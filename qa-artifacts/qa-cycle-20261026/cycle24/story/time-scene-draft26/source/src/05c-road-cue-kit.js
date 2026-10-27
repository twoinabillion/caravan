/* Approved generated encounter components, composed in the SAME live canvas.
   No event painting, scenery replacement, gameplay writes or fixed crowd. */
G.roadCueKit=(()=>{
  const manifest=__ROAD_KIT_MANIFEST__;
  const named={meet_trader_truck:'road-mansu',mansu_robbed:'road-mansu',mansu_revenge:'road-mansu',
    meet_postman:'postman-standing',postman_again:'postman-standing',ev_postman_ghost:'postman-standing',
    ev_hunter_meat:'road-hunter',meet_monk:'road-monk',meet_barber:'road-barber',ev_barber:'road-barber',
    meet_beekeeper:'beekeeper-standing',ev_beekeeper:'beekeeper-standing',
    meet_mapmaker:'road-mapmaker',lib_meet:'road-hanbyeol',lib_request:'road-hanbyeol',lib_return:'road-hanbyeol',
    meet_photographer:'road-photographer',meet_florist:'road-florist',meet_tailor:'road-tailor',
    deserter_meet:'road-seoyeon',deserter_check:'road-seoyeon',deserter_farewell:'road-seoyeon',
    gw_daegwallyeong:'road-sanjigi',cell_mountain_meet:'road-sanjigi',cell_sea_meet:'road-kimcaptain'};
  const role=(kind,motif)=>motif==='postman'?'postman-standing':motif==='beekeeper'?'beekeeper-standing':
    motif==='monk'?'road-monk':motif==='elder'?'road-elder':motif==='barber'?'road-barber':
    motif==='musician'||motif==='piano'?'road-musician':motif==='child'?'road-child':
    kind==='medical'||motif==='pharmacy'||motif==='clinic-bus'?'road-medic':
    kind==='checkpoint'||motif==='temporary-checkpoint'?'checkpoint-worker':
    motif==='coffee-van'||motif==='coffee-stall'||motif==='food-truck'?'coffee-vendor':'road-man';
  function compose(profile,caravanWidth){
    const spec=profile.scene||{},kind=profile.kind,motif=spec.motif||'',event=profile.eventKey||'';
    const adult=caravanWidth*.205,layers=[];
    const part=(key,x,ground,width)=>{
      const image=manifest.images[key];if(!image)return;
      layers.push({key,x:x-width/2,y:ground-width*image.height/image.width,width,height:width*image.height/image.width});
    };
    const person=(key,x,ground,height=adult,flip=false)=>{
      const image=manifest.images[key];if(!image)return;
      const width=height*image.width/image.height;
      layers.push({key,x:x-width/2,y:ground-height,width,height,person:true,flip});
    };
    let count=Math.max(0,Math.min(3,Math.floor(Number(spec.people)||0)));
    if(['ev_tollbooth_ghost','ev_gasstation_tank'].includes(event))count=0;
    else if(named[event])count=1;
    let base=named[event]||role(kind,motif),primary=null;
    let peopleGround=0,peopleStart=-adult*.18,step=adult*.48;
    if(event==='meet_piano'){
      primary='road-piano';part(primary,0,0,caravanWidth*.38);count=0;
    }else if(event==='meet_mapmaker'){
      primary='road-mapmaker-sidecar';part(primary,0,0,caravanWidth*.43);peopleStart=caravanWidth*.25;
    }else if(['lib_meet','lib_request','lib_return'].includes(event)){
      primary='road-library-bus';part(primary,0,0,caravanWidth*.52);peopleStart=caravanWidth*.23;
    }else if(['coffee-van','food-truck','clinic-bus','film-vehicle','broken-vehicle'].includes(motif)||event==='meet_trader_truck'){
      primary=event==='meet_trader_truck'?'road-merchant-truck':
        motif==='food-truck'?'road-food-truck':motif==='clinic-bus'?'road-clinic-bus':
        motif==='film-vehicle'?'road-cinema-truck':motif;
      const width=caravanWidth*.52;
      const childCount=motif==='broken-vehicle'?Math.min(count,Math.max(0,Number(spec.children)||0)):0;
      // Cargo-bed children are behind the separate truck side, never floating below it.
      for(let i=0;i<childCount;i++)person('road-child',width*(-.08+i*.18),-adult*.38,adult*.65,!!i);
      part(primary,0,0,width);
      count-=childCount;
      peopleStart=motif==='broken-vehicle'?-width*.60:width*.38;
      if(event==='meet_trader_truck')count=1;
    }else if(motif==='market-cart'){
      primary='market-cart';part(primary,0,0,caravanWidth*.43);peopleStart=caravanWidth*.225;
      if(event==='ev_barter_cart'){count=2;base='road-man';}
      else if(event==='meet_parts_peddler'){count=1;base='cart-trader';}
    }else if(motif==='postman'||kind==='cyclist'){
      primary='delivery-bicycle';part(primary,-adult*.35,0,adult*1.13);peopleStart=adult*.48;
    }else if(motif==='gas-station'){
      primary='fuel-pump';part(primary,0,0,adult*.70);peopleStart=adult*.68;
    }else if(motif==='temporary-checkpoint'||kind==='checkpoint'){
      primary='checkpoint-booth';part(primary,-adult*.48,0,adult*1.65);
      part('temporary-checkpoint',adult*1.04,0,adult*1.05);peopleStart=adult*.42;
    }else if(motif==='cow-walker'){
      primary='road-cow';part(primary,0,0,adult*1.55);peopleStart=adult*.9;
    }else if(named[event]||kind==='people'||kind==='medical'||['barber','beekeeper','monk','elder','child','musician','piano','wedding','procession','photo'].includes(motif)){
      // This replaces the old square crowd painting; every adult has an independent anchor.
      peopleStart=-(count-1)*step/2;
    }else return null;
    for(let i=0;i<count;i++){
      const child=event==='ev_barter_cart'&&i===1||motif==='child';
      const key=child?'road-child':i===0?base:['road-woman','road-refugee'][i-1]||'road-man';
      person(key,peopleStart+i*step,peopleGround,adult*(child?.65:key==='road-tailor'?.74:1),i===2);
    }
    const bounds=layers.reduce((b,p)=>({left:Math.min(b.left,p.x),right:Math.max(b.right,p.x+p.width),
      top:Math.min(b.top,p.y),bottom:Math.max(b.bottom,p.y+p.height)}),{left:0,right:0,top:0,bottom:0});
    return {layers,primary,prop:!primary?spec.prop||'':'',adultHeight:adult,bounds};
  }
  // Start decoding before discovery; no first-frame empty truck while its image loads.
  if(typeof Image!=='undefined')Object.values(manifest.images).forEach(entry=>{
    const image=new Image();image.src=entry.src;entry.preloaded=image;
  });
  return {images:manifest.images,compose};
})();
