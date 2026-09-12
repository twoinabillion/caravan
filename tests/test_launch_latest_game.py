#!/usr/bin/env python3
"""The desktop launcher must rebuild HTML before packaging and copying AIT."""

import json
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = Path(
    os.environ.get("CARAVAN_LAUNCHER", ROOT / "tools" / "launch-latest-game.command")
)


def run(*args, cwd=None, env=None):
    return subprocess.run(
        args,
        cwd=cwd,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


with tempfile.TemporaryDirectory(prefix="caravan-launcher-") as temp_dir:
    temp = Path(temp_dir)
    remote = temp / "remote.git"
    seed = temp / "seed"
    project = temp / "project"
    latest = temp / "latest"

    run("git", "init", "--bare", "--initial-branch=master", str(remote))
    run("git", "init", "--initial-branch=master", str(seed))
    run("git", "config", "user.name", "Caravan Test", cwd=seed)
    run("git", "config", "user.email", "caravan-test@example.invalid", cwd=seed)

    (seed / "src").mkdir()
    (seed / "src" / "version.txt").write_text("fresh source\n", encoding="utf-8")
    (seed / "reports").mkdir()
    (seed / "reports" / "asset-budget.json").write_text("{}\n", encoding="utf-8")
    (seed / "서울까지400km.html").write_text("stale html\n", encoding="utf-8")
    (seed / "caravan.ait").write_text("stale ait\n", encoding="utf-8")
    package = {
        "name": "caravan-launcher-fixture",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "prebuild:toss": "if [ \"${CARAVAN_HTML_READY:-0}\" != \"1\" ]; then cp src/version.txt 서울까지400km.html; fi",
            "build:toss": "cp 서울까지400km.html caravan.ait",
        },
    }
    (seed / "package.json").write_text(
        json.dumps(package, ensure_ascii=False), encoding="utf-8"
    )
    run("git", "add", ".", cwd=seed)
    run("git", "commit", "-m", "fixture", cwd=seed)
    run("git", "remote", "add", "origin", str(remote), cwd=seed)
    run("git", "push", "-u", "origin", "master", cwd=seed)
    run("git", "clone", str(remote), str(project))

    env = os.environ.copy()
    env.update(
        {
            "CARAVAN_PROJECT_DIR": str(project),
            "CARAVAN_LATEST_DIR": str(latest),
            "CARAVAN_SKIP_OPEN": "1",
        }
    )
    run(str(LAUNCHER), env=env)

    assert (latest / "서울까지400km.html").read_text(encoding="utf-8") == "fresh source\n"
    assert (latest / "caravan.ait").read_text(encoding="utf-8") == "fresh source\n"

print("✅ 실행기가 HTML을 먼저 재생성하고 같은 내용으로 AIT를 포장한다")
