"""Offline boundary tests. Fake HTTP/audio is NOT authenticated API or listening QA."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location('voice_tool', Path(__file__).with_name('elevenlabs-voice.py'))
tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)
KEY = 'unit_test_credential_do_not_persist'
ACCOUNT = {'tier': 'free', 'status': 'active', 'character_count': 100, 'character_limit': 10000,
           'max_credit_limit_extension': 0}
VOICE = {'voice_id': 'existing_voice_123', 'name': '천리안'}
PLAN = {'source_sha256': 'a' * 64, 'sample_id': 'sample', 'settings': {
    'model_id': 'eleven_multilingual_v2', 'voice_settings': {'speed': .9}},
    'clips': [{'id': 'sample', 'text': '안녕하십니까.'}]}


class Response(io.BytesIO):
    def __init__(self, value, audio=False):
        super().__init__(value if audio else json.dumps(value).encode())
        self.headers = {'Content-Type': 'audio/mpeg' if audio else 'application/json', 'character-cost': '8'}


class VoiceTests(unittest.TestCase):
    def test_nonterminal_input_refuses_before_prompt_or_network(self):
        with patch.dict(tool.os.environ, {}, clear=True), patch.object(tool.sys.stdin, 'isatty', return_value=False), \
             patch.object(tool.getpass, 'getpass') as prompt:
            with self.assertRaises(tool.Stop):
                tool.credential()
            prompt.assert_not_called()

    def test_hidden_input_and_environment_are_not_persisted(self):
        with patch.dict(tool.os.environ, {}, clear=True), patch.object(tool.sys.stdin, 'isatty', return_value=True), \
             patch.object(tool.getpass, 'getpass', return_value=KEY):
            self.assertEqual(tool.credential(), KEY)
            self.assertNotIn('ELEVENLABS_API_KEY', tool.os.environ)
        with patch.dict(tool.os.environ, {'ELEVENLABS_API_KEY': KEY}, clear=True):
            self.assertEqual(tool.credential(), KEY)

    def test_getpass_warning_aborts_instead_of_echoing(self):
        with patch.dict(tool.os.environ, {}, clear=True), patch.object(tool.sys.stdin, 'isatty', return_value=True), \
             patch.object(tool.getpass, 'getpass', side_effect=tool.getpass.GetPassWarning('unsafe')):
            with self.assertRaises(tool.getpass.GetPassWarning):
                tool.credential()

    def test_account_whitelist_drops_invoices_and_credential_fields(self):
        account = {**ACCOUNT, 'open_invoices': [{'private': KEY}], 'api_key': KEY}
        pages = [account, {'voices': [VOICE], 'has_more': False}]
        with patch.object(tool, 'read_json', side_effect=pages) as get:
            clean, voices, candidates = tool.inspect_account(KEY)
        self.assertNotIn(KEY, json.dumps(clean))
        self.assertNotIn('open_invoices', clean)
        self.assertEqual(clean['remaining_credits'], 9900)
        self.assertEqual(voices, candidates)
        self.assertTrue(all(call.args[1].startswith(('/v1/user/subscription', '/v2/voices?')) for call in get.call_args_list))

    def test_bad_allowance_stops_before_voice_request(self):
        for count in (True, -1, 10001, None):
            with patch.object(tool, 'read_json', return_value={**ACCOUNT, 'character_count': count}) as get:
                with self.assertRaises(tool.Stop):
                    tool.inspect_account(KEY)
                self.assertEqual(get.call_count, 1)

    def test_pagination_requires_completion_and_rejects_repeated_token(self):
        pages = [ACCOUNT, {'voices': [VOICE], 'has_more': True, 'next_page_token': 'again'},
                 {'voices': [VOICE], 'has_more': True, 'next_page_token': 'again'}]
        with patch.object(tool, 'read_json', side_effect=pages):
            with self.assertRaises(tool.Stop):
                tool.inspect_account(KEY)

    def test_only_exact_zero_overage_and_sufficient_allowance_pass(self):
        for value in (None, False, '0', 'unlimited', 100):
            with self.assertRaises(tool.Stop):
                tool.sample_gate({**ACCOUNT, 'remaining_credits': 9900, 'max_credit_limit_extension': value}, '인사')
        for remaining in (0, 999):
            with self.assertRaises(tool.Stop):
                tool.sample_gate({**ACCOUNT, 'remaining_credits': remaining}, '인사')
        tool.sample_gate({**ACCOUNT, 'remaining_credits': 1000}, '인사')

    def test_rejects_billing_voice_mutations_and_external_endpoint(self):
        with patch.object(tool.urllib.request, 'build_opener') as opener:
            for path, payload in [('/v1/user/subscription', {}), ('https://other.test', None),
                                  ('/v1/voices/add', {}), ('/v1/sound-generation', {})]:
                with self.assertRaises(tool.Stop):
                    tool.request(KEY, path, payload)
            opener.assert_not_called()

    def test_redirect_never_forwards_credential(self):
        with self.assertRaises(tool.Stop):
            tool.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.test')

    def test_report_is_redacted_and_owner_only(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(tool, 'REPORT', Path(folder) / 'safe.json'):
            tool.write_report({'name': KEY, KEY: [KEY]}, KEY)
            self.assertNotIn(KEY, tool.REPORT.read_text())
            self.assertEqual(tool.REPORT.stat().st_mode & 0o777, 0o600)

    def run_main(self, folder, sample=False, confirm='NO', request_hook=None, voices=None):
        calls = []
        def fake(key, path, payload=None):
            calls.append((path, payload))
            if request_hook:
                request_hook(path, payload)
            if path == '/v1/user/subscription':
                return Response(ACCOUNT)
            if path.startswith('/v2/voices?'):
                return Response({'voices': voices if voices is not None else [VOICE], 'has_more': False})
            return Response(b'x' * 1200, audio=True)
        stdout, stderr = io.StringIO(), io.StringIO()
        with patch.object(tool, 'ROOT', Path(folder)), patch.object(tool, 'REPORT', Path(folder) / 'reports/check.json'), \
             patch.object(tool.shutil, 'which', return_value='/installed'), \
             patch.object(tool.subprocess, 'check_output', return_value=json.dumps(PLAN).encode()), \
             patch.object(tool.subprocess, 'run'), patch.object(tool, 'credential', return_value=KEY), \
             patch.object(tool, 'request', side_effect=fake), patch.object(tool.sys.stdin, 'isatty', return_value=True), \
             patch('builtins.input', return_value=confirm), contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            result = tool.main(['--sample'] if sample else [])
        return result, calls, stdout.getvalue() + stderr.getvalue()

    def test_default_preflight_uses_only_get_without_generating(self):
        with tempfile.TemporaryDirectory() as folder:
            result, calls, output = self.run_main(folder)
            self.assertEqual(result, 0)
            self.assertTrue(all(payload is None for _, payload in calls))
            self.assertFalse((Path(folder) / 'assets').exists())
            self.assertNotIn(KEY, output)

    def test_cancelled_sample_never_posts(self):
        with tempfile.TemporaryDirectory() as folder:
            result, calls, _ = self.run_main(folder, sample=True)
            self.assertEqual(result, 0)
            self.assertTrue(all(payload is None for _, payload in calls))
            report = json.loads((Path(folder) / 'reports/check.json').read_text())
            self.assertEqual(report['status'], 'sample_cancelled')

    def test_ambiguous_voice_never_selects_replacement(self):
        with tempfile.TemporaryDirectory() as folder:
            result, calls, _ = self.run_main(folder, sample=True, confirm='YES', voices=[])
            self.assertEqual(result, 1)
            self.assertTrue(all(payload is None for _, payload in calls))

    def test_confirmed_sample_posts_once_retains_master_but_never_game_wires(self):
        with tempfile.TemporaryDirectory() as folder:
            result, calls, output = self.run_main(folder, sample=True, confirm='YES')
            self.assertEqual(result, 0)
            posts = [(path, payload) for path, payload in calls if payload is not None]
            self.assertEqual(len(posts), 1)
            self.assertEqual(posts[0][1]['text'], PLAN['clips'][0]['text'])
            manifest = json.loads(next(Path(folder).rglob('manifest.json')).read_text())
            self.assertFalse(manifest['game_wired'])
            self.assertFalse(manifest['commercial_release'])
            self.assertEqual(manifest['listening_review'], 'pending')
            self.assertNotIn(KEY, output)
            for path in Path(folder).rglob('*.json'):
                self.assertNotIn(KEY, path.read_text())

    def test_timed_out_post_keeps_attempt_and_is_never_retried(self):
        def fail(path, payload):
            if payload is not None:
                raise TimeoutError()
        with tempfile.TemporaryDirectory() as folder:
            result, calls, _ = self.run_main(folder, sample=True, confirm='YES', request_hook=fail)
            self.assertEqual(result, 1)
            self.assertEqual(sum(payload is not None for _, payload in calls), 1)
            report = json.loads((Path(folder) / 'reports/check.json').read_text())
            self.assertEqual(report['status'], 'stopped')
            self.assertTrue((Path(folder) / report['sample_manifest']).is_file())


if __name__ == '__main__':
    unittest.main()
