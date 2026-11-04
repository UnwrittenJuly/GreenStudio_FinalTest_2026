'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const languageLabels = { python: 'Python 3', cpp: 'C++ 17', c: 'C 11' };
  const defaultArray = [42, 17, 65, 9, 38, 54, 26, 73];
  const localServiceHelp = '请双击项目目录中的 start.bat，通过打开的本地网页查看作品；也可运行 python server.py。';
  let source = null;
  let input = [...defaultArray];
  let frames = [];
  let frameIndex = 0;
  let playing = false;
  let playbackTimer = null;
  let busy = false;
  let requestVersion = 0;
  let requestController = null;

  function setMessage(message, isError = false) {
    $('demoMessage').textContent = message;
    $('demoMessage').classList.toggle('is-error', isError);
  }

  function updateControls() {
    const hasFrames = frames.length > 0 && !busy;
    $('demoPrevious').disabled = !hasFrames || frameIndex === 0;
    $('demoNext').disabled = !hasFrames || frameIndex === frames.length - 1;
    $('demoPlay').disabled = !hasFrames || frames.length < 2;
    $('demoReplay').disabled = !hasFrames || frames.length < 2;
    $('demoProgress').disabled = !hasFrames || frames.length < 2;
    $('demoPlay').textContent = playing ? '暂停' : frameIndex === frames.length - 1 && frames.length > 1 ? '重新播放' : '播放';
    for (const id of ['demoRun', 'demoRandom', 'demoArrayInput']) $(id).disabled = busy || !source;
    $('demoRun').textContent = busy ? '正在生成演示…' : '演示这组数组';
    $('demoLayout').setAttribute('aria-busy', String(busy));
  }

  function pause() {
    clearTimeout(playbackTimer);
    playbackTimer = null;
    playing = false;
    updateControls();
  }

  function renderArray(array, previous = [], complete = false) {
    const plot = $('demoPlot');
    const low = Math.min(0, ...input, ...array);
    const high = Math.max(0, ...input, ...array);
    const range = high - low || 1;
    const baseline = high === low ? 50 : high / range * 100;
    const zeroLine = document.createElement('div');
    zeroLine.className = 'demo-zero-line';
    zeroLine.style.top = `${baseline}%`;
    zeroLine.setAttribute('aria-hidden', 'true');
    plot.replaceChildren(zeroLine);
    plot.style.minWidth = `${array.length * 27}px`;
    array.forEach((value, index) => {
      const column = document.createElement('div');
      column.className = 'demo-bar-column';
      const bar = document.createElement('div');
      const height = Math.abs(value) / range * 100;
      const top = value >= 0 ? baseline - height : baseline;
      bar.className = `demo-bar${complete ? ' is-complete' : previous.length && value !== previous[index] ? ' is-changed' : ''}`;
      bar.style.top = value === 0 ? `calc(${baseline}% - 1px)` : `${top}%`;
      bar.style.height = value === 0 ? '2px' : `${height}%`;
      bar.title = `位置 ${index + 1}：${value}`;
      const label = document.createElement('span');
      label.className = 'demo-bar-value';
      label.style.top = `calc(${value >= 0 ? top : baseline + height}% + ${value >= 0 ? -22 : 5}px)`;
      label.textContent = value;
      column.append(bar, label);
      plot.append(column);
    });
    $('demoChart').setAttribute('aria-label', `当前数组：[${array.join(', ')}]，横线表示零值`);
    $('demoArrayValues').textContent = `[${array.join(', ')}]`;
  }

  function displayFrame(index) {
    if (!frames.length) return;
    frameIndex = Math.max(0, Math.min(index, frames.length - 1));
    const complete = frameIndex === frames.length - 1;
    renderArray(frames[frameIndex], frameIndex > 0 ? frames[frameIndex - 1] : [], complete);
    $('demoProgress').value = frameIndex;
    $('demoFrameLabel').textContent = `步骤 ${frameIndex} / ${frames.length - 1}`;
    $('demoVisualStatus').textContent = complete ? '播放完成' : `正在查看步骤 ${frameIndex}`;
    if (complete) pause();
    else updateControls();
  }

  function scheduleNext() {
    clearTimeout(playbackTimer);
    if (!playing) return;
    playbackTimer = setTimeout(() => {
      if (!playing) return;
      displayFrame(frameIndex + 1);
      if (playing) scheduleNext();
    }, Number($('demoSpeed').value));
  }

  function play(restart = false) {
    if (busy || frames.length < 2) return;
    pause();
    if (restart || frameIndex === frames.length - 1) displayFrame(0);
    playing = true;
    updateControls();
    scheduleNext();
  }

  function resetFrames() {
    pause();
    frames = [];
    frameIndex = 0;
    $('demoProgress').max = 0;
    $('demoProgress').value = 0;
    $('demoFrameLabel').textContent = '步骤 0 / 0';
    $('demoDuration').textContent = '';
    $('demoRecordingNote').textContent = '';
    $('demoRuntimeDetails').hidden = true;
    $('demoRuntimeOutput').textContent = '';
    renderArray(input);
    updateControls();
  }

  function readArray() {
    const raw = $('demoArrayInput').value.trim();
    const unwrapped = raw.startsWith('[') && raw.endsWith(']') ? raw.slice(1, -1) : raw;
    const parts = unwrapped.split(/[,，\s]+/).filter(Boolean);
    const valid = parts.length >= 2 && parts.length <= 32 && parts.every(value => /^-?\d+$/.test(value) && Math.abs(Number(value)) <= 999);
    $('demoInputError').hidden = valid;
    $('demoInputError').textContent = valid ? '' : '请输入 2–32 个 -999 到 999 的整数，用逗号或空格分隔。';
    $('demoArrayInput').setAttribute('aria-invalid', String(!valid));
    return valid ? parts.map(Number) : null;
  }

  async function readJson(response) {
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error(`当前页面没有连接作品运行服务。${localServiceHelp}`);
    return response.json();
  }

  function showOutput(result) {
    const output = [result.stdout && `程序输出：\n${result.stdout}`, result.stderr && `运行提示：\n${result.stderr}`].filter(Boolean).join('\n\n');
    $('demoRuntimeDetails').hidden = !output;
    $('demoRuntimeOutput').textContent = output;
  }

  async function runArray() {
    if (busy || !source) return;
    const nextInput = readArray();
    if (!nextInput) {
      pause();
      $('demoArrayInput').focus();
      return;
    }
    input = nextInput;
    resetFrames();
    busy = true;
    updateControls();
    setMessage('正在根据成员原始代码生成排序演示…');
    $('demoVisualStatus').textContent = source.language === 'python' ? '正在运行作品' : '正在编译并运行作品';
    const version = ++requestVersion;
    const controller = new AbortController();
    requestController = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: source.language, code: source.code, array: input }),
        signal: controller.signal,
      });
      const result = await readJson(response);
      if (version !== requestVersion) return;
      showOutput(result);
      if (!response.ok || !result.ok) {
        $('demoVisualStatus').textContent = '本次演示未能生成';
        setMessage(result.error || `作品运行失败（HTTP ${response.status}）。`, true);
        return;
      }
      const validArray = value => Array.isArray(value) && value.length === input.length && value.every(item => Number.isInteger(item) && Math.abs(item) <= 999);
      if (!validArray(result.sorted) || !Array.isArray(result.frames) || result.frames.length > 250 || !result.frames.every(validArray)) {
        throw new Error('作品运行服务返回了不完整的演示数据，请重试。');
      }
      frames = [[...input]];
      for (const frame of [...result.frames, result.sorted]) {
        if (frame.some((value, index) => value !== frames[frames.length - 1][index])) frames.push([...frame]);
      }
      $('demoProgress').max = frames.length - 1;
      $('demoDuration').textContent = `${Math.round(Number(result.durationMs) || 0)} ms`;
      $('demoRecordingNote').textContent = frames.length <= 2
        ? '这份作品没有记录更多中间变化，演示展示输入与输出。'
        : '中间变化来自这份成员代码记录的 snapshot。';
      setMessage(`已生成 ${frames.length} 个画面，可播放或逐步查看。`);
      busy = false;
      displayFrame(0);
      if (reducedMotion.matches) {
        displayFrame(frames.length - 1);
      } else {
        play();
      }
    } catch (error) {
      if (version !== requestVersion) return;
      $('demoVisualStatus').textContent = '演示暂不可用';
      setMessage(controller.signal.aborted ? '作品运行请求超时，请稍后重试或重启本地服务。' : error instanceof TypeError ? `无法连接本地运行服务。${localServiceHelp}` : error.message, true);
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion) {
        requestController = null;
        busy = false;
        updateControls();
      }
    }
  }

  function showEmpty(title, message, isError = false) {
    $('demoLayout').hidden = true;
    $('demoEmpty').hidden = false;
    $('demoEmptyTitle').textContent = title;
    $('demoEmptyText').textContent = message;
    setMessage(message, isError);
  }

  async function initialize() {
    const id = new URLSearchParams(location.search).get('member');
    if (!id || !/^\d{2}$/.test(id)) {
      $('demoIdentity').textContent = '请从成员墙选择一位伙伴。';
      showEmpty('请选择成员作品', '返回成员墙，点击成员的排序作品链接即可查看。', true);
      return;
    }
    if (location.protocol === 'file:') {
      $('demoIdentity').textContent = '需要本地运行服务';
      showEmpty('请先启动项目', localServiceHelp, true);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const rosterResponse = await fetch('members.json', { cache: 'no-store', signal: controller.signal });
      if (!rosterResponse.ok) throw new Error('无法读取成员名单，请返回成员墙后重试。');
      const roster = await readJson(rosterResponse);
      const member = Array.isArray(roster) ? roster.find(item => item.id === id) : null;
      if (!member) {
        $('demoIdentity').textContent = '没有找到这位成员';
        showEmpty('成员不存在', '这位成员不在当前名单中，请返回成员墙选择。', true);
        return;
      }
      document.title = `${member.name}的排序作品 · GreenExplore`;
      $('demoTitle').textContent = `${member.name}的排序作品`;
      $('demoIdentity').textContent = `${member.studentClass} · ${member.name}`;
      $('demoIntroLink').href = `members/${member.id}.html`;
      $('demoIntroLink').setAttribute('aria-label', `查看${member.name}的自我介绍`);
      $('demoIntroLink').hidden = false;
      if (!member.sortingFile) {
        showEmpty('作品尚未添加', `${member.name}暂时没有排序作品，欢迎先看看这位伙伴的自我介绍。`);
        return;
      }
      const response = await fetch(`/api/member-code?id=${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal });
      const result = await readJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error || `无法读取成员作品（HTTP ${response.status}）。`);
      if (result.memberId !== id || !Object.hasOwn(languageLabels, result.language) || typeof result.code !== 'string' || !result.code.trim()) {
        throw new Error('成员作品数据不完整，请联系项目维护者。');
      }
      source = { language: result.language, code: result.code };
      $('demoSourcePath').textContent = result.file || `submissions/${member.sortingFile}`;
      $('demoSource').textContent = result.code;
      $('demoLanguage').textContent = languageLabels[source.language];
      $('demoLayout').hidden = false;
      updateControls();
    } catch (error) {
      $('demoIdentity').textContent = '作品暂不可用';
      showEmpty('暂时无法打开作品', controller.signal.aborted ? '加载作品超时，请刷新页面重试。' : error instanceof TypeError ? `无法连接本地服务。${localServiceHelp}` : error.message, true);
      return;
    } finally {
      clearTimeout(timeout);
    }
    await runArray();
  }

  $('demoPlay').addEventListener('click', () => playing ? pause() : play());
  $('demoReplay').addEventListener('click', () => play(true));
  $('demoPrevious').addEventListener('click', () => { pause(); displayFrame(frameIndex - 1); });
  $('demoNext').addEventListener('click', () => { pause(); displayFrame(frameIndex + 1); });
  $('demoProgress').addEventListener('input', event => { pause(); displayFrame(Number(event.target.value)); });
  $('demoSpeed').addEventListener('change', () => { if (playing) scheduleNext(); });
  $('demoArrayForm').addEventListener('submit', event => { event.preventDefault(); runArray(); });
  $('demoArrayInput').addEventListener('input', () => { pause(); $('demoInputError').hidden = true; $('demoArrayInput').removeAttribute('aria-invalid'); });
  $('demoRandom').addEventListener('click', () => {
    if (busy || !source) return;
    $('demoArrayInput').value = Array.from({ length: 8 }, () => Math.floor(Math.random() * 181) - 90).join(', ');
    runArray();
  });
  window.addEventListener('pagehide', () => {
    pause();
    ++requestVersion;
    requestController?.abort();
  });
  initialize();
})();
