/* Original procedural fallback bank. No sampled/generated audition audio is
   copied here. Local Studio keeps its reviewed/audition sources; app/offline
   gets a quiet playable fallback through the SAME AMBI pools, buses and fades.
   This is functional coverage, not a claim of final recorded-foley quality. */
D.offlineFoley=(()=>{
 const RATE=22050,cache=new Map(),TAU=2*Math.PI;
 // kind, duration, cutoff/noise colour, resonance, pulse count. Loop periods
 // are integral; a circular noise warm-up removes a filter startup boundary.
 const specs={
  rain_cab_light:['bed',4,.10,0,8],rain_cab_heavy:['bed',4,.15,0,12],
  rain_outdoor_light:['bed',4,.38,0,8],rain_outdoor_heavy:['bed',4,.48,0,12],
  rain_shelter:['bed',4,.07,0,6],wind_gentle:['bed',4,.018,0,1],wind_storm:['bed',4,.035,0,2],
  forest_day:['chirp',4,.03,1700,3],night_insects:['chirp',4,.02,3600,12],
  river:['bed',4,.23,0,3],tunnel:['bed',4,.006,0,1],camp_fire:['crackle',4,.15,0,11],
  wipers:['sweep',2,.10,120,2],thunder_distant:['roll',2.8,.012,42,1],
  steps_gravel:['hit',.9,.30,85,2],steps_wood:['hit',.9,.07,160,2],steps_metal:['hit',.9,.10,410,2],
  door_latch:['hit',.35,.12,520,2],cloth:['rub',.7,.06,0,3],water_pour:['rub',1.2,.35,680,7],
  bottle:['hit',.35,.08,740,2],meal:['rub',.65,.07,0,3],stove:['hit',.4,.2,70,3],
  repair_ratchet:['hit',.8,.24,900,8],repair_hammer:['hit',.75,.12,280,2],coins:['hit',.45,.18,2100,4],
  notebook:['rub',.6,.18,0,2],switch:['hit',.13,.2,800,1],cassette:['hit',.4,.16,350,2],
  dog_breath:['rub',1.2,.03,0,2],tool_sorting:['hit',.85,.18,700,5],paper_fold:['rub',.7,.24,0,3],
  cup_set_down:['hit',.4,.04,1450,1],radio_tuning:['rub',.9,.4,1050,5],
  generator_shutdown:['roll',1.4,.035,60,1],bag_packing:['rub',.9,.09,0,4]
 };
 function samples(key){
  const name=key.replace(/^detail_/,'').replace(/_[bc]$/,''),spec=specs[name];
  if(!spec)return null;
  const [kind,seconds,colour,hz,pulses]=spec,n=Math.round(RATE*seconds),data=new Float32Array(n);
  let seed=2166136261;for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const noise=new Float32Array(n);
  for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=seed/2147483648-1;}
  let low=0;
  for(let pass=0;pass<2;pass++)for(let i=0;i<n;i++){
   low+=colour*(noise[i]-low);if(!pass)continue;
   const p=i/n,t=i/RATE,cycle=p*pulses,phase=cycle%1;
   const pulse=Math.exp(-phase*(kind==='hit'?22:8))*Math.min(1,phase*120);
   const tone=hz?Math.sin(TAU*hz*t)*.35+Math.sin(TAU*hz*1.73*t)*.12:0;
   let v=low;
   if(kind==='bed')v*=.7+.3*Math.cos(TAU*p*pulses);
   else if(kind==='chirp')v=low*.2+Math.sin(TAU*Math.round(hz*seconds)*p+2*Math.sin(TAU*p*pulses))*pulse*.14;
   else if(kind==='crackle')v=low*.4+noise[i]*Math.pow(Math.max(0,Math.cos(TAU*cycle)),28);
   else if(kind==='sweep')v=low*Math.pow(Math.sin(Math.PI*phase),3)+Math.sin(TAU*hz*t)*pulse*.025;
   else if(kind==='roll')v=(low+tone*.08)*Math.sin(Math.PI*p)*Math.exp(-p*2);
   else if(kind==='hit')v=(low+tone)*pulse;
   else v=(low+tone*.02)*Math.sin(Math.PI*p)*(.35+.65*Math.pow(Math.sin(Math.PI*cycle),2));
   data[i]=v;
  }
  // Short zero-crossing taper bounds discontinuities for media loop/restarts.
  // Keep this audible-quality caveat explicit: final field recordings may replace it.
  let peak=0;for(let i=0;i<n;i++){
   data[i]*=Math.min(1,i/220,(n-1-i)/220);peak=Math.max(peak,Math.abs(data[i]));
  }
  if(peak)for(let i=0;i<n;i++)data[i]*=.32/peak;
  return data;
 }
 function source(key){
  if(cache.has(key))return cache.get(key);
  const pcm=samples(key);if(!pcm||typeof btoa!=='function')return null;
  const bytes=new Uint8Array(44+pcm.length*2),v=new DataView(bytes.buffer);
  const word=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
  word(0,'RIFF');v.setUint32(4,bytes.length-8,true);word(8,'WAVE');word(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,RATE,true);v.setUint32(28,RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  word(36,'data');v.setUint32(40,pcm.length*2,true);
  for(let i=0;i<pcm.length;i++)v.setInt16(44+i*2,Math.round(pcm[i]*32767),true);
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const uri='data:audio/wav;base64,'+btoa(binary);cache.set(key,uri);return uri;
 }
 return {source,samples};
})();
