import {pureAction,view,spawn,battleFor} from '../server/service.mjs';
import {validatePortable,portable,newPersonal,legacyPersonal} from '../server/portable.mjs';
import {recoverAtCenter} from '../server/recovery.mjs';
export {newPersonal,legacyPersonal,validatePortable};
export const version='2.4.1';
// randomUUID is restricted to secure browser contexts; preview still uses cryptographic randomness.
if(!crypto.randomUUID)crypto.randomUUID=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const s=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);};
// The browser and Worker execute the same campaign, encounters and battle simulator.
// Local battles have no turn timeout and can be resumed after closing the browser.
export class LocalGame {
 constructor(profile,saved){
  if(saved?.format==='kanto-local'&&saved.version===1){
   const row=structuredClone(saved.row),m=row.state.members[0];validatePortable(portable(row.state,m));
   if(row.state.members.length!==1||!row.state.personal)throw Error('Partida local inválida.');
   this.row=row;m.departed=false;row.state.open=true;
  }else{
   const value=validatePortable(profile),m=value.trainer;m.position.seen=Date.now()-2000;
   this.row={id:'local',invite:'',revision:0,state:{schema:2,worldRevision:3,personal:true,hostId:m.id,open:true,sharedGates:value.world.gates,progress:{},members:[m],battle:null,proposal:null,actions:[]}};
  }
 }
 get member(){return this.row.state.members[0]}
 get activeBattle(){const b=battleFor(this.row.state,this.member);return !!b&&!b.ended}
 state(){return view(this.row,this.member,{portable:this.portable()})}
 portable(){return portable(this.row.state,this.member)}
 snapshot(){return {format:'kanto-local',version:1,savedAt:new Date().toISOString(),row:structuredClone(this.row)}}
 dispatch(input){
  if(['host','join','depart','propose'].includes(input.action)&&(['host','join','depart'].includes(input.action)||input.other))throw Error('Abre tu partida a amigos para usar esta opción.');
  const row=structuredClone(this.row),s=row.state,me=s.members[0],now=Date.now();
  if(input.requestId&&s.actions.includes(input.requestId))return this.state();
  if(s.proposal?.expires<now)s.proposal=null;
  const response=pureAction(s,me,input,now);
  if(battleFor(s,me)&&!battleFor(s,me).ended){/* HP is committed by the shared simulator when combat ends. */}
  else if(!me.party.some(p=>!p.eggSteps&&p.hp>0))recoverAtCenter(me);
  if(input.requestId){s.actions.push(input.requestId);s.actions=s.actions.slice(-100);}
  if(input.action!=='sync'||response)row.revision++;
  this.row=row;return view(row,me,{portable:this.portable(),message:typeof response==='string'?response:'',dialog:response&&typeof response==='object'?response:null});
 }
}
