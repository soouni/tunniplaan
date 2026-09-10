// PDF.js 6 path bounding boxes and text positions; Halliste's ruled I–IX layout.
const roman=['I','II','III','IV','V','VI','VII','VIII','IX'];
const days=['E','T','K','N','R'];
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
function cluster(values,tolerance=1){const out=[];for(const x of [...values].sort((a,b)=>a-b)){if(!out.length||x-out.at(-1)>tolerance)out.push(x);else out[out.length-1]=(out.at(-1)+x)/2}return out}
export function clean(text){text=text.replace(/\s+/g,' ').replace(/\s*\/\s*/g,' / ').trim();const aliases={'matem':'Matemaatika','loodusõp':'Loodusõpetus','liikumisõp':'Liikumisõpetus','inimeseõp':'Inimeseõpetus','ühiskonnaõp':'Ühiskonnaõpetus','usundiõp':'Usundiõpetus','klassijuh.tund':'Klassijuhatajatund','mulgi folklooriõp':'Mulgi folklooriõpetus','eesti k':'Eesti keel','käsitöö / tehnol':'Käsitöö / tehnoloogia'};text=aliases[text.toLowerCase()]||text;return text.replace(/\b[Ee]esti k(?= \/| IÕK)/g,'Eesti keel').replace(/\s+[Õõ]p\.?\s+/g,' · ')}
function joinText(items){const lines=[];for(const item of [...items].sort((a,b)=>a.y-b.y||a.x-b.x)){let line=lines.find(l=>Math.abs(l.y-item.y)<3);if(!line){line={y:item.y,items:[]};lines.push(line)}line.items.push(item)}return clean(lines.sort((a,b)=>a.y-b.y).map(l=>l.items.sort((a,b)=>a.x-b.x).map((t,i,list)=>{const prev=list[i-1];return (prev&&(prev.spaceAfter||t.spaceBefore||t.x-prev.x-prev.width>1.2)?' ':'')+t.str}).join('')).join(' '))}
export async function inspectPage(page,OPS){
 const viewport=page.getViewport({scale:1});
 if(page.rotate!==0)throw Error('Pööratud lehekülg ei ole toetatud. Salvesta PDF tavapärases suunas.');
 const text=await page.getTextContent();
 const items=text.items.filter(i=>i.str?.trim()).map(i=>{const [x,y]=point(viewport.transform,i.transform[4],i.transform[5]);return {str:i.str.trim(),spaceBefore:/^\s/.test(i.str),spaceAfter:/\s$/.test(i.str),x,y,width:i.width,height:i.height}});
 if(items.length>15000)throw Error('PDF-i lehekülg on liiga mahukas.');
 const ops=await page.getOperatorList();if(ops.fnArray.length>250000)throw Error('PDF-i lehekülg on liiga keerukas.');
 let matrix=[1,0,0,1,0,0],stack=[];const horizontal=[],vertical=[];
 for(let i=0;i<ops.fnArray.length;i++){
  const fn=ops.fnArray[i],a=ops.argsArray[i];
  if(fn===OPS.save)stack.push([...matrix]);
  else if(fn===OPS.restore)matrix=stack.pop()||[1,0,0,1,0,0];
  else if(fn===OPS.transform)matrix=multiply(matrix,a);
  else if(fn===OPS.constructPath&&a[2]){
   const b=a[2],transform=multiply(viewport.transform,matrix),corners=[[b[0],b[1]],[b[2],b[1]],[b[0],b[3]],[b[2],b[3]]].map(([x,y])=>point(transform,x,y));
   const x0=Math.min(...corners.map(p=>p[0])),x1=Math.max(...corners.map(p=>p[0])),y0=Math.min(...corners.map(p=>p[1])),y1=Math.max(...corners.map(p=>p[1]));
   if(y1-y0<1.5&&x1-x0>8)horizontal.push({x0,x1,y:(y0+y1)/2});
   if(x1-x0<1.5&&y1-y0>8)vertical.push({x:(x0+x1)/2,y0,y1});
  }
 }
 return {width:viewport.width,items,horizontal,vertical};
}
export async function importDocument(doc,OPS,onProgress=()=>{}){
 if(doc.numPages<1||doc.numPages>10)throw Error('PDF-is võib olla kuni 10 lehekülge.');
 const schedule=Array.from({length:5},()=>Array.from({length:8},()=>Array(9).fill(''))),seen=new Set(),warnings=['Kontrolli kõiki päevi, rühmatunde ja tühje lahtreid enne salvestamist.'];let reference=null,day=null;
 for(let n=1;n<=doc.numPages;n++){
  onProgress(n,doc.numPages);const page=await doc.getPage(n),p=await inspectPage(page,OPS);
  if(!p.items.length||p.horizontal.length<20||p.vertical.length<20)throw Error('Loetavat joontega tabelit ei leitud. Skannitud PDF-i ja OCR-i see tööriist ei toeta.');
  const header=p.items.find(i=>i.str==='I');
  if(header){const labels=roman.map(r=>p.items.find(i=>i.str===r&&Math.abs(i.y-header.y)<3));if(labels.every(Boolean)){
   const xs=cluster(p.vertical.filter(v=>v.y0<header.y&&v.y1>header.y).map(v=>v.x));
   const cells=labels.map(l=>{const center=l.x+l.width/2;return [xs.filter(x=>x<center).at(-1),xs.find(x=>x>center)]});
   if(cells.some(c=>c.some(x=>x===undefined)))throw Error('Klassiveergude piire ei leitud.');
   reference=[cells[0][0],...cells.map(c=>c[1])].map(x=>x/p.width);
  }}
  if(!reference)throw Error('Puudub klasside päis I–IX. Vaja on algse Halliste PDF-iga sarnast tabelit.');
  const xs=cluster(p.vertical.map(v=>v.x)),bounds=reference.map(r=>xs.reduce((best,x)=>Math.abs(x-r*p.width)<Math.abs(best-r*p.width)?x:best,xs[0]));
  if(bounds.some((b,i)=>Math.abs(b-reference[i]*p.width)>p.width*.015)||bounds.some((b,i)=>i&&b-bounds[i-1]<p.width*.04))throw Error('Klassiveergude paigutus on muutunud. PDF vajab importija kohandamist.');
  const markers=p.items.filter(i=>i.x<bounds[0]&&(/^[1-8]\.?$/.test(i.str)||days.includes(i.str))).sort((a,b)=>a.y-b.y);
  for(const marker of markers){
   if(days.includes(marker.str)){day=days.indexOf(marker.str);continue}
   if(day===null)throw Error('Tunnireal puudub nädalapäev.');const lesson=parseInt(marker.str)-1,key=day+':'+lesson;
   if(seen.has(key))throw Error('Sama tunni rida kordub. Import peatati.');seen.add(key);
   const center=marker.x+marker.width/2,ys=cluster(p.horizontal.filter(h=>h.x0<center&&h.x1>center).map(h=>h.y));
   const top=ys.filter(y=>y<marker.y-1).at(-1),bottom=ys.find(y=>y>marker.y+1);
   if(top===undefined||bottom===undefined||bottom-top>p.width*.2)throw Error('Tunnirea piire ei õnnestunud tuvastada.');
   const mid=(top+bottom)/2;
   // No vertical divider through this row means one cell spans several classes.
   const groups=[];let start=0;for(let i=1;i<9;i++){
    const divider=p.vertical.some(v=>Math.abs(v.x-bounds[i])<1.5&&v.y0<mid&&v.y1>mid);
    if(divider){groups.push([start,i]);start=i;}
   }groups.push([start,9]);
   for(const [from,to] of groups){
    const selected=p.items.filter(item=>item.y>top&&item.y<bottom&&item.x>=bounds[from]-.8&&item.x<bounds[to]-.8);
    const value=joinText(selected);for(let c=from;c<to;c++)schedule[day][lesson][c]=value;
    if(value&&to-from>1)warnings.push(days[day]+', '+(lesson+1)+'. tund: ühendatud lahter klassidele '+(from+1)+'–'+to+'. Kontrolli jaotust.');
   }
  }
  page.cleanup();
 }
 for(let d=0;d<5;d++)for(let r=0;r<7;r++)if(!seen.has(d+':'+r))throw Error('Puudub '+days[d]+' '+(r+1)+'. tunni rida.');
 if(schedule.flat(2).filter(Boolean).length<30)throw Error('Liiga vähe loetavaid tunde.');
 return {schedule,warnings:[...new Set(warnings)]};
}
