import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url),{Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const mf=new Miniflare({modules:[{type:'ESModule',path:path.resolve('dist/server/index.js')},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>/\.m?js$/.test(p)&&p!=='index.js').map(p=>({type:'ESModule',path:path.resolve('dist/server',p)}))],modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');for(const sql of fs.readFileSync('drizzle/0000_graceful_snowbird.sql','utf8').split('--> statement-breakpoint'))await db.prepare(sql).run();
 const token='f'.repeat(36),call=async input=>{const r=await mf.dispatchFetch('https://test.local/api/coop',{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(input)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data};
 const a=await call({action:'create',key:token,name:'Bundle QA',starter:4});await call({action:'sync',room:a.room,seq:1,steps:['right','right']});let state=await call({action:'propose',room:a.room,requestId:crypto.randomUUID(),kind:'coop',npc:'guide'});assert.equal(state.battle.turn,1);
 state=await call({action:'choose',room:a.room,requestId:crypto.randomUUID(),battle:state.battle.id,turn:1,choice:'move 1'});assert.equal(state.battle.turn,2);assert.equal(state.battle.you.team[0].pp[0].pp,34);
 console.log('PASS production Worker bundle: create room, D1, start battle, deserialize separate request, advance turn, persist PP');
}finally{await mf.dispose()}
