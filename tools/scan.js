#!/usr/bin/env node
/* 정합성 스캐너 — D 전체를 로드해 참조를 전수 검사한다.
 * 사용: node tools/scan.js   (레포 루트/어디서든)
 * 검사: 이벤트 id 중복 · 노드/동료/아이템/플래그 참조 · 고아 노드 · 중복 도로 · nodeBio 커버리지
 */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

const D = new Function(read('03-data.js') + '\nreturn D;')();
const engine = read('04-engine.js');
const dataSrc = read('03-data.js');

let errs = [], warns = [];
const err = (m) => errs.push(m);
const warn = (m) => warns.push(m);

/* ── 수집 ── */
const nodeIds = new Set(Object.keys(D.nodes));
const compIds = new Set(Object.keys(D.comps));
const npcIds = new Set(Object.keys(D.npcs));
const allEvents = [...D.events];
if (D.bridgeEvent) allEvents.push(D.bridgeEvent);
if (D.gateEvent) allEvents.push(D.gateEvent);

// 퍼크 id 수집 (D.comps[].perks + 스토리 퍼크)
const perkIds = new Set();
for (const c of Object.values(D.comps)) {
  for (const lv of Object.values(c.perks || {}))
    (Array.isArray(lv) ? lv : [lv]).forEach(p => p && p.id && perkIds.add(p.id));
}

// 플래그 세터: fx.flag / fx.flagCount (이벤트 전체) + 엔진의 S.flags.xxx= / S.flags['xxx']=
const flagSetters = new Set();
const walkFx = (fx) => { if (!fx) return;
  if (fx.flag) flagSetters.add(fx.flag);
  if (fx.flagCount) flagSetters.add(fx.flagCount);
};
const walkEvent = (ev, cb) => (ev.choices || []).forEach(c => (c.out || []).forEach(o => cb(o.fx)));
allEvents.forEach(ev => walkEvent(ev, walkFx));
for (const m of engine.matchAll(/S\.flags[.\[]['"]?([A-Za-z0-9_]+)['"]?\]?\s*=(?!=)/g)) flagSetters.add(m[1]);
for (const m of engine.matchAll(/flag:\s*'([A-Za-z0-9_]+)'/g)) flagSetters.add(m[1]);

// 아이템 소스: fx.item 양수 + 제작 out + 거래 + questItems
const itemSources = new Set(D.questItems || []);
allEvents.forEach(ev => walkEvent(ev, fx => { if (fx && fx.item) for (const k in fx.item) if (fx.item[k] > 0) itemSources.add(k); }));
(D.crafts || []).forEach(c => { for (const k in (c.out || {})) itemSources.add(k); });
for (const stl of Object.values(D.stls || {})) (stl.trade || []).forEach(r => { const k = r[1] || ''; if (k.startsWith('item')) itemSources.add(k.slice(4)); });
for (const m of engine.matchAll(/S\.items\['([^']+)'\]/g)) itemSources.add(m[1]);
['부품','의약품','탄약'].forEach(i => itemSources.add(i));

/* ── 이벤트 검사 ── */
const ids = allEvents.map(e => e.id);
ids.filter((x, i) => ids.indexOf(x) !== i).forEach(d => err(`이벤트 id 중복: ${d}`));

for (const ev of allEvents) {
  const at = `[${ev.id}]`;
  if (!ev.title) err(`${at} title 없음`);
  if (!ev.choices || !ev.choices.length) err(`${at} choices 없음`);
  (ev.nearNode || []).forEach(n => { if (!nodeIds.has(n)) err(`${at} nearNode 미존재: ${n}`); });
  if (ev.needsComp && !compIds.has(ev.needsComp)) err(`${at} needsComp 미존재: ${ev.needsComp}`);
  if (ev.noComp && !compIds.has(ev.noComp)) err(`${at} noComp 미존재: ${ev.noComp}`);
  if (ev.needFlag && !flagSetters.has(ev.needFlag)) err(`${at} needFlag 세터 없음: ${ev.needFlag}`);
  if (ev.needFlagMin && !flagSetters.has(ev.needFlagMin[0])) err(`${at} needFlagMin 세터 없음: ${ev.needFlagMin[0]}`);
  if (ev.needWx && !D.wx[ev.needWx]) err(`${at} needWx 미존재: ${ev.needWx}`);
  if (ev.hiddenTarget && ev.hiddenTarget !== 'any' && !nodeIds.has(ev.hiddenTarget)) err(`${at} hiddenTarget 미존재: ${ev.hiddenTarget}`);
  if (ev.region) ev.region.forEach(r => { if (!['south','mid','north'].includes(r)) err(`${at} region 미존재: ${r}`); });
  for (const ch of ev.choices || []) {
    if (ch.req) {
      if (ch.req.comp && !compIds.has(ch.req.comp)) err(`${at} req.comp 미존재: ${ch.req.comp}`);
      if (ch.req.perk && !perkIds.has(ch.req.perk)) err(`${at} req.perk 미존재: ${ch.req.perk}`);
      if (ch.req.flag && !flagSetters.has(ch.req.flag)) err(`${at} req.flag 세터 없음: ${ch.req.flag}`);
      if (ch.req.flagMin && !flagSetters.has(ch.req.flagMin[0])) err(`${at} req.flagMin 세터 없음: ${ch.req.flagMin[0]}`);
      if (ch.req.item && !itemSources.has(ch.req.item)) err(`${at} req.item 입수처 없음: ${ch.req.item}`);
      if (ch.req.item2 && !itemSources.has(ch.req.item2)) err(`${at} req.item2 입수처 없음: ${ch.req.item2}`);
    }
    if (!ch.out || !ch.out.length) { err(`${at} "${ch.label}" out 없음`); continue; }
    for (const o of ch.out) {
      const fx = o.fx; if (!fx) continue;
      if (fx.reveal && fx.reveal !== 'any' && !nodeIds.has(fx.reveal)) err(`${at} fx.reveal 미존재: ${fx.reveal}`);
      if (fx.goto && !nodeIds.has(fx.goto)) err(`${at} fx.goto 미존재: ${fx.goto}`);
      if (fx.recruit && !compIds.has(fx.recruit)) err(`${at} fx.recruit 미존재: ${fx.recruit}`);
      if (fx.mood) for (const c in fx.mood) if (!compIds.has(c)) err(`${at} fx.mood 미존재 동료: ${c}`);
      if (fx.item) for (const k in fx.item) if (fx.item[k] < 0 && !itemSources.has(k)) warn(`${at} fx.item 소비만 존재: ${k}`);
    }
  }
}

/* ── 잡담 검사 ── */
for (const b of D.banter || []) {
  const at = `[banter "${(b.t || '').slice(0, 18)}…"]`;
  const nd = b.need || {};
  if (nd.comp && !compIds.has(nd.comp)) err(`${at} need.comp 미존재: ${nd.comp}`);
  if (nd.comp2 && !compIds.has(nd.comp2)) err(`${at} need.comp2 미존재: ${nd.comp2}`);
  if (nd.flag && !flagSetters.has(nd.flag)) err(`${at} need.flag 세터 없음: ${nd.flag}`);
  if (nd.wx && !D.wx[nd.wx]) err(`${at} need.wx 미존재: ${nd.wx}`);
  if (b.who !== '나' && b.who !== 'sys' && !compIds.has(b.who)) err(`${at} who 미존재: ${b.who}`);
}

/* ── 지도 검사 ── */
const seen = new Set();
for (const [a, b] of D.edges.map(e => [e[0], e[1]])) {
  if (!nodeIds.has(a)) err(`edge 미존재 노드: ${a}`);
  if (!nodeIds.has(b)) err(`edge 미존재 노드: ${b}`);
  const key = [a, b].sort().join('~');
  if (seen.has(key)) err(`중복 도로: ${key}`);
  seen.add(key);
}
const connected = new Set();
for (const [a, b] of D.edges.map(e => [e[0], e[1]])) { connected.add(a); connected.add(b); }
for (const n of nodeIds) if (!connected.has(n)) err(`고아 노드(도로 없음): ${n}`);
for (const n of nodeIds) if (!D.nodeBio[n]) warn(`nodeBio 누락: ${n} (기본 바이옴 적용)`);
/* newGame이 비히든 전 노드를 공개하므로 startKnown은 존재 검사만 */
(D.startKnown || []).forEach(n => { if (!nodeIds.has(n)) err(`startKnown 미존재: ${n}`); });
for (const [id, stl] of Object.entries(D.stls || {})) {
  if (!nodeIds.has(id)) err(`stl 미존재 노드: ${id}`);
  (stl.npcs || []).forEach(n => { if (!npcIds.has(n)) err(`stl[${id}] npc 미존재: ${n}`); });
}
(Object.values(D.compWhere || {})).forEach(() => {});
for (const [cid] of Object.entries(D.compWhere || {})) if (!compIds.has(cid)) err(`compWhere 미존재 동료: ${cid}`);

/* ── 리포트 ── */
const types = {}; D.events.forEach(e => types[e.type] = (types[e.type] || 0) + 1);
console.log(`이벤트 ${D.events.length}종 ${JSON.stringify(types)}`);
console.log(`노드 ${nodeIds.size} · 도로 ${D.edges.length} · 정착지 ${Object.keys(D.stls).length} · NPC ${npcIds.size} · 퍼크 ${perkIds.size}`);
warns.forEach(w => console.log('⚠️ ' + w));
if (errs.length) { errs.forEach(e => console.log('❌ ' + e)); console.log(`\n에러 ${errs.length}건`); process.exit(1); }
console.log(`✅ 참조 에러 0건 (경고 ${warns.length}건)`);
