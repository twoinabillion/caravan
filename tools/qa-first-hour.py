#!/usr/bin/env python3
"""Finite-resource opening, camp, and first companion via visible controls only.

Runs in a disposable browser context on the supplied active preview origin.
Does not accelerate the clock, grant resources, skip dialogue, or use outcome
data to choose. This is a scripted smoke/playthrough, NOT a human playtest.
"""
import argparse
import json
import sys
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tests.director_journey_helpers import snapshot, resource_delta, sha256_file, install_checkpoint_once


def arguments():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--url', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--checkpoint', help='Exact earned save from a prior isolated run; no synthetic state')
    p.add_argument('--camp-only', action='store_true', help='Test solo camp from an earned Miryang checkpoint')
    p.add_argument('--companion', action='store_true', help='Continue earned Miryang save through Minji recruitment')
    p.add_argument('--choice-index', type=int, choices=(0, 1), default=0)
    p.add_argument('--explorations', type=int, choices=(0, 1, 2), default=1)
    p.add_argument('--read-ms', type=int, default=1500)
    p.add_argument('--max-seconds', type=int, default=900)
    return p.parse_args()


def run(a):
    url = urlparse(a.url)
    assert url.hostname in ('127.0.0.1', 'localhost') and url.scheme == 'http'
    query = parse_qs(url.query)
    assert 'rev' not in query and 'infinite-resources' not in query, 'finite resources required'
    assert not a.camp_only or a.checkpoint, 'camp test requires earned checkpoint'
    assert not a.companion or (a.checkpoint and not a.camp_only), 'companion test requires earned checkpoint'
    out = Path(a.output).resolve()
    out.mkdir(parents=True, exist_ok=False)
    actions, captures, errors, controls, reloads = [], [], [], [], []
    started = time.monotonic()
    status = 'running'
    failure = None
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 360, 'height': 728}, device_scale_factor=2)
        if a.checkpoint:
            install_checkpoint_once(context, Path(a.checkpoint).read_text())
        # Presentation preference only, in this new context. No user's save is loaded.
        context.add_init_script("localStorage.setItem('caravan_story_auto','0');localStorage.setItem('caravan_intro_auto','0')")
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        captured = set()

        def observe():
            s = snapshot(page)
            s['infinite'] = page.evaluate('G.isInfiniteResourceMode()')
            s['seed'] = page.evaluate('S.seed')
            assert not s['infinite'], 'test became unlimited'
            return s

        def screen(label):
            name = f'{len(captures)+1:03d}-{label}.png'
            page.screenshot(path=str(out / name))
            captures.append({'label': label, 'file': name})

        def click(selector, label, index=0):
            b = page.locator(selector).nth(index)
            before = observe()
            text = b.inner_text()
            b.click(timeout=5000)
            page.wait_for_timeout(120)
            after = observe()
            row = {'action': label, 'selector': selector, 'label': text, 'seconds': round(time.monotonic()-started, 2),
                   'before': before, 'after': after, 'delta': resource_delta(before, after)}
            actions.append(row)
            print(json.dumps({'action': label, 'event': before['eventId'], 'at': after['at'], 'label': text,
                              'delta': row['delta']}, ensure_ascii=False), flush=True)

        def available(selector):
            return page.locator(selector + ':visible:not([disabled])').count()

        def reload_stopped(label):
            before = observe()
            assert before['drive'] is None and not page.evaluate('UI.modalOpen()')
            # The UI has already saved the last action. Reload consumes that save.
            page.reload(wait_until='domcontentloaded', timeout=120000)
            page.wait_for_function("typeof UI!=='undefined'&&!!S", timeout=120000)
            if available('#bt-continue'):
                page.locator('#bt-continue').click()
            page.wait_for_selector('#scr-game.on', timeout=15000)
            page.wait_for_timeout(400)
            after = observe()
            for key in ('at', 'day', 'min', 'resources', 'party', 'choiceCount', 'usedCount', 'recruitQ', 'campMemories'):
                assert before[key] == after[key], (label, key, before[key], after[key])
            # Current G.load stamps this one technical legacy-migration marker.
            # Require all earned flags unchanged; no other new flag is exempted.
            assert set(before['flags']).issubset(after['flags'])
            assert set(after['flags'])-set(before['flags']) <= {'recruit_migration_v2'}
            reloads.append({'label': label, 'before': before, 'after': after})

        def advance_story(decline_offer=False):
            s = observe()
            key = f"{s['eventId']}-{s['presentationPhase']}-{s['storyStep']}"
            if key not in captured:
                page.wait_for_timeout(700)
                screen(key)
                captured.add(key)
            controls.append({'event': s['eventId'], 'phase': s['presentationPhase'], 'step': s['storyStep'],
                             'text': page.locator('#ev-sheet').inner_text(),
                             'buttons': page.locator('#ev-sheet button:visible').all_text_contents()})
            page.wait_for_timeout(max(0, a.read_ms))
            if available('#ev-sheet [data-r="yes"]'):
                click('#ev-sheet [data-r="no"]:visible' if decline_offer else '#ev-sheet [data-r="yes"]:visible',
                      'defer-join' if decline_offer else 'accept-join')
                return decline_offer
            if available('#ev-sheet [data-i]'):
                index = min(a.choice_index, available('#ev-sheet [data-i]')-1)
                click('#ev-sheet [data-i]:visible:not([disabled])', 'choice', index)
            elif available('#ev-sheet [data-r]'):
                click('#ev-sheet [data-r]:visible:not([disabled])', 'result')
            elif available('#ev-sheet .story-next'):
                click('#ev-sheet .story-next:visible:not([disabled])', 'read')
            else:
                raise AssertionError(('story has no next control', s, controls[-1]))
            return False

        def settle(decline_offer=False):
            declined = False
            last_change, identity = time.monotonic(), None
            while time.monotonic()-started < a.max_seconds:
                s = observe()
                assert not s['ended'], ('unexpected ending', s['endKind'])
                if s['eventId']:
                    declined = advance_story(decline_offer) or declined
                    continue
                if available('[data-arrival-continue]'):
                    click('[data-arrival-continue]:visible', 'arrival-continue')
                    continue
                if available('#stl-leave'):
                    click('#stl-leave:visible', 'leave-town')
                    continue
                if s['drive']:
                    gone = round(s['drive']['gone'], 2)
                    if gone != identity:
                        last_change, identity = time.monotonic(), gone
                    assert time.monotonic()-last_change < 30, 'travel stalled'
                    page.wait_for_timeout(500)
                    continue
                # Allow delayed arrival/camp handoffs to mount before returning.
                page.wait_for_timeout(800)
                if observe()['eventId'] or page.evaluate('UI.modalOpen()'):
                    continue
                return declined
            raise AssertionError('wall clock limit reached')

        def stay(action):
            click('button[data-journey-mode="local"]:visible', 'stay-tab')
            click('[data-stay-choice]:visible', 'action-picker')
            click(f'[data-stay-select="{action}"]:visible', 'select-'+action)
            click(f'[data-a="{action}"]:visible:not([disabled])', 'execute-'+action)

        def drive_to(destination):
            origin = observe()['at']
            click('button[data-journey-mode="route"]:visible', 'route-tab')
            click('[data-trip-destination]:visible', 'destination-picker')
            click(f'[data-trip-route="{destination}"]:visible', 'select-destination')
            screen(origin+'-to-'+destination)
            click(f'[data-nav-depart="{destination}"]:visible:not([disabled])', 'depart')
            assert observe()['drive']['to'] == destination
            settle()
            assert observe()['at'] == destination
            reload_stopped(destination+'-with-guest')

        def check_companion():
            assert observe()['at'] == 'miryang' and observe()['day'] == 2
            assert not observe()['party'] and observe()['recruitQ'] is None
            stay('stl')
            click('[data-stlfocus="market"]:visible', 'walk-to-market')
            page.locator('#stl-enter').wait_for(state='visible')
            click('#stl-enter:visible:not([disabled])', 'enter-market')
            before = observe()
            click('[data-market-key="trade-2"]:visible', 'select-food')
            assert before['resources'] == observe()['resources'] and before['min'] == observe()['min']
            screen('food-budget-before-purchase')
            budget = page.locator('.field-board-budget').inner_text()
            click('#stl-leave:visible', 'cancel-market')
            assert before['resources'] == observe()['resources'] and before['min'] == observe()['min']
            stay('stl')
            click('[data-stlfocus="market"]:visible', 'walk-to-market')
            click('#stl-enter:visible:not([disabled])', 'enter-market')
            click('[data-market-key="trade-2"]:visible', 'select-food')
            before = observe()
            price = page.evaluate("Math.max(1,Math.round(D.stls.miryang.trade[2][3]*G.marketMul('miryang','food')*G.tradeDiscount('miryang')))")
            click('#market-action:visible:not([disabled])', 'buy-food')
            after = observe()
            assert after['resources']['food'] == before['resources']['food']+1
            assert after['resources']['scrap'] == before['resources']['scrap']-price
            assert round(after['min']-before['min'], 6) == 25
            actions[-1]['visibleBudget'] = budget
            click('#stl-hub-back:visible', 'back-to-hub')
            click('[data-stlfocus="people"]:visible', 'walk-to-people')
            click('#stl-enter:visible:not([disabled])', 'enter-people')
            click('[data-person-key="recruit-minji"]:visible', 'select-minji')
            screen('minji-before-first-meeting')
            click('[data-recruit="minji"]:visible', 'meet-minji')
            settle()
            q = observe()['recruitQ']
            assert q and q['id'] == 'minji' and q['stage'] == 'task' and q['target'] == 'ulsan'
            assert not observe()['party'], 'temporary passenger became crew early'
            reload_stopped('minji-accepted-request')
            drive_to('yangsan')
            drive_to('ulsan')
            stay('recruitstep')
            settle()
            assert observe()['recruitQ']['stage'] == 'road' and not observe()['party']
            reload_stopped('minji-task-paid')
            drive_to('gyeongju')
            assert observe()['recruitQ']['stage'] == 'follow' and not observe()['party']
            stay('camp')
            screen('camp-with-temporary-minji')
            assert available('[data-camp-talk="minji"]'), 'guest missing from camp'
            click('#camp-rest:visible', 'sleep-with-guest')
            settle()
            reload_stopped('minji-follow-after-night')
            stay('recruitstep')
            assert settle(decline_offer=True), 'join cancellation was not exercised'
            q = observe()['recruitQ']
            assert not observe()['party'] and q and q['stage'] == 'ready'
            reload_stopped('minji-join-deferred')
            stay('recruitstep')
            settle()
            assert observe()['party'] == ['minji'] and observe()['recruitQ'] is None
            screen('minji-joined')
            reload_stopped('minji-formal-join')
            click('button[data-journey-mode="route"]:visible', 'route-after-join')
            assert available('[data-nav-depart]'), 'no next departure after join'

        def check_camp():
            before = observe()
            assert before['at'] == 'miryang' and not before['party']
            assert before['resources']['food'] >= 2 and before['resources']['water'] >= 2
            assert before['resources']['items'].get('부품', 0) >= 1

            def open_camp():
                click('button[data-journey-mode="local"]:visible', 'stay-tab')
                click('[data-stay-choice]:visible', 'action-picker')
                click('[data-stay-select="camp"]:visible', 'select-camp')
                click('[data-a="camp"]:visible:not([disabled])', 'open-camp')

            open_camp()
            screen('camp-before-preparation')
            click('[data-camp-view="home"]:visible', 'camp-home')
            screen('camp-home-solo')
            click('#camp-x:visible', 'cancel-camp')
            after = observe()
            assert before['resources'] == after['resources'] and before['min'] == after['min']
            assert before['day'] == after['day']
            open_camp()
            meal_before = observe()
            click('[data-camp-prep="meal"]:visible:not([disabled])', 'prepare-meal')
            meal_after = observe()
            assert meal_after['resources']['food'] == meal_before['resources']['food']-1
            assert meal_after['resources']['water'] == meal_before['resources']['water']-1
            assert meal_after['resources']['fatigue'] == max(0, meal_before['resources']['fatigue']-6)
            assert page.locator('[data-camp-prep="meal"]').is_disabled()
            click('[data-camp-prep="repair"]:visible:not([disabled])', 'prepare-repair')
            repair_after = observe()
            assert repair_after['resources']['items']['부품'] == meal_after['resources']['items']['부품']-1
            assert repair_after['resources']['van'] == meal_after['resources']['van']
            assert page.locator('[data-camp-prep="repair"]').is_disabled()
            click('#camp-x:visible', 'close-prepared-camp')
            reload_stopped('paid-camp-preparation')
            open_camp()
            assert page.locator('[data-camp-prep="meal"]').is_disabled()
            assert page.locator('[data-camp-prep="repair"]').is_disabled()
            screen('camp-paid-preparation-after-reload')
            sleep_before = observe()
            # First solo town night gives food 1 / water 2; breakfast uses 1 each.
            assert page.evaluate("(S._stlNights?.miryang||0)===0&&G.mealNeed('breakfast')===1")
            click('#camp-rest:visible', 'sleep')
            page.wait_for_timeout(1000)
            wake = observe()
            assert wake['day'] == sleep_before['day']+1 and wake['min'] == 390
            assert wake['resources']['fatigue'] == 0
            assert wake['resources']['food'] == sleep_before['resources']['food']
            assert wake['resources']['water'] == sleep_before['resources']['water']+1
            assert wake['resources']['van'] == min(100, sleep_before['resources']['van']+12)
            assert not wake['eventId'] and not page.evaluate('UI.modalOpen()')
            screen('camp-next-morning')
            reload_stopped('camp-next-morning')
            click('button[data-journey-mode="route"]:visible', 'route-after-rest')
            assert available('[data-nav-depart]'), 'no next departure after camp'

        try:
            response = page.goto(a.url, wait_until='domcontentloaded', timeout=120000)
            assert response and response.ok
            page.wait_for_function("typeof G!=='undefined'&&typeof UI!=='undefined'", timeout=120000)
            print(json.dumps({'phase': 'runtime-ready', 'url': a.url, 'viewport': [360, 728]}), flush=True)
            if a.checkpoint:
                if available('#bt-continue'):
                    page.locator('#bt-continue').click()
            else:
                # The initial title has no S; start by genuine title/name controls.
                page.locator('#bt-new').click()
                page.locator('#inp-name').fill('초반 검수')
                page.locator('#bt-name').click()
            page.wait_for_selector('#scr-game.on')
            initial = observe()
            assert initial['opening']
            assert bool(initial['opening']['completed']) == bool(a.checkpoint)
            if a.checkpoint:
                assert initial['at'] == ('miryang' if a.camp_only or a.companion else 'yangsan') and initial['drive'] is None
            if a.companion:
                check_companion()
                assert not errors, errors
                status = 'complete'
                return
            if a.camp_only:
                check_camp()
                assert not errors, errors
                status = 'complete'
                return
            remaining = a.explorations
            main_searched = False
            yangsan_checked = False
            arrived_miryang = False
            last_change = time.monotonic()
            last_identity = None
            while time.monotonic()-started < a.max_seconds:
                s = observe()
                identity = (s['at'], s['eventId'], s['presentationPhase'], s['storyStep'],
                            s['choiceCount'], round((s['drive'] or {}).get('gone', 0), 1))
                if identity != last_identity:
                    last_change, last_identity = time.monotonic(), identity
                if s['ended']:
                    raise AssertionError(('unexpected ending', s['endKind']))
                if s['eventId']:
                    advance_story()
                    continue
                if page.evaluate('UI.modalOpen()'):
                    for selector in ('[data-arrival-continue]', '#stl-leave', '#camp-rest', '#camp-x'):
                        if available(selector):
                            screen('arrival-or-rest')
                            click(selector+':visible:not([disabled])', 'modal-next')
                            break
                    else:
                        raise AssertionError(('unhandled modal', page.locator('body').inner_text()[-1600:]))
                    continue
                if s['drive']:
                    if time.monotonic()-last_change > 30:
                        raise AssertionError(('travel stalled', s))
                    page.wait_for_timeout(500)
                    continue
                if s['at'] == 'miryang':
                    arrived_miryang = True
                    screen('miryang-road')
                    reload_stopped('miryang-arrival')
                    status = 'complete'
                    break
                if s['at'] == 'yangsan' and not yangsan_checked:
                    screen('yangsan-first-view')
                    reload_stopped('yangsan-arrival')
                    yangsan_checked = True
                if s['at'] == 'yangsan' and (not main_searched or remaining > 0):
                    opportunity = page.evaluate('G.mainEvidenceOpportunity()')
                    if not main_searched and opportunity and opportunity.get('target') == s['at']:
                        main_searched = True
                    elif remaining > 0:
                        main_searched = True
                        remaining -= 1
                    else:
                        main_searched = True
                        continue
                    click('button[data-journey-mode="local"]:visible', 'stay-tab')
                    # Select only; cancel must preserve gameplay state.
                    click('[data-stay-choice]:visible', 'action-picker')
                    before = observe()
                    page.keyboard.press('Escape')
                    page.wait_for_timeout(80)
                    after = observe()
                    assert before['resources'] == after['resources'] and before['min'] == after['min']
                    click('[data-stay-choice]:visible', 'action-picker')
                    click('[data-stay-select="explore"]:visible', 'select-explore')
                    assert observe()['resources'] == after['resources'] and observe()['min'] == after['min']
                    screen('yangsan-explore-forecast')
                    click('[data-a="explore"]:visible:not([disabled])', 'execute-explore')
                    continue
                chosen = 'yangsan' if s['at'] == 'busan' else 'miryang'
                assert s['at'] in ('busan', 'yangsan'), s['at']
                click('button[data-journey-mode="route"]:visible', 'route-tab')
                if not available(f'[data-nav-depart="{chosen}"]'):
                    click('[data-trip-destination]:visible', 'destination-picker')
                    click(f'[data-trip-route="{chosen}"]:visible', 'select-destination')
                screen(s['at']+'-departure-forecast')
                forecast = page.evaluate('id=>G.travelForecast(id)', chosen)
                before = observe()
                click(f'[data-nav-depart="{chosen}"]:visible:not([disabled])', 'depart')
                after = observe()
                assert after['drive'] and after['drive']['to'] == chosen
                actions[-1]['forecast'] = forecast
                actions[-1]['beforeDeparture'] = before
            else:
                raise AssertionError('wall clock limit reached')
            assert arrived_miryang and initial['resources']['fuel'] > observe()['resources']['fuel']
            assert not errors, errors
        except Exception as e:
            status, failure = 'failed', repr(e)
            screen('failure')
            raise
        finally:
            final = observe() if page.evaluate("typeof S!=='undefined'&&!!S") else None
            report = {'kind': 'isolated-scripted-first-companion' if a.companion else 'isolated-scripted-camp' if a.camp_only else 'isolated-scripted-first-hour-slice', 'status': status, 'failure': failure,
                      'url': a.url, 'seconds': round(time.monotonic()-started, 2),
                      'checkpoint': {'path': a.checkpoint, 'sha256': sha256_file(Path(a.checkpoint))} if a.checkpoint else None,
                      'viewport': [360, 728], 'choicePolicy': f'visible option {a.choice_index}; no outcome scoring',
                      'explorationsRequested': a.explorations, 'readDelayMs': a.read_ms,
                      'clockAccelerated': False, 'resourcesGranted': False, 'humanPlaytest': False,
                      'htmlSha256': sha256_file(ROOT/'서울까지400km.html'),
                      'actions': actions, 'captures': captures, 'reading': controls, 'reloads': reloads,
                      'pageErrors': errors, 'initial': locals().get('initial'), 'final': final}
            saved = page.evaluate("localStorage.getItem('seoul400_save_v1')")
            if saved:
                (out/'save.json').write_text(saved+'\n')
            (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
            context.close()
            browser.close()
            print(json.dumps({'status': status, 'failure': failure, 'seconds': report['seconds'],
                              'actions': len(actions), 'report': str(out/'report.json')}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    run(arguments())
