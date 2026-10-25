// node realfps.js URL [seconds=10] -> real rAF frame-time stats (SwiftShader) + dt-use probe
const puppeteer=require('puppeteer-core');
(async()=>{const [URL,S='10']=process.argv.slice(2);
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage(); await p.setViewport({width:1440,height:900}); await p.goto(URL,{waitUntil:'load'}); await new Promise(r=>setTimeout(r,8000));
 const r=await p.evaluate(sec=>new Promise(res=>{const d=[];let last=performance.now();const t0=last;function f(t){d.push(t-last);last=t;if(t-t0<sec*1000)requestAnimationFrame(f);else{d.shift();const s=[...d].sort((a,b)=>a-b);res({frames:d.length,fps:+(d.length/((t-t0)/1000)).toFixed(1),p50:+s[s.length>>1].toFixed(1),p95:+s[Math.floor(s.length*.95)].toFixed(1),max:+s[s.length-1].toFixed(1),long33:d.filter(x=>x>33).length,long100:d.filter(x=>x>100).length})}}requestAnimationFrame(f)}),+S);
 console.log(JSON.stringify(r)); await b.close();})();
