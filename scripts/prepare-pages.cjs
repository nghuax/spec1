// Version the complete static dependency graph, not just the entry module.
const fs = require('node:fs');
const path = require('node:path');
const release = process.argv[2];
if (!/^[a-zA-Z0-9-]+$/.test(release || '')) throw new Error('Provide a release ID');
const root = path.resolve(process.argv[3] || 'code');
function version(url) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(url) || !/\.(?:js|css|html)(?:[?#]|$)/.test(url)) return url;
  const [base, hash] = url.split('#');
  const clean = base.replace(/([?&])v=[^&]*(&?)/, (_, prefix, next) => next ? prefix : '');
  return clean + (clean.includes('?') ? '&' : '?') + 'v=' + release + (hash ? '#' + hash : '');
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) { walk(file); continue; }
    if(!/\.(html|css|js)$/.test(file) || /(?:p5|mastered-audio|recorded-audio|\.original\.)/.test(entry.name)) continue;
    const source=fs.readFileSync(file,'utf8');
    const updated=source
      .replace(/((?:src|href)=["'])([^"']+)(["'])/g, (_,a,url,b)=>a+version(url)+b)
      .replace(/((?:from\s+|import\s*)["'])([^"']+)(["'])/g, (_,a,url,b)=>a+version(url)+b)
      .replace(/(@import\s+["'])([^"']+)(["'])/g, (_,a,url,b)=>a+version(url)+b)
      .replace(/(url\(["']?)([^"')]+)(["']?\))/g, (_,a,url,b)=>a+version(url)+b);
    if(updated!==source)fs.writeFileSync(file,updated);
  }
}
walk(root);
