// Current UI owner, not the old adapter's hard-coded fuel <5 shortcut.
const prior=require('../discovery-twenty-20261020/departure-observer.cjs');
module.exports={...prior,apply(source){
 let next=prior.apply(source);
 const oldView="localControls:!G.isInfiniteResourceMode()&&s.fuel<5?";
 const oldAction="if(!S().driving&&S().at&&!G.isInfiniteResourceMode()&&S().fuel<5){G.openRescue('nofuel','crisis_nofuel');return true;}return false;";
 if(!next.includes(oldView)||!next.includes(oldAction))throw Error('Fuel observer owner changed');
 return next.replace(oldView,'localControls:G.canSeekFuel()?').replace(oldAction,'return G.seekFuel();');
}};
