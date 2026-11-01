// Shared by the offline verifier and the browser worker (serialized by the
// builder). Only newly authored, landmark-free outskirts may overlap. City
// cores are copied unchanged; no scene/silhouette synthesis is allowed there.
function joinTilePixels(from,connector,to,{width=2048,height=576,overlap=512}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2)throw RangeError('tile geometry');
 if(!Number.isInteger(overlap)||overlap<2||overlap>width/2)throw RangeError('overlap outside quiet outskirts');
 for(const tile of [from,connector,to])if(!tile||tile.length!==width*height*4)throw RangeError('tile bytes do not match geometry');
 const worldWidth=width*3-overlap*2,out=new Uint8ClampedArray(worldWidth*height*4);
 function ridges(tile){const r=new Int32Array(width);r.fill(height-1);for(let x=0;x<width;x++)for(let y=0;y<height;y++)if(tile[(y*width+x)*4+3]>=192){r[x]=y;break;}return r;}
 const fr=ridges(from),mr=ridges(connector),tr=ridges(to),step=width-overlap;
 for(let y=0;y<height;y++)for(let x=0;x<worldWidth;x++){
  let a,b,ax,bx,ra,rb,p;
  if(x<step){a=from;ax=x;}
  else if(x<width){a=from;b=connector;ax=x;bx=x-step;ra=fr;rb=mr;p=(x-step)/(overlap-1);}
  else if(x<step*2){a=connector;ax=x-step;}
  else if(x<step+width){a=connector;b=to;ax=x-step;bx=x-step*2;ra=mr;rb=tr;p=(x-step*2)/(overlap-1);}
  else{a=to;ax=x-step*2;}
  const i=(y*width+ax)*4,o=(y*worldWidth+x)*4;
  if(!b||p===0){out[o]=a[i];out[o+1]=a[i+1];out[o+2]=a[i+2];out[o+3]=a[i+3];continue;}
  const j=(y*width+bx)*4;
  if(p===1){out[o]=b[j];out[o+1]=b[j+1];out[o+2]=b[j+2];out[o+3]=b[j+3];continue;}
  const t=p*p*p*(p*(p*6-15)+10),la=a[i+3]*(1-t),lb=b[j+3]*t,sum=la+lb;
  if(sum===0)continue; // Never invent a black/opaque fill in a real opening.
  const horizon=ra[ax]*(1-t)+rb[bx]*t;
  out[o+3]=Math.round(255*Math.max(0,Math.min(1,y+1-horizon)));
  for(let ch=0;ch<3;ch++)out[o+ch]=Math.round((a[i+ch]*la+b[j+ch]*lb)/sum);
 }
 return out;
}
module.exports={joinTilePixels};
