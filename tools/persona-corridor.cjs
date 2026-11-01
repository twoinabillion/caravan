'use strict';
// QA policy memory only. Uses the chosen public fork text and the public map;
// it never reads D.routePlans, hidden edges, game flags, outcomes or service stock.
function rememberChoice(observation,selected,memory){
 if(observation?.eventId!=='route_mid_fork'||!selected||typeof observation.text!=='string')return false;
 const choice=observation.choices?.find(c=>c.index===selected.index&&c.label===selected.label&&c.visible===true&&c.enabled===true);
 if(!choice||!observation.text.includes('청주에 닿을 때까지')||!observation.text.includes('고른 노선 밖으로 나갈 수 없다'))return false;
 const west=/서쪽 장터길/.test(choice.label),east=/능선길/.test(choice.label);
 const named=west?[['무주','muju'],['전주','jeonju'],['청주','cheongju']]:east?[['상주','sangju'],['문경','mungyeong'],['청주','cheongju']]:null;
 if(!named||named.some(([name])=>!observation.text.includes(name)))return false;
 if(memory.corridor)return memory.corridor.choiceIndex===choice.index;
 memory.corridor={choiceIndex:choice.index,label:choice.label,waypoints:named.map(x=>x[1]),index:0,complete:false,source:'visible route_mid_fork text and enabled chosen label'};
 return true;
}
function next(observation,memory,{edges={},maxEdges=2}={}){
 const c=memory.corridor;
 if(!c||c.complete)return {active:false,route:null};
 const o=observation,goal=c.waypoints.at(-1);
 if(o.at===goal&&!o.driving){c.complete=true;return {active:false,route:null,reason:'arrived at disclosed corridor meeting point'};}
 if(o.driving||!o.at)return {active:true,route:null,reason:'finish current driving segment'};
 while(c.index<c.waypoints.length&&c.waypoints[c.index]===o.at)c.index++;
 const target=c.waypoints[c.index],path=o.publicMapRoutes?.[target],known=new Set(o.known||[]);
 if(!target||!path||!Array.isArray(path.nodes)||path.nodes.length<2||path.nodes[0]!==o.at||path.nodes.at(-1)!==target||path.nodes.some(id=>!known.has(id))||!Number.isFinite(path.km)||path.km<=0)
  return {active:true,target,route:null,reason:'no complete public path to disclosed waypoint'};
 const route=o.routes?.find(r=>r.id===path.nodes[1]);
 if(!route?.check?.ok||!route?.forecast?.ok||route.forecast.shortage)
  return {active:true,target,route:null,reason:'current first edge unavailable; keep mandatory waypoint pending'};
 if((edges[o.at+'>'+route.id]||0)>=maxEdges)
  return {active:true,target,route:null,reason:'repeat limit reached for current edge'};
 return {active:true,target,route,publicPath:{nodes:[...path.nodes],km:path.km},reason:'complete disclosed corridor before optional goals'};
}
module.exports={rememberChoice,next};
