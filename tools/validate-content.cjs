#!/usr/bin/env node
'use strict';

/*
 * 실행 전에 이벤트·영입·지도·장면 참조를 전수 검사한다.
 * 브라우저를 띄우지 않아도 끊긴 체인, 없는 인물·노드·이미지 키,
 * 중복 ID, 무한 파밍이 되는 정착지 행동을 빌드 전에 막는다.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({console});
for (const file of ['src/03-data.js', 'src/03f-npc-portraits.js', 'src/03g-scenes.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, context, {filename:file});
}
const D = vm.runInContext('D', context);
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const need = (ok, where, message) => { if (!ok) fail(where, message); };
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

const extraEvents = [D.seoulOpenEvent, D.gateEvent, D.bridgeEvent, ...(D.seoulStops || [])].filter(Boolean);
const events = [...D.events, ...extraEvents];
const eventById = new Map();
for (const event of events) {
  if (!event || !event.id) { fail('events', 'ID가 없는 이벤트'); continue; }
  if (eventById.has(event.id)) fail(event.id, '중복 이벤트 ID');
  eventById.set(event.id, event);
}

/* 장소 사건은 근처 도시 이름만 달아 둔 채 도로 풀에 섞지 않는다. 모든 구형
   nearNode가 명시적 위치 계약으로 이관됐고, waypoint가 실제 인접 구간인지 검사한다. */
const locationKinds = new Set(['node', 'waypoint', 'road', 'local']);
const locationEdgeKeys = new Set((D.edges || []).map(([a,b]) => [a,b].sort().join('|')));
for (const event of D.events || []) {
  if (event.nearNode) need(!!(D.eventLocations && D.eventLocations[event.id]),
    `eventLocation:${event.id}`, 'nearNode 사건에 위치 계약이 없음');
}
for (const [id, location] of Object.entries(D.eventLocations || {})) {
  const where=`eventLocation:${id}`;
  need(eventById.has(id), where, '연결된 이벤트가 없음');
  need(isObject(location) && locationKinds.has(location.kind), where, `잘못된 위치 종류 ${location && location.kind}`);
  if (!isObject(location)) continue;
  if (location.kind === 'node') {
    need(Array.isArray(location.nodes) && location.nodes.length > 0, where, 'node 목록이 비었음');
    for (const node of location.nodes || []) need(!!D.nodes[node], where, `없는 장소 ${node}`);
  }
  if (location.kind === 'waypoint') {
    need(Number.isFinite(location.progress) && location.progress > 0 && location.progress < 1,
      where, '경유 진행률은 0과 1 사이여야 함');
    need(Array.isArray(location.routes) && location.routes.length > 0, where, '경유 노선이 비었음');
    for (const route of location.routes || []) {
      need(Array.isArray(route) && route.length === 2, where, '경유 노선 형식이 잘못됨');
      if (!Array.isArray(route) || route.length !== 2) continue;
      need(!!D.nodes[route[0]] && !!D.nodes[route[1]], where, `없는 노선 장소 ${route.join('→')}`);
      need(locationEdgeKeys.has([...route].sort().join('|')), where, `실제 인접 길이 아닌 경유 노선 ${route.join('→')}`);
    }
  }
}

const compIds = new Set(Object.keys(D.comps || {}));
const npcIds = new Set(Object.keys(D.npcs || {}));
const knowledgeIds = new Set(Object.keys(D.knowledge || {}));
for (const id of npcIds) {
  need(typeof D.portraits[id] === 'string' && D.portraits[id].trim(),
    `portrait:${id}`, '이름 있는 정착지 인물의 얼굴 초상이 없음');
}
const speakerIds = new Set([
  ...compIds, ...npcIds, ...Object.keys(D.portraits || {}),
  'me', '나', 'sys', 'record', 'cheollian', 'radio', 'unknown',
  'passer_man', 'passer_woman', 'passer_elder', 'passer_child',
  'passer_merchant', 'passer_guard', 'passer_refugee', 'passer_worker', 'passer_medic'
]);
const validateSpeaker = (speaker, where) => {
  const id = typeof speaker === 'string' ? speaker : speaker && speaker.who;
  need(typeof id === 'string' && speakerIds.has(id), where, `없는 화자 ${id || String(speaker)}`);
  if (isObject(speaker) && speaker.name !== undefined)
    need(typeof speaker.name === 'string' && speaker.name.trim(), where, '화자 표시 이름이 비었음');
};
const perkIds = new Set();
for (const comp of Object.values(D.comps || {})) {
  for (const level of [1, 2]) for (const perk of comp.perks[level] || []) perkIds.add(perk.id);
  if (comp.perks[3]) perkIds.add(comp.perks[3].id);
}
for (const id of compIds) {
  const voice=D.companionVoices&&D.companionVoices[id];
  need(isObject(voice), `companionVoice:${id}`, '목소리 시트가 없음');
  if (!isObject(voice)) continue;
  for (const field of ['vocabulary','rhythm','humor','avoidance','silence'])
    need(typeof voice[field] === 'string' && voice[field].trim(), `companionVoice:${id}`, `${field} 항목이 없음`);
  need(Array.isArray(voice.forbidden) && voice.forbidden.length >= 3,
    `companionVoice:${id}`, '금지 범용 표현이 세 개 미만');
}

function validateReq(req, where) {
  if (!req) return;
  need(isObject(req), where, '선택 조건이 객체가 아님');
  if (!isObject(req)) return;
  for (const key of ['comp', 'healthyComp', 'trustComp'])
    if (req[key]) need(compIds.has(req[key]), where, `없는 동료 참조 ${req[key]}`);
  if (req.knowledge) {
    need(Array.isArray(req.knowledge) && req.knowledge.length === 2, where, 'knowledge 조건 형식이 잘못됨');
    if (Array.isArray(req.knowledge)) {
      need(knowledgeIds.has(req.knowledge[0]), where, `없는 지식 ${req.knowledge[0]}`);
      need([1, 2].includes(req.knowledge[1]), where, 'knowledge 단계는 1 또는 2여야 함');
    }
  }
  if (req.perk) need(perkIds.has(req.perk), where, `없는 퍼크 참조 ${req.perk}`);
  if (req.up) need((D.upgrades || []).some(up => up.id === req.up), where, `없는 업그레이드 ${req.up}`);
  for (const key of ['scrap', 'fuel', 'water', 'food', 'party', 'stories', 'traces', 'itemQty'])
    if (req[key] !== undefined) need(Number.isFinite(req[key]) && req[key] >= 0, where, `${key} 조건이 잘못됨`);
}

function validateFx(fx, where) {
  if (!fx) return;
  need(isObject(fx), where, '효과 fx가 객체가 아님');
  if (!isObject(fx)) return;
  if (fx.chain) need(eventById.has(fx.chain), where, `끊긴 체인 ${fx.chain}`);
  if (fx.goto) need(!!D.nodes[fx.goto], where, `없는 이동 노드 ${fx.goto}`);
  if (fx.reveal && fx.reveal !== 'any') need(!!D.nodes[fx.reveal], where, `없는 발견 노드 ${fx.reveal}`);
  for (const key of ['startRecruit', 'recruitRoad', 'recruitReady', 'offerComp', 'recruit']) {
    if (!fx[key]) continue;
    need(compIds.has(fx[key]), where, `없는 동료 효과 ${key}:${fx[key]}`);
    need(!!D.recruitQuests[fx[key]], where, `없는 영입 의뢰 ${fx[key]}`);
  }
  if (fx.recruitChoice) {
    const valid = Object.values(D.recruitQuests || {}).some(q => q.approaches && q.approaches[fx.recruitChoice]);
    need(valid, where, `없는 영입 방식 ${fx.recruitChoice}`);
  }
  if (fx.knowledge) {
    const gains = Array.isArray(fx.knowledge[0]) ? fx.knowledge : [fx.knowledge];
    for (const gain of gains) {
      need(Array.isArray(gain) && knowledgeIds.has(gain[0]), where, `없는 지식 효과 ${gain && gain[0]}`);
      need(Array.isArray(gain) && [1, 2].includes(gain[1]), where, '지식 효과 단계는 1 또는 2여야 함');
    }
  }
  if (fx.relation) {
    need(isObject(fx.relation) && Array.isArray(fx.relation.between) && fx.relation.between.length === 2,
      where, '관계 효과 형식이 잘못됨');
    for (const id of (fx.relation && fx.relation.between) || [])
      need(compIds.has(id), where, `없는 관계 동료 ${id}`);
    need(Number.isFinite(fx.relation && fx.relation.amount) && fx.relation.amount !== 0,
      where, '관계 변화량이 0이거나 숫자가 아님');
  }
}

for (const event of events) {
  const where = `event:${event.id}`;
  need(typeof event.title === 'string' && event.title.trim(), where, '제목 없음');
  need(typeof event.text === 'string' || typeof event.text === 'function', where, '본문 없음');
  need(Array.isArray(event.choices) && event.choices.length, where, '선택지 없음');
  if (event.nearNode) for (const id of event.nearNode)
    need(!!D.nodes[id], where, `nearNode가 없는 장소 ${id}`);
  if (event.locEvent) need(!!D.nodes[event.locEvent], where, `locEvent가 없는 장소 ${event.locEvent}`);
  for (const key of ['needsComp', 'needsComp2', 'noComp'])
    if (event[key]) need(compIds.has(event[key]), where, `없는 동료 게이트 ${key}:${event[key]}`);
  if(event.needFlags!==undefined){
    need(Array.isArray(event.needFlags)&&event.needFlags.length>0, where, 'needFlags가 비었거나 배열이 아님');
    for(const flag of event.needFlags||[]) need(typeof flag==='string'&&flag.trim(), where, 'needFlags에 빈 플래그가 있음');
  }
  for (const key of ['needKnowledge', 'noKnowledge']) if (event[key]) {
    need(Array.isArray(event[key]) && knowledgeIds.has(event[key][0]), where, `없는 지식 게이트 ${event[key] && event[key][0]}`);
    need(Array.isArray(event[key]) && [1, 2].includes(event[key][1]), where, `${key} 단계는 1 또는 2여야 함`);
  }
  for (const key of ['maxVanPct', 'maxScrap', 'maxPartyMood'])
    if (event[key] !== undefined) need(Number.isFinite(event[key]) && event[key] >= 0, where, `${key} 게이트가 잘못됨`);
  for (const key of ['needsInjury', 'needsDriverInjury'])
    if (event[key] !== undefined) need(event[key] === 1, where, `${key} 게이트는 1이어야 함`);
  if (event.needsNpc) need(npcIds.has(event.needsNpc), where, `없는 NPC 게이트 ${event.needsNpc}`);
  (event.choices || []).forEach((choice, ci) => {
    const cwhere = `${where}.choice[${ci}]`;
    need(typeof choice.label === 'string' && choice.label.trim(), cwhere, '라벨 없음');
    validateReq(choice.req, cwhere);
    need(Array.isArray(choice.out) && choice.out.length, cwhere, '결과 없음');
    (choice.out || []).forEach((outcome, oi) => {
      const owhere = `${cwhere}.out[${oi}]`;
      need(typeof outcome.text === 'string' || typeof outcome.text === 'function', owhere, '결과 본문 없음');
      need(outcome.p === undefined || (Number.isFinite(outcome.p) && outcome.p > 0), owhere, '확률 p가 0 이하이거나 숫자가 아님');
      validateFx(outcome.fx, owhere);
      for (const speaker of outcome.turnSpeakers || []) validateSpeaker(speaker, owhere);
    });
  });
  for (const speaker of event.turnSpeakers || []) validateSpeaker(speaker, where);
}

let choiceMemoryCount=0;
for (const [eventId, memories] of Object.entries(D.choiceMemories || {})) {
  const event=eventById.get(eventId), where=`choiceMemory:${eventId}`;
  need(!!event, where, '이벤트가 없음');
  need(Array.isArray(memories), where, '선택 기억 목록이 배열이 아님');
  const ids=new Set();
  for (const [index, memory] of (memories || []).entries()) {
    if (!memory) continue;
    choiceMemoryCount++;
    need(!!(event && event.choices[index]), `${where}[${index}]`, '해당 선택지가 없음');
    need(typeof memory.id === 'string' && memory.id.trim() && !ids.has(memory.id), `${where}[${index}]`, '없거나 중복된 기억 ID');
    ids.add(memory.id);
    need(typeof memory.summary === 'string' && memory.summary.trim(), `${where}[${index}]`, '기억 요약 없음');
    need(Number.isFinite(memory.afterKm) && memory.afterKm > 0, `${where}[${index}]`, '후속 주행거리 없음');
    need(Array.isArray(memory.lines) && memory.lines.length, `${where}[${index}]`, '후속 대화 없음');
    for (const line of memory.lines || []) {
      need(Array.isArray(line) && line.length === 2 && typeof line[1] === 'string' && line[1].trim(), `${where}[${index}]`, '후속 대사 형식 오류');
      if (Array.isArray(line)) validateSpeaker(line[0], `${where}[${index}]`);
    }
  }
}
need(choiceMemoryCount===17, 'choiceMemory', `핵심 선택 기억은 정확히 17개여야 함 (현재 ${choiceMemoryCount})`);

for (const [id, def] of Object.entries(D.knowledge || {})) {
  const where=`knowledge:${id}`;
  need(typeof def.label === 'string' && def.label.trim(), where, '표시 이름 없음');
  need(def.initial === undefined || [0, 1, 2].includes(def.initial), where, '초기 단계 오류');
  need(typeof def.known === 'string' && def.known.trim(), where, '확인된 사실 문장 없음');
  for (const rule of def.flags || []) {
    need(Array.isArray(rule) && typeof rule[0] === 'string' && [1, 2].includes(rule[1]), where, '플래그 동기화 규칙 오류');
  }
}

for (const [id, script] of Object.entries(D.eventTurnScripts || {})) {
  const event = eventById.get(id);
  need(!!event, `turnScript:${id}`, '이벤트가 없음');
  if (!event) continue;
  for (const speaker of script.text || []) validateSpeaker(speaker, `turnScript:${id}.text`);
  for (const [route, speakers] of Object.entries(script.choices || {})) {
    const [ci, oi] = route.split('.').map(Number);
    need(!!(event.choices[ci] && event.choices[ci].out[oi]), `turnScript:${id}.${route}`, '결과 경로가 없음');
    for (const speaker of speakers) validateSpeaker(speaker, `turnScript:${id}.${route}`);
  }
}

for (const id of Object.keys(D.nodes || {})) {
  const scene=D.nodeScenes&&D.nodeScenes[id];
  need(!!scene, `nodeScene:${id}`, '도착 장면 연결이 없음');
  if(scene) need(!!D.scenes[scene], `nodeScene:${id}`, `없는 장면 ${scene}`);
}
for (const [id, scene] of Object.entries(D.arrivalScenes || {})) {
  need(!!D.nodes[id], `arrivalScene:${id}`, '없는 도착지');
  need(!!D.scenes[scene], `arrivalScene:${id}`, `없는 세로 도착 장면 ${scene}`);
}
{
  const expected=[...new Set(Object.values(D.stls||{}).flatMap(stl=>stl.npcs||[]))];
  const canon=D.settlementPortraitCanon||[];
  const missing=expected.filter(id=>!canon.includes(id));
  const legacy=canon.filter(id=>(D.legacyIllustratedPortraits||[]).includes(id));
  const noPortrait=canon.filter(id=>!D.portraits[id]);
  need(!missing.length, 'settlementPortraitCanon', `상주 주민 누락 ${missing.join(', ')}`);
  need(!legacy.length, 'settlementPortraitCanon', `삽화형 주민 잔존 ${legacy.join(', ')}`);
  need(!noPortrait.length, 'settlementPortraitCanon', `초상 누락 ${noPortrait.join(', ')}`);
}
for (const [id, scene] of Object.entries(D.eventScenes || {}))
  need(!!D.scenes[scene], `eventScene:${id}`, `없는 장면 ${scene}`);
const criticalNarrativeScenes={
  resist_reveal:'resistance-contact',
  cell_sea_meet:'sea-captain-contact',
  gw_gangneung:'gangneung-hospital-build'
};
for(const [id,scene] of Object.entries(criticalNarrativeScenes))
  need(D.eventScenes&&D.eventScenes[id]===scene, `narrativeScene:${id}`, `전용 장면 ${scene} 연결이 없음`);
{
  const contact=eventById.get('resist_reveal');
  const required=['library_met','postman_met','mapmaker_met'];
  for(const flag of required) need(contact&&Array.isArray(contact.needFlags)&&contact.needFlags.includes(flag),
    'event:resist_reveal', `만남 선행 조건 ${flag} 누락`);
}
for (const [id, turns] of Object.entries(D.eventTurnScenes || {})) {
  need(eventById.has(id), `turnScenes:${id}`, '이벤트가 없음');
  for (const scene of Object.values(turns)) need(!!D.scenes[scene], `turnScenes:${id}`, `없는 장면 ${scene}`);
}
for (const [id, stages] of Object.entries(D.eventTurnSceneStages || {})) {
  const turns=D.eventTurnScenes&&D.eventTurnScenes[id];
  need(Array.isArray(turns)&&turns.length, `turnSceneStages:${id}`, '연속 컷 목록이 없음');
  let prior=-1;
  for (const stage of stages || []) {
    need(Number.isInteger(stage.at)&&stage.at>=0&&stage.at>=prior, `turnSceneStages:${id}`, '장면 단계 순서 오류');
    need(!!D.scenes[stage.key], `turnSceneStages:${id}`, `없는 장면 ${stage.key}`);
    need(Array.isArray(turns)&&turns.includes(stage.key), `turnSceneStages:${id}`, `연속 컷에 없는 장면 ${stage.key}`);
    prior=stage.at;
  }
}
for (const [scene, description] of Object.entries(D.sceneDescriptions || {})) {
  need(!!D.scenes[scene], `sceneDescription:${scene}`, '없는 장면의 설명');
  need(typeof description==='string'&&description.trim().length>=8, `sceneDescription:${scene}`, '행동 설명이 너무 짧음');
}
const requiredRecruitCuts={
  meet_scrapyard:['recruit-minji-welding'],
  meet_bus:['recruit-parkss-clinic-market-v2'],
  meet_hitchhiker:['recruit-leo-daein-market-v2'],
  jy_recruit:['recruit-jaeyi-suspension-check'],
  es_recruit:['recruit-eunsu-rooftop','recruit-eunsu-sky-point'],
  kw_recruit:['recruit-kangwoo-pickpocket']
};
for (const [id, cuts] of Object.entries(requiredRecruitCuts)) {
  for (const scene of cuts) {
    need((D.eventTurnScenes[id]||[]).includes(scene), `recruitCuts:${id}`, `필수 행동 컷 누락 ${scene}`);
    need(!!(D.sceneDescriptions&&D.sceneDescriptions[scene]), `recruitCuts:${id}`, `행동 설명 누락 ${scene}`);
  }
}
for (const [id, choices] of Object.entries(D.eventChoiceScenes || {})) {
  const event = eventById.get(id);
  need(!!event, `choiceScenes:${id}`, '이벤트가 없음');
  for (const [index, value] of Object.entries(choices)) {
    if (event) need(!!event.choices[Number(index)], `choiceScenes:${id}.${index}`, '선택지가 없음');
    for (const scene of (Array.isArray(value) ? value : [value])) need(!!D.scenes[scene], `choiceScenes:${id}.${index}`, `없는 장면 ${scene}`);
  }
}

/* 전용 컷이 없는 대량 사건이 네 장짜리 generic 폴백으로 다시 몰리지 않도록
   대상·행동 기반 48장 사건군의 참조와 실제 도달 범위를 빌드 때마다 검사한다. */
const familyRules=D.eventSceneFamilyRules || [];
need(familyRules.length===48, 'eventSceneFamilies', `사건 장면군은 정확히 48개여야 함 (현재 ${familyRules.length})`);
const usedFamilies=new Map();
for (const [index, rule] of familyRules.entries()) {
  const where=`eventSceneFamily[${index}]`;
  need(typeof rule.scene==='string' && rule.scene.startsWith('event-'), where, `잘못된 장면 키 ${rule.scene}`);
  need(!!D.scenes[rule.scene], where, `없는 장면 ${rule.scene}`);
  need(!rule.match || (Object.prototype.toString.call(rule.match)==='[object RegExp]' && !rule.match.global), where, '정규식은 비전역 RegExp여야 함');
  need(!rule.types || (Array.isArray(rule.types) && rule.types.length), where, '타입 목록이 비었음');
}
let familyCandidates=0, familyMapped=0;
for (const event of D.events || []) {
  const hasDedicated=(D.eventTurnScenes&&D.eventTurnScenes[event.id]) || event.scenes || event.scene ||
    (D.eventScenes&&D.eventScenes[event.id]) || (event.locEvent&&D.nodeScenes&&D.nodeScenes[event.locEvent]);
  if(hasDedicated) continue;
  const type=(event.ai||event.type==='추적')?'추적':event.type;
  if(type==='스토리'||type==='대화') continue;
  familyCandidates++;
  const familyText=`${event.id||''} ${String(event.title||'').replace(/<[^>]*>/g,'')} ${type||''}`;
  const rule=familyRules.find(item=>(!item.types||item.types.includes(type))&&(!item.match||item.match.test(familyText)));
  if(rule){ familyMapped++; usedFamilies.set(rule.scene,(usedFamilies.get(rule.scene)||0)+1); }
  else fail(`eventSceneFamily:${event.id}`, `장면군에 매칭되지 않은 ${type} 사건`);
}
need(familyMapped===familyCandidates, 'eventSceneFamilies', `${familyCandidates-familyMapped}개 범용 사건이 장면군에 연결되지 않음`);
need(usedFamilies.size===48, 'eventSceneFamilies', `실제 쓰이지 않는 장면군 ${48-usedFamilies.size}개`);

for (const [id, quest] of Object.entries(D.recruitQuests || {})) {
  const where = `recruit:${id}`;
  need(compIds.has(id), where, '동료 정의가 없음');
  for (const target of quest.targets || []) need(!!D.nodes[target], where, `없는 대상 장소 ${target}`);
  for (const key of ['task', 'follow', 'join']) need(eventById.has(quest[key]), where, `없는 ${key} 이벤트 ${quest[key]}`);
  need(Object.keys(quest.approaches || {}).length >= 2, where, '해결 방식이 부족함');
  for (const [choice, approach] of Object.entries(quest.approaches || {})) {
    need(approach.label && approach.memory, `${where}.${choice}`, '라벨또는 기억 문구가 없음');
    if (approach.drive) need(approach.drive.title && approach.drive.desc && approach.drive.effect,
      `${where}.${choice}.drive`, '후속 주행 설명이 부족함');
  }
}

for (const [id, stl] of Object.entries(D.stls || {})) {
  const where = `settlement:${id}`;
  need(Object.values(D.nodes).some(node => node.stl === id), where, '연결된 지도 노드가 없음');
  for (const npc of stl.npcs || []) need(npcIds.has(npc), where, `없는 NPC ${npc}`);
  if (stl.recruit) need(compIds.has(stl.recruit), where, `없는 영입 동료 ${stl.recruit}`);
  if (!stl.field) continue;
  const ids = new Set();
  for (const action of stl.field.actions || []) {
    const awhere = `${where}.field.${action.id || '?'}`;
    need(action.id && !ids.has(action.id), awhere, '없거나 중복된 행동 ID'); ids.add(action.id);
    need(Boolean(action.daily) !== Boolean(action.once), awhere, 'daily와 once 중 하나만 필요');
    need(Number.isFinite(action.time) && action.time >= 15, awhere, '소요 시간은 15분 이상이어야 함');
    need(speakerIds.has(action.npc), awhere, `없는 현장 인물 ${action.npc}`);
    need(action.change && ['steam','light','record','order','water','route','air','shelter','watch','gate'].includes(action.change.visual), awhere, '현장 변화 시각 유형 없음·오류');
    need(action.change && typeof action.change.after === 'string' && action.change.after.trim(), awhere, '행동 뒤 남는 변화 문구 없음');
    validateReq(action.req, awhere); validateFx(action.fx, awhere);
    if (action.hidden) need(Number.isFinite(action.needDone) && action.needDone > 0, awhere, '숨은 행동에 needDone이 없음');
  }
}

const adjacency = new Map(Object.keys(D.nodes).map(id => [id, []]));
const edgeKeys = new Set();
for (const [from, to, km] of D.edges || []) {
  need(!!D.nodes[from] && !!D.nodes[to], 'graph', `없는 노드를 잇는 길 ${from}-${to}`);
  need(Number.isFinite(km) && km > 0, 'graph', `잘못된 거리 ${from}-${to}:${km}`);
  const key = [from, to].sort().join(':'); need(!edgeKeys.has(key), 'graph', `중복 길 ${key}`); edgeKeys.add(key);
  if (adjacency.has(from) && adjacency.has(to)) { adjacency.get(from).push(to); adjacency.get(to).push(from); }
}
const reached = new Set(['busan']), queue = ['busan'];
while (queue.length) for (const next of adjacency.get(queue.shift()) || []) if (!reached.has(next)) { reached.add(next); queue.push(next); }
need(reached.has('seoul'), 'graph', '부산에서 서울로 이어지지 않음');

for (const [index, page] of (D.intro || []).entries()) {
  const where = `intro[${index}]`;
  need(!!D.scenes[page.scene], where, `없는 장면 ${page.scene}`);
  need(Array.isArray(page.beats) && page.beats.length, where, '화자 턴이 없음');
  for (const beat of page.beats || []) if (beat.who) need(speakerIds.has(beat.who), where, `없는 화자 ${beat.who}`);
}

if (errors.length) {
  console.error(`❌ 콘텐츠 참조 오류 ${errors.length}건`);
  for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
  if (errors.length > 80) console.error(`- …외 ${errors.length - 80}건`);
  process.exit(1);
}

const fieldCount = Object.values(D.stls || {}).filter(stl => stl.field).length;
console.log(`✅ 콘텐츠 참조 정상 · 이벤트 ${events.length}·노드 ${Object.keys(D.nodes).length}·장면 ${Object.keys(D.scenes).length}·사건군 ${usedFamilies.size}/${familyMapped}건·영입 ${Object.keys(D.recruitQuests).length}·현장탐색 ${fieldCount}`);
