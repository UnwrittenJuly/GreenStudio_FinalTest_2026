#!/usr/bin/env python3
"""Local classroom project and real Python/C/C++ sorting runner.

Run with ``python server.py`` and open http://127.0.0.1:8000.
Submitted programs run with this computer's permissions. This local development
runner is intended for trusted interview participants; it is not a code sandbox.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parent
MAX_BODY_BYTES = 100_000
MAX_CODE_BYTES = 24_000
MAX_OUTPUT_BYTES = 64_000
MAX_RESULT_BYTES = 150_000
MAX_FRAMES = 250
RUN_TIMEOUT = 3.0
COMPILE_TIMEOUT = 10.0
RUN_SLOTS = threading.BoundedSemaphore(2)
PUBLIC_SUFFIXES = {
    ".html", ".css", ".js", ".mjs", ".json", ".svg", ".png", ".jpg",
    ".jpeg", ".webp", ".ico", ".woff", ".woff2", ".txt",
}


def _compiler(name: str) -> str | None:
    configured = os.environ.get("CC" if name == "gcc" else "CXX")
    if configured:
        found = shutil.which(configured)
        if found:
            return found
    found = shutil.which(name)
    if found:
        return found
    if os.name == "nt":
        for directory in (r"D:\Dev\MinGW\bin", r"C:\msys64\mingw64\bin", r"C:\MinGW\bin"):
            candidate = Path(directory) / (name + ".exe")
            if candidate.is_file():
                return str(candidate)
    return None


def language_status() -> dict:
    return {
        "python": {"available": True, "label": "Python 3"},
        "c": {"available": _compiler("gcc") is not None, "label": "C (C11)"},
        "cpp": {"available": _compiler("g++") is not None, "label": "C++ (C++17)"},
    }


def _validate_request(payload: object) -> tuple[str, str, list[int]]:
    if not isinstance(payload, dict):
        raise ValueError("请求必须是 JSON 对象。")
    language, code, array = payload.get("language"), payload.get("code"), payload.get("array")
    if language not in ("python", "c", "cpp"):
        raise ValueError("请选择 Python、C 或 C++。")
    if not isinstance(code, str) or not code.strip():
        raise ValueError("请先编写排序代码。")
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        raise ValueError("代码不能超过 24 KB。")
    if not isinstance(array, list) or not 2 <= len(array) <= 32:
        raise ValueError("数组长度必须为 2 到 32。")
    if any(type(item) is not int or not -999 <= item <= 999 for item in array):
        raise ValueError("数组只能包含 -999 到 999 之间的整数。")
    return language, code, array


def _terminate_process(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        try:
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                timeout=3, creationflags=subprocess.CREATE_NO_WINDOW,
            )
        except (OSError, subprocess.TimeoutExpired):
            process.kill()
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    try:
        process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=3)


def _run_process(command: list[str], cwd: Path, timeout: float, tag: str) -> dict:
    stdout_file, stderr_file = cwd / (tag + ".stdout"), cwd / (tag + ".stderr")
    reason = None
    started = time.monotonic()
    options = {}
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
    else:
        options["start_new_session"] = True
    environment = dict(os.environ)
    environment["PYTHONIOENCODING"] = "utf-8"
    environment["PYTHONUNBUFFERED"] = "1"
    # Keep compiler scratch files beside this run's other temporary files.
    for variable in ("TMP", "TEMP", "TMPDIR"):
        environment[variable] = str(cwd)
    # MinGW executables may need runtime DLLs beside their compiler.
    compiler_dirs = {str(Path(item).parent) for item in (_compiler("gcc"), _compiler("g++")) if item}
    environment["PATH"] = os.pathsep.join(sorted(compiler_dirs) + [environment.get("PATH", "")])
    with stdout_file.open("wb") as out, stderr_file.open("wb") as err:
        process = subprocess.Popen(
            command, cwd=str(cwd), stdin=subprocess.DEVNULL, stdout=out, stderr=err,
            env=environment, shell=False, **options,
        )
        while process.poll() is None:
            if time.monotonic() - started > timeout:
                reason = "timeout"
                _terminate_process(process)
                break
            if stdout_file.stat().st_size + stderr_file.stat().st_size > MAX_OUTPUT_BYTES:
                reason = "output_limit"
                _terminate_process(process)
                break
            time.sleep(0.02)
    # Check again after exit: a short program can produce too much output between polls.
    if stdout_file.stat().st_size + stderr_file.stat().st_size > MAX_OUTPUT_BYTES:
        reason = "output_limit"
    with stdout_file.open("rb") as out, stderr_file.open("rb") as err:
        captured_stdout = out.read(MAX_OUTPUT_BYTES).decode("utf-8", errors="replace")
        captured_stderr = err.read(MAX_OUTPUT_BYTES).decode("utf-8", errors="replace")
    return {
        "returncode": process.returncode,
        "stdout": captured_stdout,
        "stderr": captured_stderr,
        "reason": reason,
    }


def _write_python_runner(directory: Path, code: str, array: list[int]) -> list[str]:
    (directory / "solution.py").write_text(code, encoding="utf-8")
    runner = f'''import json
from pathlib import Path

_frames = []
def snapshot(arr):
    if len(_frames) < {MAX_FRAMES}:
        _frames.append(list(arr))

_scope = {{"__name__": "__submission__", "snapshot": snapshot}}
exec(compile(Path("solution.py").read_text(encoding="utf-8"), "solution.py", "exec"), _scope)
_array = {array!r}
_answer = _scope["sort_array"](_array)
if _answer is None:
    _answer = _array
Path("result.json").write_text(json.dumps({{"sorted": _answer, "frames": _frames}}), encoding="utf-8")
'''
    (directory / "runner.py").write_text(runner, encoding="utf-8")
    return [sys.executable, "-I", "runner.py"]


def _write_native_runner(directory: Path, code: str, array: list[int], language: str) -> tuple[list[str], list[str]]:
    count, initial = len(array), ", ".join(str(item) for item in array)
    if language == "c":
        prelude = f'''#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stddef.h>
#include <stdint.h>
#include <limits.h>
#include <stdbool.h>
static int _recorded[{MAX_FRAMES}][{count}];
static int _frame_count = 0;
static void snapshot(const int arr[], int n) {{
    if (n == {count} && _frame_count < {MAX_FRAMES}) {{
        for (int i = 0; i < n; ++i) _recorded[_frame_count][i] = arr[i];
        ++_frame_count;
    }}
}}
#line 1 "solution.c"
'''
        suffix = f'''
#line 1 "runner.c"
int main(void) {{
    int arr[{count}] = {{{initial}}};
    sort_array(arr, {count});
    FILE *out = fopen("result.json", "w");
    if (!out) return 2;
    fputs("{{\\"sorted\\":[", out);
    for (int i = 0; i < {count}; ++i) fprintf(out, "%s%d", i ? "," : "", arr[i]);
    fputs("],\\"frames\\":[", out);
    for (int frame = 0; frame < _frame_count; ++frame) {{
        fprintf(out, "%s[", frame ? "," : "");
        for (int i = 0; i < {count}; ++i) fprintf(out, "%s%d", i ? "," : "", _recorded[frame][i]);
        fputs("]", out);
    }}
    fputs("]}}", out);
    return fclose(out) == 0 ? 0 : 2;
}}
'''
        compiler, standard, filename = _compiler("gcc"), "-std=c11", "runner.c"
    else:
        prelude = f'''#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <fstream>
#include <limits>
#include <numeric>
#include <queue>
#include <stack>
#include <string>
#include <utility>
#include <vector>
using namespace std;
static vector<vector<int>> _recorded;
static void snapshot(const vector<int>& arr) {{
    if (arr.size() == {count} && _recorded.size() < {MAX_FRAMES}) _recorded.push_back(arr);
}}
#line 1 "solution.cpp"
'''
        suffix = f'''
#line 1 "runner.cpp"
int main() {{
    vector<int> arr = {{{initial}}};
    sort_array(arr);
    ofstream out("result.json");
    if (!out) return 2;
    out << "{{\\"sorted\\":[";
    for (size_t i = 0; i < arr.size(); ++i) out << (i ? "," : "") << arr[i];
    out << "],\\"frames\\":[";
    for (size_t f = 0; f < _recorded.size(); ++f) {{
        out << (f ? ",[" : "[");
        for (size_t i = 0; i < _recorded[f].size(); ++i) out << (i ? "," : "") << _recorded[f][i];
        out << "]";
    }}
    out << "]}}";
    return out.good() ? 0 : 2;
}}
'''
        compiler, standard, filename = _compiler("g++"), "-std=c++17", "runner.cpp"
    if compiler is None:
        raise FileNotFoundError("尚未检测到对应编译器，请安装 GCC / G++ 并加入 PATH。")
    (directory / filename).write_text(prelude + code + suffix, encoding="utf-8")
    executable = directory / ("submission.exe" if os.name == "nt" else "submission")
    return [compiler, standard, "-O0", filename, "-o", str(executable)], [str(executable)]


def _valid_array(value: object, count: int) -> bool:
    return isinstance(value, list) and len(value) == count and all(
        type(item) is int and -999 <= item <= 999 for item in value
    )


def run_submission(payload: object, *, run_timeout: float = RUN_TIMEOUT, compile_timeout: float = COMPILE_TIMEOUT) -> dict:
    started = time.monotonic()
    response = {"ok": False, "stdout": "", "stderr": "", "durationMs": 0}

    def failure(message: str, kind: str) -> dict:
        response.update(error=message, errorType=kind, durationMs=round((time.monotonic() - started) * 1000))
        return response

    try:
        language, code, array = _validate_request(payload)
    except ValueError as error:
        return failure(str(error), "validation")
    try:
        with tempfile.TemporaryDirectory(prefix="greenexplore-run-") as temporary:
            directory = Path(temporary)
            if language == "python":
                command = _write_python_runner(directory, code, array)
            else:
                compile_command, command = _write_native_runner(directory, code, array, language)
                compilation = _run_process(compile_command, directory, compile_timeout, "compile")
                response.update(stdout=compilation["stdout"], stderr=compilation["stderr"])
                if compilation["reason"] == "timeout":
                    return failure("编译超时，请简化代码后重试。", "timeout")
                if compilation["reason"] == "output_limit":
                    return failure("编译输出超过 64 KB，请修复编译错误。", "output_limit")
                if compilation["returncode"] != 0:
                    return failure("编译失败，请根据下方信息修改代码。", "compile")
            execution = _run_process(command, directory, run_timeout, "run")
            response["stdout"] += execution["stdout"]
            response["stderr"] += execution["stderr"]
            if execution["reason"] == "timeout":
                return failure(f"代码运行超时（最多 {run_timeout:g} 秒），请检查是否存在死循环。", "timeout")
            if execution["reason"] == "output_limit":
                return failure("程序输出超过 64 KB，请减少打印内容。", "output_limit")
            if execution["returncode"] != 0:
                return failure("代码运行失败，请根据下方信息修改代码。", "runtime")
            result_file = directory / "result.json"
            if not result_file.is_file() or result_file.stat().st_size > MAX_RESULT_BYTES:
                return failure("未获得有效结果，请按约定实现 sort_array 函数。", "runtime")
            try:
                result = json.loads(result_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeError):
                return failure("程序结果格式无效。", "runtime")
            if not isinstance(result, dict) or not _valid_array(result.get("sorted"), len(array)):
                return failure("排序结果必须是与输入等长的整数数组。", "wrong_answer")
            answer = result["sorted"]
            frames = result.get("frames", [])
            if not isinstance(frames, list) or len(frames) > MAX_FRAMES or any(
                not _valid_array(frame, len(array)) for frame in frames
            ):
                return failure("snapshot 必须传入与原数组等长的整数数组。", "runtime")
            all_frames = [list(array)] + frames
            if all_frames[-1] != answer:
                all_frames.append(answer)
            if len(all_frames) > MAX_FRAMES:
                last = len(all_frames) - 1
                all_frames = [all_frames[round(index * last / (MAX_FRAMES - 1))] for index in range(MAX_FRAMES)]
            response.update(sorted=answer, frames=all_frames)
            if answer != sorted(array):
                return failure("结果尚未通过：请将原数组按从小到大排序，并保留全部元素。", "wrong_answer")
            response.update(ok=True, durationMs=round((time.monotonic() - started) * 1000))
            return response
    except FileNotFoundError as error:
        return failure(str(error), "unavailable")
    except (OSError, subprocess.SubprocessError) as error:
        return failure(f"执行环境错误：{error}", "environment")


class InterviewHandler(SimpleHTTPRequestHandler):
    server_version = "GreenExploreLocal/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status: int, payload: dict) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(encoded)

    def _trusted_request(self) -> bool:
        host = self.headers.get("Host", "")
        valid_hosts = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
        if self.server.server_port == 80:
            valid_hosts.update(("127.0.0.1", "localhost"))
        origin = self.headers.get("Origin")
        if host.lower() not in valid_hosts or (origin and origin != "http://" + host.lower()):
            self._json(403, {"ok": False, "error": "仅接受当前本地页面的请求。"})
            return False
        return True

    def _static_allowed(self) -> bool:
        path = unquote(urlsplit(self.path).path)
        if "\0" in path:
            return False
        if path == "/":
            return True
        parts = path.replace("\\", "/").split("/")
        if any(part.startswith(".") for part in parts if part):
            return False
        candidate = (ROOT / path.lstrip("/")).resolve()
        try:
            candidate.relative_to(ROOT)
        except ValueError:
            return False
        return candidate.is_file() and candidate.suffix.lower() in PUBLIC_SUFFIXES

    def _member_code(self) -> None:
        identifiers = parse_qs(urlsplit(self.path).query, keep_blank_values=True).get("id", [])
        if len(identifiers) != 1:
            self._json(404, {"ok": False, "error": "请选择一位成员查看排序程序。"})
            return
        member_id = identifiers[0]
        try:
            members = json.loads((ROOT / "members.json").read_text(encoding="utf-8-sig"))
        except (OSError, ValueError):
            self._json(500, {"ok": False, "error": "成员名单暂时无法读取，请稍后重试。"})
            return
        member = next((item for item in members if isinstance(item, dict) and item.get("id") == member_id), None) if isinstance(members, list) else None
        if member is None:
            self._json(404, {"ok": False, "error": "未找到这位成员。"})
            return
        filename = member.get("sortingFile")
        if not isinstance(filename, str) or not filename or any(char in filename for char in ("/", "\\", ":", "\0")):
            self._json(404, {"ok": False, "error": "这位成员暂未提供排序程序。"})
            return
        directory = (ROOT / "submissions").resolve()
        source = (directory / filename).resolve()
        language = {".py": "python", ".c": "c", ".cpp": "cpp"}.get(source.suffix.lower())
        if source.parent != directory or language is None:
            self._json(404, {"ok": False, "error": "这位成员的排序程序暂时无法读取。"})
            return
        try:
            code = source.read_text(encoding="utf-8-sig")
        except (OSError, UnicodeError):
            self._json(404, {"ok": False, "error": "这位成员的排序程序暂时无法读取。"})
            return
        self._json(200, {"ok": True, "memberId": member_id, "language": language, "file": f"submissions/{filename}", "code": code})

    def do_GET(self) -> None:
        if not self._trusted_request():
            return
        if urlsplit(self.path).path == "/api/health":
            self._json(200, {"ok": True, "languages": language_status(), "maxFrames": MAX_FRAMES, "runTimeoutSeconds": RUN_TIMEOUT})
        elif urlsplit(self.path).path == "/api/member-code":
            self._member_code()
        elif self._static_allowed():
            super().do_GET()
        else:
            self.send_error(404, "File not found")

    def do_HEAD(self) -> None:
        if not self._trusted_request():
            return
        if urlsplit(self.path).path == "/api/member-code":
            self._member_code()
        elif self._static_allowed():
            super().do_HEAD()
        else:
            self.send_error(404, "File not found")

    def do_POST(self) -> None:
        if not self._trusted_request():
            return
        if urlsplit(self.path).path != "/api/run":
            self._json(404, {"ok": False, "error": "接口不存在。"})
            return
        if self.headers.get_content_type() != "application/json":
            self._json(415, {"ok": False, "error": "请使用 application/json 发送代码。"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY_BYTES:
            self._json(413, {"ok": False, "error": "请求内容为空或超过 100 KB。"})
            return
        if not RUN_SLOTS.acquire(blocking=False):
            self._json(429, {"ok": False, "error": "当前正在执行其他代码，请稍后再试。", "errorType": "busy"})
            return
        try:
            self.connection.settimeout(5)
            try:
                raw = self.rfile.read(length)
                payload = json.loads(raw.decode("utf-8"))
            except (ValueError, UnicodeError, TimeoutError):
                self._json(400, {"ok": False, "error": "请求 JSON 无效或接收超时。"})
                return
            self._json(200, run_submission(payload))
        finally:
            RUN_SLOTS.release()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


class LocalHTTPServer(ThreadingHTTPServer):
    # Each member preview loads its own HTML, CSS and images. Allow their
    # simultaneous connections to queue instead of refusing preview assets.
    request_queue_size = 128


def create_server(port: int = 8000) -> ThreadingHTTPServer:
    server = LocalHTTPServer(("127.0.0.1", port), InterviewHandler)
    server.daemon_threads = True
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the GreenExplore classroom project.")
    parser.add_argument("--port", type=int, default=8000, help="Local port (default: 8000)")
    parser.add_argument("--open", action="store_true", help="Open the project in the default browser")
    args = parser.parse_args()
    try:
        server = create_server(args.port)
    except OSError as error:
        print(f"Cannot start on port {args.port}: {error}\nClose the previous server window, or use --port 8080.", file=sys.stderr)
        raise SystemExit(1) from error
    print(f"GreenExplore: http://127.0.0.1:{server.server_port}", flush=True)
    print("Trusted local code only: submissions run with your computer's permissions.", flush=True)
    if args.open:
        webbrowser.open(f"http://127.0.0.1:{server.server_port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
