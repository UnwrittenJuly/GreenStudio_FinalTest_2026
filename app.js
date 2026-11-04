'use strict';

// 名单与公共页面由项目维护者管理；同学只编辑自己的 members/NN.html。
(() => {
  const roster = [
    ['电子2602', '任天灵'], ['计2603', '李嘉赢'], ['电子2603', '吴柏鑫'],
    ['智能2601', '李佳璐'], ['电子2603', '朱家铭'], ['计2603', '张亮琪'],
    ['智能2602', '叶斌铖'], ['计2605', '杨沁林'], ['电子2603', '崔建涛'],
    ['通信2603', '田子涵'], ['智能2601', '韩硕'], ['计2601', '周钰山'],
    ['通信2601', '蒲佳妮'], ['计2602', '谢宇轩'], ['国电2602', '张淇奥'],
    ['通信2602', '朱惠瑶'], ['国电2602', '夏源浩'], ['智能2604', '方君强']
  ];
  const $ = id => document.getElementById(id);
  const select = $('memberSelect');
  const grid = $('memberGrid');
  const storageKey = 'greenexplore.project.member';
  const members = roster.map(([studentClass, name], i) => ({
    studentClass, name, id: String(i + 1).padStart(2, '0')
  }));

  for (const member of members) {
    select.add(new Option(`${member.studentClass} · ${member.name}`, member.id));
    const card = document.createElement('article');
    card.className = 'member-shell';
    card.id = `member-${member.id}`;
    const header = document.createElement('div');
    header.className = 'member-card-heading';
    const number = document.createElement('span');
    number.textContent = member.id;
    const label = document.createElement('span');
    label.textContent = `${member.studentClass} / 独立开发区域`;
    header.append(number, label);
    const frame = document.createElement('iframe');
    frame.src = `members/${member.id}.html`;
    frame.title = `${member.studentClass} ${member.name}的自我介绍`;
    frame.loading = 'lazy';
    frame.setAttribute('sandbox', 'allow-scripts');
    const footer = document.createElement('div');
    footer.className = 'member-card-footer';
    const path = document.createElement('code');
    path.textContent = frame.getAttribute('src');
    const link = document.createElement('a');
    link.href = frame.getAttribute('src');
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '独立预览 ↗';
    link.setAttribute('aria-label', `独立预览${member.name}的介绍`);
    footer.append(path, link);
    card.append(header, frame, footer);
    grid.append(card);
  }

  function selectedMember() { return members.find(member => member.id === select.value); }
  function updateChecklist() {
    const member = selectedMember();
    const extension = { python: 'py', c: 'c', cpp: 'cpp' }[$('languageSelect').value];
    const identity = member ? `${member.studentClass}_${member.name}` : '班级_姓名';
    const memberPath = member ? `members/${member.id}.html` : 'members/你的编号.html';
    const sortingPath = `submissions/${identity}.${extension}`;
    $('sortFilePath').textContent = sortingPath;
    $('memberFilePath').textContent = memberPath;
    const branch = `student/${member ? `${member.studentClass}-${member.name}` : '班级-姓名'}`;
    $('startSteps').textContent = `浏览器 → 课程仓库 → Fork\nVS Code → Git: Clone → 自己的 Fork 地址\n打开项目 → main → 创建新分支\n个人分支：${branch}\n终端 → 运行任务 → 启动项目（Windows）`;
    $('submissionChecklist').textContent = `提交说明：feat: 完成${member?.name || '个人'}的介绍与排序考核\n来源：自己的 Fork / ${branch}\n目标：UnwrittenJuly/GreenStudio_FinalTest_2026 / main\n填写模板 → 创建 PR → 等待老师审核`;
    $('copyChecklistButton').textContent = '复制我的提交清单 ↗';
    $('copyChecklistButton').disabled = !member;
  }
  function updateIdentity() {
    const member = selectedMember();
    $('studentClass').value = member?.studentClass || '';
    $('studentName').value = member?.name || '';
    $('locateMemberButton').disabled = !member;
    $('memberTip').textContent = member
      ? `${member.name}，你的开发文件是 members/${member.id}.html。只修改这个文件中的介绍内容；排序程序保存为「${member.studentClass}_${member.name}」。`
      : '选择上方姓名，查看自己的文件。修改文件中的自我介绍、兴趣和学习目标，保存后刷新预览。';
    for (const card of grid.children) card.classList.toggle('is-mine', card.id === `member-${member?.id}`);
    try { localStorage.setItem(storageKey, select.value); } catch { /* 身份选择仍可使用。 */ }
    updateChecklist();
    // 通知排序模块更新下载资格；身份由本模块统一管理。
    $('studentClass').dispatchEvent(new Event('input', { bubbles: true }));
    $('studentName').dispatchEvent(new Event('input', { bubbles: true }));
  }
  function updateView() {
    const sorting = location.hash === '#sorting';
    $('teamTask').hidden = sorting;
    $('sortingTask').hidden = !sorting;
    for (const link of document.querySelectorAll('[data-view]')) {
      if ((link.dataset.view === 'sorting') === sorting) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (members.some(member => member.id === saved)) select.value = saved;
  } catch { /* 不依赖本地存储也能选择成员。 */ }
  select.addEventListener('change', updateIdentity);
  $('languageSelect').addEventListener('change', updateChecklist);
  document.addEventListener('sorting-language-change', updateChecklist);
  window.addEventListener('hashchange', updateView);
  $('locateMemberButton').addEventListener('click', () => {
    const member = selectedMember();
    if (!member) return;
    location.hash = 'team';
    updateView();
    $(`member-${member.id}`).scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('refreshMembersButton').addEventListener('click', () => {
    for (const frame of grid.querySelectorAll('iframe')) {
      frame.src = `${frame.getAttribute('src').split('?')[0]}?v=${Date.now()}`;
    }
    $('memberTip').textContent = '介绍预览已刷新。请确认已在编辑器中保存自己的 HTML 文件。';
  });
  $('copyChecklistButton').addEventListener('click', async event => {
    const member = selectedMember();
    if (!member) { select.focus(); return; }
    const checklist = `${member.studentClass} ${member.name}的提交清单\n获取项目：浏览器 Fork 老师的公开仓库到自己的账号 → VS Code 克隆自己的 Fork\n远程 origin：自己的 Fork\n介绍文件：${$('memberFilePath').textContent}\n排序文件：${$('sortFilePath').textContent}\n${$('submissionChecklist').textContent}\nVS Code 操作：保存 → 检查差异 → 分别暂存两个文件 → 提交 → 发布分支到自己的 origin（后续为推送）→ 向老师仓库创建 PR\n成功创建 PR 即完成提交流程，等待老师审核和合并。\n完整指南：在 VS Code 打开 STUDENT_GUIDE.md，按 Ctrl + Shift + V 预览。`;
    try {
      await navigator.clipboard.writeText(checklist);
      event.target.textContent = '已复制 ✓';
    } catch { event.target.textContent = '请手动选择并复制上方文件路径和清单'; }
  });
  updateView();
  updateIdentity();
})();
