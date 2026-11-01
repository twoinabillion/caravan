const test=require('node:test'),assert=require('node:assert/strict');
const {joinTilePixels}=require('./continuous-route-join.cjs');
function tile(w,h,ridge,color){const a=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(y>=ridge(x)){const i=(y*w+x)*4;a.set([...color(x,y),255],i);}return a;}
const opts={width:16,height:10,overlap:4};
const a=()=>tile(16,10,x=>2, (x,y)=>[40+x,50+y,60]);
const b=()=>tile(16,10,x=>4, (x,y)=>[80+x,90+y,100]);
const c=()=>tile(16,10,x=>3, (x,y)=>[120+x,130+y,140]);
test('shared city windows remain byte-identical, with no mutation of any input',()=>{
 const input=[a(),b(),c()],before=input.map(x=>Buffer.from(x)),out=joinTilePixels(...input,opts);assert.equal(out.length,40*10*4);
 for(let y=0;y<10;y++)for(let x=4;x<12;x++)for(let ch=0;ch<4;ch++){
  assert.equal(out[(y*40+x)*4+ch],input[0][(y*16+x)*4+ch]);
  assert.equal(out[(y*40+24+x)*4+ch],input[2][(y*16+x)*4+ch]);
 }
 input.forEach((x,i)=>assert.deepEqual(Buffer.from(x),before[i]));
});
test('quiet terrain joins never turn opaque ground into a translucent second mountain',()=>{
 const out=joinTilePixels(a(),b(),c(),opts);
 for(let y=0;y<10;y++)for(let x=0;x<40;x++){
  if(y<2)assert.equal(out[(y*40+x)*4+3],0,'transparent sky');
  if(y>=5)assert.equal(out[(y*40+x)*4+3],255,'solid ground');
 }
 // Alpha-only interpolation would leave these samples partly visible.
 assert.equal(out[(3*40+13)*4+3],255,'below the registered ridge is solid');
 assert.equal(out[(2*40+14)*4+3],0,'above the registered ridge is sky');
});
test('different texture columns survive the overlap rather than repeating a bank column',()=>{
 const f=tile(16,10,()=>0,x=>[x*10,50,80]);const out=joinTilePixels(f,f,f,opts);
 const values=[];for(let x=12;x<16;x++)values.push(out[(8*40+x)*4]);
 assert(new Set(values).size>1);assert.notDeepEqual(values,[120,120,120,120]);
});
test('when a photograph has a transparent opening, no invented black terrain fills it',()=>{
 const f=a(),g=b();for(let y=5;y<7;y++)for(let x=0;x<16;x++){f[(y*16+x)*4+3]=0;g[(y*16+x)*4+3]=0;}
 const out=joinTilePixels(f,g,c(),opts);for(let y=5;y<7;y++)for(let x=12;x<16;x++)assert.equal(out[(y*40+x)*4+3],0);
});
test('malformed tile bytes/geometry fail before producing a partial scene',()=>{
 assert.throws(()=>joinTilePixels(a(),b(),new Uint8Array(2),opts),/tile bytes/);
 assert.throws(()=>joinTilePixels(a(),b(),c(),{...opts,overlap:9}),/overlap/);
});
