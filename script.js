const $=id=>document.getElementById(id);let stream=null,facing='user',photos=[];const video=$('video');let currentFilter='normal',busy=false,autoCancelled=false;let faceEffect='none',faceLandmarks=null,faceMesh=null,tracking=false,trackingBusy=false;const overlay=$('faceOverlay');let trackingErrorShown=false;
const filters={normal:'none',bw:'grayscale(1) contrast(1.1)',vintage:'sepia(.7) saturate(.8) contrast(.95)',warm:'sepia(.25) saturate(1.35) brightness(1.06)',xray:'invert(1)'};
function applyColorFilter(){
  const effect=filters[currentFilter]||'none';
  // Apply to the actual video, not the face-overlay canvas.
  video.style.setProperty('filter',effect,'important');
  video.style.setProperty('-webkit-filter',effect,'important');
}
document.querySelectorAll('.filter-choice').forEach(btn=>btn.addEventListener('click',()=>{
  currentFilter=btn.dataset.filter;
  applyColorFilter();
  document.querySelectorAll('.filter-choice').forEach(b=>{
    const active=b===btn;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',String(active));
  });
}));
document.querySelectorAll('.face-choice').forEach(btn=>btn.addEventListener('click',()=>{faceEffect=btn.dataset.face;document.querySelectorAll('.face-choice').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});drawLiveFace();if(faceEffect!=='none'&&!window.FaceMesh)status('Face filters are loading or unavailable. Check your connection and reload.')}));
function drawFace(ctx,lm,w,h){if(!lm||faceEffect==='none')return;const pt=i=>({x:lm[i].x*w,y:lm[i].y*h});const left=pt(33),right=pt(263),nose=pt(1),top=pt(10),a=pt(234),b=pt(454);const eyeDist=Math.hypot(right.x-left.x,right.y-left.y),r=Math.max(12,eyeDist*.23);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.textAlign='center';ctx.textBaseline='middle';function glyph(t,x,y,size){ctx.font=`${size}px serif`;ctx.fillText(t,x,y)}
if(faceEffect==='hearts'){ctx.fillStyle='#ed6b94';glyph('♥',a.x,a.y-r*.8,r*1.4);glyph('♥',b.x,b.y-r*.8,r*1.4);glyph('♥',top.x,top.y-r*1.2,r)}
if(faceEffect==='blush'){ctx.fillStyle='rgba(245,106,143,.38)';for(const cheek of [pt(205),pt(425)]){ctx.beginPath();ctx.ellipse(cheek.x,cheek.y,r*1.05,r*.52,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#f8e0e8';glyph('♥',nose.x,nose.y+r*.1,r*.65)}
if(faceEffect==='glasses'){ctx.strokeStyle='#2b2429';ctx.lineWidth=Math.max(3,r*.13);for(const eye of [left,right]){ctx.beginPath();ctx.ellipse(eye.x,eye.y,r*1.18,r*.83,0,0,Math.PI*2);ctx.stroke()}ctx.beginPath();ctx.moveTo(left.x+r*1.15,left.y);ctx.quadraticCurveTo(nose.x,nose.y-r*.9,right.x-r*1.15,right.y);ctx.stroke();}
if(faceEffect==='crown'){ctx.fillStyle='#f3bc4d';const cy=top.y-r*.9;ctx.beginPath();ctx.moveTo(top.x-r*2,cy);ctx.lineTo(top.x-r*2.1,cy-r*1.7);ctx.lineTo(top.x-r*.9,cy-r*.8);ctx.lineTo(top.x,cy-r*2.4);ctx.lineTo(top.x+r*.9,cy-r*.8);ctx.lineTo(top.x+r*2.1,cy-r*1.7);ctx.lineTo(top.x+r*2,cy);ctx.closePath();ctx.fill();ctx.fillStyle='#d8789e';glyph('◆',top.x,cy-r*.45,r*.65)}
if(faceEffect==='sparkles'){ctx.fillStyle='#f5b951';for(const [x,y,sz] of [[a.x,a.y-r,r*1.5],[b.x,b.y-r,r*1.5],[top.x,top.y-r*1.7,r],[nose.x,nose.y+r*1.9,r*.7]])glyph('✦',x,y,sz)}ctx.restore()}
function drawLiveFace(){
  // Match CSS object-fit:cover, including portrait phone screens.
  const w=video.videoWidth,h=video.videoHeight;
  const rect=overlay.getBoundingClientRect();
  if(!w||!h||!rect.width||!rect.height)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  overlay.width=Math.round(rect.width*dpr);
  overlay.height=Math.round(rect.height*dpr);
  const c=overlay.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0);
  const scale=Math.max(rect.width/w,rect.height/h);
  c.translate((rect.width-w*scale)/2,(rect.height-h*scale)/2);
  c.scale(scale,scale);
  drawFace(c,faceLandmarks,w,h);
}
async function setupTracking(){if(tracking)return;if(!window.FaceMesh){status('Camera ready. Face filters require an internet connection to load.');return;}tracking=true;try{faceMesh=new FaceMesh({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`});faceMesh.setOptions({maxNumFaces:1,refineLandmarks:false,minDetectionConfidence:.5,minTrackingConfidence:.5});faceMesh.onResults(result=>{faceLandmarks=result.multiFaceLandmarks?.[0]||null;drawLiveFace()});async function tick(){if(!tracking)return;if(stream&&video.readyState>=2&&!trackingBusy){trackingBusy=true;try{await faceMesh.send({image:video})}catch(e){console.warn('Face tracking unavailable',e);tracking=false;status('Camera works, but face tracking could not start. Reload with internet access.')}finally{trackingBusy=false}}if(tracking)setTimeout(tick,100)}tick()}catch(e){tracking=false;console.warn(e)}}
$('autoMode').addEventListener('change',()=>{if(!$('autoMode').checked)autoCancelled=true;if(!busy&&stream){$('capture').textContent=$('autoMode').checked?'◎ Start auto session':'◎ Take photo';status($('autoMode').checked?'Auto timer ready. Press Start auto session once.':'Camera ready! Strike a pose.')}});
function status(s){$('status').textContent=s}async function startCamera(){try{autoCancelled=true;faceLandmarks=null;overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);if(stream)stream.getTracks().forEach(t=>t.stop());if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access requires HTTPS or localhost.');
stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:960}},audio:false});video.srcObject=stream;
// Front camera is mirrored like a selfie mirror; rear camera is NOT mirrored.
const mirrored=facing==='user';
video.style.setProperty('transform',mirrored?'scaleX(-1)':'none','important');
overlay.style.setProperty('transform',mirrored?'scaleX(-1)':'none','important');
await video.play();
applyColorFilter();
setupTracking();drawLiveFace();$('placeholder').style.display='none';$('capture').disabled=false;status('Camera ready! Strike a pose.');$('capture').textContent=$('autoMode').checked?'◎ Start auto session':'◎ Take photo'}catch(e){status('Camera unavailable: '+e.message+'. Use localhost or HTTPS and allow camera access.')}}$('start').onclick=startCamera;function flipCamera(){if(busy)return;facing=facing==='user'?'environment':'user';startCamera()}$('flip').onclick=flipCamera;$('flipBeside').onclick=flipCamera;const wait=ms=>new Promise(r=>setTimeout(r,ms));
// CanvasRenderingContext2D.filter is unreliable on some mobile browsers.
// Pixel processing makes downloaded photos match the chosen preview filter.
function applyPhotoColorFilter(ctx,width,height,kind){
  if(kind==='normal')return;
  const frame=ctx.getImageData(0,0,width,height),d=frame.data;
  const clamp=v=>Math.max(0,Math.min(255,v));
  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    if(kind==='bw'){
      const gray=(.2126*r+.7152*g+.0722*b-128)*1.1+128;
      r=g=b=gray;
    }else if(kind==='vintage'){
      const sr=.393*r+.769*g+.189*b,sg=.349*r+.686*g+.168*b,sb=.272*r+.534*g+.131*b;
      r=r*.3+sr*.7;g=g*.3+sg*.7;b=b*.3+sb*.7;
      const avg=(r+g+b)/3;
      r=(avg+(r-avg)*.8-128)*.95+128;
      g=(avg+(g-avg)*.8-128)*.95+128;
      b=(avg+(b-avg)*.8-128)*.95+128;
    }else if(kind==='warm'){
      const sr=.393*r+.769*g+.189*b,sg=.349*r+.686*g+.168*b,sb=.272*r+.534*g+.131*b;
      r=r*.75+sr*.25;g=g*.75+sg*.25;b=b*.75+sb*.25;
      const avg=(r+g+b)/3;
      r=(avg+(r-avg)*1.35)*1.06;
      g=(avg+(g-avg)*1.35)*1.06;
      b=(avg+(b-avg)*1.35)*1.06;
    }else if(kind==='xray'){
      // Invert RGB pixels in the captured image, even on iOS Safari.
      r=255-r;g=255-g;b=255-b;
    }
    d[i]=clamp(r);d[i+1]=clamp(g);d[i+2]=clamp(b);
  }
  ctx.putImageData(frame,0,0);
}
async function snap(){if(!stream||!video.videoWidth)return false;for(let n=3;n>0;n--){if(autoCancelled)return false;$('countdown').textContent=n;await wait(1000)}if(autoCancelled)return false;$('countdown').textContent='';const c=document.createElement('canvas');c.width=1000;c.height=750;const ctx=c.getContext('2d');const vw=video.videoWidth,vh=video.videoHeight,scale=Math.max(c.width/vw,c.height/vh);ctx.save();if(facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1)}ctx.drawImage(video,(c.width-vw*scale)/2,(c.height-vh*scale)/2,vw*scale,vh*scale);ctx.restore();applyPhotoColorFilter(ctx,c.width,c.height,currentFilter);if(faceEffect!=='none'&&faceLandmarks){const temp=document.createElement('canvas');temp.width=vw;temp.height=vh;drawFace(temp.getContext('2d'),faceLandmarks,vw,vh);ctx.save();if(facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1)}ctx.drawImage(temp,(c.width-vw*scale)/2,(c.height-vh*scale)/2,vw*scale,vh*scale);ctx.restore()}const captured=c.toDataURL('image/jpeg',.95);photos.push(captured);render();
// Mimic a camera shutter closing, then briefly show the exact saved frame.
const shutter=$('shutterBlink'),review=$('photoReview');
shutter.classList.remove('blink-active');void shutter.offsetWidth;shutter.classList.add('blink-active');
await wait(170);
review.src=captured;review.classList.add('review-visible');
await wait(850);
review.classList.remove('review-visible');
await wait(160);
shutter.classList.remove('blink-active');
$('countdown').textContent='';return true}
$('capture').onclick=async()=>{if(busy||!stream||!video.videoWidth)return;busy=true;autoCancelled=false;$('capture').disabled=true;const auto=$('autoMode').checked;try{if(auto){status('Auto session running — 4 photos with a 3-second timer.');for(let i=0;i<4;i++){if(autoCancelled||!stream)break;const ok=await snap();if(!ok)break}status(autoCancelled?'Auto session stopped.':'All done! Your four photos are ready.')}else{await snap();status('Photo taken! Strike another pose.')}}finally{busy=false;$('countdown').textContent='';$('capture').disabled=!stream;$('capture').textContent=$('autoMode').checked?'◎ Start auto session':'◎ Take photo'}};
// Decorative borders are rendered directly into the export canvas,
// so JPEG, PDF, print and Save to device all use the selected frame.
let selectedFrame='classic';
const frameNames={classic:'Classic cream',hearts:'Pink hearts',stripes:'Blue stripes',checker:'Pink gingham',lavender:'Lavender stars'};
document.querySelectorAll('.frame-option').forEach(button=>{
  button.addEventListener('click',()=>{
    selectedFrame=button.dataset.frame;
    document.querySelectorAll('.frame-option').forEach(other=>{
      const active=other===button;
      other.classList.toggle('active',active);
      other.setAttribute('aria-pressed',String(active));
    });
    $('frameNote').textContent=frameNames[selectedFrame]+' selected · Your downloads will use this frame.';
  });
});
function paintFrame(ctx,w,h,kind){
  ctx.save();
  const fill={classic:'#fffaf4',hearts:'#ed9db8',stripes:'#c6e8f4',checker:'#f8c6d7',lavender:'#dcd1f4'}[kind]||'#fffaf4';
  ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);
  if(kind==='hearts'){
    ctx.fillStyle='#ffffff';
    ctx.font='46px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let y=27;y<h;y+=106)for(let x=27;x<w;x+=106)ctx.fillText('♡',x+((Math.floor(y/106)%2)*52),y);
  }else if(kind==='stripes'){
    ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
    ctx.strokeStyle='#f8ffff';ctx.lineWidth=23;
    for(let x=-h;x<w+h;x+=58){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();}
    ctx.restore();
  }else if(kind==='checker'){
    ctx.fillStyle='rgba(255,255,255,.52)';
    const tile=42;
    for(let y=0;y<h;y+=tile)for(let x=0;x<w;x+=tile)
      if((Math.floor(x/tile)+Math.floor(y/tile))%2===0)ctx.fillRect(x,y,tile,tile);
  }else if(kind==='lavender'){
    ctx.fillStyle='#fffafc';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let y=32;y<h;y+=115)for(let x=35;x<w;x+=120){
      ctx.font=((x+y)%2?'34px':'27px')+' Georgia, serif';
      ctx.fillText((Math.floor(x/120)+Math.floor(y/115))%2?'✧':'✦',x,y);
    }
  }
  ctx.restore();
}
function render(){const root=$('shots');root.innerHTML='';if(!photos.length)root.innerHTML='<div class="empty">Your photos will show up here after you take them. ✨</div>';photos.forEach((p,i)=>{const card=document.createElement('div');card.className='shot';const img=document.createElement('img');img.src=p;img.alt='Selfie '+(i+1);const bottom=document.createElement('div');bottom.className='shot-bottom';const label=document.createElement('span');label.textContent='SNAP '+String(i+1).padStart(2,'0');const del=document.createElement('button');del.textContent='Remove ×';del.onclick=()=>{photos.splice(i,1);render()};bottom.append(label,del);card.append(img,bottom);root.append(card)});$('counter').textContent=photos.length+' taken';$('selectedPhoto').innerHTML=photos.map((_,i)=>`<option value="${i}">Photo ${i+1}</option>`).join('');$('download').disabled=$('print').disabled=$('saveDevice').disabled=!photos.length}function updateLayout(){$('singleLabel').style.display=$('layout').value==='single'?'flex':'none'}$('layout').onchange=updateLayout;updateLayout();$('clear').onclick=()=>{autoCancelled=true;photos=[];render()};async function compose(){if(!photos.length)throw Error('Take a photo first.');const layout=$('layout').value;const chosen=layout==='single'?[photos[Number($('selectedPhoto').value)||0]]:layout==='strip'?photos.slice(0,4):photos;const canvas=$('output'),ctx=canvas.getContext('2d');const margin=45,gap=20,w=900,h=675;let cols,rows;if(layout==='strip'){cols=1;rows=4;canvas.width=w+margin*2;canvas.height=rows*h+(rows-1)*gap+margin*2+125}else if(layout==='grid'){cols=2;rows=Math.ceil(chosen.length/2);canvas.width=cols*w+(cols-1)*gap+margin*2;canvas.height=rows*h+(rows-1)*gap+margin*2+90}else{cols=1;rows=1;canvas.width=w+margin*2;canvas.height=h+margin*2+90}paintFrame(ctx,canvas.width,canvas.height,selectedFrame);for(let i=0;i<chosen.length;i++){const img=new Image();img.src=chosen[i];await img.decode();const x=margin+(i%cols)*(w+gap),y=margin+Math.floor(i/cols)*(h+gap);ctx.fillStyle='#ffffff';ctx.fillRect(x-9,y-9,w+18,h+18);ctx.drawImage(img,x,y,w,h)}ctx.fillStyle='#493a3b';ctx.textAlign='center';ctx.font='bold 32px sans-serif';ctx.fillText('smile...ur on camera!  ♡',canvas.width/2,canvas.height-35);return canvas}function fileName(){return 'smile-ur-on-camera-'+selectedFrame+'-'+$('layout').value}async function makePDF(canvas){if(!window.jspdf)throw Error('PDF library did not load. Check your internet connection.');const {jsPDF}=window.jspdf;const orientation=canvas.width>canvas.height?'landscape':'portrait';const pdf=new jsPDF({orientation,unit:'px',format:[canvas.width,canvas.height],hotfixes:['px_scaling']});pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',0,0,canvas.width,canvas.height);return pdf}function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function buildExport() {
  const canvas = await compose();
  const format = $('format').value;
  if (format === 'pdf') {
    const pdf = await makePDF(canvas);
    return {blob:pdf.output('blob'),name:fileName()+'.pdf',mime:'application/pdf'};
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',0.95));
  if (!blob) throw Error('Unable to create JPEG.');
  return {blob,name:fileName()+'.jpg',mime:'image/jpeg'};
}
$('download').onclick = async () => {
  try {
    const file = await buildExport();
    downloadBlob(file.blob,file.name);
    status('Download started. Check your Downloads folder.');
  } catch(e) { status('Download failed: '+e.message); }
};
$('print').onclick = async () => {
  if (!photos.length) return;
  // Open immediately on the tap: mobile browsers block windows opened after awaits.
  const win = window.open('','_blank');
  if (!win) { status('Allow pop-ups for this site to print, or use Download.'); return; }
  win.document.write('<!doctype html><html><head><title>Print photobooth photos</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;text-align:center;background:white}img{display:block;max-width:100%;max-height:100vh;margin:auto}@media print{@page{margin:0}body{margin:0}}</style></head><body><p id="loading">Preparing photo…</p></body></html>');
  win.document.close();
  try {
    const canvas = await compose();
    const image = win.document.createElement('img');
    image.alt = 'Your photobooth photos';
    image.onload = () => {win.document.getElementById('loading')?.remove();win.focus();win.print();};
    image.src = canvas.toDataURL('image/jpeg',0.95);
    win.document.body.appendChild(image);
    status('Print dialog opened. Choose a printer or Save as PDF.');
  } catch(e) { win.close();status('Print failed: '+e.message); }
};
// Mobile Share Sheet: on supported phones users can select Save Image / Save to Files.
// Otherwise download normally (the browser decides where to store the file).
$('saveDevice').onclick = async () => {
  if (!photos.length) return;
  try {
    const {blob,name,mime} = await buildExport();
    const file = new File([blob],name,{type:mime});
    if (typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({files:[file]})) {
      try {
        await navigator.share({files:[file],title:'My photobooth photo'});
        status('Photo shared. To save it, select Save Image or Save to Files in the share menu.');
        return;
      } catch(e) {
        if (e.name === 'AbortError') { status('Save canceled.'); return; }
        // Some browsers deny a share sheet after asynchronous image composition.
        console.warn('Native sharing failed, downloading instead:',e);
      }
    }
    downloadBlob(blob,name);
    status('Saved to your browser downloads. On iPhone, open Downloads and choose Save Image.');
  } catch(e) { status('Could not save: '+e.message); }
};render();window.addEventListener('resize',drawLiveFace);
window.addEventListener('orientationchange',()=>setTimeout(drawLiveFace,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)drawLiveFace()});
window.addEventListener('pagehide',()=>{tracking=false;if(stream)stream.getTracks().forEach(t=>t.stop())});
