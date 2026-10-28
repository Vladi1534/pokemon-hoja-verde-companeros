// Public, short-lived movement history. It is not part of a portable save.
const point=(p,t)=>({map:p.map,x:p.x,y:p.y,fx:p.fx??p.x,fy:p.fy??p.y,dir:p.dir,fdir:p.fdir||p.dir,t});
export function recordMotion(member,before,path,now){
 if(!path.length)return;
 const interval=Math.max(90,Math.min(170,(now-before.seen)/path.length||120));
 let trail=member.motion?.trail||[];
 const start=now-path.length*interval;
 if(!trail.length||trail.at(-1).map!==before.map||trail.at(-1).x!==before.x||trail.at(-1).y!==before.y)trail=[point(before,start)];
 // Long idle periods must not look like a slow walk across the whole interval.
 if(trail.at(-1).t<start)trail.push(point(before,start));
 for(let i=0;i<path.length;i++)trail.push(point(path[i],Math.max(trail.at(-1).t+1,now-(path.length-1-i)*interval)));
 member.motion={seq:(member.motion?.seq||0)+1,trail:trail.slice(-24)};
}
