"""Meaningful regression checks for authoring extensions, separate from game tests."""
from pathlib import Path
from html.parser import HTMLParser
import contextlib
import copy
import importlib.util
import io
import json
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent / 'pixel-workshop'
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('pixel_workshop_build', HERE / 'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Inputs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'input':
            self.ids.add(a.get('id'))


class ExtensionTests(unittest.TestCase):
    def test_new_head_and_tool_need_only_data_definitions(self):
        old_actors, old_out = builder.ACTORS, builder.OUT
        try:
            builder.ACTORS = copy.deepcopy(old_actors)
            builder.ACTORS['heads']['bun'] = [[-6, -8, 10, 4, 'hair'], [-8, -7, 3, 3, 'hair']]
            builder.ACTORS['tools']['brush'] = [[0, -1, 6, 2, 'wood'], [5, -3, 3, 5, 'metal']]
            with tempfile.TemporaryDirectory() as directory:
                builder.OUT = Path(directory)
                (builder.OUT / 'manifest.json').write_text('{"drafts":[]}')
                with contextlib.redirect_stdout(io.StringIO()):
                    builder.build()
                parser = Inputs()
                parser.feed((builder.OUT / 'pixel-workshop.html').read_text())
                self.assertIn('hair-bun', parser.ids)
                self.assertIn('tool-brush', parser.ids)
        finally:
            builder.ACTORS, builder.OUT = old_actors, old_out

    def test_tools_leave_visible_fingers_at_the_shared_hand(self):
        data = json.loads((HERE / 'actors.json').read_text())
        hand = {(x, y) for x in range(-1, 2) for y in range(3)}
        for key, rows in data['tools'].items():
            with self.subTest(tool=key):
                pixels = {(x, y) for left, top, width, height, _ in rows for x in range(left, left + width) for y in range(top, top + height)}
                self.assertGreater(len(hand - pixels), 0, 'held object covers every finger pixel')


if __name__ == '__main__':
    unittest.main()
