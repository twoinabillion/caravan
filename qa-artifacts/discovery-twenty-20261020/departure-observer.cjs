// Audit-only bridge to the current UI owner's public departure predicate.
const route="check:copy(G.canTravelTo(n.id)),forecast:copy(G.travelForecast(n.id)),";
const execute="case 'travel':act('travel',()=>G.startTravel(decision.to),";
function enabled(G,id){const forecast=G.travelForecast(id);return !!(forecast.ok&&!forecast.shortage);}
function apply(source){
 if(!source.includes(route)||!source.includes(execute))throw Error('Departure observer anchor changed');
 return source.replace(route,"check:{...copy(G.canTravelTo(n.id)),engineOk:G.canTravelTo(n.id).ok,ok:!!(G.travelForecast(n.id).ok&&!G.travelForecast(n.id).shortage)},forecast:copy(G.travelForecast(n.id)),")
 .replace(execute,"case 'travel':act('travel',()=>{const f=G.travelForecast(decision.to);return f.ok&&!f.shortage?G.startTravel(decision.to):false;},")
 .replace('return {...snap(),notifications:',"return {...snap(),localControls:!G.isInfiniteResourceMode()&&s.fuel<5?[{id:'walkfuel',label:'연료 구하기',enabled:true}]:[],notifications:")
 .replace("case 'trade':act('trade'","case 'walkfuel':act('walkfuel',()=>{if(!S().driving&&S().at&&!G.isInfiniteResourceMode()&&S().fuel<5){G.openRescue('nofuel','crisis_nofuel');return true;}return false;},{observation:obs});break;\n        case 'trade':act('trade'");
}
module.exports={apply,enabled};
