// Independent HD study geometry. This module never reads a save or enables the live renderer.
const WORLD=2.875,OVERLAP=64/1024,BASELINE=.72;
function frame(progress,{reverse=false,width=360}={}){
 if(!Number.isFinite(width)||width<=0)throw Error('Invalid viewport');
 const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
 const camera=(reverse?1-p:p)*(WORLD-1)*width;
 return {camera,width,baseline:BASELINE,sourcePixelsPerViewport:1024,plates:[
  {role:'from',x:-camera,width,mirrored:false},
  {role:'bridge',x:(1-OVERLAP)*width-camera,width,mirrored:false},
  {role:'to',x:2*(1-OVERLAP)*width-camera,width,mirrored:false}
 ]};
}
module.exports={WORLD,OVERLAP,BASELINE,frame};
