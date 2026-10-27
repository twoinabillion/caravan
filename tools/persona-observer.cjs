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
module.exports={fieldActions};
