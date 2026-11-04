'use strict';

(() => {
  const skillKeys = ['embedded', 'eda', 'linux', 'ros'];
  if (new URLSearchParams(location.search).get('preview') === '1') {
    document.querySelectorAll('[data-open]').forEach(button => {
      button.addEventListener('click', () => {
        const skill = button.dataset.open;
        if (!skillKeys.includes(skill)) return;
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'greenexplore:open-profile', memberId: '18', skill }, '*');
        } else {
          location.href = '18.html#' + skill;
        }
      });
    });
    return;
  }

  const $ = id => document.getElementById(id);
  const artwork = $('artwork');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = { ink: '#17231f', muted: '#617269', line: '#c9d4ce', green: '#167759', cyan: '#1d8290', amber: '#ae7522', pale: '#edf3ef' };
  const skills = {
    embedded: {
      title: '嵌入式开发与接口联调',
      summary: '以开发板为入口，连接硬件接口、固件程序与外设通信。',
      tags: ['MSPM0', 'STM32', 'GPIO', 'UART', '固件调试'],
      steps: ['识别主控、供电和扩展接口，梳理外设连接关系。', '围绕 GPIO、串口等接口编写固件并开展联调。', '结合下载、调试与运行记录，定位软硬件交界处的问题。'],
      note: '交互模型与接口信号流程示意，参考开发板的结构与接口布局。',
      phases: ['识别主控与外设接口', '梳理供电和信号连接', 'GPIO 与串口数据交互', '结合调试信息检查固件行为']
    },
    eda: {
      title: '电路设计、PCB 布局与封装核对',
      summary: '点选电路模块、手动输入时钟，再切换 PCB 三维视图核对布局。',
      tags: ['原理图', '时序逻辑', '元件布局', 'PCB 布线', '3D 核对'],
      steps: ['按时钟、时序、状态逻辑、显示及模拟网络整理原理图。', '在 PCB 中安排器件位置，完成网络连接与布线整理。', '通过三维视图核对封装方向、接口位置和整板布局。'],
      note: '交互逻辑示意：单步时钟驱动 0–9 计数与七段显示；模块关系不等同于器件级电气仿真。',
      phases: ['分模块整理原理图', '检查时序与状态信号关系', '安排器件并整理网络连接', '结合 PCB 三维视图核对布局']
    },
    linux: {
      title: 'Linux 系统与设备开发',
      summary: '围绕命令行、构建、进程、驱动接口和设备通信开展系统侧工作。',
      tags: ['Shell', '构建工具', '进程与服务', '设备接口'],
      steps: ['在命令行中组织源码、构建配置与开发工具。', '理解应用、系统调用、驱动和设备之间的调用关系。', '通过进程、服务和日志信息分析设备程序的运行过程。'],
      note: '交互终端示意：点击操作查看命令与系统分层，不连接主机或执行真实命令。',
      phases: ['查看源码与工作目录', '构建设备程序', '检查进程和设备接口', '跟踪应用与设备之间的交互']
    },
    ros: {
      title: 'ROS 机器人感知与运动',
      summary: '切换机器人模型与仿真环境，通过目标点交互观察规划和运动的关系。',
      tags: ['ROS 节点', '话题通信', '传感器', '路径与控制'],
      steps: ['围绕四轮底盘与上方传感器建立机器人模型，检查结构关系。', '将机器人模型放入仿真场景，组织环境、障碍物和传感器视图。', '通过 ROS 节点与话题组织感知、规划和运动控制的数据传递。'],
      note: '交互运动与传感器原理示意，可调整目标点观察机器人模型和路径变化。',
      phases: ['传感器获取环境信息', '节点之间传递消息', '依据路径组织运动控制', '观察位置与传感器信息的变化']
    }
  };
  const boards = {
    mspm0: { name: 'MSPM0 开发板' },
    stm32: { name: 'STM32 开发板' }
  };
  const edaViews = {
    schematic: { name: '交互原理图' },
    pcb: { name: 'PCB 三维视图' }
  };
  const rosViews = {
    model: { name: '交互机器人模型' },
    simulation: { name: '交互仿真环境' }
  };
  const systems = {
    ubuntu: { name: 'Ubuntu', accent: '#bb5e29' },
    debian: { name: 'Debian', accent: '#167759' },
    fedora: { name: 'Fedora', accent: '#1d8290' },
    raspberry: { name: 'Raspberry Pi OS', accent: '#167759' }
  };
  let activeSkill = skillKeys.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'embedded';
  let activeBoard = 'mspm0';
  let activeEdaView = 'schematic';
  let activeRosView = 'model';
  let activeSystem = 'ubuntu';
  let activeCommand = 'system';
  let selectedEdaModule = 'clock';
  let edaCounter = 0;
  let paused = motionPreference.matches;
  let elapsed = 0;
  let previousTime = 0;
  let frameId = 0;
  let phaseIndex = -1;
  let refs = {};
  const edaModules = {
    clock: { index: 0, title: '时钟脉冲', detail: '为计数与时序逻辑提供触发节拍；可使用“单步时钟”观察计数变化。', lines: [0] },
    timing: { index: 1, title: '时序电路', detail: '组织计数与译码关系，将输入时钟转换为后级逻辑使用的状态。', lines: [0, 1] },
    state: { index: 2, title: '状态逻辑', detail: '结合当前状态整理控制信号，连接时序部分与显示部分。', lines: [1, 2] },
    display: { index: 3, title: '数码管显示', detail: '把当前计数映射为七段组合；右侧显示可随单步时钟切换 0–9。', lines: [2] },
    power: { index: 4, title: '电源与开关', detail: '单独组织电源、输入输出与手动指定开关，便于检查连接关系。', lines: [] },
    analog: { index: 5, title: '放大器网络', detail: '模拟电路作为独立功能模块，在设计中结合信号路径检查器件连接。', lines: [] }
  };

  function svgFrame(title, description, body, interactive = false) {
    return '<svg class="schematic-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" role="' + (interactive ? 'group' : 'img') + '" aria-labelledby="diagramTitle diagramDescription">' +
      '<title id="diagramTitle">' + title + '</title><desc id="diagramDescription">' + description + '</desc>' +
      '<defs><pattern id="engineeringGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dde5e0" stroke-width=".65"/></pattern><marker id="flowArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#78958a"/></marker></defs>' +
      '<rect width="800" height="400" fill="#f7f9f8"/><rect width="800" height="400" fill="url(#engineeringGrid)"/>' + body + '</svg>';
  }
  function text(x, y, value, size = 14, fill = colors.ink, anchor = 'middle') {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-family="Segoe UI,Microsoft YaHei,sans-serif" font-size="' + size + '" fill="' + fill + '">' + value + '</text>';
  }
  function block(x, y, width, height, title, subtitle, id = '') {
    return '<g' + (id ? ' id="' + id + '"' : '') + '><rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="4" fill="white" stroke="' + colors.line + '" stroke-width="1.5"/>' + text(x + width / 2, y + height / 2 - 3, title, 16) + text(x + width / 2, y + height / 2 + 20, subtitle, 11, colors.muted) + '</g>';
  }

  function embeddedScene() {
    return svgFrame('嵌入式接口与信号流程', '主控、GPIO 外设与串口调试端之间的接口关系，下方展示串口数字信号示意。',
      text(28, 28, 'INTERFACE / SIGNAL FLOW', 12, colors.muted, 'start') +
      block(45, 90, 155, 86, 'GPIO 外设', '输入 / 输出') +
      block(300, 70, 200, 126, boards[activeBoard].name, '固件 · 接口控制') +
      block(600, 90, 155, 86, '调试终端', '串口 / 运行信息') +
      '<path id="gpioPath" d="M200 133H300" stroke="#78958a" stroke-width="2" fill="none" marker-end="url(#flowArrow)"/>' +
      '<path id="txPath" d="M500 115H600" stroke="#78958a" stroke-width="2" fill="none" marker-end="url(#flowArrow)"/>' +
      '<path id="rxPath" d="M600 155H500" stroke="#78958a" stroke-width="2" fill="none" marker-end="url(#flowArrow)"/>' +
      text(250, 118, 'GPIO', 11, colors.green) + text(550, 101, 'TX', 11, colors.green) + text(550, 183, 'RX', 11, colors.cyan) +
      '<circle id="gpioPacket" r="4" fill="' + colors.green + '"/><circle id="txPacket" r="4" fill="' + colors.green + '"/><circle id="rxPacket" r="4" fill="' + colors.cyan + '"/>' +
      '<path d="M400 42V70" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' + text(400, 33, '供电与连接检查', 11, colors.muted) +
      '<rect x="45" y="235" width="710" height="128" rx="4" fill="white" stroke="' + colors.line + '"/>' +
      text(66, 259, 'UART DIGITAL SIGNAL / 串口数字信号示意', 12, colors.muted, 'start') +
      '<path d="M110 285H718M110 330H718" stroke="#e2e8e4" stroke-dasharray="4 5"/>' +
      text(90, 290, 'H', 11, colors.muted) + text(90, 335, 'L', 11, colors.muted) +
      '<path id="uartWave" d="M112 285H150V330H190V285H230V330H270V285H350V330H390V285H470V330H510V285H718" fill="none" stroke="' + colors.green + '" stroke-width="2"/>' +
      '<line id="signalCursor" x1="112" x2="112" y1="276" y2="340" stroke="' + colors.amber + '" stroke-width="1.5"/>' +
      text(400, 388, '接口关系与数字信号仅作原理讲解，不代表实时测量', 11, colors.muted));
  }

  function edaScene() {
    function module(key, x, y, width, height, title, subtitle) {
      return '<g data-eda-module="' + key + '" role="button" tabindex="0" aria-label="查看' + title + '模块" aria-pressed="false" style="cursor:pointer">' +
        block(x, y, width, height, title, subtitle, 'edaModule' + edaModules[key].index) + '</g>';
    }
    const segments = {
      a: '16,8 54,8 60,14 54,20 16,20 10,14',
      b: '62,18 68,24 68,62 62,68 56,62 56,24',
      c: '62,72 68,78 68,116 62,122 56,116 56,78',
      d: '16,120 54,120 60,126 54,132 16,132 10,126',
      e: '8,72 14,78 14,116 8,122 2,116 2,78',
      f: '8,18 14,24 14,62 8,68 2,62 2,24',
      g: '16,64 54,64 60,70 54,76 16,76 10,70'
    };
    return svgFrame('交互电路模块与七段显示', '点击电路模块查看相关信号路径，使用单步时钟增加十进制计数并观察七段显示。',
      text(28, 28, 'CIRCUIT MODULES / DESIGN FLOW', 12, colors.muted, 'start') +
      module('clock', 35, 65, 155, 90, '时钟脉冲', 'NE555 / 触发节拍') +
      module('timing', 225, 65, 155, 90, '时序电路', '计数 / 译码') +
      module('state', 415, 65, 155, 90, '状态逻辑', '组合与状态关系') +
      module('display', 605, 65, 160, 90, '数码管显示', '显示驱动') +
      '<path id="edaFlow0" d="M190 110H225" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' +
      '<path id="edaFlow1" d="M380 110H415" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' +
      '<path id="edaFlow2" d="M570 110H605" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' +
      '<circle id="edaPacket0" r="4" fill="' + colors.green + '"/><circle id="edaPacket1" r="4" fill="' + colors.green + '"/><circle id="edaPacket2" r="4" fill="' + colors.green + '"/>' +
      module('power', 35, 205, 235, 75, '电源与开关', '输入 / 输出 / 手动指定') +
      module('analog', 325, 205, 235, 75, '放大器网络', '模拟信号相关电路') +
      '<path id="edaSupport" d="M152 205V180H440V205M300 180V155" fill="none" stroke="' + colors.line + '" stroke-dasharray="4 4"/>' +
      '<rect x="605" y="175" width="160" height="185" rx="4" fill="white" stroke="' + colors.line + '"/>' +
      '<g id="edaDigit" transform="translate(654 189) scale(.82)" aria-label="当前七段显示 0">' +
      Object.entries(segments).map(([name, points]) => '<polygon data-segment="' + name + '" points="' + points + '" fill="#dce6df"/>').join('') + '</g>' +
      '<text id="edaCount" x="685" y="333" text-anchor="middle" font-family="Consolas,monospace" font-size="16" fill="' + colors.green + '">COUNT 0</text>' +
      text(35, 325, '点击模块：高亮关联路径', 13, colors.muted, 'start') +
      text(35, 348, '单步时钟：观察计数与七段显示', 13, colors.muted, 'start') +
      text(400, 388, '模块关系与计数逻辑交互示意，非器件级电气仿真', 11, colors.muted), true);
  }

  function linuxScene() {
    const terminalLines = Array.from({ length: 5 }, (_, index) =>
      '<text id="terminalLine' + index + '" x="52" y="' + (116 + index * 35) + '" font-family="Consolas,monospace" font-size="14" fill="#d7e7de"></text>').join('');
    return svgFrame('Linux 开发流程与设备接口', '终端展示构建与观察进程的示例命令，右侧展示应用、驱动接口和设备之间的分层关系。',
      text(28, 28, 'LINUX / BUILD / DEVICE INTERFACE', 12, colors.muted, 'start') +
      '<rect x="30" y="62" width="490" height="270" rx="4" fill="#16231f" stroke="#40564b" stroke-width="1.5"/>' +
      '<path d="M30 101H520" stroke="#40564b"/>' +
      text(52, 86, systems[activeSystem].name + ' / DEVELOPMENT WORKFLOW · 示例命令', 12, '#b6cdbf', 'start') +
      '<rect x="30" y="62" width="4" height="270" fill="' + systems[activeSystem].accent + '"/>' +
      terminalLines +
      '<rect id="terminalCursor" x="52" y="290" width="8" height="14" fill="#6fc39c"/>' +
      block(585, 62, 185, 72, '应用程序', '任务 / 进程 / 服务', 'linuxLayer0') +
      block(585, 163, 185, 72, '系统与驱动接口', '系统调用 / 设备文件', 'linuxLayer1') +
      block(585, 264, 185, 72, '硬件设备', '接口 / 外设通信', 'linuxLayer2') +
      '<path id="linuxFlow0" d="M677 134V163" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' +
      '<path id="linuxFlow1" d="M677 235V264" fill="none" stroke="#78958a" stroke-width="2" marker-end="url(#flowArrow)"/>' +
      '<path id="linuxReturn" d="M585 300H550V98H585" fill="none" stroke="#92ac9d" stroke-width="1.5" stroke-dasharray="5 5"/>' +
      '<circle id="linuxPacket0" r="4" fill="' + colors.green + '"/><circle id="linuxPacket1" r="4" fill="' + colors.cyan + '"/>' +
      text(277, 367, '源码组织 → 构建配置 → 运行观察 → 设备交互', 13, colors.muted) +
      text(400, 391, '命令与消息流为流程示意，非实际设备或终端的实时输出', 11, colors.muted));
  }

  function movePacket(path, dot, fraction) {
    if (!path || !dot) return;
    const point = path.getPointAtLength(path.getTotalLength() * fraction);
    dot.setAttribute('cx', point.x);
    dot.setAttribute('cy', point.y);
  }

  function updateEda() {
    const selected = edaModules[selectedEdaModule];
    Object.entries(edaModules).forEach(([key, module]) => {
      const group = refs['edaModule' + module.index];
      const rectangle = group?.querySelector('rect');
      if (!rectangle) return;
      const active = key === selectedEdaModule;
      rectangle.setAttribute('fill', active ? '#e2efe6' : 'white');
      rectangle.setAttribute('stroke', active ? colors.green : colors.line);
      rectangle.setAttribute('stroke-width', active ? 2.5 : 1.5);
      group.parentElement.setAttribute('aria-pressed', String(active));
    });
    for (let index = 0; index < 3; index++) {
      refs['edaFlow' + index]?.setAttribute('stroke', selected.lines.includes(index) ? colors.green : '#b6c8be');
      refs['edaFlow' + index]?.setAttribute('stroke-width', selected.lines.includes(index) ? 3 : 1.5);
    }
    refs.edaSupport?.setAttribute('stroke', ['power', 'analog'].includes(selectedEdaModule) ? colors.green : colors.line);
    const patterns = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
    const pattern = patterns[edaCounter];
    refs.edaDigit?.querySelectorAll('[data-segment]').forEach(segment => {
      segment.setAttribute('fill', pattern.includes(segment.dataset.segment) ? colors.green : '#dce6df');
    });
    refs.edaDigit?.setAttribute('aria-label', '当前七段显示 ' + edaCounter);
    if (refs.edaCount) refs.edaCount.textContent = 'COUNT ' + edaCounter;
    $('sceneStatus').textContent = '计数 ' + edaCounter + ' · ' + selected.title + '：' + selected.detail;
  }

  function linuxCommand() {
    const name = systems[activeSystem].name;
    const commands = {
      system: { title: '系统信息', layers: [1], lines: ['$ uname -a', '[示意] Linux / ' + name, '$ cat /etc/os-release', '[示意] 查看发行版与系统环境', ''] },
      devices: { title: '设备接口', layers: [1, 2], lines: ['$ ls /dev/', '[示意] tty* / gpiochip* / input/', '$ ls /sys/class/', '[示意] 设备节点与驱动接口', ''] },
      build: { title: '构建程序', layers: [0], lines: ['$ cmake -S . -B build', '$ cmake --build build', '[示意] 配置 → 编译 → 链接', '$ ./build/device-demo', '[示意] 应用通过接口访问设备'] },
      services: { title: '进程与服务', layers: [0, 1], lines: ['$ systemctl status device.service', '[示意] 服务状态与生命周期', '$ journalctl -u device.service', '[示意] 通过日志观察运行过程', '$ ps -ef'] }
    };
    return commands[activeCommand];
  }

  function updateScene(time) {
    const cycle = (time % 12000) / 12000;
    const phase = Math.min(3, Math.floor(cycle * 4));
    if (phase !== phaseIndex && !['eda', 'linux', 'ros'].includes(activeSkill)) {
      $('sceneStatus').textContent = skills[activeSkill].phases[phase];
      phaseIndex = phase;
    }
    if (activeSkill === 'embedded') {
      movePacket(refs.gpioPath, refs.gpioPacket, (time % 2100) / 2100);
      movePacket(refs.txPath, refs.txPacket, (time % 1600) / 1600);
      movePacket(refs.rxPath, refs.rxPacket, ((time + 600) % 1900) / 1900);
      const cursorX = 112 + cycle * 606;
      refs.signalCursor.setAttribute('x1', cursorX);
      refs.signalCursor.setAttribute('x2', cursorX);
    } else if (activeSkill === 'eda') {
      updateEda();
      for (let index = 0; index < 3; index++) {
        movePacket(refs['edaFlow' + index], refs['edaPacket' + index], ((time + index * 320) % 1500) / 1500);
      }
    } else if (activeSkill === 'linux') {
      const command = linuxCommand();
      const lines = command.lines;
      let characters = Math.floor(Math.min(1, time / 2500) * lines.join('').length);
      lines.forEach((line, index) => {
        refs['terminalLine' + index].textContent = line.slice(0, Math.max(0, characters));
        characters -= line.length;
      });
      refs.terminalCursor.setAttribute('opacity', Math.floor(time / 500) % 2 ? 1 : 0.25);
      for (let index = 0; index < 3; index++) {
        const rectangle = refs['linuxLayer' + index].querySelector('rect');
        rectangle.setAttribute('fill', command.layers.includes(index) ? '#e2efe6' : 'white');
        rectangle.setAttribute('stroke', command.layers.includes(index) ? colors.green : colors.line);
      }
      $('sceneStatus').textContent = systems[activeSystem].name + ' · ' + command.title + '交互示意';
      movePacket(refs.linuxFlow0, refs.linuxPacket0, (time % 1700) / 1700);
      movePacket(refs.linuxFlow1, refs.linuxPacket1, ((time + 650) % 1700) / 1700);
    }
  }

  function boardVisible() {
    return activeSkill === 'embedded' || (activeSkill === 'eda' && activeEdaView === 'pcb');
  }

  function diagramVisible() {
    return activeSkill !== 'ros' && !(activeSkill === 'eda' && activeEdaView === 'pcb');
  }

  function syncExternalPause() {
    window.BoardReference3D?.setPaused(paused || !boardVisible() || document.hidden);
    window.RosReferenceLab?.setPaused(paused || activeSkill !== 'ros' || document.hidden);
  }

  function syncViews() {
    if ($('photoFigure')) $('photoFigure').hidden = true;
    if ($('boardFigure')) $('boardFigure').hidden = !boardVisible();
    if ($('rosFigure')) $('rosFigure').hidden = activeSkill !== 'ros';
    if ($('diagramShell')) $('diagramShell').hidden = !diagramVisible();
    $('boardSwitch').hidden = activeSkill !== 'embedded';
    if ($('edaSwitch')) $('edaSwitch').hidden = activeSkill !== 'eda';
    if ($('rosSwitch')) $('rosSwitch').hidden = activeSkill !== 'ros';
    if ($('linuxSwitch')) $('linuxSwitch').hidden = activeSkill !== 'linux';
    if ($('linuxActions')) $('linuxActions').hidden = activeSkill !== 'linux';
    if ($('edaStep')) $('edaStep').hidden = activeSkill !== 'eda' || activeEdaView !== 'schematic';
    if (boardVisible()) {
      window.BoardReference3D?.setModel(activeSkill === 'eda' ? 'circuit' : activeBoard);
      window.BoardReference3D?.resize();
    }
    if (activeSkill === 'ros') {
      window.RosReferenceLab?.setView(activeRosView);
      window.RosReferenceLab?.resize();
      $('sceneStatus').textContent = activeRosView === 'model' ? '拖动查看机器人结构，滚轮调整视角距离' : '在仿真区域点选目标，观察路径与运动';
    } else if (activeSkill === 'eda' && activeEdaView === 'pcb') {
      $('sceneStatus').textContent = '拖动旋转 PCB，查看器件封装、接口与布局关系';
    }
    syncExternalPause();
  }

  function updatePauseButton() {
    $('pauseButton').textContent = paused ? '播放示意' : '暂停示意';
    $('pauseButton').setAttribute('aria-pressed', String(paused));
    syncExternalPause();
  }

  function tick(time) {
    if (paused || document.hidden || !diagramVisible()) return;
    if (previousTime) elapsed += Math.min(time - previousTime, 100);
    previousTime = time;
    updateScene(elapsed);
    frameId = requestAnimationFrame(tick);
  }

  function setPaused(value) {
    paused = value;
    cancelAnimationFrame(frameId);
    previousTime = 0;
    updatePauseButton();
    if (!paused && !document.hidden && diagramVisible()) frameId = requestAnimationFrame(tick);
  }

  function mountScene() {
    cancelAnimationFrame(frameId);
    elapsed = paused ? 9000 : 0;
    previousTime = 0;
    phaseIndex = -1;
    if (!diagramVisible()) {
      artwork.replaceChildren();
      refs = {};
      updatePauseButton();
      return;
    }
    const renderers = { embedded: embeddedScene, eda: edaScene, linux: linuxScene };
    artwork.innerHTML = renderers[activeSkill]();
    refs = Object.fromEntries(Array.from(artwork.querySelectorAll('[id]'), element => [element.id, element]));
    if (activeSkill === 'eda') {
      artwork.querySelectorAll('[data-eda-module]').forEach(module => {
        function activate() {
          selectedEdaModule = module.dataset.edaModule;
          updateEda();
        }
        module.addEventListener('click', activate);
        module.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          activate();
        });
      });
    }
    updateScene(elapsed);
    updatePauseButton();
    if (!paused && !document.hidden && diagramVisible()) frameId = requestAnimationFrame(tick);
  }

  function selectSkill(key, updateHash = true) {
    if (!Object.hasOwn(skills, key)) return;
    activeSkill = key;
    const skill = skills[key];
    document.querySelectorAll('button[data-skill]').forEach(button => {
      const selected = button.dataset.skill === key;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $('skillPanel').setAttribute('aria-labelledby', 'tab-' + key);
    $('skillPanel').dataset.activeSkill = key;
    $('skillPanel').dataset.skill = key;
    document.documentElement.dataset.activeSkill = key;
    $('sceneIndex').textContent = '0' + (skillKeys.indexOf(key) + 1) + ' / 04';
    $('sceneTitle').textContent = skill.title;
    $('sceneSummary').textContent = skill.summary;
    $('simulationNote').textContent = skill.note;
    $('skillTags').replaceChildren(...skill.tags.map(tag => {
      const element = document.createElement('span');
      element.textContent = tag;
      return element;
    }));
    $('workSteps').replaceChildren(...skill.steps.map(step => {
      const item = document.createElement('li');
      item.textContent = step;
      return item;
    }));
    syncViews();
    if (updateHash) history.replaceState(null, '', '#' + key);
    mountScene();
  }

  document.querySelectorAll('button[data-skill]').forEach(button => {
    button.addEventListener('click', () => selectSkill(button.dataset.skill));
    button.addEventListener('keydown', event => {
      const index = skillKeys.indexOf(button.dataset.skill);
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % skillKeys.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + skillKeys.length - 1) % skillKeys.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = skillKeys.length - 1;
      else return;
      event.preventDefault();
      selectSkill(skillKeys[next]);
      $('tab-' + skillKeys[next]).focus();
    });
  });

  function bindSelection(attribute, select) {
    document.querySelectorAll('button[' + attribute + ']').forEach(button => {
      button.addEventListener('click', () => {
        if (!select(button.getAttribute(attribute))) return;
        document.querySelectorAll('button[' + attribute + ']').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        syncViews();
        mountScene();
      });
    });
  }
  bindSelection('data-board', key => {
    if (!Object.hasOwn(boards, key)) return false;
    activeBoard = key;
    return true;
  });
  bindSelection('data-eda-view', key => {
    if (!Object.hasOwn(edaViews, key)) return false;
    activeEdaView = key;
    return true;
  });
  bindSelection('data-ros-view', key => {
    if (!Object.hasOwn(rosViews, key)) return false;
    activeRosView = key;
    return true;
  });
  bindSelection('data-system', key => {
    if (!Object.hasOwn(systems, key)) return false;
    activeSystem = key;
    return true;
  });

  bindSelection('data-command', key => {
    if (!['system', 'devices', 'build', 'services'].includes(key)) return false;
    activeCommand = key;
    return true;
  });

  $('edaStep')?.addEventListener('click', () => {
    if (activeSkill !== 'eda' || activeEdaView !== 'schematic') return;
    edaCounter = (edaCounter + 1) % 10;
    updateEda();
  });

  $('pauseButton').addEventListener('click', () => setPaused(!paused));
  $('replayButton').addEventListener('click', () => {
    paused = false;
    if (boardVisible()) window.BoardReference3D?.resetView();
    if (activeSkill === 'ros') window.RosReferenceLab?.reset();
    if (activeSkill === 'eda') edaCounter = 0;
    mountScene();
  });
  window.addEventListener('hashchange', () => selectSkill(location.hash.slice(1), false));
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frameId);
    previousTime = 0;
    syncExternalPause();
    if (!document.hidden && !paused && diagramVisible()) frameId = requestAnimationFrame(tick);
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frameId);
    window.BoardReference3D?.setPaused(true);
    window.RosReferenceLab?.setPaused(true);
  });
  motionPreference.addEventListener('change', event => {
    if (event.matches) {
      setPaused(true);
      elapsed = 9000;
      if (diagramVisible()) updateScene(elapsed);
    }
  });
  selectSkill(activeSkill, false);
})();
