"""Integration tests for real local code execution; no third-party packages needed."""

import http.client
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.parse import quote

import server


ARRAY = [9, -2, 4, 4, 0]


class SubmissionTests(unittest.TestCase):
    def run_code(self, code, language="python", array=None, **kwargs):
        return server.run_submission({"language": language, "code": code, "array": ARRAY if array is None else array}, **kwargs)

    def assert_sorted(self, result):
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["sorted"], sorted(ARRAY))
        self.assertEqual(result["frames"][0], ARRAY)
        self.assertEqual(result["frames"][-1], sorted(ARRAY))

    def test_python_return_value_with_real_snapshots(self):
        result = self.run_code("""def sort_array(arr):
    for end in range(len(arr) - 1, 0, -1):
        for i in range(end):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                snapshot(arr)
    return arr
""")
        self.assert_sorted(result)
        self.assertGreater(len(result["frames"]), 2)
        self.assertNotEqual(result["frames"][1], result["frames"][-1])

    def test_python_in_place_without_snapshots(self):
        self.assert_sorted(self.run_code("def sort_array(arr):\n    arr.sort()"))

    def test_stdout_cannot_collide_with_result_protocol(self):
        result = self.run_code('def sort_array(arr):\n    print(\'{"sorted":[999],"frames":[]}\')\n    return sorted(arr)')
        self.assert_sorted(result)
        self.assertIn('"sorted":[999]', result["stdout"])

    def test_wrong_order_is_not_success(self):
        result = self.run_code("def sort_array(arr):\n    return sorted(arr, reverse=True)")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "wrong_answer")
        self.assertEqual(result["sorted"], sorted(ARRAY, reverse=True))

    def test_changed_elements_are_not_success(self):
        result = self.run_code("def sort_array(arr):\n    return [0] * len(arr)")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "wrong_answer")

    def test_python_syntax_error_is_explained(self):
        result = self.run_code("def sort_array(arr)\n    return arr")
        self.assertFalse(result["ok"])
        self.assertIn("SyntaxError", result["stderr"])
        self.assertIn("solution.py", result["stderr"])

    def test_infinite_loop_times_out(self):
        result = self.run_code("def sort_array(arr):\n    while True: pass", run_timeout=0.25)
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "timeout")
        self.assertLess(result["durationMs"], 5000)

    def test_output_flood_is_stopped(self):
        result = self.run_code("def sort_array(arr):\n    while True: print('x' * 10000)")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "output_limit")
        self.assertLessEqual(len(result["stdout"].encode()), server.MAX_OUTPUT_BYTES)

    def test_snapshot_frame_cap_preserves_endpoints(self):
        result = self.run_code("def sort_array(arr):\n    for _ in range(1000): snapshot(arr)\n    return sorted(arr)")
        self.assert_sorted(result)
        self.assertLessEqual(len(result["frames"]), server.MAX_FRAMES)

    def test_invalid_snapshot_shape_is_rejected(self):
        result = self.run_code("def sort_array(arr):\n    snapshot([1])\n    return sorted(arr)")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "runtime")

    def test_request_constraints(self):
        for array in ([True, 3], [1, 1.5], [1000, 0], [1], list(range(33))):
            with self.subTest(array=array):
                result = self.run_code("def sort_array(arr): return arr", array=array)
                self.assertEqual(result["errorType"], "validation")
        self.assertEqual(self.run_code("x" * (server.MAX_CODE_BYTES + 1))["errorType"], "validation")

    @unittest.skipUnless(server._compiler("gcc"), "GCC is not installed")
    def test_c_compilation_and_snapshots(self):
        result = self.run_code("""void sort_array(int arr[], int n) {
    for (int end = n - 1; end > 0; --end) {
        for (int i = 0; i < end; ++i) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = temp;
                snapshot(arr, n);
            }
        }
    }
    puts("C really ran");
}
""", "c")
        self.assert_sorted(result)
        self.assertGreater(len(result["frames"]), 2)
        self.assertIn("C really ran", result["stdout"])

    @unittest.skipUnless(server._compiler("g++"), "G++ is not installed")
    def test_cpp_compilation_and_snapshots(self):
        result = self.run_code("""void sort_array(vector<int>& arr) {
    for (size_t i = 0; i < arr.size(); ++i) {
        for (size_t j = i + 1; j < arr.size(); ++j) {
            if (arr[i] > arr[j]) { swap(arr[i], arr[j]); snapshot(arr); }
        }
    }
    cout << "C++ really ran";
}
""", "cpp")
        self.assert_sorted(result)
        self.assertGreater(len(result["frames"]), 2)
        self.assertIn("C++ really ran", result["stdout"])

    @unittest.skipUnless(server._compiler("gcc"), "GCC is not installed")
    def test_native_compile_error_points_to_submission(self):
        result = self.run_code("void sort_array(int arr[], int n) { invalid syntax ! }", "c")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errorType"], "compile")
        self.assertIn("solution.c", result["stderr"])


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.create_server(0)
        cls.port = cls.httpd.server_port
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=3)

    def request(self, method, path, body=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        status, content = response.status, response.read()
        connection.close()
        return status, content

    def test_health_and_index(self):
        status, content = self.request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(content)["languages"]["python"]["available"])
        status, content = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn(b"html", content.lower())

    def test_shared_assets_and_all_member_pages(self):
        paths = ["/app.js", "/sorting.js", "/styles.css", "/members/card.css", "/members.json"]
        paths += [f"/members/{index:02}.html" for index in range(1, 19)]
        for path in paths:
            with self.subTest(path=path):
                status, content = self.request("GET", path)
                self.assertEqual(status, 200)
                self.assertTrue(content)

    def test_preview_does_not_cache_edited_files(self):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        connection.request("GET", "/members/01.html")
        response = connection.getresponse()
        self.assertEqual(response.getheader("Cache-Control"), "no-store")
        response.read()
        connection.close()

    def test_preview_assets_survive_simultaneous_member_loads(self):
        paths = ["/members/card.css", "/members/02.html", "/members/16.html", "/members/14-bg.jpg"] * 16
        ready = threading.Barrier(len(paths))

        def load_asset(path):
            ready.wait(timeout=10)
            return self.request("GET", path)

        with ThreadPoolExecutor(max_workers=len(paths)) as executor:
            responses = list(executor.map(load_asset, paths))
        for path, (status, content) in zip(paths, responses):
            with self.subTest(path=path):
                self.assertEqual(status, 200)
                self.assertTrue(content)

    def test_private_sources_and_hidden_files_are_not_served(self):
        for path in ("/.git/config", "/%2egit/config", "/server.py", "/test_server.py", "/../server.py", "/%00.js"):
            with self.subTest(path=path):
                self.assertEqual(self.request("GET", path)[0], 404)

    def test_foreign_origin_and_host_are_rejected(self):
        self.assertEqual(self.request("GET", "/api/health", headers={"Origin": "https://example.com"})[0], 403)
        self.assertEqual(self.request("GET", "/api/health", headers={"Host": "attacker.example"})[0], 403)

    def test_post_executes_user_code(self):
        body = json.dumps({"language": "python", "array": [8, 3, 6], "code": "def sort_array(arr): return sorted(arr)"})
        status, content = self.request("POST", "/api/run", body, {"Content-Type": "application/json", "Origin": f"http://127.0.0.1:{self.port}"})
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(content)["sorted"], [3, 6, 8])

    def test_invalid_json_and_content_type(self):
        self.assertEqual(self.request("POST", "/api/run", "{}", {"Content-Type": "text/plain"})[0], 415)
        self.assertEqual(self.request("POST", "/api/run", "{", {"Content-Type": "application/json"})[0], 400)

    def test_registered_member_code_matches_the_retained_source_files(self):
        members = json.loads((server.ROOT / "members.json").read_text(encoding="utf-8-sig"))
        self.assertEqual(len(members), 18)
        for member in members:
            with self.subTest(member=member["id"]):
                status, content = self.request("GET", f'/api/member-code?id={member["id"]}')
                result = json.loads(content)
                filename = member.get("sortingFile")
                if not filename:
                    self.assertEqual(status, 404)
                    self.assertFalse(result["ok"])
                    self.assertTrue(result["error"])
                    continue
                self.assertEqual(status, 200)
                self.assertTrue(result["ok"])
                self.assertEqual(result["memberId"], member["id"])
                self.assertEqual(result["file"], f"submissions/{filename}")
                self.assertEqual(result["language"], {".py": "python", ".c": "c", ".cpp": "cpp"}[Path(filename).suffix])
                self.assertEqual(result["code"], (server.ROOT / "submissions" / filename).read_text(encoding="utf-8-sig"))
                self.assertEqual(self.request("GET", "/" + quote(result["file"]))[0], 404)

    def test_member_code_rejects_unknown_or_ambiguous_identity(self):
        for query in ("", "?id=", "?id=19", "?id=unknown", "?id=../server.py", "?id=01&id=02", "?file=server.py"):
            with self.subTest(query=query):
                status, content = self.request("GET", "/api/member-code" + query)
                self.assertEqual(status, 404)
                self.assertFalse(json.loads(content)["ok"])
        self.assertEqual(self.request("GET", "/members/19.html")[0], 404)

    def test_member_code_only_reads_registered_submission_files(self):
        with tempfile.TemporaryDirectory(prefix="greenexplore-members-") as temporary:
            directory = Path(temporary)
            (directory / "submissions").mkdir()
            (directory / "submissions" / "unregistered.py").write_text("private source", encoding="utf-8")
            (directory / "outside.py").write_text("outside source", encoding="utf-8")
            for filename in ("../outside.py", "..\\outside.py", str(directory / "outside.py"), "missing.py", "notes.txt", None):
                with self.subTest(filename=filename):
                    (directory / "members.json").write_text(json.dumps([{"id": "01", "sortingFile": filename}]), encoding="utf-8")
                    with patch.object(server, "ROOT", directory):
                        status, content = self.request("GET", "/api/member-code?id=01&file=unregistered.py")
                    self.assertEqual(status, 404)
                    self.assertFalse(json.loads(content)["ok"])
                    self.assertNotIn(b"private source", content)
                    self.assertNotIn(b"outside source", content)

    def test_member_code_head_and_local_read_only_contract(self):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            connection.request("HEAD", "/api/member-code?id=01")
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertIn("application/json", response.getheader("Content-Type"))
            self.assertGreater(int(response.getheader("Content-Length")), 0)
            self.assertEqual(response.read(), b"")
        finally:
            connection.close()
        for headers in ({"Origin": "https://example.com"}, {"Host": "attacker.example"}):
            self.assertEqual(self.request("GET", "/api/member-code?id=01", headers=headers)[0], 403)
        self.assertEqual(self.request("POST", "/api/member-code?id=01", "{}")[0], 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
