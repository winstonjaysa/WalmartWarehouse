const puppeteer=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync('/workspace/gateflow/qa/tools/auto.js','utf8');const shim=src.match(/const shim=`([\s\S]*?)`;\n\(async/)[1].replace('${DT}','133');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:+(process.env.VW||1440),height:+(process.env.VH||900)});await p.evaluateOnNewDocument(shim);await p.goto(process.argv[2],{waitUntil:'load'});await new Promise(r=>setTimeout(r,3000));
let t=Date.now();for(let i=0;i<5;i++)await p.evaluate(()=>__vstep(1));console.log('step ms',(Date.now()-t)/5);
t=Date.now();for(let i=0;i<5;i++)await p.evaluate(()=>JSON.stringify(__track()).length);console.log('track ms',(Date.now()-t)/5);
t=Date.now();for(let i=0;i<3;i++)await p.screenshot({path:'/tmp/x.png'});console.log('shot ms',(Date.now()-t)/3);await b.close();})();
