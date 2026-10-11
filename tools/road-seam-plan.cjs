// Read-only raster measurements. Output is SVG layout, never an edited raster.
const fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const W=1024,H=1728,STEP=2;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
async function measure(file){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const skyline=[];
 for(let x=0;x<info.width;x++){
  let y=0;while(y<info.height&&data[(y*info.width+x)*4+3]<192)y++;
  skyline.push(info.height-y);
 }
 const heights=skyline.map((_,x)=>{const a=skyline.slice(Math.max(0,x-3),x+4).sort((a,b)=>a-b);return a[Math.floor(a.length/2)];});
 return {width:info.width,height:info.height,heights,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
}
function seamPlan(city,route,{edge='right',reverse=false}={}){
 const strips=[];
 const atJoin=Math.round(W*.10);
 const joinCity=city.heights[edge==='right'?W-1-atJoin:atJoin];
 const joinRoute=3*route.heights[Math.round((reverse?2048-atJoin:1024+atJoin)/3)];
 const joinScale=joinRoute>0?joinCity/joinRoute:1;
 for(let x=0;x<W;x+=STEP){
  const mid=x+STEP/2,cityX=Math.round(edge==='right'?W-1-mid:mid);
  const routeX=Math.round((reverse?2048-mid:1024+mid)/3);
  const ch=city.heights[Math.max(0,Math.min(city.width-1,cityX))];
  const rh=3*route.heights[Math.max(0,Math.min(route.width-1,routeX))];
  // Match the ridge throughout the short material join, then ease to native
  // terrain. City itself is untouched; this is fixed in world coordinates.
  const t=smooth((mid/W-.10)/.48);
  const scale=mid/W<=.10?(rh>0?ch/rh:1):joinScale*(1-t)+t;
  const target=rh*scale;
  strips.push({x,width:STEP,scale:+scale.toFixed(6),height:target,cityHeight:ch,routeHeight:rh});
 }
 return {width:W,height:H,edge,reverse,strips,cityHash:city.sha256,routeHash:route.sha256};
}
module.exports={measure,seamPlan,smooth,W,H,STEP};
