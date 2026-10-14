#!/usr/bin/env python3
"""Broad existing-test audit, not a human playtest or live-save mutation.

Archives complete output and exclusions; never builds, fixes, applies code,
launches a server, or touches the user's browser context. Browser tests use
their existing disposable generated-HTML fixtures. Fixture shortcuts are NOT
normal-route playthrough evidence. Review failures before classifying bugs.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--jobs', type=int, choices=(1, 2), default=2)
    parser.add_argument('--timeout', type=int, default=180)
    parser.add_argument('--pytest-only', action='store_true', help='Collect declaration-based tests, not module import alone')
    parser.add_argument('--min-free-mb', type=int, default=2048,
                        help='Refuse browser audit below this free-space threshold (minimum 256 MB)')
    args = parser.parse_args()
    out = Path(args.output).resolve()
    if args.min_free_mb < 256:
        parser.error('--min-free-mb must be at least 256')
    probe = out.parent
    while not probe.exists():
        probe = probe.parent
    minimum = args.min_free_mb * 1024 * 1024
    if shutil.disk_usage(probe).free < minimum:
        parser.error('insufficient free disk space; no tests or output directory created')
    out.mkdir(parents=True, exist_ok=False)
    html = ROOT / '서울까지400km.html'
    before = digest(html)
    started = time.monotonic()
    results, excluded = [], []

    def save_report(report):
        # Leave the last readable checkpoint intact if a later write fails.
        pending = out / 'report.json.pending'
        pending.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
        pending.replace(out / 'report.json')

    def run(name, command, kind):
        t = time.monotonic()
        if shutil.disk_usage(out).free < minimum:
            return {'name': name, 'kind': kind, 'command': command,
                    'status': 'blocked-disk-space', 'exitCode': None,
                    'seconds': 0, 'log': None, 'counts': {}}
        log = out / (name + '.log')
        env = dict(os.environ, PYTHONUNBUFFERED='1', PYTHONPATH=str(ROOT))
        # Preserve full output, including failures, without shell interpolation.
        with log.open('w') as f:
            try:
                p = subprocess.run(command, cwd=ROOT, env=env, stdout=f,
                                   stderr=subprocess.STDOUT, timeout=args.timeout)
                status, code = ('passed' if p.returncode == 0 else 'failed'), p.returncode
            except subprocess.TimeoutExpired:
                status, code = 'timeout', None
        body = log.read_text(errors='replace')
        if status == 'passed' and not body.strip():
            status = 'no-evidence'
        counts = {}
        if kind == 'node-contracts':
            for k in ('tests', 'pass', 'fail', 'skipped'):
                m = re.search(r'^# ' + k + r' (\d+)$', body, re.M)
                if m:
                    counts[k] = int(m.group(1))
        else:
            m = re.search(r'(\d+) passed', body)
            if m:
                counts['pytestPassed'] = int(m.group(1))
            counts['checkFailureLines'] = sum('❌' in line for line in body.splitlines())
        row = {'name': name, 'kind': kind, 'command': command, 'status': status,
               'exitCode': code, 'seconds': round(time.monotonic()-t, 2),
               'log': log.name, 'counts': counts}
        print(json.dumps(row, ensure_ascii=False), flush=True)
        return row

    node = sorted({str(p.relative_to(ROOT)) for pattern in
                   ('tests/*.cjs', 'tests/test_*.mjs', 'tools/test-*.cjs', 'tools/test-*.mjs')
                   for p in ROOT.glob(pattern)})
    tasks = [] if args.pytest_only else [('node-contracts', ['node', '--test', *node], 'node-contracts')]
    # Keep snapshot-producing reviews out: they own previously collected captures.
    # Hardcoded other servers cannot substitute for the active user's preview.
    for p in sorted((ROOT / 'tests').glob('test_*.py')):
        src = p.read_text()
        declares_tests = bool(re.search(r'^def test_', src, re.M))
        if args.pytest_only and not declares_tests:
            continue
        reason = None
        if re.search(r'https?://(?:localhost|127\.0\.0\.1)', src):
            reason = 'network/preview-specific test; requires explicit origin adaptation'
        elif any(token in src for token in ('.write_text(', '.screenshot(', 'subprocess.', 'Popen(')):
            reason = 'capture/file-writing/process test; requires separate output ownership review'
        if reason:
            excluded.append({'file': str(p.relative_to(ROOT)), 'reason': reason})
        else:
            command = ([sys.executable, '-m', 'pytest', str(p.relative_to(ROOT)), '-q']
                       if declares_tests else [sys.executable, str(p.relative_to(ROOT))])
            tasks.append((p.stem, command,
                          'isolated-browser-or-source-fixture'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(run, *task) for task in tasks]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())
            checkpoint = {'kind': 'broad-existing-test-audit', 'complete': False,
                          'results': sorted(results, key=lambda x: x['name']), 'excluded': excluded}
            save_report(checkpoint)
    complete = not any(r['status']=='blocked-disk-space' for r in results)
    report = {'kind': 'broad-existing-test-audit', 'complete': complete,
              'seconds': round(time.monotonic()-started, 2),
              'htmlSha256Before': before, 'htmlSha256After': digest(html),
              'userSaveTouched': False, 'humanPlaytest': False, 'subjectiveListening': False,
              'results': sorted(results, key=lambda x: x['name']), 'excluded': excluded}
    save_report(report)
    print(json.dumps({'complete': complete, 'suites': len(results),
                      'passed': sum(r['status']=='passed' for r in results),
                      'failed': sum(r['status']=='failed' for r in results),
                      'timeouts': sum(r['status']=='timeout' for r in results),
                      'excluded': len(excluded), 'report': str(out / 'report.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
