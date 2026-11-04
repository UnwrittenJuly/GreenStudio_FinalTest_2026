'use strict';

// 名单与公共页面由项目维护者管理；同学只编辑自己的 members/NN.html。
(async () => {
  const $ = id => document.getElementById(id);
  const select = $('memberSelect');
  const grid = $('memberGrid');
  const storageKey = 'greenexplore.introductions.member';
  let members;
  try {
    const response = await fetch('members.json');
    if (!response.ok) throw new Error('无法读取成员名单');
    members = await response.json();
  } catch {
    $('memberTip').textContent = '成员名单暂时无法加载。请双击 start.bat 启动项目后刷新页面。';
    return;
  }

  for (const count of document.querySelectorAll('[data-member-count]')) count.textContent = members.length;
  $('heroNumber').setAttribute('aria-label', `${members.length} 位成员`);

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
    label.textContent = `${member.studentClass} / ${member.name}`;
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
    const links = document.createElement('div');
    links.className = 'member-card-links';
    links.append(link);
    if (member.sortingFile) {
      const demoLink = document.createElement('a');
      demoLink.href = `sorting-view.html?member=${encodeURIComponent(member.id)}`;
      demoLink.textContent = '排序演示 ↗';
      demoLink.setAttribute('aria-label', `查看${member.name}的排序演示`);
      links.append(demoLink);
    } else {
      const pending = document.createElement('span');
      pending.className = 'member-pending';
      pending.textContent = '排序待补充';
      links.append(pending);
    }
    footer.append(path, links);
    card.append(header, frame, footer);
    grid.append(card);
  }

  function selectedMember() { return members.find(member => member.id === select.value); }
  function updateIdentity() {
    const member = selectedMember();
    $('locateMemberButton').disabled = !member;
    $('memberTip').textContent = member
      ? `${member.name}的介绍文件是 members/${member.id}.html。点击「定位成员介绍」查看，通过卡片链接打开完整介绍或排序演示。`
      : '选择上方姓名，定位成员介绍。点击“独立预览”了解完整介绍，或打开“排序演示”看看每位伙伴的代码如何工作。';
    for (const card of grid.children) card.classList.toggle('is-mine', card.id === `member-${member?.id}`);
    try { localStorage.setItem(storageKey, select.value); } catch { /* 身份选择仍可使用。 */ }
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (members.some(member => member.id === saved)) select.value = saved;
  } catch { /* 不依赖本地存储也能选择成员。 */ }
  select.addEventListener('change', updateIdentity);
  $('locateMemberButton').addEventListener('click', () => {
    const member = selectedMember();
    if (!member) return;
    location.hash = 'team';
    $(`member-${member.id}`).scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('refreshMembersButton').addEventListener('click', () => {
    for (const frame of grid.querySelectorAll('iframe')) {
      frame.src = `${frame.getAttribute('src').split('?')[0]}?v=${Date.now()}`;
    }
    $('memberTip').textContent = '介绍预览已刷新。请确认已在编辑器中保存自己的 HTML 文件。';
  });
  updateIdentity();
})();
