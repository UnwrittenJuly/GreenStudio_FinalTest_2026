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
    const profilePath = `members/${member.id}.html`;
    const frame = document.createElement('iframe');
    frame.src = member.compactPreview ? `${profilePath}?preview=1` : profilePath;
    frame.title = `${member.studentClass} ${member.name}的自我介绍`;
    frame.loading = 'lazy';
    frame.setAttribute('sandbox', 'allow-scripts');
    const footer = document.createElement('div');
    footer.className = 'member-card-footer';
    const path = document.createElement('code');
    path.textContent = profilePath;
    const link = document.createElement('a');
    link.className = 'button button-secondary';
    link.href = profilePath;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '独立预览 ↗';
    link.setAttribute('aria-label', `独立预览${member.name}的介绍`);
    const links = document.createElement('div');
    links.className = 'member-card-links';
    links.append(link);
    if (member.sortingFile) {
      const demoLink = document.createElement('a');
      demoLink.className = 'button button-primary';
      demoLink.href = `sorting-view.html?member=${encodeURIComponent(member.id)}`;
      demoLink.textContent = '排序演示 ↗';
      demoLink.setAttribute('aria-label', `查看${member.name}的排序演示`);
      links.append(demoLink);
    } else if (!member.compactPreview) {
      const pending = document.createElement('span');
      pending.className = 'member-pending';
      pending.textContent = '排序待补充';
      links.append(pending);
    }
    footer.append(path, links);
    card.append(header, frame, footer);
    grid.append(card);
  }

  // Compact skill cards open their full animation in the main page. Verify
  // the sender because sandboxed member frames have an opaque origin.
  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || data.type !== 'greenexplore:open-profile') return;
    const member = members.find(item => item.id === data.memberId && item.compactPreview);
    if (!member || !['embedded', 'eda', 'linux', 'ros'].includes(data.skill)) return;
    const frame = $(`member-${member.id}`)?.querySelector('iframe');
    if (event.source !== frame?.contentWindow) return;
    location.assign(`members/${member.id}.html#${data.skill}`);
  });

  function selectedMember() { return members.find(member => member.id === select.value); }
  function updateIdentity() {
    const member = selectedMember();
    $('locateMemberButton').disabled = !member;
    $('memberTip').textContent = member
      ? member.compactPreview
        ? `${member.name}的工程工作台：点击技能选项进入对应交互场景，或通过「独立预览」查看完整工作台。`
        : `${member.name}的介绍文件是 members/${member.id}.html。点击「定位成员介绍」查看，通过卡片链接打开完整介绍或排序演示。`
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
  $('refreshMembersButton').addEventListener('click', async () => {
    const button = $('refreshMembersButton');
    const previews = Array.from(grid.querySelectorAll('iframe'));
    const total = previews.length;
    const version = Date.now();
    let completed = 0;
    let timedOut = 0;
    button.disabled = true;
    button.textContent = '正在刷新成员介绍…';
    $('memberTip').textContent = `正在刷新介绍预览：0 / ${total}`;
    function refreshFrame(frame) {
      return new Promise(resolve => {
        let timer;
        const finish = expired => {
          clearTimeout(timer);
          frame.removeEventListener('load', loaded);
          if (expired) timedOut++;
          completed++;
          $('memberTip').textContent = `正在刷新介绍预览：${completed} / ${total}`;
          resolve();
        };
        const loaded = () => finish(false);
        frame.addEventListener('load', loaded, { once: true });
        timer = setTimeout(() => finish(true), 15000);
        // Explicitly refresh offscreen cards too; lazy frames may otherwise
        // wait for scrolling and hold a refresh worker indefinitely.
        frame.loading = 'eager';
        const refreshUrl = new URL(frame.getAttribute('src'), document.baseURI);
        refreshUrl.searchParams.set('v', version);
        frame.src = refreshUrl.href;
      });
    }
    async function worker() {
      while (previews.length) await refreshFrame(previews.shift());
    }
    await Promise.all(Array.from({ length: 3 }, worker));
    button.disabled = false;
    button.textContent = '↻ 刷新成员介绍';
    $('memberTip').textContent = timedOut
      ? `${timedOut} 个介绍预览加载较慢，请确认启动窗口仍在运行后再刷新。`
      : '介绍预览已刷新。请确认已在编辑器中保存自己的 HTML 文件。';
  });
  const linkedMember = members.find(member => location.hash === `#member-${member.id}`);
  if (linkedMember) select.value = linkedMember.id;
  updateIdentity();
  if (linkedMember) {
    const card = $(`member-${linkedMember.id}`);
    card.querySelector('iframe').loading = 'eager';
    card.scrollIntoView({ block: 'center', behavior: 'auto' });
  }
})();
