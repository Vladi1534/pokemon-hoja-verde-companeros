/* Play a short authoritative path behind real time, including turns and followers. */
var RemoteMotion=(()=>{
 const copy=p=>({...p});
 function receive(previous,member,now,serverTime){
  const p=member.position,trail=member.motion?.trail;
  if(!previous||previous.map!==p.map){
   previous={map:p.map,trail:[],lastTime:-Infinity,seq:-1,received:now,serverTime,delay:420,pose:copy(p)};
  }
  if(trail?.length&&member.motion.seq!==previous.seq){
   const gap=now-previous.received;
   if(previous.seq>=0)previous.delay=Math.max(350,Math.min(700,previous.delay*.8+Math.min(700,gap)*.2));
   previous.trail=trail.map(copy);previous.seq=member.motion.seq;previous.received=now;
  }else if(!trail?.length){
   previous.seq=-1;
   const last=previous.trail.at(-1);
   if(!last||last.x!==p.x||last.y!==p.y||last.dir!==p.dir){previous.trail.push({...p,t:serverTime});previous.trail=previous.trail.slice(-24);}
  }
  previous.serverTime=serverTime;previous.clockAt=now;previous.target=copy(p);return previous;
 }
 function sample(remote,now){
  const trail=remote.trail;if(!trail.length)return {...remote.target,moving:false};
  const time=Math.max(remote.lastTime,remote.serverTime+(now-remote.clockAt)-remote.delay);remote.lastTime=time;
  let a=trail[0],b;
  for(let i=1;i<trail.length;i++){if(trail[i].t>time){b=trail[i];break;}a=trail[i];}
  let pose={...a,moving:false};
  if(b&&time>=a.t&&a.map===b.map&&Math.abs(b.x-a.x)+Math.abs(b.y-a.y)<=1){
   const f=Math.max(0,Math.min(1,(time-a.t)/Math.max(1,b.t-a.t)));
   for(const key of ['x','y','fx','fy'])pose[key]=a[key]+(b[key]-a[key])*f;
   pose.dir=b.dir;pose.fdir=b.fdir;pose.moving=a.x!==b.x||a.y!==b.y;
  }
  // A portal, recovery or stale path should appear at the new map, never fly across it.
  if(pose.map!==remote.map)pose={...remote.target,moving:false};
  remote.pose=pose;return pose;
 }
 return {receive,sample};
})();
if(typeof module==='object'&&module.exports)module.exports=RemoteMotion;
