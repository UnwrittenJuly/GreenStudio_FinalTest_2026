/* Interactive structural models based on the supplied hardware references.
 * Geometry is illustrative; it is not a PCB fabrication or electrical model. */
'use strict';
(() => {
  if (new URLSearchParams(location.search).get('preview') === '1') return;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const material = { metal: '#bac4c9', gold: '#c6a44d', plastic: '#22292b', ceramic: '#b1a38a' };

  class Structure {
    constructor(name, width, height, description) {
      Object.assign(this, { name, width, height, description, faces: [], labels: [], features: [] });
    }
    face(points, color, layer = 'component', feature = -1) {
      this.faces.push({ points, color, layer, feature });
    }
    box(x, y, z, width, height, depth, color, feature = -1, layer = 'component') {
      const a = width / 2, b = height / 2, c = depth / 2;
      const points = [[-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],[-a,-b,c],[a,-b,c],[a,b,c],[-a,b,c]]
        .map(p => [p[0] + x, p[1] + y, p[2] + z]);
      [[4,5,6,7],[3,2,1,0],[7,6,2,3],[5,1,2,6],[4,0,1,5],[4,7,3,0]].forEach(indices => {
        this.face(indices.map(i => points[i]), color, layer, feature);
      });
    }
    part(name, description, x, y, z, width, height, depth, color) {
      const feature = this.features.length;
      this.features.push({ name, description, x, y, z: z + depth / 2 + .2, width, height });
      this.box(x, y, z, width, height, depth, color, feature);
      return feature;
    }
    plate(x, y, z, width, height, color, layer = 'component') {
      this.face([[x-width/2,y-height/2,z],[x+width/2,y-height/2,z],[x+width/2,y+height/2,z],[x-width/2,y+height/2,z]], color, layer);
    }
    cylinder(x, y, z, radius, height, color, segments = 16) {
      const top = [], lower = [];
      for (let i = 0; i < segments; i++) {
        const angle = i * Math.PI * 2 / segments;
        const point = [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
        top.push([...point, z + height / 2]); lower.push([...point, z - height / 2]);
      }
      this.face(top, color);
      for (let i = 0; i < segments; i++) this.face([lower[i], lower[(i+1)%segments], top[(i+1)%segments], top[i]], color);
    }
    label(text, x, y, z, width, height = 8, color = '#d5ded8') {
      this.labels.push({ text, x, y, z, width, height, color });
    }
  }

  function mountingHoles(model) {
    for (const x of [-model.width/2+8, model.width/2-8]) for (const y of [-model.height/2+8, model.height/2-8]) {
      model.cylinder(x,y,2.1,5.1,1.2,material.gold);
      model.cylinder(x,y,2.8,3.1,.3,'#172124');
    }
  }
  function qfp(model, x, y, size, title) {
    const id = model.part('主控芯片', '方形主控封装与周边引脚。用于说明主控在板级系统中的位置。', x,y,4.9,size,size,5.2,'#30383e');
    const count = Math.round(size / 2.4);
    for (let i = 0; i < count; i++) {
      const p = -size/2 + 1.5 + i * (size-3)/(count-1);
      model.box(x+p,y-size/2-2,2.8,1,4,.9,material.metal,id);
      model.box(x+p,y+size/2+2,2.8,1,4,.9,material.metal,id);
      model.box(x-size/2-2,y+p,2.8,4,1,.9,material.metal,id);
      model.box(x+size/2+2,y+p,2.8,4,1,.9,material.metal,id);
    }
    model.cylinder(x-size/2+4,y-size/2+4,7.6,1.2,.15,'#9ba6aa',8);
    model.label(title,x,y,7.65,size-5,6,'#aebbc2');
  }
  function maleHeader(model, x, y, count, horizontal = false, rows = 2) {
    for (let i = 0; i < count; i++) for (let j = 0; j < rows; j++) {
      const px = x + (horizontal ? i * 5 : j * 5), py = y + (horizontal ? j * 5 : i * 5);
      model.box(px,py,5.1,4.7,4.7,5.8,'#22282a');
      model.box(px,py,10.2,1.45,1.45,13.5,material.gold);
    }
    const w = horizontal ? count*5 : rows*5, h = horizontal ? rows*5 : count*5;
    model.features.push({ name:'扩展排针',description:'外部连线与调试使用的排针结构；模型不定义具体针脚电气功能。',x:x+w/2-2.5,y:y+h/2-2.5,z:17,width:w,height:h });
  }
  function femaleHeader(model, x, y, count, horizontal = false, rows = 1) {
    for (let i = 0; i < count; i++) for (let j = 0; j < rows; j++) {
      const px = x + (horizontal ? i * 4.8 : j * 4.8), py = y + (horizontal ? j * 4.8 : i * 4.8);
      model.box(px,py,7,4.65,4.65,10,'#e6c94e');
      model.plate(px,py,12.1,2.5,2.5,'#1b282a');
      model.box(px,py,0,1.1,1.1,6,material.gold);
    }
    const w = horizontal ? count*4.8 : rows*4.8, h = horizontal ? rows*4.8 : count*4.8;
    model.features.push({ name:'扩展母座',description:'黄色母座与插孔的结构参考，可用于理解模块与外设的连接位置。',x:x+w/2-2.4,y:y+h/2-2.4,z:12.2,width:w,height:h });
  }
  function smd(model, x, y, vertical = false) {
    const w = vertical ? 2.6 : 6, h = vertical ? 6 : 2.6;
    model.box(x,y,2.8,w,h,1.5,material.ceramic);
    model.box(x-(vertical?0:2.5),y-(vertical?2.5:0),2.85,vertical?w:1,vertical?1:h,1.6,material.metal);
    model.box(x+(vertical?0:2.5),y+(vertical?2.5:0),2.85,vertical?w:1,vertical?1:h,1.6,material.metal);
  }
  function pushButton(model, x, y, title) {
    const id = model.part(title, '板上机械按键与周边封装结构。',x,y,4.2,12,10,4.5,material.metal);
    model.cylinder(x,y,7.3,3.5,3,'#2c3438',12);
    model.label(title,x,y+9,2.2,19,5,'#d4dfd9');
    return id;
  }
  function mspm0Model() {
    const m = new Structure('MSPM0 开发板',144,224,'结构参考：黑色PCB、方形主控、双排针、晶振与底部按键。拖动可查看立体结构。');
    m.box(0,0,0,m.width,m.height,3.6,'#1b2729',-1,'board');
    mountingHoles(m);
    maleHeader(m,-55,-81,32); maleHeader(m,50,-81,32);
    maleHeader(m,-32,-101,14,true);
    qfp(m,0,18,43,'MSPM0');
    m.label('MSPM0 DEVELOPMENT',0,65,2.1,78,7,'#d3ddd5');
    m.label('J1 / IO',-53,-92,2.1,22,5);
    m.label('J2 / IO',53,-92,2.1,22,5);
    for (let row=0;row<3;row++) for (let i=0;i<5;i++) smd(m,-26+i*12,-61+row*12,i%2===0);
    m.part('晶振与时钟电路','主控附近的晶振与阻容结构，参考照片中的板上布局。',-15,-21,4.1,17,8,3.9,'#b5bdb8');
    m.plate(-15,-21,6.1,12,4,'#c8bea3');
    smd(m,16,-20); smd(m,20,66); smd(m,-8,70);
    pushButton(m,-22,98,'RESET'); pushButton(m,22,98,'KEY');
    m.part('状态指示器','板上小型指示器与周边贴片元件的结构参考。',-28,-78,3.3,4,3,2,'#71966d');
    return m;
  }
  function stm32Model() {
    const m = new Structure('STM32 开发板',210,244,'结构参考：蓝色PCB、黄色扩展母座、主控、USB与电源接口、纽扣电池和按键。');
    m.box(0,0,0,m.width,m.height,3.6,'#17629a',-1,'board');
    mountingHoles(m);
    femaleHeader(m,-94,-58,18,false,2);
    femaleHeader(m,-65,-43,25,false,2);
    femaleHeader(m,65,-43,27,false,2);
    femaleHeader(m,-8,-109,20,true,2);
    femaleHeader(m,-87,104,13,true,2);
    qfp(m,0,-20,48,'STM32');
    m.part('TF卡槽','左上方金属卡槽的结构参考。',-64,-87,4.7,34,27,5.4,'#b8c4ca');
    m.plate(-64,-88,7.5,27,18,'#adb9bf');
    for (const y of [5,31]) {
      m.part('USB接口','边缘USB连接器的结构参考；连接器外壳与开口分层绘制。',-101,y,7.3,20,14,12.1,material.metal);
      m.box(-111,y,7.3,1.7,10,6,'#23343e');
      m.box(-103,y,13.45,13,8,.25,'#9faeb7');
    }
    m.part('电源接口','板边电源连接器的结构参考。',79,-91,9.7,28,22,17,'#293136');
    m.box(94,-91,9.7,3,15,12,'#151f22');
    m.label('DC',79,-91,18.4,12,5,'#a4b2b5');
    m.part('接线端子','顶边接线端子的结构参考。',-62,-112,9,30,16,15,'#2b83ad');
    for (const x of [-69,-55]) {
      m.cylinder(x,-112,16.7,4.2,.4,material.metal,12);
      m.plate(x,-112,17,5.2,.8,'#455860');
    }
    m.cylinder(0,49,6.5,16.5,9.3,'#aebac0',24);
    m.cylinder(0,49,11.3,14.3,.5,'#d0d7d9',24);
    m.label('+',0,49,11.7,10,8,'#697b80');
    m.features.push({name:'纽扣电池座',description:'主控下方的圆形电池与座体结构参考。',x:0,y:49,z:12,width:33,height:33});
    m.part('晶振','电池旁的金属晶振封装结构。',33,43,5.1,11,22,5.8,material.metal);
    m.cylinder(-58,91,9,11,14,'#e4e5df');
    m.cylinder(-58,91,16.2,2.7,.5,'#394849',12);
    m.features.push({name:'蜂鸣器',description:'板下方圆柱蜂鸣器的结构参考。',x:-58,y:91,z:17,width:23,height:23});
    for (const y of [47,69,92]) pushButton(m,86,y,y===92?'RESET':'KEY');
    for (const x of [32,48]) m.cylinder(x,-94,7.5,5.5,11,'#849a91');
    for (let i=0;i<11;i++) smd(m,-40+i*7,-59,i%2===0);
    for (let i=0;i<7;i++) smd(m,22+i*8,78,i%2===1);
    m.label('STM32',0,-89,2.1,57,10,'#dbe7e9');
    m.label('EXPANSION / DEBUG',0,114,2.1,79,6,'#c6dbe0');
    return m;
  }
  function dip(model,x,y,width,height,count,title) {
    const id=model.part(title,'DIP封装逻辑芯片的结构参考。元件名称按设计资料标注，不表示运行或测量结果。',x,y,6,width,height,8,'#2a3034');
    const vertical=height>width, length=vertical?height:width;
    for(let i=0;i<count;i++) {
      const p=-length/2+3+i*(length-6)/(count-1);
      if(vertical) {
        model.box(x-width/2-2,y+p,3.5,5,1.7,4,material.gold,id);
        model.box(x+width/2+2,y+p,3.5,5,1.7,4,material.gold,id);
      } else {
        model.box(x+p,y-height/2-2,3.5,1.7,5,4,material.gold,id);
        model.box(x+p,y+height/2+2,3.5,1.7,5,4,material.gold,id);
      }
    }
    model.label(title,x,y,10.2,width-4,Math.min(6,height-3),'#c3ccce');
  }
  function terminal(model,x,y,count) {
    model.part('接线端子','电源、输入与输出接线端子结构参考。',x,y,8,count*8+5,13,12,'#40815e');
    for(let i=0;i<count;i++) {
      const px=x-(count-1)*4+i*8;
      model.cylinder(px,y,14.3,2.8,.5,'#c4c9b9',12);
      model.plate(px,y,14.65,3.8,.6,'#59665c');
    }
  }
  function circuitModel() {
    const m=new Structure('电路综合设计 PCB',220,204,'结构参考：蓝色PCB、DIP逻辑器件、七段显示器、拨码开关、阻容与接线端子。');
    m.box(0,0,0,m.width,m.height,3.4,'#1465aa',-1,'board');
    // Routing marks give the board surface depth and orientation, without
    // asserting an electrical netlist or fabricating circuit test results.
    for(let i=0;i<5;i++) {
      m.plate(-18,-91+i*3,1.8,135,1,'#254d70');
      m.plate(-82+i*3,-7,1.8,1,142,'#254d70');
      m.plate(13+i*3,71,1.8,1,42,'#254d70');
    }
    dip(m,-84,-63,18,43,4,'NE555');
    dip(m,-27,-66,52,21,7,'74HC00');
    dip(m,-27,-27,52,21,8,'74HC138');
    dip(m,-27,14,52,21,8,'74HC161');
    dip(m,-27,53,52,21,7,'74HC08');
    dip(m,-27,86,52,21,7,'CD4066');
    dip(m,29,-63,21,48,8,'CD4511');
    dip(m,29,6,21,51,8,'CD4049');
    dip(m,78,-13,43,20,8,'CD45312');
    dip(m,34,62,18,29,4,'UA741');
    m.part('七段数码管','PCB右上方的七段显示器封装。模型为显示器结构示意。',80,-65,5.8,44,47,8,'#182124');
    for(const y of [-81,-65,-49]) m.plate(80,y,10,20,3,'#9eaaa9');
    for(const x of [69,91]) for(const y of [-73,-57]) m.plate(x,y,10,3,12,'#9eaaa9');
    m.cylinder(98,-47,10.2,1.7,.2,'#9eaaa9',10);
    m.part('拨码开关','红色拨码开关组，用于介绍手动配置输入的结构。',80,36,7.1,37,32,10.5,'#c3352b');
    for(let i=0;i<4;i++) {
      m.box(68+i*8,36,13,4.5,11,2,'#e6e8e1');
      m.label(String(i+1),68+i*8,47,12.5,5,4,'#fff7ee');
    }
    for(let i=0;i<7;i++) smd(m,53,-88+i*7);
    for(let i=0;i<4;i++) smd(m,18+i*13,92);
    terminal(m,-88,15,3); terminal(m,-88,83,2); terminal(m,80,86,2);
    m.label('CIRCUIT DESIGN / PCB',17,-98,1.85,111,6,'#d9e8ef');
    return m;
  }
  function buildModel(key) {
    return key==='stm32'?stm32Model():key==='circuit'?circuitModel():mspm0Model();
  }
  function startViewer() {
    const canvas=document.getElementById('boardCanvas');
    const viewport=document.getElementById('boardViewport');
    if(!canvas||!viewport)return;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)return;
    const controls={
      reset:document.getElementById('boardResetView'),
      auto:document.getElementById('boardAutoRotate'),
      plus:document.getElementById('boardZoomIn'),
      minus:document.getElementById('boardZoomOut'),
      name:document.getElementById('boardModelLabel'),
      info:document.getElementById('boardModelInfo')
    };
    let model=buildModel('mspm0'), modelKey='mspm0';
    let tilt=.66,yaw=-.28,spin=-.18,zoom=1;
    let width=0,height=0,dpr=1,frame=0,lastTime=0;
    let automatic=false,paused=false,inView=true,selected=-1;
    let drag=null,pointerMoved=false,featurePolygons=[];
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    canvas.style.touchAction='none';
    canvas.style.cursor='grab';
    canvas.style.display='block';
    canvas.style.width='100%';
    canvas.style.height='100%';
    if(!canvas.hasAttribute('tabindex'))canvas.tabIndex=0;
    canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown + - 0');

    function visible() {
      return inView&&!document.hidden&&viewport.getClientRects().length>0&&width>0&&height>0;
    }
    function requestDraw() {
      if(!frame)frame=requestAnimationFrame(draw);
    }
    function resize() {
      const bounds=viewport.getBoundingClientRect();
      if(bounds.width<2||bounds.height<2)return;
      width=bounds.width;height=bounds.height;dpr=Math.min(2,window.devicePixelRatio||1);
      const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
      if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
      requestDraw();
    }
    function colorShade(hex,amount) {
      const number=parseInt(hex.slice(1),16);
      return 'rgb('+[number>>16,(number>>8)&255,number&255].map(c=>Math.round(clamp(c*amount,0,255))).join(',')+')';
    }
    function area(points) {
      let result=0;
      points.forEach((p,i)=>{const q=points[(i+1)%points.length];result+=p.x*q.y-q.x*p.y;});
      return result/2;
    }
    function inside(x,y,polygon) {
      let hit=false;
      for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
        const a=polygon[i],b=polygon[j];
        if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
      }
      return hit;
    }
    function draw(time) {
      frame=0;
      if(!visible()){lastTime=0;return;}
      if(automatic&&!paused&&!drag&&lastTime)yaw+=Math.min(60,time-lastTime)*.00016;
      lastTime=time;
      const cx=Math.cos(tilt),sx=Math.sin(tilt),cy=Math.cos(yaw),sy=Math.sin(yaw),cz=Math.cos(spin),sz=Math.sin(spin);
      function rotate(point) {
        const x=point[0]*cz-point[1]*sz,y=point[0]*sz+point[1]*cz;
        const yy=y*cx-point[2]*sx,zz=y*sx+point[2]*cx;
        return [x*cy+zz*sy,yy,-x*sy+zz*cy];
      }
      const camera=850;
      const corners=[];
      for(const x of [-model.width/2-15,model.width/2+15])for(const y of [-model.height/2-12,model.height/2+12])for(const z of [-4,21]) {
        const p=rotate([x,y,z]),f=camera/(camera-p[2]);corners.push([p[0]*f,p[1]*f]);
      }
      const minX=Math.min(...corners.map(p=>p[0])),maxX=Math.max(...corners.map(p=>p[0]));
      const minY=Math.min(...corners.map(p=>p[1])),maxY=Math.max(...corners.map(p=>p[1]));
      const scale=Math.min((width-40)/(maxX-minX),(height-65)/(maxY-minY))*zoom;
      const originX=width/2-(minX+maxX)/2*scale,originY=height/2+8-(minY+maxY)/2*scale;
      function project(point) {
        const p=rotate(point),f=camera/(camera-p[2]);
        return {x:originX+p[0]*f*scale,y:originY+p[1]*f*scale,z:p[2]};
      }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle='#eef2ef';ctx.fillRect(0,0,width,height);
      ctx.strokeStyle='#d4ddd6';ctx.lineWidth=.65;
      const reach=Math.max(model.width,model.height)*.8;
      for(let n=-reach;n<=reach;n+=20) {
        for(const segment of [[[n,-reach,-16],[n,reach,-16]],[[-reach,n,-16],[reach,n,-16]]]) {
          const a=project(segment[0]),b=project(segment[1]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
      const shadow=[[-model.width/2,-model.height/2,-9],[model.width/2,-model.height/2,-9],[model.width/2,model.height/2,-9],[-model.width/2,model.height/2,-9]].map(project);
      ctx.save();ctx.fillStyle='#213d2c24';ctx.shadowColor='#14291f40';ctx.shadowBlur=17;
      ctx.beginPath();shadow.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.restore();
      const projected=[];
      for(const face of model.faces) {
        const points=face.points.map(project);
        if(area(points)<.03)continue;
        const a=face.points[0],b=face.points[1],c=face.points[2];
        const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
        const normal=rotate([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]);
        const length=Math.hypot(...normal)||1;
        const light=Math.max(0,(-normal[0]*.32-normal[1]*.46+normal[2]*.83)/length);
        projected.push({face,points,depth:points.reduce((sum,p)=>sum+p.z,0)/points.length,shade:.57+light*.45});
      }
      const base=projected.filter(item=>item.face.layer==='board');
      const components=projected.filter(item=>item.face.layer!=='board').sort((a,b)=>a.depth-b.depth);
      const upperVisible=rotate([0,0,1])[2]>.04;
      const order=upperVisible?[...base,...components]:[...components,...base];
      for(const item of order) {
        const points=item.points;
        ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
        ctx.fillStyle=colorShade(item.face.color,item.shade);ctx.fill();
        ctx.lineWidth=.45;ctx.strokeStyle='#0d222a28';ctx.stroke();
      }
      // Plane-aligned silkscreen is projected from real 3D board coordinates.
      if(upperVisible)for(const label of model.labels) {
        const x=label.x-label.width/2,y=label.y-label.height/2;
        const a=project([x,y,label.z]),b=project([x+label.width,y,label.z]),c=project([x,y+label.height,label.z]);
        ctx.save();ctx.transform((b.x-a.x)/label.width,(b.y-a.y)/label.width,(c.x-a.x)/label.height,(c.y-a.y)/label.height,a.x,a.y);
        ctx.fillStyle=label.color;ctx.font='500 '+(label.height*.83)+'px Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(label.text,label.width/2,label.height/2,label.width);ctx.restore();
      }
      featurePolygons=[];
      if(upperVisible)model.features.forEach((feature,index)=>{
        const a=feature.width/2,b=feature.height/2;
        const polygon=[[-a,-b],[a,-b],[a,b],[-a,b]].map(p=>project([feature.x+p[0],feature.y+p[1],feature.z]));
        featurePolygons.push({index,polygon,depth:polygon.reduce((sum,p)=>sum+p.z,0)/4});
        if(index===selected) {
          ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
          ctx.strokeStyle='#46a378';ctx.lineWidth=2;ctx.stroke();
        }
      });
      ctx.fillStyle='#6c8172';ctx.font='10px Consolas, monospace';ctx.textAlign='left';ctx.textBaseline='top';
      ctx.fillText('3D STRUCTURE / '+modelKey.toUpperCase(),14,13);
      ctx.textAlign='right';ctx.fillText(Math.round(zoom*100)+'%',width-14,13);
      canvas.dataset.view=[tilt,yaw,spin,zoom].map(value=>value.toFixed(3)).join(',');
      if(automatic&&!paused)requestDraw();
    }
    function updateAutomatic() {
      controls.auto?.setAttribute('aria-pressed',String(automatic));
      if(controls.auto)controls.auto.textContent=automatic?'停止旋转':'自动旋转';
      lastTime=0;requestDraw();
    }
    function resetView() {
      tilt=.66;yaw=-.28;spin=-.18;zoom=1;selected=-1;
      if(controls.info)controls.info.textContent=model.description;
      lastTime=0;requestDraw();
    }
    function setModel(key) {
      if(!['mspm0','stm32','circuit'].includes(key))return;
      modelKey=key;model=buildModel(key);resetView();
      if(controls.name)controls.name.textContent=model.name;
      canvas.dataset.model=key;
      canvas.setAttribute('aria-label',model.name+'三维结构模型，可拖动旋转，滚轮或加减按钮缩放，也可使用方向键旋转');
      resize();
    }
    function setPaused(value) {
      paused=Boolean(value);lastTime=0;
      if(paused&&frame){cancelAnimationFrame(frame);frame=0;}
      requestDraw();
    }
    function selectPart(clientX,clientY) {
      const rect=canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;
      const found=featurePolygons.slice().sort((a,b)=>b.depth-a.depth).find(item=>inside(x,y,item.polygon));
      selected=found?found.index:-1;
      const feature=model.features[selected];
      canvas.dataset.selectedPart=feature?.name||'';
      if(controls.info)controls.info.textContent=feature?feature.name+'：'+feature.description:model.description;
      requestDraw();
    }
    const pointers=new Map();
    let pinch=null;
    canvas.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      canvas.focus({preventScroll:true});
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId,[event.clientX,event.clientY]);
      if(pointers.size===1){drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};pointerMoved=false;}
      else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),zoom};pointerMoved=true;}
      canvas.style.cursor='grabbing';
    });
    canvas.addEventListener('pointermove',event=>{
      if(!pointers.has(event.pointerId))return;
      pointers.set(event.pointerId,[event.clientX,event.clientY]);
      if(pointers.size>=2&&pinch){
        const [a,b]=[...pointers.values()];zoom=clamp(pinch.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,pinch.distance),.65,2.25);
      }else if(drag){
        yaw+=(event.clientX-drag.x)*.009;
        tilt=clamp(tilt+(event.clientY-drag.y)*.009,-1.35,1.35);
        drag.x=event.clientX;drag.y=event.clientY;
        if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4)pointerMoved=true;
      }
      requestDraw();
    });
    function releasePointer(event) {
      if(!pointers.has(event.pointerId))return;
      if(!pointerMoved&&pointers.size===1&&event.type!=='pointercancel')selectPart(event.clientX,event.clientY);
      pointers.delete(event.pointerId);pinch=null;
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(pointers.size===1){const [point]=[...pointers.values()];drag={x:point[0],y:point[1],startX:point[0],startY:point[1]};pointerMoved=true;}
      else drag=null;
      canvas.style.cursor=drag?'grabbing':'grab';lastTime=0;requestDraw();
    }
    canvas.addEventListener('pointerup',releasePointer);
    canvas.addEventListener('pointercancel',releasePointer);
    canvas.addEventListener('wheel',event=>{
      event.preventDefault();zoom=clamp(zoom*Math.exp(-event.deltaY*.0013),.65,2.25);requestDraw();
    },{passive:false});
    canvas.addEventListener('keydown',event=>{
      let handled=true;
      if(event.key==='ArrowLeft')yaw-=.12;
      else if(event.key==='ArrowRight')yaw+=.12;
      else if(event.key==='ArrowUp')tilt=clamp(tilt-.1,-1.35,1.35);
      else if(event.key==='ArrowDown')tilt=clamp(tilt+.1,-1.35,1.35);
      else if(event.key==='+'||event.key==='=')zoom=clamp(zoom*1.12,.65,2.25);
      else if(event.key==='-')zoom=clamp(zoom/1.12,.65,2.25);
      else if(event.key==='0'||event.key==='Home')resetView();
      else if(event.key===' '){automatic=!automatic;updateAutomatic();}
      else handled=false;
      if(handled){event.preventDefault();requestDraw();}
    });
    controls.reset?.addEventListener('click',resetView);
    controls.auto?.addEventListener('click',()=>{automatic=!automatic;updateAutomatic();});
    controls.plus?.addEventListener('click',()=>{zoom=clamp(zoom*1.15,.65,2.25);requestDraw();});
    controls.minus?.addEventListener('click',()=>{zoom=clamp(zoom/1.15,.65,2.25);requestDraw();});
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
    const visibilityObserver=new IntersectionObserver(entries=>{
      inView=entries[0].isIntersecting;lastTime=0;
      if(inView){resize();requestDraw();}else if(frame){cancelAnimationFrame(frame);frame=0;}
    },{rootMargin:'80px'});visibilityObserver.observe(viewport);
    document.addEventListener('visibilitychange',()=>{
      lastTime=0;if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else requestDraw();
    });
    window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;});
    window.addEventListener('pageshow',resize);
    reducedMotion.addEventListener('change',event=>{if(event.matches){automatic=false;updateAutomatic();}});
    window.BoardReference3D={setModel,setPaused,resetView,resize};
    setModel('mspm0');canvas.dataset.state='ready';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startViewer,{once:true});
  else startViewer();
})();
