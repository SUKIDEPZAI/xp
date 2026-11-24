'use strict';
require('./load-env')();
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const connectionString=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
if(!connectionString){console.error('Set DATABASE_URL_UNPOOLED or DATABASE_URL before running migrations.');process.exit(1)}
(async()=>{
  const pool=new Pool({connectionString,max:1,connectionTimeoutMillis:10000});
  try{
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const migration='0001_initial.sql';
    const {rows}=await pool.query('SELECT id FROM schema_migrations WHERE id=$1',[migration]);
    if(rows.length){console.log(`Migration ${migration} already applied.`);return}
    const sql=fs.readFileSync(path.join(__dirname,'..','migrations',migration),'utf8');
    const client=await pool.connect();
    try{await client.query('BEGIN');await client.query(sql);await client.query('INSERT INTO schema_migrations(id) VALUES($1)',[migration]);await client.query('COMMIT');console.log(`Applied ${migration}.`)}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }finally{await pool.end()}
})().catch(error=>{console.error('Migration failed:',error.message);process.exitCode=1});
