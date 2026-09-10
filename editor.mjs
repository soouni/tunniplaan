import {getDocument,GlobalWorkerOptions,OPS} from 'pdfjs-dist/build/pdf.mjs';
import workerSource from 'pdfjs-dist/build/pdf.worker.min.mjs';
import {importDocument} from './pdf-import.mjs';
import {exportHTML,validatePlan} from './export.mjs';
GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
const $=id=>document.getElementById(id),names=['Esmaspäev','Teisipäev','Kolmapäev','Neljapäev','Reede'];
let plan=null,selected=0,checked=new Set(),busy=false,dirty=false,pdfURL=null;
function say(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error)}
function progress(){$('checked').checked=checked.has(selected);$('progress').textContent='Kontrollitud '+checked.size+' / 5 päeva.';$('download').disabled=busy||checked.size!==5||!$('plan-title').value.trim();$('import').disabled=busy||!$('pdf-file').files.length;document.querySelectorAll('#review-days button').forEach((b,i)=>b.classList.toggle('done',checked.has(i)))}
function encode(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)}
function setPDFLink(){if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=URL.createObjectURL(new Blob([Uint8Array.from(atob(plan.pdfBase64),c=>c.charCodeAt(0))],{type:'application/pdf'}));$('pdf-link').href=pdfURL;}
function invalidate(){dirty=true;$('preview').hidden=true;$('preview').removeAttribute('srcdoc');}
function showEditor(){const nav=$('review-days');nav.replaceChildren();names.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',i===selected);b.onclick=()=>{selected=i;showEditor()};nav.append(b)});const table=$('edit-table');table.replaceChildren();const head=table.createTHead().insertRow();['Tund',...Array.from({length:9},(_,i)=>(i+1)+'. klass')].forEach(label=>{const th=document.createElement('th');th.scope='col';th.textContent=label;head.append(th)});const body=table.createTBody();plan.schedule[selected].forEach((row,r)=>{const tr=body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=(r+1)+'. tund';tr.append(th);row.forEach((value,c)=>{const td=tr.insertCell(),input=document.createElement('textarea');input.value=value;input.maxLength=500;input.setAttribute('aria-label',names[selected]+', '+(r+1)+'. tund, '+(c+1)+'. klass');input.oninput=()=>{plan.schedule[selected][r][c]=input.value;td.classList.add('changed');checked.delete(selected);invalidate();progress()};td.append(input)})});progress()}
function loadPlan(value,warnings){validatePlan(value);plan=value;selected=0;checked.clear();dirty=true;$('review').hidden=false;$('plan-title').value=plan.title;$('extra-note').value=plan.extraNote;$('warnings').replaceChildren();warnings.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('warnings').append(li)});setPDFLink();invalidate();showEditor()}
function finalPlan(){return {...plan,title:$('plan-title').value.trim(),extraNote:$('extra-note').value,savedAt:new Date().toISOString()}}
$('pdf-file').onchange=progress;
$('import').onclick=async()=>{
 if(busy)return;const file=$('pdf-file').files[0];if(!file)return;
 if(dirty&&!confirm('Uus import asendab praegused salvestamata muudatused. Jätkata?'))return;
 if(file.size>10*1024*1024){say('PDF võib olla kuni 10 MB.',true);return;}
 busy=true;progress();let task,timer;
 try{say('Loen PDF-i…');const bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Valitud fail ei ole PDF.');const base64=encode(bytes);
 task=getDocument({data:bytes,useSystemFonts:true,isEvalSupported:false,enableXfa:false,stopAtErrors:true});task.onPassword=()=>{void task.destroy();say('Parooliga kaitstud PDF ei sobi. Salvesta kaitseta koopia.',true)};
 const parsing=(async()=>{const doc=await task.promise;return importDocument(doc,OPS,(n,total)=>say('Loen PDF-i: lehekülg '+n+' / '+total+'…'))})();
 const result=await Promise.race([parsing,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('PDF-i lugemine võttis liiga kaua. Proovi lihtsamat PDF-i.')),60000)})]);
 loadPlan({...result,title:file.name.replace(/\.pdf$/i,''),sourceName:file.name,extraNote:'',pdfBase64:base64},result.warnings);
 say('PDF loetud. Kontrolli kõik päevad ja lisa vajadusel tabelivälised märkused.');
 }catch(e){say(e.message||'PDF-i lugemine ebaõnnestus.',true)}finally{clearTimeout(timer);if(task)await task.destroy().catch(()=>{});busy=false;progress();}
};
$('html-file').onchange=async()=>{if(busy)return;const file=$('html-file').files[0];if(!file)return;if(dirty&&!confirm('Avamine asendab salvestamata muudatused. Jätkata?'))return;try{if(file.size>18*1024*1024)throw Error('HTML-fail on liiga suur.');const doc=new DOMParser().parseFromString(await file.text(),'text/html');const data=doc.getElementById('plan-data');if(!data)throw Error('See fail ei sisalda uue muutmistööriista andmeid. Impordi algne PDF.');loadPlan(JSON.parse(data.textContent),['Kontrolli kõik päevad enne uue faili salvestamist.']);say('Salvestatud tunniplaan avatud.')}catch(e){say(e.message,true)}};
$('checked').onchange=()=>{if($('checked').checked)checked.add(selected);else checked.delete(selected);progress()};
$('plan-title').oninput=()=>{invalidate();progress()};$('extra-note').oninput=invalidate;
$('show-preview').onclick=()=>{try{$('preview').srcdoc=exportHTML(finalPlan());$('preview').hidden=false;$('preview').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){say(e.message,true)}};
$('download').onclick=()=>{if(!plan||busy||checked.size!==5)return;try{const text=exportHTML(finalPlan()),url=URL.createObjectURL(new Blob([text],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='index.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);dirty=false;say('Uue index.html allalaadimine käivitati. Kontrolli faili arvutis ja laadi see GitHubi vana faili asemele. Veebilehte pole veel muudetud.')}catch(e){say(e.message,true)}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
$('import').disabled=false;say('Vali uus tunniplaani PDF. Muudatused jõuavad veebi alles pärast uue HTML-faili üleslaadimist.');progress();
