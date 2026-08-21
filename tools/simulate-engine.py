#!/usr/bin/env python3
"""실엔진 밸런스 시뮬레이션.

기존 simulate-journeys.py는 이벤트 층을 하드코딩 확률의 병렬 모델로 대체해
"게임의 모델"을 측정했다. 이 스크립트는 로드된 페이지의 실제 전역(G/S/D)을
직접 구동해 "게임 자체"를 측정한다 — G.newGame → G.startTravel → G.tick →
실제 이벤트 풀·선택 해석·위기·구제·시한까지 전부 진짜 코드가 돈다.

정책(policy)마다 자동 플레이어의 성향이 다르다:
  direct   보급을 최소화하고 최단 경로로 밀어붙인다
  prepared 정착지마다 보급하고 야영으로 피로를 관리한다
  explorer 탐색·정착지 일을 챙기며 느리게 간다
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / '서울까지400km.html'
DEFAULT_REPORT = ROOT / 'reports' / 'engine-simulation.json'

SIM_JS = r"""
({runs, baseSeed, policies, maxDays, profileOverride}) => {
  const results = [];
  // UI 부작용 차단: 시뮬은 상태만 돌린다 (모달/토스트/오디오는 no-op)
  const realModalOpen = UI.modalOpen;
  const noop = () => {};
  const stubs = ['toast','speak','playChat','playRadio','renderAll','renderHud','onDepart','clearSpeech'];
  const saved = {};
  for (const key of stubs) { saved[key] = UI[key]; UI[key] = noop; }
  UI.modalOpen = () => false;
  UI.onArrive = () => 0;
  const savedShowEvent = UI.showEvent;

  // 이벤트는 열리는 즉시 정책에 따라 선택 하나를 고르고 닫는다
  let pendingEvent = null;
  const seenEvents = [];
  UI.showEvent = (evd) => { pendingEvent = evd; if (evd && evd.id) seenEvents.push(evd.id);
    if (S && evd && evd.id) {
      (S._evTimes = S._evTimes || []).push(S.day * 1440 + S.min);
      /* 감독이 실제로 일하는지의 원자료: 이 사건이 무거운가 × 지금 국면이 무엇인가 */
      try { (S._evPhase = S._evPhase || []).push({p: S.director && S.director.phase,
        h: G.eventIsHeavy ? !!G.eventIsHeavy(evd) : false}); } catch (e) {}
    } };
  // 길 위 작업대는 정착지 밖에서 열린다 — UI 타이머 대신 플래그를 폴링해 소화한다
  let roadGarageHook = null;

  const choiceUsable = (choice) => {
    if (!choice || !choice.req) return true;
    const rq = G.reqOk(choice.req);
    return !rq || rq.ok !== false;
  };
  const resolveEvent = (policy) => {
    let guard = 0;
    while (pendingEvent && guard++ < 12) {
      const evd = pendingEvent; pendingEvent = null;
      const choices = (evd.choices || []).filter(choiceUsable);
      if (!choices.length) break;
      let choice;
      if (policy === 'direct') {
        // 시간을 가장 적게 쓰는 선택을 고른다
        choice = choices.reduce((best, c) => {
          const t = (c.out && c.out[0] && c.out[0].fx && c.out[0].fx.time) || 0;
          const bt = (best.out && best.out[0] && best.out[0].fx && best.out[0].fx.time) || 0;
          return t < bt ? c : best;
        }, choices[0]);
      } else if (policy === 'explorer') {
        choice = choices[choices.length - 1];
      } else if (policy === 'completionist') {
        // 완주형은 서사를 진전시키는 선택을 안다: 영입 시작·유대·기억·본편 플래그 우선
        const score = (c) => {
          const fx = (c.out && c.out[0] && c.out[0].fx) || {};
          let v = 0;
          if (fx.startRecruit) v += 100;
          if (fx.recruitChoice || fx.recruitReady || fx.recruitJoin) v += 100;
          if (fx.flag) v += 30;
          if (fx.bond || fx.bondAll) v += 20;
          if (fx.note) v += 3;
          if ((fx.pursuit || 0) > 0) v -= 60;   // 관측 5 = 기피 죽음 위험
          return v;
        };
        choice = choices.reduce((a, b) => score(b) > score(a) ? b : a, choices[0]);
      } else {
        choice = choices[Math.min(1, choices.length - 1)];
      }
      const out = G.pickOutcome(evd, choice);
      // 실제 UI 핸들러와 같은 순서 — 이걸 빼면 S.combat.history가 비어
      // 적응형 난이도(COMBAT_AUTO_ADJUST_*)가 꺼진 채로 밸런스를 재게 된다
      const meta = out && out.combatMeta || null;
      let entry = (out.fx && out.fx.combatEnd) ? G.rememberCombatChoice(evd, choice, meta) : null;
      G.applyFx(out.fx || {});
      /* offerComp는 UI 확인 다이얼로그를 거쳐 G.doRecruit로 이어진다 —
         봇은 자리가 있으면 태운다 (direct는 혼자 간다는 성향이라 제외) */
      if (out.fx && out.fx.offerComp && policy !== 'direct') {
        try { if (S.party.length < G.maxParty()) { G.doRecruit(out.fx.offerComp); trace('합류 ' + out.fx.offerComp); } else trace('자리없음 ' + out.fx.offerComp); } catch (e) {}
      }
      if (!entry) G.rememberCombatChoice(evd, choice, meta);
      if (G.afterChoice) { try { G.afterChoice(evd, choice, out); } catch (e) {} }
      if (out.fx && out.fx.chain) { const next = D.events.find(e => e.id === out.fx.chain); if (next) G.openEvent(next); }
    }
    pendingEvent = null;
  };

  for (let i = 0; i < runs; i++) {
    const policy = policies[i % policies.length];
    G.seedOverride = baseSeed + i * 7919;
    G.newGame('onroad', '시뮬', 'full', (typeof profileOverride!=='undefined'&&profileOverride)||undefined);
    G.seedOverride = undefined;
    /* 고철 수입/지출 계측 — 카탈로그가 도달 가능한지 판단하려면 유입을 알아야 한다 */
    S._scrapEarned = 0; S._scrapSpent = 0; S._blocked = {};
    let _lastScrap = S.scrap;
    const meterScrap = () => {
      const d = S.scrap - _lastScrap;
      if (d > 0) S._scrapEarned += d; else S._scrapSpent += -d;
      _lastScrap = S.scrap;
    };
    const buyUpgrades = () => {
      if (!cfg.upgrades) return;
      for (let k = 0; k < 6; k++) {
        const rank = u => {
          const i = cfg.wants.indexOf(u.id);
          return i < 0 ? 100 + u.cost.scrap : i;   // 원하는 것 먼저, 그 다음 싼 것
        };
        const buyable = (D.upgrades || [])
          .filter(u => !S.up[u.id] && G.canBuyUp(u.id).ok)
          .sort((a, b) => rank(a) - rank(b));
        const reserve = policy === 'completionist' ? 30 : 8;   // 긴 투어는 구제·보급 예비금이 생명줄
        if (!buyable.length || S.scrap < G.upScrapCost(buyable[0]) + reserve) {
          for (const u of (D.upgrades || [])) {
            if (S.up[u.id]) continue;
            const why = G.canBuyUp(u.id).why || (S.scrap < G.upScrapCost(u) + 8 ? '여유 부족' : '');
            if (why) S._blocked[why] = (S._blocked[why] || 0) + 1;
          }
          break;
        }
        if (!G.buyUpgrade(buyable[0].id)) break;
        meterScrap();
      }
    };
    let ended = '', guard = 0, lastMiss = null;
    seenEvents.length = 0;

    // 정책별 성향 — 실제 플레이어가 시간을 쓰는 방식의 근사
    const cfg = {
      /* wants = 빌드 취향. 이게 없으면 두 정책이 똑같이 '싼 것부터' 사고,
         "빌드가 분화하지 않는다"는 게임이 아니라 봇 탓이 된다. (2026-08-07) */
      direct:   {bundles:1, explore:0, upgrades:false, repairAt:0.35, campAt:88, fieldWork:false, wants:[]},
      prepared: {bundles:2, explore:1, upgrades:true,  repairAt:0.70, campAt:62, fieldWork:true,
                 wants:['tank1','tank2','collector','garden','kitchen','stove','fridge','bunk','awning','susp','armor']},
      explorer: {bundles:3, explore:2, upgrades:true,  repairAt:0.75, campAt:55, fieldWork:true,
                 wants:['scope','antenna','mudtires','winch','lightbar','bullbar','solar','snorkel','sidebox','armory','horn']},
      /* 완주형 — 네 기둥을 실제로 채우러 다닌다. 영입 목표가 서울 반대 방향이면
         BFS로 우회한다. 이 정책의 소요일이 곧 "다 챙기는 플레이"의 실측이다. */
      completionist: {bundles:3, explore:2, upgrades:true, repairAt:0.75, campAt:60, fieldWork:true,
                 wants:['bench','collector','garden','cabin','tank1','scope','antenna','winch','kitchen','bunk']},
    }[policy];

    /* 동료 영입 — 네 기둥의 '관계'는 영입 없이는 영영 0이다.
       엔진의 실제 진행 함수(G.openRecruitStep)를 그대로 부른다. */
    S._recruitTrace = [];
    S._poolLog = {};
    if (!G._fireWrapped) {
      G._fireWrapped = true;
      const origFire = G.fireDriveEvent;
      G.fireDriveEvent = () => {
        try {
          const pool = G.directEventPool(G.eligible());
          for (const e of pool) if (['resist_reveal','cell_sea_meet','cell_dome_meet','gp_envelope','postman_again'].includes(e.id))
            S._poolLog[e.id] = (S._poolLog[e.id] || 0) + 1;
          S._poolLog._calls = (S._poolLog._calls || 0) + 1;
        } catch (e) {}
        return origFire();
      };
    }
    const trace = (m) => { if (S._recruitTrace.length < 40) S._recruitTrace.push(`D${S.day} ${m}`); };
    const pushRecruit = () => {
      if (S.recruitQ) trace(`Q ${S.recruitQ.id}:${S.recruitQ.stage}@${S.at}→${S.recruitQ.target}`);
      let guard3 = 0;
      while (S.recruitQ && guard3++ < 4) {
        const before = JSON.stringify(S.recruitQ);
        let opened = false;
        try { opened = G.openRecruitStep(); } catch (e) { break; }
        if (opened) resolveEvent(policy);
        if (!opened || JSON.stringify(S.recruitQ) === before) break;
      }
    };
    const meetRecruitHere = () => {
      if (policy !== 'completionist' || S.recruitQ || S.party.length >= G.maxParty()) return false;
      const row = Object.entries(D.recruitQuests || {}).find(([id, def]) =>
        def.meetNode === S.at && !G.hasComp(id));
      if (!row || !G.openRecruitMeet(row[0])) return false;
      resolveEvent(policy);
      return true;
    };
    const completionTourDone = () => policy === 'completionist' &&
      (S.day >= Math.max(14, Math.floor(maxDays * .4)) || S.stats.events >= 80);

    const stayAlive = () => {
      // 어떤 정책이든 목마르면 물은 산다 (봇의 아둔함이 사망률로 잡히지 않게)
      const stl = S.at && D.nodes[S.at] && D.nodes[S.at].stl;
      if (!stl) return;
      let guard2 = 0;
      // 완주형은 우회가 길다. 아침·점심 배급과 다음 보급소까지의 여유를 함께 싣는다.
      const waterFloor = G.partySize() * (policy === 'completionist' ? 5 : 3) + 4;
      const foodFloor = G.partySize() * (policy === 'completionist' ? 4 : 2) + 2;
      while ((S.water <= waterFloor || S.food <= foodFloor) && guard2++ < 8) {
        const bundle = G.tradeBundle(stl);
        if (!bundle || !bundle.ok) break;
      }
      /* 묶음을 살 돈이 모자라도 낱개 물·식량은 살 수 있다. 실제 시장 UI의 같은
         거래를 사용해 최소 이동분부터 채우고, 돈이 없으면 그대로 실패하게 둔다. */
      const topUp = (key, floor) => {
        const index = (D.stls[stl].trade || []).findIndex(row => row[1] === key);
        let guard4 = 0;
        while (index >= 0 && S[key] < floor && guard4++ < 8) {
          const bought = G.trade(stl, index);
          if (!bought || !bought.ok) break;
        }
      };
      topUp('water', G.partySize() * 3 + 3);
      topUp('food', G.partySize() * 2 + 2);
    };

    while (!ended && S.day <= maxDays && guard++ < 4000) {
      if (S.at === 'seoul') {
        /* 서울 노드에 닿는 것은 완주가 아니다. G.seoulReady()가 false면 실엔진은
           관문 이벤트로 수원까지 되돌려보낸다(04-engine.js:2495). 그 상태를 완주로
           세면 '빈 장부로 서울 땅을 처음 밟은 날'을 완주 소요일로 착각하게 된다. */
        /* 일반 정책은 주행·보급 경제를 재므로 서울 노드 첫 도달에서 끝낸다.
           완주형만 실제 정착지 영입과 서사 사건을 밟아 네 기둥을 채운 뒤 들어온다. */
        if (policy === 'completionist' && !G.seoulReady() && !completionTourDone()) {
          /* 긴 우회 표본을 채우기 전에는 서울을 찍고 끝내지 않는다. */
          lastMiss = G.seoulMissing();
        } else {
          lastMiss = G.seoulReady() ? null : G.seoulMissing();
          ended = G.seoulReady() ? 'completed' : 'reached';
          break;
        }
      }

      if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) {
        const stl = D.nodes[S.at].stl;
        if (policy === 'completionist') {
          /* 오래 도는 플레이어는 탐색품을 시장 수요에 팔아 보급비를 만든다.
             sellToDemand의 식량 보호선과 지역별 일일 판매 제한을 그대로 쓴다. */
          for (let k = 0; k < 4; k++) {
            const sold = G.sellToDemand(stl);
            if (!sold || !sold.ok) break;
            meterScrap();
          }
        }
        for (let k = 0; k < cfg.bundles; k++) {
          if (policy === 'completionist') {
            const crew = G.partySize();
            if (S.water > crew * 4 + 4 && S.food > crew * 3 + 2) break;
          }
          if (!G.tradeBundle(stl).ok) break;
        }
        stayAlive();
        if (S.van < S.vanMax * cfg.repairAt) G.settlementRepair();
        // 업그레이드 구매 — 성장 축이 측정되도록 (싼 것부터)
        buyUpgrades();
        meetRecruitHere();
        pushRecruit();
        // 정착지 현장 일 — 시간을 쓰고 관계를 얻는다
        if (cfg.fieldWork && D.stls[stl] && D.stls[stl].field) {
          try {
            for (const entry of D.stls[stl].field.actions || []) {
              const action = G.stlFieldAction(stl, entry.id);
              const st = G.stlFieldStatus(stl, action);
              if (st && st.ok) { G.doStlFieldAction(stl, entry.id); resolveEvent(policy); }
            }
          } catch (e) {}
        }
      }
      // 탐색 — 정착지든 아니든 노드마다 살핀다 (폐허를 뒤지는 게 이 게임의 수입원이다)
      for (let e = 0; e < cfg.explore; e++) {
        try { if (!G.explore()) break; resolveEvent(policy); } catch (er) { break; }
      }
      if (S.ended) { ended = 'dead'; break; }

      pushRecruit();
      // 퍽 선택 대기가 걸리면 유대 레벨이 영원히 멈춘다 — 사람은 카드에서 고른다
      for (const cid of S.party || []) {
        const c = S.comps[cid];
        if (c && c.pending) { try { G.choosePerk(cid, 0); } catch (e) {} }
      }
      const here = S.at;
      let target = null;
      const stepToward = (goal) => {
        const prev = {}; prev[here] = here;
        const queue = [here];
        while (queue.length) {
          const cur = queue.shift();
          if (cur === goal) break;
          for (const nb of G.neighbors(cur)) if (!(nb.id in prev)) { prev[nb.id] = cur; queue.push(nb.id); }
        }
        if (!(goal in prev)) return null;
        let step = goal;
        while (prev[step] !== here) step = prev[step];
        return step;
      };
      // 생존이 최우선 — 물·식량이 이틀치 밑이면 최근접 정착지로 간다
      if (policy === 'completionist' && !completionTourDone()) {
        const crew = G.partySize();
        const waterNeed = crew * 4 + 4;
        const foodNeed = crew * 3 + 2;
        if (S.water < waterNeed || S.food < foodNeed) {
          let bestStl = null, bestLen = Infinity;
          for (const id of Object.keys(D.nodes)) {
            if (!D.nodes[id].stl || id === here) continue;
            const dist = {}; dist[here] = 0; const q2 = [here];
            let found = -1;
            while (q2.length) {
              const cur = q2.shift();
              if (cur === id) { found = dist[cur]; break; }
              for (const nb of G.neighbors(cur)) if (!(nb.id in dist)) { dist[nb.id] = dist[cur] + 1; q2.push(nb.id); }
            }
            if (found >= 0 && found < bestLen) { bestLen = found; bestStl = id; }
          }
          if (bestStl) target = stepToward(bestStl);
        }
      }
      // 장부가 찼으면 남산이다 — 우회는 끝났다
      if (!target && policy === 'completionist' && (G.seoulReady() || completionTourDone())) target = stepToward('seoul');
      // 영입 후보는 도로 풀에 뜨지 않고 정착지 사람 목록에서 직접 만난다.
      if (!target && policy === 'completionist' && !completionTourDone() && !S.recruitQ && S.party.length < G.maxParty()) {
        const nextRecruit = Object.entries(D.recruitQuests || {}).find(([id]) => !G.hasComp(id));
        if (nextRecruit && nextRecruit[1].meetNode !== here)
          target = stepToward(nextRecruit[1].meetNode);
      }
      // 완주형: 영입 목표가 있으면 그리로 가는 최단 경로의 다음 발
      if (!target && policy === 'completionist' && S.recruitQ && (S.recruitQ.stage === 'task' || S.recruitQ.stage === 'follow')
          && S.recruitQ.target && S.recruitQ.target !== here) {
        target = stepToward(S.recruitQ.target);
      }
      if (!target && policy === 'completionist' && !G.seoulReady() && !completionTourDone()) {
        /* 긴 우회 표본을 채우는 동안은 미방문 노드로 순회하며 사건을 모은다. */
        S._visited = S._visited || {}; S._visited[here] = (S._visited[here] || 0) + 1;
        let bestScore = -Infinity;
        for (const nb of G.neighbors(here)) {
          if (nb.id === 'seoul') continue;
          const visits = S._visited[nb.id] || 0;
          const save = S.at; S.at = nb.id; const remain = G.remainKm(); S.at = save;
          /* 덜 가 본 곳 우선, 같은 방문 횟수면 서울과 가까운 쪽 (막판에 헤매지 않게) */
          const score = -visits * 1000 - remain;
          if (score > bestScore) { bestScore = score; target = nb.id; }
        }
      }
      if (policy === 'completionist' && target === 'seoul' && !G.seoulReady() && !completionTourDone()) target = null;
      if (!target) {
        // 기본: 서울에 가장 가까워지는 이웃 (remainKm 기준 그리디)
        let bestRemain = Infinity;
        for (const nb of G.neighbors(here)) {
          if (policy === 'completionist' && nb.id === 'seoul' && !G.seoulReady() && !completionTourDone()) continue;
          const save = S.at; S.at = nb.id;
          const remain = G.remainKm();
          S.at = save;
          if (remain < bestRemain) { bestRemain = remain; target = nb.id; }
        }
      }
      if (!target) { G.camp(); resolveEvent(policy); continue; }
      if (policy === 'completionist' && G.seoulReady() && S._recruitTrace.length < 40)
        trace(`준비완료 @${here}→${target} 관측${S.pursuit} 연료${Math.round(S.fuel)}`);
      if (!target) { ended = 'stuck'; break; }
      /* 고른 목표가 막혔으면(연료 부족 등) 갈 수 있는 이웃 중 차선을 고른다 —
         같은 구간을 12일 재시도하는 교착이 실제로 났다(2026-08-07 seed77). */
      if (!G.canTravelTo(target).ok) {
        let alt = null, altRemain = Infinity;
        for (const nb of G.neighbors(here)) {
          if (!G.canTravelTo(nb.id).ok) continue;
          if (policy === 'completionist' && nb.id === 'seoul' && !G.seoulReady() && !completionTourDone()) continue;
          const save = S.at; S.at = nb.id; const remain = G.remainKm(); S.at = save;
          if (remain < altRemain) { altRemain = remain; alt = nb.id; }
        }
        if (alt) target = alt;
      }
      const chk = G.canTravelTo(target);
      if (!chk.ok) {
        if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) { G.trade(D.nodes[S.at].stl, 0); G.camp(); resolveEvent(policy); continue; }
        G.camp(); resolveEvent(policy);
        if (guard > 3000) { ended = 'stuck'; break; }
        continue;
      }
      if (!G.startTravel(target)) { ended = 'stuck'; break; }
      let tickGuard = 0;
      while (S.driving && tickGuard++ < 20000 && !S.ended) {
        G.tick(1.4);
        if (pendingEvent) resolveEvent(policy);
      }
      if (S.ended) { ended = 'dead'; break; }
      resolveEvent(policy);
      /* 도착 처리의 지연 예약을 '재현'하면 안 된다 — 실 G.arrive가 이미 돌았고,
         그 안에서 popBeat/popStory/maybeCrisis가 소비된다. 사본을 또 돌리면
         도착마다 큐가 두 번 빠지고 첫 결과는 setTimeout과 함께 버려진다.
         (2026-08-06 적대적 재검증에서 이 계측 오류가 드러났다.)
         대신 arrive가 setTimeout에 넘긴 id를 그대로 받아 동기로 연다. */
      const drain = () => {
        /* 도착만이 아니라 야영·초계·구제도 타이머로 넘긴다. 배열로 받아 전부 소화한다.
           (2026-08-07 재검증: 단일 값이라 camp 이연 56/200이 통째로 유실됐다.) */
        for (let i = 0; i < 8; i++) {
          const q = Array.isArray(S._simDeferred) ? S._simDeferred : (S._simDeferred ? [S._simDeferred] : []);
          S._simDeferred = [];
          if (!q.length) return;
          for (const id of q) { G.openEventById(id); resolveEvent(policy); if (S.ended) return; }
        }
      };
      meterScrap(); drain(); meterScrap();
      try{ (S._dirSamples=S._dirSamples||[]).push({d:S.day, i:G.directorPressure(), p:S.director&&S.director.phase}); }catch(e){}
      if (S.roadGarage) { buyUpgrades(); S.roadGarage = false; meterScrap(); }

      if (S.roadGarage) { buyUpgrades(); S.roadGarage = false; meterScrap(); }
      if (S.fatigue >= cfg.campAt || G.isNight()) { G.camp(); resolveEvent(policy); drain(); }
      if (S.fuel <= 0 && !(S.at && D.nodes[S.at] && D.nodes[S.at].stl) && !S.driving) {
        G.openRescue('nofuel', 'crisis_nofuel'); resolveEvent(policy);
      }
      if (S.roadGarage) { buyUpgrades(); S.roadGarage = false; meterScrap(); }
      if (S.ended) { ended = 'dead'; break; }
    }
    if (!ended) ended = S.ended ? 'dead' : 'timeout';
    results.push({
      policy, ended,
      seen: [...new Set(seenEvents)], roadGarageSeen: seenEvents.includes('road_mechanic'),
      recruitTrace: S._recruitTrace || [], poolLog: S._poolLog || {},
      drivePoolCalls: (S._poolLog && S._poolLog._calls) || 0,
      party: (S.party||[]).length,
      compLvls: Object.fromEntries((S.party||[]).map(id=>[id,(S.comps[id]||{}).lvl||0])),
      pillars: (()=>{ try { const p=G.pillars(); return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v.have+'/'+v.need])); } catch(e){ return null; } })(),
      seoulReady: (()=>{ try { return G.seoulReady(); } catch(e){ return false; } })(),
      storyDone: !!(S.flags&&S.flags.story_done),
      pacing: (()=>{
        const t=(S._evTimes||[]).slice().sort((a,b)=>a-b);
        let maxGap=0;
        for(let k=1;k<t.length;k++) maxGap=Math.max(maxGap, t[k]-t[k-1]);
        const ds=S._dirSamples||[];
        const phases=[...new Set(ds.map(x=>x.p))];
        const iv=ds.map(x=>x.i), mean=iv.reduce((a,b)=>a+b,0)/Math.max(1,iv.length);
        const sd=Math.sqrt(iv.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,iv.length));
        const ep=S._evPhase||[];
        const share=(ph)=>{ const rows=ep.filter(x=>ph.includes(x.p)); return rows.length?rows.filter(x=>x.h).length/rows.length:null; };
        return {maxGapMin:Math.round(maxGap), phases, intensityMean:Math.round(mean), intensitySd:Math.round(sd*10)/10, events:t.length,
                peakHeavy:share(['peak','build']), relaxHeavy:share(['relax','fade'])};
      })(),
      deathCause: S.ended && S.endKind ? S.endKind : (S.ended ? 'unknown' : null),
      lastVitals: {water:S.water, food:S.food, fuel:S.fuel, van:S.van, pursuit:S.pursuit},
      missing: lastMiss ? `${lastMiss.pillar} ${lastMiss.have}/${lastMiss.need}` : '',
      ready: !!(typeof G.seoulReady === 'function' && G.seoulReady()),
      deeds: (typeof G.deedsDone === 'function' ? G.deedsDone().length : 0),
      upgrades: Object.keys(S.up || {}).filter(k => S.up[k]).length,
      upgradeIds: Object.keys(S.up || {}).filter(k => S.up[k]).sort(),
      blocked: S._blocked || {}, scrapEarned: S._scrapEarned || 0, scrapSpent: S._scrapSpent || 0, scrapLeft: S.scrap,
      weight: (typeof G.upWeight === 'function' ? G.upWeight() : 0),
      slotContest: (typeof G.slotUsage === 'function'
        ? Object.keys(D.upSlots || {}).some(sid => G.slotUsage(sid).length >= (D.upSlots[sid].cap)) : false),
      scrapEarned: (S.stats && S.stats.scrapEarned) || 0,
      deedsNeed: (typeof G.pillars === 'function'
        ? Object.values(G.pillars()).reduce((n, x) => n + x.need, 0) : 0),
      day: S.day, km: Math.round(S.stats.km), events: S.stats.events,
      fuel: Math.round(S.fuel), water: S.water, food: S.food, scrap: S.scrap,
      van: Math.round(S.van), pursuit: S.pursuit, party: S.party.length,
      rescues: Object.values(S._rescues || {}).reduce((a, b) => a + b, 0),
      lateTransfer: S.day > D.transferDeadlineDay,
      deadlineSeen: !!(S.flags.deadline_seen_d10 || S.flags.deadline_seen_d5),
    });
  }
  for (const key of stubs) UI[key] = saved[key];
  UI.modalOpen = realModalOpen; UI.showEvent = savedShowEvent;
  return results;
}
"""


# 이 비트들은 "썼으니 있다"가 아니라 "플레이어가 실제로 본다"를 보장해야 하는 것들.
# 2026-08-06 측정에서 런당 등장률이 3% 안팎이었다 — 사실상 아무도 못 보는 상태.
# 본편 비트는 전달률을 실제로 재야 한다. (2026-08-06: 여기를 빈 dict로 두는 바람에
# 승격이 본편 비트를 밀어낸 것을 게이트가 놓쳤다 — 죽은 검사는 검사가 아니다.)
# 동료 조건이 붙은 비트(갈등 아크)는 자동 플레이어가 동료를 얻지 못해 구조적으로
# 0%가 나오므로 여기 넣지 않고 단위 검사(tests/test_journey_beats.py)가 지킨다.
KEY_BEATS = {
    'story_generation_form': '본편 · 세대의 서식',
    'story_family_principle': '본편 · 가족의 원칙',
    'story_generation_speech': '본편 · 세대의 말',
}
MALICE_BEATS = ['levy_office', 'salvage_claim', 'water_toll', 'cleaners_recall', 'signal_bait']


def beat_rates(rows):
    out = {}
    n = max(1, len(rows))
    for beat, label in KEY_BEATS.items():
        hit = sum(1 for r in rows if beat in (r.get('seen') or []))
        out[beat] = {'label': label, 'pct': round(100 * hit / n, 1)}
    # OR 집계는 한 편이 100%면 나머지가 0%여도 통과한다 — 개별로 센다.
    per = {}
    for b in MALICE_BEATS:
        per[b] = round(100 * sum(1 for r in rows if b in (r.get('seen') or [])) / n, 1)
    delivered = sum(1 for b, pct in per.items() if pct >= 40)
    out['_malice'] = {'label': '악의 계열 조우', 'per': per, 'delivered': delivered,
                      'pct': round(100 * sum(1 for r in rows
                                             if any(b in (r.get('seen') or []) for b in MALICE_BEATS)) / n, 1)}
    return out


def summarize(rows, deadline):
    has_deadline = deadline is not None
    out = {}
    policies = sorted({r['policy'] for r in rows})
    for policy in policies:
        subset = [r for r in rows if r['policy'] == policy]
        arrived = [r for r in subset if r['ended'] in ('reached', 'completed')]
        days = sorted(r['day'] for r in arrived)
        out[policy] = {
            'runs': len(subset),
            'reachedPct': round(100 * len(arrived) / max(1, len(subset)), 1),
            'completedPct': round(100 * sum(1 for r in subset if r['ended'] == 'completed') / max(1, len(subset)), 1),
            'deadPct': round(100 * sum(1 for r in subset if r['ended'] == 'dead') / max(1, len(subset)), 1),
            'medianDay': days[len(days) // 2] if days else None,
            'endedBuckets': {k: sum(1 for r in subset if r['ended'] == k)
                             for k in sorted({r['ended'] for r in subset})},
            'meanParty': round(sum(r['party'] for r in subset) / max(1, len(subset)), 2),
            'meanDeeds': round(sum(r['deeds'] for r in subset) / max(1, len(subset)), 2),
            'medianUpgrades': sorted(r['upgrades'] for r in subset)[len(subset) // 2] if subset else 0,
            'roadGaragePct': round(100 * sum(1 for r in subset if r.get('roadGarageSeen')) / max(1, len(subset)), 1),
            'blockedTop': __import__('collections').Counter(
                k for r in subset for k, v in (r.get('blocked') or {}).items() for _ in range(v)).most_common(5),
            'meanScrapEarned': round(sum(r.get('scrapEarned', 0) for r in subset) / max(1, len(subset)), 1),
            'meanScrapLeft': round(sum(r.get('scrapLeft', 0) for r in subset) / max(1, len(subset)), 1),
            'meanWeight': round(sum(r['weight'] for r in subset) / max(1, len(subset)), 1),
            'slotContestPct': round(100 * sum(1 for r in subset if r['slotContest']) / max(1, len(subset)), 1),
            'deedsNeed': subset[0].get('deedsNeed', 0),
            'meanDay': round(sum(r['day'] for r in subset) / max(1, len(subset)), 2),
            'meanRescues': round(sum(r['rescues'] for r in subset) / max(1, len(subset)), 2),
            'lateTransferPct': (round(100 * sum(1 for r in arrived if r['lateTransfer']) / max(1, len(arrived)), 1)
                                if has_deadline else None),
            'lateBase': 'arrived',
            'meanEvents': round(sum(r['events'] for r in subset) / max(1, len(subset)), 1),
            'drivePoolCoveragePct': round(100 * sum(1 for r in subset if r.get('drivePoolCalls', 0) > 0) / max(1, len(subset)), 1),
            'meanDrivePoolCalls': round(sum(r.get('drivePoolCalls', 0) for r in subset) / max(1, len(subset)), 1),
            'deadlineSeenPct': (round(100 * sum(1 for r in subset if r['deadlineSeen']) / max(1, len(subset)), 1)
                                if has_deadline else None),
            'lateRatePct': (round(100 * sum(1 for r in subset if (r.get('day') or 0) > deadline) / max(1, len(subset)), 1)
                            if has_deadline else None),
            'readyPct': round(100 * sum(1 for r in subset if r.get('seoulReady')) / max(1, len(subset)), 1),
            'maxEventGapMin': max((r.get('pacing', {}).get('maxGapMin', 0) for r in subset), default=0),
            'phase3Pct': round(100 * sum(1 for r in subset
                if len([p2 for p2 in (r.get('pacing', {}).get('phases') or []) if p2]) >= 3) / max(1, len(subset)), 1),
            'intensitySdMean': round(sum(r.get('pacing', {}).get('intensitySd', 0) for r in subset) / max(1, len(subset)), 1),
            'heavyShapeDelta': (lambda ps, rs: round((sum(ps) / len(ps) - sum(rs) / len(rs)) * 100, 1)
                if ps and rs else None)(
                [r.get('pacing', {}).get('peakHeavy') for r in subset if r.get('pacing', {}).get('peakHeavy') is not None],
                [r.get('pacing', {}).get('relaxHeavy') for r in subset if r.get('pacing', {}).get('relaxHeavy') is not None]),
        }
    all_days = [out[p]['medianDay'] for p in policies if out[p]['medianDay'] is not None]
    out['_spread'] = {'medianDaySpread': (max(all_days) - min(all_days)) if all_days else None}

    # 두 준비형 정책이 실제로 다른 차를 만드는가 — 장착 집합의 겹침 비율
    sets = {}
    for p in policies:
        if p == 'direct':
            continue
        ids = [set(r.get('upgradeIds') or []) for r in rows if r['policy'] == p]
        ids = [s for s in ids if s]
        if ids:
            common = set.intersection(*ids) if len(ids) > 1 else ids[0]
            sets[p] = common if common else max(ids, key=len)
    if len(sets) >= 2:
        a, b = list(sets.values())[:2]
        union = a | b
        out['_buildOverlap'] = round(len(a & b) / len(union), 3) if union else 1.0
    out['_beats'] = beat_rates(rows)
    return out


THRESHOLDS = """게이트 임계값 — 리포트 생성기가 아니라 실제로 실패할 수 있는 검사다."""


def gate(summary, rows, deadline):
    """이 게이트가 재는 것과 못 재는 것을 분명히 한다.

    잰다  : 주행·보급 경제 — 서울 노드까지의 소요일(daysToSeoulNode), 자원 소모,
            구제 호출 빈도, 사건 노출량, 정책 간 차이. 완주형은 정착지 영입과 긴
            우회를 포함한 생존·경제 스트레스 경로를 잰다.
    못 잰다: 사람 플레이의 선택 품질이나 감정적 완주 경험. 봇의 소요일을 사람의
            평균 완주 시간으로 주장하면 안 된다.
    """
    problems = []
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        if row['medianDay'] is None:
            problems.append(f"{policy}: 서울 노드 도달 0건 (buckets={row['endedBuckets']})")
            continue
        if policy != 'completionist' and row['reachedPct'] < 25:
            # 완주형은 준비 전 서울을 피하도록 설계돼 이 게이트가 맞지 않는다 — readyPct로 잰다
            problems.append(f"{policy}: 서울 노드 도달 {row['reachedPct']}% < 25%")
        if deadline is not None and row['deadlineSeenPct'] < 100:
            problems.append(f"{policy}: 시한 압박 목격 {row['deadlineSeenPct']}% < 100%")
        if row['meanEvents'] < 5:
            problems.append(f"{policy}: 런당 사건 {row['meanEvents']}건 — 이벤트 층이 돌지 않았다")
        if row.get('drivePoolCoveragePct', 0) < 80:
            problems.append(
                f"{policy}: 주행 사건 풀 호출 런 {row.get('drivePoolCoveragePct', 0)}% < 80% "
                f"— 보장·탐색 사건이 도로 슬롯 고갈을 가리고 있다")

    ranked = [(p, r) for p, r in summary.items()
              if not p.startswith('_') and r['medianDay'] is not None]
    if ranked and deadline is not None:
        fastest = min(ranked, key=lambda kv: kv[1]['medianDay'])
        # 집중 플레이는 시한의 절반 안에 서울 땅을 밟을 수 있어야 한다(장부 채울 여유).
        if fastest[1]['medianDay'] > deadline * 0.5:
            problems.append(
                f"{fastest[0]}(최속): 서울 노드까지 {fastest[1]['medianDay']}일 "
                f"> 시한 {deadline}일의 50% — 장부를 채울 여유가 없다")

    if ranked and deadline is not None:
        slowest = max(ranked, key=lambda kv: kv[1]['medianDay'])
        # W1은 "느긋한 플레이는 25% 이상 늦는다"고 썼지만 봇으로는 잴 수 없다 —
        # 봇은 네 기둥을 완주하지 못하고 서울 노드만 밟으므로, 봇의 소요일은
        # 완주 경로의 소요일이 아니다. 대신 잴 수 있는 것만 잰다: 시한이 넉넉하면
        # 압박이 아니므로, 가장 느긋한 정책이 시한의 40% 이상을 써야 한다.
        # 25% 초과율 주장은 사람 플레이 전까지 미검증으로 남긴다. (2026-08-07)
        if slowest[1]['medianDay'] < deadline * 0.4:
            problems.append(
                f"{slowest[0]}(최저속): {slowest[1]['medianDay']}일 < 시한 {deadline}일의 40% "
                f"— 다 챙겨도 시간이 남으면 시한은 압박이 아니다")

    comp = summary.get('completionist')
    if comp:
        # 경제가 '물리는' 증거 둘: 다 챙기는 플레이는 중량 페널티 구간(>8pt)에 실제로
        # 들어가고, 배타 슬롯 경합을 실제로 겪는다. (2026-08-07 실측 11.6pt · 60%)
        if (comp.get('meanWeight') or 0) < 8:
            problems.append(
                f"completionist: 평균 중량 {comp.get('meanWeight')}pt < 8 — 중량 기회비용이 발동하지 않는다")
        # 네 기둥 완주는 서울·피날레·동료 E2E가 맡는다. 이 봇의 readyPct는 정보로만
        # 남기고, 여기서는 긴 우회가 경제적으로 생존해 서울 노드에 닿는지를 검사한다.

    # 페이싱 곡선 게이트 (2026-08-07): 주장이 아니라 곡선으로.
    # (1) 이틀 넘게 아무 사건도 없는 죽은 구간이 없어야 하고
    # (2) 느긋한 정책에서 감독 국면 3종(build/peak/relax·fade)이 실제로 순환해야 하고
    # (3) 강도가 평평하지 않아야 한다(표준편차).
    for policy in ('prepared', 'explorer', 'completionist'):
        row = summary.get(policy)
        if not row:
            continue
        # 완주형은 40~50일 순회라 최댓값 통계가 더 출렁인다 — 실측(2760) 기반 여유
        gap_cap = 3600 if policy == 'completionist' else 2880
        if row.get('maxEventGapMin', 0) > gap_cap:
            problems.append(f"{policy}: 최대 무사건 구간 {row['maxEventGapMin']}분 > {gap_cap}분 — 죽은 구간")
        if row.get('phase3Pct', 0) < 60:
            problems.append(f"{policy}: 국면 3종 순환 런 {row.get('phase3Pct')}% < 60% — 감독이 평평하다")
        if row.get('intensitySdMean', 0) < 5:
            problems.append(f"{policy}: 강도 표준편차 {row.get('intensitySdMean')} < 5 — 곡선이 아니라 직선")
        # ⚠️ 이 지표는 감독의 '인과 증명'이 아니다 — 국면이 최근 사건으로 계산되므로
        # 절정=무거움 상관은 정의상 성립한다(2026-08-07 실측: 가중·숨고르기를 꺼도 11~22%p 유지).
        # 회귀 바닥선으로만 쓴다: 이 수치가 0에 수렴하면 국면 계산 자체가 죽은 것이다.
        d = row.get('heavyShapeDelta')
        if d is not None and d < 3:
            problems.append(f"{policy}: 절정-이완 무거운 사건 비율 차 {d}%p < 3%p — 국면 계산이 죽었다")

    spread = summary.get('_spread', {}).get('medianDaySpread')
    if spread is None or spread < 2:
        problems.append(f"정책 간 소요일 스프레드 {spread}일 < 2일 — 준비에 비용이 없다")

    # W2: 쓴 것이 보이는가. 등장률이 낮으면 기능이 아니라 죽은 콘텐츠다.
    beats = summary.get('_beats', {})
    for beat, row in beats.items():
        if beat == '_malice':
            if row['pct'] < 70:
                problems.append(f"{row['label']} 조우율 {row['pct']}% < 70% — 세계에 대비가 없다")
            if row['delivered'] < 3:
                problems.append(
                    f"악의 조우 5종 중 실제 전달 {row['delivered']}종 < 3종 — {row['per']}")
        elif row['pct'] < 60:
            problems.append(f"핵심 비트 「{row['label']}」 등장률 {row['pct']}% < 60% — 쓴 것이 안 보인다")

    # W4: 경제가 실제로 물리는가 — 카탈로그(608고철)와 수입의 척도가 맞아야
    # 슬롯·중량이 기회비용이 된다. 4~5개만 달고 끝나면 두 시스템은 꺼져 있는 것이다.
    # 정책마다 챙기는 정도가 다르다. 기준은 "가장 많이 챙기는 플레이가 슬롯을 만나는가"다 —
    # 모든 정책에 같은 수를 요구하면 정책 구분 자체가 사라진다.
    thorough = [(p, r) for p, r in summary.items()
                if not p.startswith('_') and r.get('medianDay') is not None and p != 'direct']
    if thorough:
        best = max(thorough, key=lambda kv: kv[1]['medianUpgrades'])
        # 기준선 재보정(2026-08-07): 옛 8개/50%는 이연 이벤트를 놓친 계측 위에서 잡힌 값이다.
        # 계측을 고친 뒤 실측은 5~6개 — 선행 조건 사슬(tank1→tank2, bench→cabin 등)이
        # 한 런의 상한을 만든다. 카탈로그가 "도달 불가"인 게 아니라 한 번에 다 못 다는 것이다.
        if best[1]['medianUpgrades'] < 5:
            problems.append(
                f"{best[0]}(최다 장착): 런당 {best[1]['medianUpgrades']}개 < 5개 — 성장 축이 돌지 않는다")
        # 배타는 '어떤 빌드에서든' 걸려야 한다 — 모든 정책에 요구하면 취향 구분이 사라진다.
        contested = max(r['slotContestPct'] for _, r in thorough)
        if contested < 50:
            problems.append(
                f"최다 경합 정책 슬롯 {contested}% < 50% — 배타가 어느 빌드에서도 걸리지 않는다")
        # 빌드 분화는 '몇 개 달았나'가 아니라 '무엇을 달았나'다.
        # 개수만 보면 서로 다른 7개씩을 단 두 빌드가 '동일'로 읽힌다. (2026-08-07)
        overlap = summary.get('_buildOverlap')
        if overlap is not None and overlap > 0.6:
            problems.append(
                f"정책 간 빌드 겹침 {overlap:.0%} > 60% — 취향이 달라도 같은 차가 나온다")
        counts = sorted(r['medianUpgrades'] for _, r in thorough)
        if False:
            problems.append('정책 간 장착 수 차이 없음 — 빌드가 분화하지 않는다')

    if not rows:
        problems.append('시뮬레이션 결과 0건')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', type=int, default=60)
    ap.add_argument('--seed', type=int, default=400_000_001)
    ap.add_argument('--profile', default='', help='출발 프로필 강제 (keeper/runner/hauler)')
    ap.add_argument('--policies', default='', help='정책 목록 콤마 구분')
    ap.add_argument('--max-days', type=int, default=45)
    ap.add_argument('--html', type=Path, default=DEFAULT_HTML)
    ap.add_argument('--report', type=Path, default=DEFAULT_REPORT)
    args = ap.parse_args()

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        page.add_init_script('localStorage.clear()')
        page.goto(args.html.resolve().as_uri())
        page.wait_for_function('typeof G !== "undefined" && typeof D !== "undefined"')
        page_deadline = page.evaluate('D.transferDeadlineDay')
        rows = page.evaluate(SIM_JS, {
            'runs': args.runs, 'baseSeed': args.seed,
            'policies': args.policies.split(',') if args.policies else ['direct', 'prepared', 'explorer', 'completionist'],
            'maxDays': args.max_days, 'profileOverride': args.profile or None,
        })
        browser.close()

    summary = summarize(rows, page_deadline)
    report = {
        'rows': rows,
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'real engine — 측정 대상: 주행·보급 경제(daysToSeoulNode). 전역 제한일 없음. 실제 완주(네 기둥)는 측정 불가',
        'metric': 'daysToSeoulNode',
        'runs': len(rows), 'seed': args.seed, 'maxDays': args.max_days,
        'deadlineDay': page_deadline,
        'summary': summary,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2))

    print(f"실엔진 시뮬 {len(rows)}런 · seed {args.seed}")
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        deadline_copy = (f"시한압박 목격 {row['deadlineSeenPct']:5.1f}%" if page_deadline is not None
                         else "전역 시한 없음")
        print(f"  {policy:9s} 서울도달 {row['reachedPct']:5.1f}% · 사망 {row['deadPct']:4.1f}% · "
              f"중앙 DAY {str(row['medianDay']):>3s} · 구제 {row['meanRescues']:.2f}회 · "
              f"고철 +{row.get('meanScrapEarned',0):.0f}/잔여 {row.get('meanScrapLeft',0):.0f} · "
              + (f"기둥완성 {row.get('readyPct',0):.0f}% · " if policy == 'completionist' else '') +
              f"{deadline_copy} · 사건 {row['meanEvents']:.1f}건 · "
              f"동행 {row['meanParty']:.1f}명 · 장착 {row['medianUpgrades']}개"
              f"(중량 {row['meanWeight']}pt · 슬롯경합 {row['slotContestPct']}%) · {row['endedBuckets']}")
    print(f"  정책 간 소요일 스프레드: {summary['_spread']['medianDaySpread']}일")
    for beat, row in summary.get('_beats', {}).items():
        extra = f" · 개별 {row['per']}" if 'per' in row else ''
        print(f"  등장률 · {row['label']}: {row['pct']}%{extra}")
    print(f"보고서 → {args.report}")

    problems = gate(summary, rows, page_deadline)
    if problems:
        for p in problems:
            print(f'  ❌ {p}')
        raise SystemExit(f'실엔진 밸런스 게이트 실패 {len(problems)}건')
    print('✅ 실엔진 밸런스 게이트 통과')


if __name__ == '__main__':
    main()
