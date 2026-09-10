const {chromium}=require('C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report=[];
 for(const stage of ['harm','exhaust','adapt','liven']){
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:8137/code/works/'+stage+'.html');
  await page.waitForTimeout(3500);
  const frame=page.frames().find(f=>f.url().includes('/artworks/'+stage+'/'));
  if(!frame)errors.push('Missing artwork iframe');
  else {
   if(await frame.locator('canvas').count()===0)errors.push('No canvas');
   await frame.locator('canvas').first().click({position:{x:300,y:250},force:true});
   await page.waitForTimeout(1200);
  }
  await page.screenshot({path:'design-audit/release-'+stage+'.png'});
  report.push({stage,errors}); await page.close();
 }
 console.log(JSON.stringify(report,null,2));fs.writeFileSync('design-audit/release-results.json',JSON.stringify(report,null,2));
 await browser.close();if(report.some(r=>r.errors.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
