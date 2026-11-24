'use strict';
require('./scripts/load-env')();
const {defineConfig}=require('drizzle-kit');
module.exports=defineConfig({schema:'./server/schema.js',out:'./migrations/drizzle',dialect:'postgresql',dbCredentials:{url:process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL||''},strict:true,verbose:true});
