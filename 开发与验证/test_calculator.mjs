// Developer-only: node test_calculator.mjs. No dependencies or browser automation.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const folder=path.dirname(fileURLToPath(import.meta.url));
const html=readFileSync(path.join(folder,'..','视频码率计算器.html'),'utf8');
const script=id=>{const m=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'));assert.ok(m,id);return m[1];};
const context={};vm.createContext(context);vm.runInContext(script('budget-core'),context);
const C=context.BitrateCore;
const base={timeMode:'output',duration:'9:38',source:'9:38',start:'0',end:'',speed:'1',limit:'180',target:'170',audio:'128',overhead:'1.5',unit:'MB',extra:'0',encoder:'hevc',profile:'normal'};
let count=0;
function test(name,run){run();count++;console.log('PASS '+name);}
test('default matches original 2189 kbps',()=>{const b=C.calculate(base);assert.equal(b.video,2189);assert.equal(b.seconds,578);assert.ok(Math.abs(b.estimatedBytes-169952538.071066)<0.001);});
test('MiB gives larger budget and correct byte definition',()=>{const b=C.calculate({...base,unit:'MiB'});assert.equal(b.unitBytes,1048576);assert.equal(b.video,2302);assert.ok(b.estimatedBytes<=170*1048576);});
test('one minute direct and fractional durations',()=>{for(const [s,n] of [['60',60],['1:00',60],['0:09.5',9.5],['1:09:38.5',4178.5],['9：38',578]])assert.equal(C.duration(s),n);});
test('format duration preserves subsecond output',()=>{assert.equal(C.formatDuration(9.5),'0:09.5');assert.equal(C.formatDuration(4178.5),'1:09:38.5');assert.equal(C.formatDuration(59.9999),'1:00');assert.equal(C.formatDuration(0.001),'0:00.001');});
test('trim and speed use output rather than source',()=>{const o={...base,timeMode:'segment',source:'10:00',start:'1:00',end:'9:00',speed:'2'};assert.equal(C.calculate(o).seconds,240);assert.equal(C.calculate({...o,end:'',speed:'.5'}).seconds,1080);});
test('fractional trim and noninteger speed',()=>{assert.equal(C.outputSeconds({...base,timeMode:'segment',source:'10.5',start:'0.5',end:'9.5',speed:'1.5'}),6);});
test('audio removal frees budget',()=>{const b=C.calculate({...base,audio:'0'});assert.equal(b.video,2317);assert.equal(b.audioBytes,0);});
test('multiple output audio tracks subtract their total',()=>{assert.equal(C.calculate({...base,audio:'256'}).video,2061);});
test('fixed subtitles and attachments reduce video budget',()=>{const b=C.calculate({...base,extra:'5'});assert.equal(b.video,2120);assert.equal(b.extraBytes,5000000);assert.ok(b.estimatedBytes<=b.targetBytes);});
test('budget components never exceed target',()=>{for(const unit of ['MB','MiB'])for(const pct of ['0','1.5','15'])for(const extra of ['0','2','100']){const b=C.calculate({...base,unit,overhead:pct,extra});assert.ok(b.videoBytes+b.audioBytes+b.extraBytes+b.overheadBytes<=b.targetBytes+1e-6);assert.ok(b.estimatedBytes<=b.targetBytes+1e-6);}});
test('all six encoders share the same budget and label hardware correctly',()=>{const b=C.calculate(base);for(const id of Object.keys(C.codecs)){const s=C.settings(b,id,'normal',base);assert.ok(s.includes('2189 kbps'));if(id.startsWith('vt_'))assert.ok(s.includes('不能照搬'));else assert.ok(s.includes('2-Pass'));}});
test('large but valid sizes remain finite',()=>{const b=C.calculate({...base,limit:'100000000',target:'99999999',duration:'0.001'});assert.ok(Number.isSafeInteger(b.video));assert.ok(Number.isFinite(b.estimatedBytes));});
const invalid=[
 ['empty duration',{duration:''}],['zero duration',{duration:'0'}],['negative duration',{duration:'-1'}],['bad seconds',{duration:'1:60'}],['bad minutes',{duration:'1:60:00'}],['fractional minutes',{duration:'1.5:00'}],['NaN duration',{duration:'NaN'}],['infinite duration',{duration:'Infinity'}],['scientific duration',{duration:'1e3'}],['excessive length',{duration:'864001'}],
 ['zero limit',{limit:'0'}],['negative target',{target:'-1'}],['same target and limit',{target:'180'}],['above limit',{target:'181'}],['blank number',{target:''}],['nondecimal target',{target:'0xff'}],['infinite target',{target:'Infinity'}],['excessive size',{target:'100000001'}],['invalid units',{unit:'GB'}],
 ['negative audio',{audio:'-1'}],['fractional audio',{audio:'128.5'}],['excessive audio',{audio:'2049'}],['missing audio',{audio:''}],['invalid overhead',{overhead:'NaN'}],['excessive overhead',{overhead:'15.1'}],['negative overhead',{overhead:'-1'}],['negative attachments',{extra:'-1'}],['attachments exceed target',{extra:'170'}],['video budget under 100',{target:'1'}],
 ['trim reversed',{timeMode:'segment',start:'2:00',end:'1:00'}],['trim zero length',{timeMode:'segment',start:'1:00',end:'1:00'}],['trim past end',{timeMode:'segment',end:'10:00'}],['negative trim start',{timeMode:'segment',start:'-1'}],['zero speed',{timeMode:'segment',speed:'0'}],['excessive speed',{timeMode:'segment',speed:'101'}],['excessive slow output',{timeMode:'segment',source:'864000',speed:'.01'}]
];
for(const [name,change] of invalid)test('reject '+name,()=>assert.throws(()=>C.calculate({...base,...change})));
const reference=JSON.parse(readFileSync(path.join(folder,'reference_vectors.json'),'utf8'));
test('original Python budget parity ('+reference.budgets.length+' cases)',()=>{for(const v of reference.budgets){if(v.error){assert.throws(()=>C.calculate(v.input));continue;}const b=C.calculate(v.input);assert.equal(b.video,v.video,JSON.stringify(v.input));assert.equal(b.seconds,v.seconds);assert.ok(Math.abs(b.estimatedBytes-v.estimatedBytes)<.001);}});
test('original recommendation threshold parity ('+reference.recommendations.length+' cases)',()=>{for(const r of reference.recommendations)assert.equal(C.recommend(r.codec,r.rate,r.profile),r.expected);});
// Structural / controller checks use an explicit DOM stub. These are NOT browser tests.
test('HTML has no external scripts, styles or network APIs',()=>{assert.ok(!/<script[^>]+src=/i.test(html));assert.ok(!/<link[^>]+href=/i.test(html));assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html));assert.ok(html.includes("connect-src 'none'"));});
const elements=new Map();
for(const m of html.matchAll(/\bid="([^"]+)"/g)){assert.ok(!elements.has(m[1]),'duplicate id '+m[1]);const tag=html.slice(m.index).split('>')[0];const value=(tag.match(/\bvalue="([^"]*)"/)||[])[1]||base[m[1]]||'';elements.set(m[1],{value,textContent:'',hidden:/\bhidden\b/.test(tag),disabled:false,style:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},select(){}});}
let copied='';
const ui={BitrateCore:C,document:{getElementById:id=>{assert.ok(elements.has(id),'missing '+id);return elements.get(id);}},navigator:{clipboard:{writeText:async t=>{copied=t;}}},setTimeout,clearTimeout,URL,Blob};vm.createContext(ui);
test('controller initializes the original default',()=>{vm.runInContext(script('calculator-ui'),ui);assert.equal(elements.get('videoRate').textContent,'2189');assert.ok(elements.get('settings').value.includes('x265'));});
test('controller removes stale result and disables export on invalid input',()=>{elements.get('duration').value='0';elements.get('duration').listeners.input();assert.equal(elements.get('videoRate').textContent,'—');assert.equal(elements.get('settings').value,'');assert.equal(elements.get('export').disabled,true);assert.equal(elements.get('error').hidden,false);});
test('controller recovers and switches output time mode',()=>{Object.assign(elements.get('duration'),{value:'9:38'});elements.get('timeMode').value='segment';elements.get('source').value='10:00';elements.get('start').value='1:00';elements.get('end').value='9:00';elements.get('speed').value='2';elements.get('timeMode').listeners.input();assert.equal(elements.get('direct').hidden,true);assert.equal(elements.get('segment').hidden,false);assert.ok(elements.get('outputTime').textContent.includes('240 秒'));assert.equal(elements.get('export').disabled,false);});
test('controller hardware setting preserves support caveat',()=>{elements.get('encoder').value='vt_hevc';elements.get('encoder').listeners.input();assert.ok(elements.get('settings').value.includes('不能照搬'));});
await elements.get('copyRate').listeners.click();
await Promise.resolve();
test('clipboard controller receives the current bitrate (stub only)',()=>{assert.equal(copied,elements.get('videoRate').textContent);});
console.log(JSON.stringify({tests:count,originalBudgetCases:reference.budgets.length,originalRecommendationCases:reference.recommendations.length,browserTest:false,macTest:false}));
