"""Final-build gameplay observer. No progress/resource grants or direct choices.

Reuse the repository's earned-campaign runner. Choose Minji's visible invitation,
two camps and a real route aftermath; observe the saved result and ending recall.
Driving/dialogue are accelerated, so this does not measure human play time.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('earned_base', ROOT / 'tools/qa-director-city-route.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
STOP_AT_FORK = '--stop-at-fork' in sys.argv
if STOP_AT_FORK:
    sys.argv.remove('--stop-at-fork')


class PayoffCampaign(base.Campaign):
    def route_recruit_crew(self):
        self.resume() if self.checkpoint else self.fresh()
        return self.loop()

    def done(self, state):
        if STOP_AT_FORK:
            return state['eventId'] == 'route_mid_fork' and state['presentationPhase'] == 'event'
        return super().done(state)

    def current(self):
        return None if self.page.evaluate("S.party.includes('minji')") else 'minji'

    def modal(self, state):
        invite = self.page.locator('[data-first-companion="minji"]:visible')
        if invite.count():
            before = base.snapshot(self.page)
            invite.click()
            self.record('first-companion-invitation', before, control='[data-first-companion="minji"]')
            return True
        talk = self.page.locator('[data-camp-talk="minji"]:visible:not([disabled])')
        if talk.count() and self.page.evaluate("Number(S.campMemories?.minji?.visits||0)<2&&!G.currentCampConversation()?.choiceId"):
            before = base.snapshot(self.page)
            talk.click()
            self.record('camp-talk-open', before, control='[data-camp-talk="minji"]')
            return True
        return super().modal(state)

    def service(self, state):
        if 'minji' in state['party'] and state['campMemories'].get('minji', {}).get('visits', 0) < 2:
            camp = self.page.locator('[data-a="camp"]:visible:not([disabled])')
            if camp.count():
                before = base.snapshot(self.page)
                camp.first.click()
                self.record('camp-open', before, control='[data-a="camp"]')
                return True
        return super().service(state)

    def choice_index(self, event):
        if event in ('route_ridge_aftermath', 'route_market_aftermath'):
            return 1 if self.a.route == 'ridge' else 2
        return super().choice_index(event)

    def event(self, state):
        event = state['eventId']
        if event in ('route_ridge_aftermath', 'route_market_aftermath'):
            self.capture(event, state.get('presentationPhase') or 'event')
            if state.get('presentationPhase') == 'outcome' and not getattr(self, 'aftermath_reloaded', False):
                self.aftermath_reloaded = True
                base.capture_gameplay_save(self.page, self.out / 'aftermath-earned-save.json')
                before_raw = self.page.evaluate("localStorage.getItem('seoul400_save_v1')")
                before, after = base.reload_exact_once(self.page)
                loaded_raw = self.page.evaluate('window.__DIRECTOR_LOADED_SAVE')
                old_input, loaded_input = json.loads(before_raw), json.loads(loaded_raw)
                # Lifecycle writes close/reopen a telemetry session. Preserve
                # them in the real game; compare all non-lifecycle saved data,
                # including quality choice/event counts and non-session history.
                lifecycle_keys = ['lastSeenAt', 'activeSession', 'lastStop', 'playMs', 'sessions']
                telemetry = []
                for saved_input in [old_input, loaded_input]:
                    quality = saved_input.get('_quality', {})
                    telemetry.append({key: quality.pop(key, None) for key in lifecycle_keys})
                    if 'timeline' in quality:
                        quality['timeline'] = [row for row in quality['timeline']
                                               if row.get('type') not in ('session_start', 'session_end')]
                observation = {
                    'class': 'earned-route-aftermath-result', 'before': before, 'after': after,
                    'rawInputIdentical': before['saveInput']['sha256'] == after['loadedInput']['sha256'],
                    'beforeLifecycleTelemetry': telemetry[0], 'loadedLifecycleTelemetry': telemetry[1],
                    'allNonLifecycleSavedFieldsIdentical': old_input == loaded_input,
                }
                (self.out / 'reload-observation.json').write_text(json.dumps(observation, ensure_ascii=False, indent=2))
                assert old_input == loaded_input, 'reload changed non-lifecycle saved fields'
                assert before['state']['resources'] == after['state']['resources']
                assert before['state']['flags'] == after['state']['flags']
                for key in ['notes', 'noteSeq', 'party', 'comps', 'usedCount', 'choiceCount', 'eventCount', 'day', 'min', 'km']:
                    assert before['state'][key] == after['state'][key], key
                self.reloads.append(observation)
                self.page.evaluate('window.__CARAVAN_TEST_AUTO_MS=12')
                self.emit({'phase': 'earned-aftermath-reload', 'event': event, 'sameResources': True})
                return True
        if event == 'seoul_night' and state.get('presentationPhase') == 'outcome':
            visible = self.page.evaluate(r"""()=>{
              const recall=D.routeAftermathRecall(S);
              const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
              return recall&&norm(document.querySelector('#ev-sheet')?.innerText).includes(norm(recall));
            }""")
            if visible:
                self.capture(event, 'default-earned-route-recall')
                if not getattr(self, 'ending_saved', False):
                    self.ending_saved = True
                    base.capture_gameplay_save(self.page, self.out / 'ending-earned-save.json')
                    (self.out / 'ending-visible.json').write_text(json.dumps({
                        'state': state, 'recall': self.page.evaluate('D.routeAftermathRecall(S)'),
                        'text': self.page.locator('#ev-sheet').inner_text(),
                    }, ensure_ascii=False, indent=2))
        return super().event(state)

    def finish(self, reason):
        if STOP_AT_FORK:
            state = base.snapshot(self.page)
            assert reason == 'complete' and not self.errors
            assert 'minji' in state['party'] and state['campMemories']['minji']['visits'] >= 2
            save = base.capture_gameplay_save(self.page, self.out / 'before-fork-earned-save.json')
            self.capture('route_mid_fork', 'earned-before-choice')
            (self.out / 'trace.json').write_text(json.dumps(self.trace.rows, ensure_ascii=False, indent=2))
            (self.out / 'prefix-manifest.json').write_text(json.dumps({
                'status': reason, 'scope': 'earned prefix before route selection, not a final-build campaign',
                'mainResponse': self.response, 'save': save, 'state': state,
                'actions': len(self.trace.rows), 'errors': self.errors, 'captures': self.captures,
            }, ensure_ascii=False, indent=2))
            self.emit({'status': reason, 'scope': 'prefix', 'save': save, 'actions': len(self.trace.rows)})
            self.context.close()
            return
        assert getattr(self, 'aftermath_reloaded', False), 'route aftermath was not earned and reloaded'
        assert getattr(self, 'ending_saved', False), 'earned route recall was not observed in default ending'
        super().finish(reason)


base.Campaign = PayoffCampaign
base.main()
