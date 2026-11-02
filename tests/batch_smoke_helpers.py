"""Current versioned contracts used by the broad browser smoke.

Legacy unversioned exact-key snapshots cannot describe new saved-selector owners.
Run their current receipt/revision regressions and require actual executed tests.
"""
import pathlib
import re
import subprocess


def versioned_reader_contracts(root):
    suites = [
        'tests/test_qa_cycle103_authored_stages.cjs',
        'tests/test_qa_cycle109_nested_legacy.cjs',
        'tests/test_qa_cycle95_paid_reader.cjs',
    ]
    run = subprocess.run(['node', '--test', *suites], cwd=root, text=True,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    destination = pathlib.Path(root) / 'qa-artifacts/batch-20261101-complete/story/smoke-versioned-contracts.log'
    destination.write_text(run.stdout)
    count = re.search(r'^# tests (\d+)$', run.stdout, re.M)
    failures = re.search(r'^# fail (\d+)$', run.stdout, re.M)
    return {
        'ok': run.returncode == 0 and bool(count) and int(count[1]) > 0 and
              bool(failures) and int(failures[1]) == 0,
        'tests': int(count[1]) if count else 0,
        'log': str(destination),
    }
