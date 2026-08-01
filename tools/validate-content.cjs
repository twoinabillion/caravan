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

const compIds = new Set(Object.keys(D.comps || {}));
const npcIds = new Set(Object.keys(D.npcs || {}));
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

function validateReq(req, where) {
  if (!req) return;
  need(isObject(req), where, '선택 조건이 객체가 아님');
  if (!isObject(req)) return;
  for (const key of ['comp', 'healthyComp'])
    if (req[key]) need(compIds.has(req[key]), where, `없는 동료 참조 ${req[key]}`);
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

for (const [id, scene] of Object.entries(D.eventScenes || {}))
  need(!!D.scenes[scene], `eventScene:${id}`, `없는 장면 ${scene}`);
for (const [id, turns] of Object.entries(D.eventTurnScenes || {})) {
  need(eventById.has(id), `turnScenes:${id}`, '이벤트가 없음');
  for (const scene of Object.values(turns)) need(!!D.scenes[scene], `turnScenes:${id}`, `없는 장면 ${scene}`);
}
for (const [id, choices] of Object.entries(D.eventChoiceScenes || {})) {
  const event = eventById.get(id);
  need(!!event, `choiceScenes:${id}`, '이벤트가 없음');
  for (const [index, value] of Object.entries(choices)) {
    if (event) need(!!event.choices[Number(index)], `choiceScenes:${id}.${index}`, '선택지가 없음');
    for (const scene of (Array.isArray(value) ? value : [value])) need(!!D.scenes[scene], `choiceScenes:${id}.${index}`, `없는 장면 ${scene}`);
  }
}

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
console.log(`✅ 콘텐츠 참조 정상 · 이벤트 ${events.length}·노드 ${Object.keys(D.nodes).length}·장면 ${Object.keys(D.scenes).length}·영입 ${Object.keys(D.recruitQuests).length}·현장탐색 ${fieldCount}`);
