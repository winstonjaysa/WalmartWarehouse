const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1600,900']});
const pg=await b.newPage();await pg.setViewport({width:1600,height:900});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('file:///workspace/gateflow/builds/walmart-dc_v3.html',{waitUntil:'load',timeout:90000});
await new Promise(r=>setTimeout(r,25000));
await pg.screenshot({path:'/workspace/gateflow/preview/v3_wide.png'});
console.log('errors',JSON.stringify(errs.slice(0,5)));await b.close();})();
