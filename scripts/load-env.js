'use strict';
const fs=require('node:fs');
const path=require('node:path');

// Minimal .env reader for Node 22 without adding a runtime dependency.
// Platform-provided environment variables always take precedence.
function loadEnvFile(file=path.resolve(__dirname,'..','.env')){
  let source;
  try{source=fs.readFileSync(file,'utf8')}catch(error){if(error.code==='ENOENT')return false;throw error}
  for(const rawLine of source.split(/\r?\n/)){
    const line=rawLine.trim();if(!line||line.startsWith('#'))continue;
    const match=line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);if(!match)continue;
    const key=match[1];if(process.env[key]!==undefined)continue;
    let value=match[2].trim();
    if(value.startsWith('"')){const end=value.lastIndexOf('"');if(end>0)value=value.slice(1,end).replace(/\\n/g,'\n').replace(/\\r/g,'\r').replace(/\\"/g,'"').replace(/\\\\/g,'\\')}
    else if(value.startsWith("'")){const end=value.lastIndexOf("'");if(end>0)value=value.slice(1,end)}
    else value=value.replace(/\s+#.*$/,'').trim();
    process.env[key]=value;
  }
  return true;
}
module.exports=loadEnvFile;
