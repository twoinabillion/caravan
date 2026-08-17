#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'src/03-data.js'), 'utf8');
const D = new Function(`${source}\nreturn D;`)();
const outputDir = __dirname;

const placeTerms = [
  '시장','장터','역 앞','성곽','정문','병원','진료소','약국','기지국','관제센터','중계소','통신국',
  '도서관','학교','교회','성당','공장','공단','폐차장','카센터','창고','차고','지하차도','터널',
  '교량','다리','고가','댐','수문','부두','항구','등대','초소','검문소','경비탑','송전탑','철탑',
  '발전소','변전소','주유소','휴게소','모텔','아파트','백화점','마트','식당','빵집','좌판','훈련소',
  '경기장','농장','비닐하우스','온실','저수지','호수','광장','골목','마을','정착지','캠프','돔',
  '벙커','기지','연구소','관측소','케이블카','플랫폼','선착장','양조장','덕장','목장','박물관',
  '사찰','절 앞','무덤','묘지','폐역','재활용','극장','포구','방파제','계곡','능선','고갯마루'
];
const roadTerms = [
  '갓길','도로','고속도로','국도','산길','비포장길','교차로','육교','분기점','차선','길목','커브',
  '헤드라이트','앞차','뒤차','주행 중','길가','도로변','고개를 넘','차를 세우','차가 멈'
];
const continuationTerms = ['돌아가','되돌아','다음 정차','도착한 뒤','도착하면','계속 간','남은 거리','다시 찾아'];
const nodeNames = Object.values(D.nodes || {}).map(node => node.name).filter(Boolean);

function textOf(value) {
  if (typeof value === 'function') return String(value);
  return String(value || '');
}

function introText(event) {
  return `${event.title || ''}\n${textOf(event.text)}`;
}

function fullText(event) {
  const chunks = [introText(event)];
  for (const choice of event.choices || []) {
    chunks.push(choice.label || '');
    for (const outcome of choice.out || []) chunks.push(textOf(outcome.text));
  }
  return chunks.join('\n');
}

function effects(event) {
  const result = {goto:[], reveal:[], chain:[], startRecruit:[], recruitRoad:[], recruitReady:[]};
  for (const choice of event.choices || []) for (const outcome of choice.out || []) {
    const fx = outcome.fx || {};
    for (const key of Object.keys(result)) if (fx[key]) result[key].push(fx[key]);
  }
  for (const key of Object.keys(result)) result[key] = [...new Set(result[key])];
  return result;
}

function delivery(event) {
  if (event.locEvent) return 'node-arrival';
  if (event.fixed) return 'fixed-sequence';
  if (event.noPool || event.w === 0) return 'scripted';
  if (event.nearNode) return 'endpoint-gated-road-pool';
  if (event.region) return 'regional-road-pool';
  return 'global-road-pool';
}

function prefixGroup(id) {
  if (id.startsWith('lc_')) return 'local-culture';
  if (id.startsWith('near_')) return 'regional-landmark';
  if (id.startsWith('cell_')) return 'resistance-cell';
  if (id.startsWith('npc_')) return 'settlement-npc-followup';
  if (id.startsWith('ev_')) return 'special-node-scene';
  if (['meet_bus','meet_scrapyard','meet_hitchhiker','jy_recruit','es_recruit','kw_recruit'].includes(id)) return 'companion-first-meet';
  return 'other';
}

const rows = D.events.map(event => {
  const intro = introText(event);
  const all = fullText(event);
  const placeHits = placeTerms.filter(term => intro.includes(term));
  const roadHits = roadTerms.filter(term => intro.includes(term));
  const continuationHits = continuationTerms.filter(term => all.includes(term));
  const namedPlaceHits = nodeNames.filter(name => intro.includes(name));
  const eventDelivery = delivery(event);
  const dedicatedScene = Boolean(
    event.scene || (event.scenes && event.scenes.length) ||
    (D.eventScenes && D.eventScenes[event.id]) ||
    (D.eventTurnScenes && D.eventTurnScenes[event.id])
  );
  let riskScore = 0;
  const reasons = [];
  const pooled = eventDelivery.endsWith('road-pool');
  if (eventDelivery === 'endpoint-gated-road-pool') {
    riskScore += 3;
    reasons.push('출발지·도착지 이름만 맞으면 주행 중 임의 슬롯에서 발생');
  }
  if (pooled && placeHits.length) {
    riskScore += Math.min(4, 1 + placeHits.length);
    reasons.push(`고정 장소 표현: ${placeHits.slice(0,4).join(', ')}`);
  }
  if (pooled && namedPlaceHits.length) {
    riskScore += 3;
    reasons.push(`도시·노드 이름이 본문에 직접 등장: ${namedPlaceHits.slice(0,3).join(', ')}`);
  }
  if (event.recruitStart) {
    riskScore += 4;
    reasons.push(`동료 ${event.recruitStart}의 첫 만남을 시작`);
  }
  if (event.priority) {
    riskScore += 2;
    reasons.push('일반 사건보다 우선 발동');
  }
  if (pooled && continuationHits.length) {
    riskScore += 1;
    reasons.push(`장소 연속성 문구: ${continuationHits.slice(0,3).join(', ')}`);
  }
  if (event.type === '대화') riskScore = Math.max(0, riskScore - 4);
  return {
    id:event.id,title:event.title,type:event.type,delivery:eventDelivery,group:prefixGroup(event.id),
    weight:event.w,priority:event.priority || 0,region:event.region || [],nearNode:event.nearNode || [],
    locEvent:event.locEvent || null,recruitStart:event.recruitStart || null,
    dedicatedScene,placeHits,roadHits,namedPlaceHits,continuationHits,effects:effects(event),riskScore,reasons,
    intro:textOf(event.text).replace(/\s+/g, ' ').slice(0, 320)
  };
});

const by = (key) => rows.reduce((acc,row) => {
  const value = row[key] || 'none';
  acc[value] = (acc[value] || 0) + 1;
  return acc;
}, {});
const endpoint = rows.filter(row => row.delivery === 'endpoint-gated-road-pool');
const locationPooled = rows.filter(row =>
  ['endpoint-gated-road-pool','regional-road-pool','global-road-pool'].includes(row.delivery) &&
  row.type !== '대화' && (row.placeHits.length || row.namedPlaceHits.length)
);

const recruitment = Object.entries(D.recruitQuests || {}).map(([id,quest]) => {
  const start = rows.find(row => row.recruitStart === id);
  const task = rows.find(row => row.id === quest.task);
  const follow = rows.find(row => row.id === quest.follow);
  const join = rows.find(row => row.id === quest.join);
  const backtrackDirections=[];
  if (start && start.nearNode.length) for (const edge of D.edges || []) {
    const [a,b] = edge;
    for (const [from,to] of [[a,b],[b,a]]) {
      if (!start.nearNode.includes(from) && !start.nearNode.includes(to)) continue;
      const target=[to,from].find(node=>quest.targets.includes(node)) || quest.targets[0];
      if (target === from && to !== target) backtrackDirections.push({from,to,target});
    }
  }
  return {
    id,name:quest.name,startEvent:start && start.id,startTitle:start && start.title,
    startDelivery:start && start.delivery,startNearNode:start && start.nearNode,
    arrivalTargets:quest.targets,taskEvent:quest.task,taskTitle:task && task.title,
    taskDelivery:task && task.delivery,followEvent:quest.follow,followDelivery:follow && follow.delivery,
    joinEvent:quest.join,joinDelivery:join && join.delivery,backtrackDirections
  };
});

const summary = {
  totalEvents:rows.length,
  byDelivery:by('delivery'),
  byType:by('type'),
  endpointGatedCount:endpoint.length,
  endpointGroups:endpoint.reduce((acc,row)=>{ acc[row.group]=(acc[row.group]||0)+1; return acc; },{}),
  pooledEventsWithPlaceLanguage:locationPooled.length,
  recruitFlows:recruitment.length,
  recruitBacktrackDirections:recruitment.reduce((sum,flow)=>sum+flow.backtrackDirections.length,0),
  dedicatedSceneEvents:rows.filter(row=>row.dedicatedScene).length,
  endpointDedicatedScenes:endpoint.filter(row=>row.dedicatedScene).length,
  endpointGenericScenes:endpoint.filter(row=>!row.dedicatedScene).length,
  nodeCount:Object.keys(D.nodes || {}).length,
  edgeCount:(D.edges || []).length,
  settlementCount:Object.keys(D.stls || {}).length
};

const payload = {
  generatedAt:new Date().toISOString(),summary,recruitment,
  endpointGated:endpoint.sort((a,b)=>b.riskScore-a.riskScore || a.id.localeCompare(b.id)),
  highRisk:rows.filter(row=>row.riskScore >= 7).sort((a,b)=>b.riskScore-a.riskScore || a.id.localeCompare(b.id)),
  locationPooled:locationPooled.sort((a,b)=>b.riskScore-a.riskScore || a.id.localeCompare(b.id)),
  rows
};

fs.writeFileSync(path.join(outputDir, 'inventory.json'), JSON.stringify(payload, null, 2));
fs.writeFileSync(path.join(outputDir, 'endpoint-gated.tsv'), [
  ['id','title','group','nearNode','riskScore','intro'].join('\t'),
  ...payload.endpointGated.map(row => [row.id,row.title,row.group,row.nearNode.join(','),row.riskScore,row.intro].join('\t'))
].join('\n'));
console.log(JSON.stringify(summary, null, 2));
