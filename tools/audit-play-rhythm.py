#!/usr/bin/env python3
"""Audit blocking-event rhythm and driving continuity without human players."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / "서울까지400km.html"
DEFAULT_REPORT = ROOT / "reports" / "play-rhythm.json"


AUDIT_JS = r"""
({runs}) => {
  const round = (value, places=1) => Number(value.toFixed(places));
  const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
  const legs=[];
  const runRows=[];
  let locationContract=null;

  for(let run=0;run<runs;run++){
    G.newGame('onroad','RHYTHM-'+run);
    S.known=Object.keys(D.nodes);
    S.fuel=S.fuelMax;
    S.food=200;
    S.water=200;
    S.scrap=200;
    let previous=null;
    let guard=0;
    const row={run,legs:0,reachedSeoul:false,blockedEvents:0};

    while(S.at!=='seoul'&&guard++<24){
      const from=S.at;
      const candidates=G.neighbors(from)
        .filter(next=>next.id!==previous)
        .sort((a,b)=>G.goalDistance(a.id)-G.goalDistance(b.id));
      const next=candidates[0]||G.neighbors(from).sort((a,b)=>G.goalDistance(a.id)-G.goalDistance(b.id))[0];
      if(!next) break;
      S.fuel=S.fuelMax;
      const started=G.startTravel(next.id);
      if(!started) break;
      const dv=S.driving;
      const speed=Math.max(.01,G.tickKmPerSecond());
      const slots=Array.isArray(dv.slots)?dv.slots:[];
      const first=slots.length?Math.min(...slots.map(slot=>Number(slot.at)||0)):dv.dist;
      const driveSeconds=dv.dist/speed;
      const uninterruptedSeconds=first/speed;
      legs.push({
        run,from,to:next.id,km:dv.dist,
        blockingEvents:slots.length,
        driveSeconds:round(driveSeconds,2),
        uninterruptedSeconds:round(uninterruptedSeconds,2),
        short:dv.dist<30,
        slotKinds:slots.map(slot=>slot.forced?'forced':slot.beat?'beat':slot.pillarPick?'pillar':slot.special||'random')
      });
      row.legs++;
      row.blockedEvents+=slots.length;
      previous=from;
      S.at=next.id;
      S.driving=null;
      if(!S.visited.includes(next.id)) S.visited.push(next.id);
    }
    row.reachedSeoul=S.at==='seoul';
    runRows.push(row);
  }

  G.newGame('onroad','LOCATION-CHECK');
  G.doRecruit('minji');
  const stopped=G.crewLocation('minji');
  S.known=Object.keys(D.nodes);
  S.fuel=S.fuelMax;
  const firstLeg=G.neighbors(S.at).sort((a,b)=>G.goalDistance(a.id)-G.goalDistance(b.id))[0];
  if(firstLeg&&G.startTravel(firstLeg.id)){
    locationContract={stopped,driving:G.crewLocation('minji'),different:stopped!==G.crewLocation('minji')};
  }

  const totalSeconds=legs.reduce((sum,leg)=>sum+leg.driveSeconds,0);
  const totalEvents=legs.reduce((sum,leg)=>sum+leg.blockingEvents,0);
  const estimatedEventSeconds=totalEvents*55;
  const estimatedGameplaySeconds=totalSeconds+estimatedEventSeconds;
  const eventLegs=legs.filter(leg=>leg.blockingEvents>0);
  const shortLegs=legs.filter(leg=>leg.short);
  const summary={
    runs,
    completedRuns:runRows.filter(row=>row.reachedSeoul).length,
    totalLegs:legs.length,
    totalBlockingEvents:totalEvents,
    maxBlockingEventsPerLeg:Math.max(0,...legs.map(leg=>leg.blockingEvents)),
    eventsPerTenGameplayMinutes:round(totalEvents/Math.max(1,estimatedGameplaySeconds)*600,2),
    averageUninterruptedSeconds:round(mean(legs.map(leg=>leg.uninterruptedSeconds)),2),
    averageSecondsBeforeBlockingEvent:round(mean(eventLegs.map(leg=>leg.uninterruptedSeconds)),2),
    shortLegBlockingRate:round(shortLegs.filter(leg=>leg.blockingEvents>0).length/Math.max(1,shortLegs.length)*100,2),
    projectedStoryTaps:{beforeChoiceMax:1,outcomeContinueTaps:0},
    companionLocation:locationContract
  };
  const warnings=[];
  if(summary.maxBlockingEventsPerLeg>1) warnings.push({severity:'critical',code:'MULTI_BLOCK_LEG',message:'한 구간에 전체화면 사건이 두 개 이상 배치됨'});
  if(summary.averageSecondsBeforeBlockingEvent<12) warnings.push({severity:'high',code:'EARLY_BLOCK',message:'첫 전체화면 사건까지 평균 호흡이 12초 미만'});
  if(summary.eventsPerTenGameplayMinutes>8) warnings.push({severity:'high',code:'EVENT_RATE',message:'예상 플레이 10분당 전체화면 사건이 8개 초과'});
  if(summary.shortLegBlockingRate>35) warnings.push({severity:'medium',code:'SHORT_LEG_INTERRUPTION',message:'30km 미만 구간의 사건 비율이 35% 초과'});
  if(!locationContract||!locationContract.different) warnings.push({severity:'high',code:'CREW_LOCATION',message:'정차와 주행의 동료 위치가 구분되지 않음'});
  return {schemaVersion:1,generatedAt:new Date().toISOString(),summary,warnings,runs:runRows,legs};
}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=40)
    parser.add_argument("--html", type=Path, default=DEFAULT_HTML)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(headless=True)
      page = browser.new_page(viewport={"width": 390, "height": 844})
      page.goto(args.html.resolve().as_uri(), wait_until="load")
      report = page.evaluate(AUDIT_JS, {"runs": max(1, args.runs)})
      browser.close()

    report["generatedAtUtc"] = datetime.now(timezone.utc).isoformat()
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    summary = report["summary"]
    print(
        "Rhythm audit: "
        f"{summary['totalLegs']} legs, "
        f"max {summary['maxBlockingEventsPerLeg']} blocking event/leg, "
        f"{summary['averageSecondsBeforeBlockingEvent']}s before a block, "
        f"{summary['eventsPerTenGameplayMinutes']} events/10 gameplay minutes"
    )
    for warning in report["warnings"]:
        print(f"- {warning['severity']}: {warning['code']} - {warning['message']}")
    print(f"Report: {args.report}")
    return 1 if any(row["severity"] == "critical" for row in report["warnings"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
