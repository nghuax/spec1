const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.wav':'audio/wav'};
http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file,'index-2026-09-22-v01.html') : file;
  fs.readFile(target,(err,data) => {res.writeHead(err ? 404 : 200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(err ? 'Not found' : data);});
}).listen(8137,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8137/code/'));
