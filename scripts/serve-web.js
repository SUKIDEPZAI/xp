'use strict';
require('./load-env')();
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {URL}=require('node:url');
const {handleApi}=require('../server/api');
const {pingDatabase,closeDatabase}=require('../server/database');

const ROOT=path.resolve(__dirname,'..','ui');
const PORT=Number.parseInt(process.env.PORT||'8080',10);
const HOST=process.env.HOST||'0.0.0.0';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.wasm':'application/wasm','.txt':'text/plain; charset=utf-8','.mp3':'audio/mpeg','.mp4':'video/mp4','.webm':'video/webm'};
function send(res,status,body,type='text/plain; charset=utf-8',extra={}){res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Cache-Control':'no-store',...extra});res.end(body)}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/','http://'+(req.headers.host||'localhost'));
    if(url.pathname.startsWith('/api/')){await handleApi(req,res);return}
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method not allowed','text/plain; charset=utf-8',{Allow:'GET, HEAD, OPTIONS'});
    if(url.pathname==='/health')return send(res,200,'ok');
    if(url.pathname==='/ready'){
      try{await pingDatabase();return send(res,200,'ready')}
      catch(error){return send(res,503,error.code==='DATABASE_NOT_CONFIGURED'?'database_not_configured':'database_unavailable')}
    }
    let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{return send(res,400,'Bad request')}
    if(pathname==='/')pathname='/index.html';
    const filename=path.resolve(ROOT,`.${pathname}`),relative=path.relative(ROOT,filename);
    if(relative.startsWith('..')||path.isAbsolute(relative))return send(res,403,'Forbidden');
    fs.stat(filename,(error,stat)=>{
      if(error||!stat.isFile())return send(res,404,'Not found');
      const type=MIME[path.extname(filename).toLowerCase()]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Cache-Control':filename.endsWith('.wasm')?'public, max-age=31536000, immutable':'no-cache'});
      if(req.method==='HEAD')return res.end();
      fs.createReadStream(filename).on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end()}).pipe(res);
    });
  }catch(error){console.error('HTTP request error:',error.message);if(!res.headersSent)send(res,500,'Internal server error');else res.destroy()}
});
server.listen(PORT,HOST,()=>process.stdout.write(`XP Living Desktop listening on http://${HOST}:${PORT}\n`));
server.on('error',error=>{console.error(error);process.exitCode=1});
let shuttingDown=false;
async function shutdown(signal){if(shuttingDown)return;shuttingDown=true;process.stdout.write(`Received ${signal}; shutting down.\n`);server.close(async()=>{try{await closeDatabase()}catch(error){console.error('Database shutdown error:',error.message)}process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
