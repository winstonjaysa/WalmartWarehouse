const puppeteer=require('puppeteer-core');const fs=require('fs');const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [w,h,tag,mob] of [[1280,800,'desk',false],[390,844,'mob',true]]){const p=await b.newPage();const log=[];
 await p.setViewport({width:w,height:h,isMobile:mob,hasTouch:mob,deviceScaleFactor:mob?2:1});
 p.on('console',m=>log.push(`[${m.type()}] ${m.text()}`));p.on('pageerror',e=>log.push('[pageerror] '+e.message));
 p.on('requestfailed',r=>log.push('[requestfailed] '+r.url()+' '+(r.failure()&&r.failure().errorText)));
 p.on('response',r=>{if(r.status()>=400)log.push('[http '+r.status()+'] '+r.url())});
 const t0=Date.now();await p.goto(''+(process.env.URL||'http://127.0.0.1:8931/walmart-dc.html')+'',{waitUntil:'load',timeout:120000});
 await new Promise(r=>setTimeout(r,20000));
 const info=await p.evaluate(()=>{const c=document.querySelector('canvas');const gl=c&&(c.getContext('webgl2')||c.getContext('webgl'));return {canvas:c?[c.width,c.height]:null,gl:!!gl,loading:!!(document.querySelector('#loading')&&getComputedStyle(document.querySelector('#loading')).display!=='none'&&getComputedStyle(document.querySelector('#loading')).opacity!=='0'),title:document.title}});
 await p.screenshot({path:`${OUT}/load_${tag}_${w}x${h}.png`});
 fs.writeFileSync(`${OUT}/console_${tag}.txt`,log.join('\n'));console.log(tag,JSON.stringify(info),'ms',Date.now()-t0,'log',log.length);await p.close();}
await b.close();})().catch(e=>{console.error('FATAL',e);process.exit(1)});
