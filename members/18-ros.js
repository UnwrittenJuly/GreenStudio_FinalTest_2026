'use strict';

// Interactive geometry and grid navigation; no ROS process is run by this page.
(() => {
  if (new URLSearchParams(location.search).get('preview') === '1') return;
  const canvas = document.getElementById('rosCanvas');
  const viewport = document.getElementById('rosViewport');
  const figure = document.getElementById('rosFigure');
  if (!canvas || !viewport || !figure) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const $ = id => document.getElementById(id);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const COLS = 30, ROWS = 20;
  const grid = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1));
  function wall(x, y, width, height) {
    for (let row = y; row < y + height; row++)
      for (let col = x; col < x + width; col++) grid[row][col] = true;
  }
  wall(7, 4, 18, 2);
  wall(7, 6, 2, 9);
  wall(15, 10, 10, 2);
  wall(15, 12, 2, 5);
  wall(22, 15, 3, 2);
  wall(3, 12, 2, 2);

  let view = 'model', paused = reducedMotion.matches;
  let width = 600, height = 430, frame = 0, lastTime = 0, scanAngle = 0;
  let yaw = -.56, pitch = .64, zoom = 1, drag = null;
  let robot = { x: 3, y: 3, heading: 0 };
  let goal = { x: 26, y: 16 }, route = [], routeIndex = 0, plannedCells = [];
  let navigation = 'idle';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';

  function setStatus(text) { if ($('rosGoalStatus')) $('rosGoalStatus').textContent = text; }
  function visible() { return !document.hidden && !figure.hidden && figure.getClientRects().length > 0; }
  function blocked(x, y) {
    const col = Math.floor(x + .5), row = Math.floor(y + .5);
    return row < 0 || row >= ROWS || col < 0 || col >= COLS || grid[row][col];
  }

  // A four-neighbour search keeps every segment on a free grid cell.
  function search(start, end) {
    const key = (x, y) => y * COLS + x;
    const visited = new Set([key(start.x, start.y)]);
    const parents = new Map();
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      if (current.x === end.x && current.y === end.y) {
        const result = [current];
        let entry = current;
        while (parents.has(key(entry.x, entry.y))) {
          entry = parents.get(key(entry.x, entry.y));
          result.push(entry);
        }
        return result.reverse();
      }
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const next = { x: current.x + dx, y: current.y + dy };
        const nextKey = key(next.x, next.y);
        if (!blocked(next.x, next.y) && !visited.has(nextKey)) {
          visited.add(nextKey);
          parents.set(nextKey, current);
          queue.push(next);
        }
      }
    }
    return null;
  }

  function planTo(nextGoal, announce = true) {
    if (blocked(nextGoal.x, nextGoal.y)) {
      setStatus('目标位于障碍物中，请点击可通行区域。');
      canvas.dataset.blockedGoal = 'true';
      return false;
    }
    const start = { x: Math.round(robot.x), y: Math.round(robot.y) };
    const cells = search(start, nextGoal);
    if (!cells) {
      setStatus('当前目标不可达，请在连通的空地上重新选择。');
      return false;
    }
    goal = { ...nextGoal };
    plannedCells = cells;
    route = [{ x: robot.x, y: robot.y }, ...cells];
    routeIndex = 0;
    navigation = cells.length === 1 && Math.hypot(robot.x - goal.x, robot.y - goal.y) < .01 ? 'arrived' : 'moving';
    canvas.dataset.goal = `${goal.x},${goal.y}`;
    canvas.dataset.blockedGoal = 'false';
    canvas.dataset.planLength = String(cells.length);
    if (announce) setStatus(`目标网格 (${goal.x}, ${goal.y})：已生成绕障路径${paused ? '，当前处于暂停状态' : '，机器人沿路径移动'}。`);
    render();
    schedule();
    return true;
  }

  function moveRobot(seconds) {
    let distance = seconds * 2.6;
    while (distance > 0 && routeIndex < route.length) {
      const target = route[routeIndex];
      const dx = target.x - robot.x, dy = target.y - robot.y;
      const remaining = Math.hypot(dx, dy);
      if (remaining < .0001) { routeIndex++; continue; }
      const step = Math.min(distance, remaining);
      robot.x += dx / remaining * step;
      robot.y += dy / remaining * step;
      robot.heading = Math.atan2(dy, dx);
      distance -= step;
      if (step === remaining) routeIndex++;
    }
    if (navigation === 'moving' && routeIndex >= route.length) {
      navigation = 'arrived';
      setStatus(`已到达目标网格 (${goal.x}, ${goal.y})。点击另一处空地可重新规划。`);
    }
  }

  function mapMetrics() {
    const cell = Math.min((width - 32) / COLS, (height - 78) / ROWS);
    return { cell, left: (width - cell * COLS) / 2, top: 42 + (height - 78 - cell * ROWS) / 2 };
  }
  function pointOnMap(col, row, metrics) {
    return { x: metrics.left + (col + .5) * metrics.cell, y: metrics.top + (row + .5) * metrics.cell };
  }

  // A lightweight perspective model: cuboids and cylinders are real 3D faces.
  function project(point) {
    const [x, y, z] = point;
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
    const depth = ry * Math.cos(pitch) + z * Math.sin(pitch);
    const scale = Math.min(width / 340, height / 290) * .88 * zoom * 750 / (750 - depth);
    return { x: width / 2 + rx * scale, y: height * .65 + (ry * Math.sin(pitch) - z * Math.cos(pitch)) * scale, depth };
  }
  function addFace(faces, points, fill, stroke = '#23352d') { faces.push({ points, fill, stroke }); }
  function box(faces, x, y, z, w, d, h, palette) {
    const p = [[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
    [[0,1,2,3],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach((indices, i) =>
      addFace(faces, indices.map(index => p[index]), palette[i % palette.length]));
  }
  function cylinder(faces, center, radius, length, axis, colors, segments = 20) {
    const ring = (offset, i) => {
      const a = i / segments * Math.PI * 2;
      return axis === 'x' ? [center[0]+offset,center[1]+Math.cos(a)*radius,center[2]+Math.sin(a)*radius]
        : [center[0]+Math.cos(a)*radius,center[1]+Math.sin(a)*radius,center[2]+offset];
    };
    const low = Array.from({ length: segments }, (_, i) => ring(-length / 2, i));
    const high = Array.from({ length: segments }, (_, i) => ring(length / 2, i));
    addFace(faces, low, colors[0]);
    addFace(faces, high, colors[1] || colors[0]);
    for (let i = 0; i < segments; i++) addFace(faces, [low[i],low[(i+1)%segments],high[(i+1)%segments],high[i]], colors[2] || colors[0]);
  }

  function drawModel() {
    ctx.fillStyle = '#f6f8f7'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#dce4df'; ctx.lineWidth = 1;
    for (let i = -150; i <= 150; i += 25) {
      for (const line of [[[i,-135,0],[i,135,0]],[[-150,i,0],[150,i,0]]]) {
        const a = project(line[0]), b = project(line[1]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const faces = [];
    box(faces,-83,-58,27,166,116,25,['#9c4b14','#a95214','#b15a16','#a75012','#b65814','#d97722']);
    box(faces,-79,-54,52,158,108,3,['#bd641d','#be651e','#bb601a','#bc631c','#bc631c','#dc8233']);
    box(faces,-21,-65,32,42,10,18,['#1e2924','#1e2924','#293830','#293830','#26352d','#34483d']);
    for (const x of [-94,94]) for (const y of [-43,43]) {
      cylinder(faces,[x,y,25],25,20,'x',['#465049','#515b54','#28362e'],22);
      cylinder(faces,[x,y,25],13,22,'x',['#a6b1aa','#b8c3bc','#7f8d84'],20);
      cylinder(faces,[x,y,25],5,24,'x',['#d4dcd7','#dce3df','#b1beb5'],12);
    }
    cylinder(faces,[0,-5,61],24,12,'z',['#27392e','#344b3b','#25382c']);
    cylinder(faces,[0,-5,77],19,20,'z',['#1d2621','#29362e','#17251c']);
    cylinder(faces,[0,-5,88],17,2,'z',['#222c26','#3d5143','#24352a']);
    for (const x of [-66,66]) for (const y of [-42,42]) cylinder(faces,[x,y,56],3,3,'z',['#acb9b0','#dce4df','#899b90'],8);
    const projected = faces.map(face => {
      const points = face.points.map(project);
      return { ...face, points, depth: points.reduce((sum, p) => sum + p.depth, 0) / points.length };
    }).sort((a,b) => a.depth - b.depth);
    for (const face of projected) {
      ctx.beginPath();
      face.points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
      ctx.closePath(); ctx.fillStyle = face.fill; ctx.fill();
      ctx.strokeStyle = face.stroke; ctx.globalAlpha = .32; ctx.lineWidth = .6; ctx.stroke(); ctx.globalAlpha = 1;
    }
    function callout(point, text, side, offsetY) {
      const p = project(point);
      const endX = Math.max(26, Math.min(width - 26, p.x + side * Math.min(115, width * .21)));
      const endY = Math.max(60, Math.min(height - 44, p.y + offsetY));
      ctx.strokeStyle = '#7e9786'; ctx.lineWidth = .85;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(endX,endY); ctx.stroke();
      ctx.fillStyle = '#3f6951'; ctx.beginPath(); ctx.arc(p.x,p.y,2.2,0,Math.PI*2); ctx.fill();
      ctx.font = `${width < 420 ? 10 : 11}px "Segoe UI", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = side > 0 ? 'right' : 'left';
      ctx.fillText(text,endX,endY-6);
    }
    callout([0,-5,89],'激光雷达 / lidar_link',1,-35);
    callout([-40,30,55],'底盘 / base_link',-1,-32);
    callout([95,43,26],'驱动轮 / wheel_link',1,35);
    ctx.textAlign = 'left'; ctx.fillStyle = '#587163';
    ctx.font = `${width < 440 ? 9 : 11}px Consolas, monospace`;
    ctx.fillText('ROBOT STRUCTURE / INTERACTIVE MODEL',18,24);
    ctx.fillStyle = '#89988f';
    ctx.fillText('拖动旋转 · 滚轮缩放 · 方向键调整视角',18,height-17);
  }

  function drawSimulation() {
    ctx.fillStyle = '#f8faf9'; ctx.fillRect(0,0,width,height);
    const metrics = mapMetrics(), { cell, left, top } = metrics;
    ctx.fillStyle = '#fff'; ctx.fillRect(left,top,COLS*cell,ROWS*cell);
    for (let row=0;row<ROWS;row++) for(let col=0;col<COLS;col++) {
      ctx.fillStyle = grid[row][col] ? '#526359' : '#fff';
      ctx.fillRect(left+col*cell,top+row*cell,cell+.2,cell+.2);
    }
    ctx.strokeStyle = '#e4eae6'; ctx.lineWidth = .45;
    for(let col=0;col<=COLS;col++) { ctx.beginPath();ctx.moveTo(left+col*cell,top);ctx.lineTo(left+col*cell,top+ROWS*cell);ctx.stroke(); }
    for(let row=0;row<=ROWS;row++) { ctx.beginPath();ctx.moveTo(left,top+row*cell);ctx.lineTo(left+COLS*cell,top+row*cell);ctx.stroke(); }
    if(plannedCells.length) {
      ctx.strokeStyle = '#288361';ctx.lineWidth = Math.max(1.6,cell*.11);ctx.lineJoin='round';
      ctx.beginPath();
      plannedCells.forEach((p,i)=>{ const pixel=pointOnMap(p.x,p.y,metrics);i?ctx.lineTo(pixel.x,pixel.y):ctx.moveTo(pixel.x,pixel.y); });
      ctx.stroke();
    }
    const origin = pointOnMap(robot.x,robot.y,metrics);
    const endpoints=[];
    for(let i=0;i<=24;i++) {
      const angle=scanAngle-.72+i/24*1.44;
      let range=.1;
      while(range<7.5&&!blocked(robot.x+Math.cos(angle)*range,robot.y+Math.sin(angle)*range))range+=.08;
      range=Math.max(0,range-.08);
      endpoints.push(pointOnMap(robot.x+Math.cos(angle)*range,robot.y+Math.sin(angle)*range,metrics));
    }
    ctx.fillStyle='#2b978a15';ctx.beginPath();ctx.moveTo(origin.x,origin.y);endpoints.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='#26988a5e';ctx.lineWidth=.7;
    endpoints.forEach(p=>{ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(p.x,p.y);ctx.stroke();});
    const goalPixel=pointOnMap(goal.x,goal.y,metrics);
    ctx.strokeStyle='#177850';ctx.lineWidth=1.5;
    const cross=Math.max(4,cell*.33);
    ctx.beginPath();ctx.arc(goalPixel.x,goalPixel.y,cross,0,Math.PI*2);ctx.moveTo(goalPixel.x-cross-3,goalPixel.y);ctx.lineTo(goalPixel.x+cross+3,goalPixel.y);ctx.moveTo(goalPixel.x,goalPixel.y-cross-3);ctx.lineTo(goalPixel.x,goalPixel.y+cross+3);ctx.stroke();
    ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(robot.heading);
    ctx.fillStyle='#b96223';ctx.strokeStyle='#8e461d';ctx.lineWidth=1;
    ctx.fillRect(-cell*.31,-cell*.25,cell*.62,cell*.5);ctx.strokeRect(-cell*.31,-cell*.25,cell*.62,cell*.5);
    ctx.fillStyle='#293a2f';
    for(const x of [-.22,.16])for(const y of [-.34,.25])ctx.fillRect(cell*x,cell*y,cell*.15,cell*.11);
    ctx.beginPath();ctx.arc(0,0,Math.max(1.8,cell*.13),0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffebcb';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(cell*.38,0);ctx.stroke();ctx.restore();
    ctx.fillStyle='#415d4c';ctx.font=`${width<440?9:11}px Consolas, monospace`;ctx.textAlign='left';
    ctx.fillText('NAVIGATION / OCCUPANCY GRID',18,23);
    ctx.textAlign='right';ctx.fillStyle='#829389';ctx.fillText('交互示意',width-18,23);ctx.textAlign='left';
    ctx.font=`${width<440?9:11}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle='#526359';ctx.fillRect(left,height-23,8,8);ctx.fillText('障碍',left+13,height-16);
    ctx.fillStyle='#288361';ctx.fillRect(left+62,height-23,8,8);ctx.fillText('规划路径',left+75,height-16);
    ctx.fillStyle='#26988a';ctx.fillRect(left+148,height-23,8,8);ctx.fillText('扫描',left+161,height-16);
    canvas.dataset.position=`${robot.x.toFixed(2)},${robot.y.toFixed(2)}`;
    canvas.dataset.navigation=paused&&navigation==='moving'?'paused':navigation;
  }

  function render() {
    if(!visible())return;
    ctx.clearRect(0,0,width,height);
    if(view==='model')drawModel();else drawSimulation();
  }
  function animate(time) {
    frame=0;
    if(paused||view!=='simulation'||!visible()){lastTime=0;return;}
    const delta=lastTime?Math.min((time-lastTime)/1000,.07):0;
    lastTime=time;scanAngle+=delta*.72;moveRobot(delta);render();schedule();
  }
  function schedule() {
    if(!frame&&!paused&&view==='simulation'&&visible())frame=requestAnimationFrame(animate);
  }
  function resize() {
    const bounds=viewport.getBoundingClientRect();
    if(bounds.width<1||bounds.height<1)return;
    width=bounds.width;height=bounds.height;
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);render();schedule();
  }
  function resetView() { yaw=-.56;pitch=.64;zoom=1;render(); }
  function resetNavigation() {
    robot={x:3,y:3,heading:0};goal={x:26,y:16};route=[];plannedCells=[];routeIndex=0;scanAngle=0;navigation='idle';
    planTo(goal,false);
    if(view==='simulation')setStatus(`已重置起点与默认目标。${paused?'导航已暂停；点击空地仍可更新规划。':'点击空地可设置新的导航目标。'}`);
  }
  function setView(next) {
    if(!['model','simulation'].includes(next))return;
    cancelAnimationFrame(frame);frame=0;lastTime=0;view=next;
    canvas.dataset.view=view;
    canvas.style.cursor=view==='model'?'grab':'crosshair';
    canvas.setAttribute('aria-label',view==='model'
      ?'四轮机器人三维结构模型。拖动旋转，方向键调整视角，滚轮或加减键缩放。'
      :'可交互导航网格。点击空地设置目标，方向键调整目标，Enter执行规划。');
    for(const id of ['rosResetGoal','rosRandomGoal'])if($(id))$(id).disabled=view!=='simulation';
    if(view==='model')setStatus('结构模型：四轮底盘、激光雷达与传感器。拖动旋转，滚轮缩放；此视图为结构参考。');
    else {
      if(!route.length)planTo(goal,false);
      setStatus(`点击空地设置目标，路径会绕开障碍物。${paused?'当前已暂停，点击目标只更新规划。':'机器人按网格路径移动，扫描射线在墙体处截断。'}`);
    }
    resize();render();schedule();
  }
  function setPaused(value) {
    paused=Boolean(value);cancelAnimationFrame(frame);frame=0;lastTime=0;
    canvas.dataset.paused=String(paused);
    render();schedule();
  }
  function chooseRandomGoal() {
    if(view!=='simulation')return;
    const candidates=[];
    const start={x:Math.round(robot.x),y:Math.round(robot.y)};
    for(let row=1;row<ROWS-1;row++)for(let col=1;col<COLS-1;col++)
      if(!grid[row][col]&&Math.hypot(col-robot.x,row-robot.y)>5)candidates.push({x:col,y:row});
    while(candidates.length) {
      const index=Math.floor(Math.random()*candidates.length);
      const next=candidates.splice(index,1)[0];
      if(search(start,next)){planTo(next);return;}
    }
    setStatus('没有找到新的连通目标，请重置场景后再试。');
  }
  function pickGoal(clientX,clientY) {
    const bounds=canvas.getBoundingClientRect(),metrics=mapMetrics();
    const x=clientX-bounds.left,y=clientY-bounds.top;
    const col=Math.floor((x-metrics.left)/metrics.cell),row=Math.floor((y-metrics.top)/metrics.cell);
    if(col<0||col>=COLS||row<0||row>=ROWS)return;
    planTo({x:col,y:row});
  }
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0&&event.pointerType==='mouse')return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:0};
    canvas.setPointerCapture(event.pointerId);
    if(view==='model')canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.lastX,dy=event.clientY-drag.lastY;
    drag.moved=Math.max(drag.moved,Math.hypot(event.clientX-drag.x,event.clientY-drag.y));
    drag.lastX=event.clientX;drag.lastY=event.clientY;
    if(view==='model'){
      yaw+=dx*.009;pitch=Math.max(.2,Math.min(1.35,pitch+dy*.007));render();
    }
  });
  function endPointer(event,cancelled=false) {
    if(!drag||drag.id!==event.pointerId)return;
    if(view==='simulation'&&!cancelled&&drag.moved<9)pickGoal(event.clientX,event.clientY);
    drag=null;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor=view==='model'?'grab':'crosshair';
  }
  canvas.addEventListener('pointerup',event=>endPointer(event));
  canvas.addEventListener('pointercancel',event=>endPointer(event,true));
  canvas.addEventListener('wheel',event=>{
    if(view!=='model')return;
    event.preventDefault();zoom=Math.max(.55,Math.min(1.85,zoom*Math.exp(-event.deltaY*.001)));render();
  },{passive:false});
  canvas.addEventListener('keydown',event=>{
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(event.key==='Home'){event.preventDefault();if(view==='model')resetView();else resetNavigation();return;}
    if(view==='model') {
      if(directions[event.key]){
        event.preventDefault();const [dx,dy]=directions[event.key];yaw+=dx*.12;pitch=Math.max(.2,Math.min(1.35,pitch+dy*.09));render();
      } else if(['+','=','-'].includes(event.key)){
        event.preventDefault();zoom=Math.max(.55,Math.min(1.85,zoom+(event.key==='-'?-.12:.12)));render();
      }
    } else if(directions[event.key]) {
      event.preventDefault();const [dx,dy]=directions[event.key];planTo({x:goal.x+dx,y:goal.y+dy});
    } else if(event.key==='Enter'){event.preventDefault();planTo(goal);}
  });
  $('rosViewReset')?.addEventListener('click',resetView);
  $('rosResetGoal')?.addEventListener('click',resetNavigation);
  $('rosRandomGoal')?.addEventListener('click',chooseRandomGoal);
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(visible()){render();schedule();}
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;});
  reducedMotion.addEventListener('change',event=>{if(event.matches)setPaused(true);});
  if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(viewport);
  else window.addEventListener('resize',resize);
  new MutationObserver(()=>{
    if(!visible()){cancelAnimationFrame(frame);frame=0;lastTime=0;}
    else {resize();schedule();}
  }).observe(figure,{attributes:true,attributeFilter:['hidden','style']});

  window.RosReferenceLab={
    setView,setPaused,resize,
    reset(){resetView();resetNavigation();},
    getState(){return{view,paused,navigation,robot:{...robot},goal:{...goal},plannedCells:plannedCells.map(p=>({...p})),grid:grid.map(row=>[...row])};}
  };
  canvas.dataset.paused=String(paused);
  setView('model');
})();
