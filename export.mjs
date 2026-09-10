import template from './public-template.html';
export function validatePlan(plan){
 if(!plan||!Array.isArray(plan.schedule)||plan.schedule.length!==5)throw Error('Tunniplaanis peab olema viis päeva.');
 for(const day of plan.schedule){if(!Array.isArray(day)||day.length!==8)throw Error('Igas päevas peab olema kaheksa tunnirida.');for(const row of day){if(!Array.isArray(row)||row.length!==9||row.some(x=>typeof x!=='string'||x.length>500))throw Error('Kontrolli lahtrite sisu.');}}
 if(typeof plan.title!=='string'||!plan.title.trim()||plan.title.length>120)throw Error('Lisa kuni 120 märgiga pealkiri.');
 if(typeof plan.pdfBase64!=='string'||plan.pdfBase64.length>15*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(plan.pdfBase64))throw Error('PDF-andmed on vigased.');
 if(typeof plan.extraNote!=='string'||plan.extraNote.length>2000||typeof plan.sourceName!=='string'||plan.sourceName.length>250)throw Error('Märkus või failinimi on liiga pikk.');
}
export function exportHTML(plan){validatePlan(plan);const json=JSON.stringify(plan).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');return template.replace('<!--PLAN_DATA-->','<script type="application/json" id="plan-data">'+json+'</script>');}
