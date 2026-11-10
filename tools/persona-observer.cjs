/* Public UI projection for isolated engine playtests. No authored effects,
   outcome prose, result probabilities or hidden rewards enter observations. */
const copy=value=>value===undefined?null:JSON.parse(JSON.stringify(value));
function fieldActions(G,settlement,settlementId){
  return (settlement?.field?.actions||[]).map(action=>({
    id:action.id,label:action.label||action.name||action.title,time:action.time,
    description:action.desc||action.text||'',cost:G.reqCostText(action.req),
    status:copy(G.stlFieldStatus(settlementId,action))
  })).filter(action=>!action.status.hiddenLocked);
}
function slotStatus(G,D,id){
  const rule=D.upSlots?.[id];
  if(!rule)return null;
  const installed=Array.from(G.slotUsage(id),u=>({id:u.id,name:u.nm||u.name}));
  return {id,name:rule.nm,cap:rule.cap,used:installed.length,installed};
}
function upgradeOptions(G,D,S){
  if(!S)return [];
  // Same displayed description, final price, installation rule and duration as
  // renderUpgradePanel. Base cost alone underestimates a roadside purchase.
  return Array.from(D.upgrades||[],u=>({
    id:u.id,name:u.nm||u.name,description:u.d||'',owned:!!S.up?.[u.id],
    cost:{scrap:G.upScrapCost(u),parts:u.cost.parts||0},minutes:G.upgradeMinutes(u),
    requirements:Array.from(G.upRequirements(u),id=>({id,name:G.upDef(id).nm,owned:!!S.up?.[id]})),
    installation:G.upInstallationInfo(u.id),slot:u.slot?slotStatus(G,D,u.slot):null,
    status:copy(G.canBuyUp(u.id))
  }));
}
function homeStatus(G,D,S){
  if(!S)return null;
  const stage=G.vanStage();
  return {
    stage:{id:stage.id,name:stage.nm,extensionCm:stage.cm,build:stage.build},
    seatCapacity:G.seatCapacity(),capacity:{fuel:S.fuelMax,food:S.foodMax,water:S.waterMax},
    rations:copy(G.dailyRationInfo()),
    participants:Array.from(G.homeParticipants?G.homeParticipants():G.campParticipants(),id=>({id,name:D.comps[id].name,guest:!S.party.includes(id)})),
    installed:Array.from(D.upgrades||[]).filter(u=>S.up?.[u.id])
      .map(u=>({id:u.id,name:u.nm||u.name,description:u.d||''})),
    slots:Object.fromEntries(Object.keys(D.upSlots||{}).map(id=>{
      const {name,cap,used,installed}=slotStatus(G,D,id);return [id,{name,cap,used,installed}];
    }))
  };
}
module.exports={fieldActions,upgradeOptions,homeStatus};
