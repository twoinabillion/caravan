#!/usr/bin/env python3
"""Hidden-key preflight; optional ONE explicitly confirmed TTS audition.

Default: GET-only. Never persist a key, modify billing/voices, or wire gameplay.
Use --sample to offer one current-game line, not a batch. No automatic retry.
"""
import argparse
import datetime
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
import warnings

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api.elevenlabs.io'
REPORT = ROOT / 'reports/elevenlabs-voice-preflight.json'


class Stop(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Stop('API redirect refused; credential was not forwarded.')


def credential():
    value = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not value:
        if not sys.stdin.isatty():
            raise Stop('Open this command in Terminal for hidden key input. Do not send the key in chat.')
        with warnings.catch_warnings():
            warnings.simplefilter('error', getpass.GetPassWarning)
            value = getpass.getpass('ElevenLabs API key (hidden, never saved): ').strip()
    if not value or any(c.isspace() for c in value):
        raise Stop('Empty or invalid credential; no request sent.')
    return value


def request(key, path, payload=None):
    # No arbitrary origins, billing endpoints or voice creation/mutation.
    allowed_get = path == '/v1/user/subscription' or path.startswith('/v2/voices?')
    allowed_post = re.fullmatch(r'/v1/text-to-speech/[A-Za-z0-9_-]+\?output_format=mp3_44100_128', path)
    if not (allowed_get if payload is None else allowed_post):
        raise Stop('Endpoint not permitted.')
    headers = {'xi-api-key': key, 'Accept': 'application/json' if payload is None else 'audio/mpeg'}
    body = None
    if payload is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(payload, ensure_ascii=False).encode('utf8')
    req = urllib.request.Request(API + path, data=body, headers=headers)
    return urllib.request.build_opener(NoRedirect()).open(req, timeout=25)


def read_json(key, path):
    with request(key, path) as response:
        body = response.read(2_000_001)
    if len(body) > 2_000_000:
        raise Stop('Oversized API metadata; stopped.')
    return json.loads(body)


def inspect_account(key):
    value = read_json(key, '/v1/user/subscription')
    account = {field: value.get(field) for field in ('tier', 'status', 'character_count',
               'character_limit', 'max_credit_limit_extension')}
    count, limit = account['character_count'], account['character_limit']
    if type(count) is not int or type(limit) is not int or not 0 <= count <= limit:
        raise Stop('Unusable allowance metadata; no speech generated.')
    account['remaining_credits'] = limit - count
    voices, token, seen = [], None, set()
    for _ in range(10):
        query = {'voice_type': 'saved', 'page_size': 100, 'include_total_count': 'false',
                 'include_custom_rates': 'false'}
        if token:
            query['next_page_token'] = token
        page = read_json(key, '/v2/voices?' + urllib.parse.urlencode(query))
        for voice in page.get('voices', []):
            identity = voice.get('voice_id', '')
            if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', identity):
                raise Stop('Invalid voice identifier.')
            voices.append({'voice_id': identity, 'name': str(voice.get('name', ''))[:120]})
        if page.get('has_more') is False:
            break
        token = page.get('next_page_token')
        if not token or token in seen:
            raise Stop('Incomplete voice pagination; no voice selected.')
        seen.add(token)
    else:
        raise Stop('Voice pagination bound reached; no voice selected.')
    voices = list({v['voice_id']: v for v in voices}.values())
    candidates = [v for v in voices if re.search(r'천리안|cheollian', v['name'], re.I)]
    return account, voices, candidates


def sample_gate(account, text):
    extension = account.get('max_credit_limit_extension')
    if type(extension) is not int or extension != 0:
        raise Stop('Usage-based billing must be confirmed disabled (limit 0) before generation. No settings changed.')
    if not 1 <= len(text) <= 300 or account['remaining_credits'] < 1000:
        raise Stop('Insufficient safety margin for one short sample; no speech generated.')


def redact(value, key):
    # Defensive: even a returned voice name must not echo the credential.
    if isinstance(value, dict):
        return {str(k).replace(key, '[redacted]'): redact(v, key) for k, v in value.items()}
    if isinstance(value, list):
        return [redact(v, key) for v in value]
    return value.replace(key, '[redacted]') if isinstance(value, str) else value


def write_report(report, key):
    REPORT.parent.mkdir(exist_ok=True)
    temp = REPORT.with_name('.elevenlabs-preflight-' + uuid.uuid4().hex + '.tmp')
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as file:
        json.dump(redact(report, key), file, ensure_ascii=False, indent=2)
        file.write('\n')
    os.replace(temp, REPORT)


def make_sample(key, voice, clip, plan, report):
    account = read_json(key, '/v1/user/subscription')  # Recheck immediately before spending.
    count, limit = account.get('character_count'), account.get('character_limit')
    if type(count) is not int or type(limit) is not int or not 0 <= count <= limit:
        raise Stop('Unusable allowance metadata; no speech generated.')
    account['remaining_credits'] = limit - count
    sample_gate(account, clip['text'])
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    folder = ROOT / 'assets/audio/auditions' / ('elevenlabs-voice-' + stamp + '-' + uuid.uuid4().hex[:8])
    folder.mkdir(parents=True, exist_ok=False)
    payload = {'text': clip['text'], 'model_id': plan['settings']['model_id'],
               'voice_settings': plan['settings']['voice_settings']}
    manifest = {'provider': 'ElevenLabs', 'voice': voice, 'request': payload,
                'source_sha256': plan['source_sha256'], 'generated_at': stamp,
                'commercial_release': False, 'game_wired': False, 'listening_review': 'pending',
                'subscription_tier': account.get('tier'), 'status': 'request_started_no_automatic_retry'}
    manifest_path = folder / 'manifest.json'
    report.update(status='sample_attempt_started', sample_manifest=str(manifest_path.relative_to(ROOT)))
    write_report(report, key)
    # Persist attempt BEFORE POST: a timeout can still consume credits.
    manifest_path.write_text(json.dumps(redact(manifest, key), ensure_ascii=False, indent=2) + '\n')
    with request(key, '/v1/text-to-speech/' + voice['voice_id'] + '?output_format=mp3_44100_128', payload) as response:
        body = response.read(3_000_001)
        if not 1000 <= len(body) <= 3_000_000 or not response.headers.get('Content-Type', '').startswith('audio/'):
            raise Stop('Unexpected speech response; do not retry automatically.')
        cost = response.headers.get('character-cost')
    master = folder / (clip['id'] + '.mp3')
    with master.open('xb') as file:
        file.write(body)
    # Decode only; this does NOT establish tone, pronunciation or listening approval.
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(master), '-f', 'null', '-'],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    manifest.update(status='generated_and_decoded', file=master.name,
                    reported_credit_cost=cost, sha256=hashlib.sha256(body).hexdigest())
    manifest_path.write_text(json.dumps(redact(manifest, key), ensure_ascii=False, indent=2) + '\n')
    report.update(status='sample_generated_listening_pending', sample_manifest=str(manifest_path.relative_to(ROOT)))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sample', action='store_true', help='Offer one confirmed, noncommercial audition, never a batch.')
    parser.add_argument('--voice-id', help='An existing saved voice ID, NOT an API key.')
    args = parser.parse_args(argv)
    key, report = None, None
    try:
        if not shutil.which('node') or (args.sample and not shutil.which('ffmpeg')):
            raise Stop('Node and (for samples) ffmpeg must be installed first.')
        plan = json.loads(subprocess.check_output(['node', str(ROOT / 'tools/elevenlabs-voice-plan.cjs')], cwd=ROOT))
        key = credential()
        account, voices, candidates = inspect_account(key)
        report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'status': 'preflight_only', 'account': account, 'voice_candidates': candidates,
                  'saved_voices': voices, 'source_sha256': plan['source_sha256'],
                  'planned_clips': len(plan['clips']), 'game_wired': False, 'key_saved': False}
        write_report(report, key)
        print(json.dumps(redact({'account': account, 'voice_candidates': candidates,
                                'planned_clips': len(plan['clips'])}, key), ensure_ascii=False, indent=2))
        if args.sample:
            chosen = next((v for v in voices if v['voice_id'] == args.voice_id), None) if args.voice_id else (
                candidates[0] if len(candidates) == 1 else None)
            if not chosen:
                raise Stop('No unambiguous existing 천리안 voice. Select its saved voice ID; no replacement voice created.')
            clip = next(c for c in plan['clips'] if c['id'] == plan['sample_id'])
            sample_gate(account, clip['text'])
            print('One sample only; existing credits; no billing changes; noncommercial and NOT game-wired.')
            print(json.dumps(redact({'voice': chosen, 'text': clip['text']}, key), ensure_ascii=False, indent=2))
            if not sys.stdin.isatty() or input('Generate this ONE sample? Type YES (anything else cancels): ').strip() != 'YES':
                report['status'] = 'sample_cancelled'
            else:
                make_sample(key, chosen, clip, plan, report)
            write_report(report, key)
        print('Safe report: ' + str(REPORT))
        return 0
    except (KeyboardInterrupt, EOFError):
        message = 'Cancelled; no automatic retry.'
    except urllib.error.HTTPError as error:
        message = 'API HTTP ' + str(error.code) + '; no automatic retry. Check key permissions in your dashboard.'
    except Stop as error:
        message = str(error)
    except Exception as error:
        message = 'Stopped (' + type(error).__name__ + '); no automatic retry.'
    if report is not None:
        report.update(status='stopped', reason=message)
        write_report(report, key)
    print(message, file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
