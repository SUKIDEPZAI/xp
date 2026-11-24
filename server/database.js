'use strict';
let singleton=null;
function getDatabase(){
  if(!process.env.DATABASE_URL)throw Object.assign(new Error('DATABASE_URL is not configured'),{code:'DATABASE_NOT_CONFIGURED'});
  if(singleton)return singleton;
  const {Pool}=require('pg');
  const {drizzle}=require('drizzle-orm/node-postgres');
  const schema=require('./schema');
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:8000,keepAlive:true,allowExitOnIdle:false});
  pool.on('error',error=>console.error('Database pool error:',error.message));
  const db=drizzle(pool,{schema});
  singleton={pool,db,schema};return singleton;
}
async function pingDatabase(){const {pool}=getDatabase();await pool.query('select 1');return true}
async function closeDatabase(){if(singleton){const current=singleton;singleton=null;await current.pool.end()}}
module.exports={getDatabase,pingDatabase,closeDatabase};
