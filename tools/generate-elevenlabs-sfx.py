#!/usr/bin/env python3
"""Generate a bounded, noncommercial SFX audition batch; never store credentials.

Run interactively. Outputs are candidates only, deliberately not game-wired.
No automatic retry: a timed-out POST may already have consumed credits.
"""
import datetime
import argparse
import getpass
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
API = "https://api.elevenlabs.io"
BATCH = [
    ("tool_sorting", 3, "Close dry Foley: a mechanic's hands quietly sort three worn steel sockets and a small ratchet onto a wooden workbench. Separate light clinks, cloth scraping wood, natural pauses. Intimate small repair shop, restrained realistic dynamics. No voices, music, alarms or cinematic impacts."),
    ("paper_fold", 3, "Close dry Foley: one old paper letter unfolded, gently flattened by a hand, then folded once. Soft textured paper rustle, deliberate human movement, quiet space between gestures. No voices, music, wind or exaggerated whooshes."),
    ("cup_set_down", 2, "Close dry Foley: a single ceramic mug gently set down on a worn wooden kitchen shelf, a small dull ceramic tap and very short natural room reflection. An ordinary quiet morning, not dramatic. No liquid pouring, voices, music or other objects."),
    ("radio_tuning", 4, "An old small shortwave radio knob slowly turned: soft switch click, narrow-band crackle and brief static rising then settling to a quiet hiss. Heard from nearby inside a modest workshop. No intelligible speech, broadcasts, music or loud squeals."),
    ("generator_shutdown", 6, "A small old diesel generator heard from several metres away across a quiet courtyard. Steady low mechanical rumble at first, then power is switched off; the motor winds down unevenly and stops, leaving quiet air. Realistic gradual deceleration, no explosion. No voices, music or other machines."),
    ("bag_packing", 4, "Close dry Foley: soft cotton clothes pressed into a canvas travel bag, canvas creaks, then a short zipper pulled shut. Gentle unhurried household movement with pauses, intimate realistic texture. No voices, footsteps, music or cinematic whooshes."),
]


def request(key, path, payload=None):
    headers = {"xi-api-key": key}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(API + path, data=data, headers=headers)
    return urllib.request.urlopen(req, timeout=55)


def subscription(key):
    with request(key, "/v1/user/subscription") as response:
        value = json.load(response)
    return {field: value.get(field) for field in
            ("tier", "status", "character_count", "character_limit")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', type=pathlib.Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text()) if args.plan else None
    batch = plan['clips'] if plan else [dict(name=n, seconds=s, prompt=p, loop=False) for n, s, p in BATCH]
    if len(batch)>40 or any(not re.fullmatch(r'[a-z0-9_]+',c['name']) or not .5<=c['seconds']<=12
                           or not 1<=len(c['prompt'])<=450 for c in batch):
        raise RuntimeError('Invalid bounded batch.')
    key = getpass.getpass("ElevenLabs credential (hidden): ")
    before = subscription(key)
    estimate = sum(c['seconds'] * 40 for c in batch)
    if before["tier"] != "free":
        raise RuntimeError("This audition script is limited to the free plan.")
    remaining = before["character_limit"] - before["character_count"]
    if remaining < estimate + 200:
        raise RuntimeError("Insufficient free allowance for bounded batch.")
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    folder = ROOT / "assets/audio/auditions" / ("elevenlabs-" + (plan['id'] if plan else 'intro') + '-' + stamp)
    folder.mkdir(parents=True, exist_ok=False)
    (folder / "masters").mkdir()
    manifest = {"provider": "ElevenLabs", "model": "eleven_text_to_sound_v2",
                "generated_at": stamp, "subscription_before": before,
                "estimated_credits": estimate, "commercial_release": False,
                "licensing": "Generated on Free. Noncommercial audition only; public sharing requires attribution. Do not ship commercially. Regenerate while paid or obtain explicit rights.",
                "license_source": "https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform",
                "game_wired": False, "listening_review": "pending", "clips": []}

    def save_manifest():
        (folder / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    save_manifest()
    print(json.dumps({"folder": str(folder.relative_to(ROOT)), "estimated_credits": estimate}), flush=True)
    for clip in batch:
        name, seconds, prompt = clip['name'], clip['seconds'], clip['prompt']
        payload = {"text": prompt, "duration_seconds": seconds,
                   "prompt_influence": .4, "loop": bool(clip.get('loop')),
                   "model_id": "eleven_text_to_sound_v2"}
        try:
            with request(key, "/v1/sound-generation?output_format=mp3_44100_128", payload) as response:
                body = response.read(3_000_001)
                content_type = response.headers.get("Content-Type", "")
                cost = response.headers.get("character-cost")
            if len(body) > 3_000_000 or len(body) < 1000 or "audio" not in content_type:
                raise RuntimeError("Unexpected audio response; stopping without retry.")
            master = folder / "masters" / (name + ".mp3")
            master.write_bytes(body)
            delivery = folder / (name + ".mp3")
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-n", "-i", str(master),
                            "-af", "aformat=channel_layouts=mono,loudnorm=I=-24:TP=-4:LRA=11,volume=-0.5dB,aresample=44100",
                            "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "96k",
                            str(delivery)], check=True)
            probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
                    "format=duration,size:stream=codec_name,sample_rate,channels", "-of", "json", str(delivery)])
            manifest["clips"].append({"name": name, "prompt": prompt, "request": payload,
                "reported_credit_cost": cost, "master_sha256": hashlib.sha256(body).hexdigest(),
                "file": delivery.name, "probe": json.loads(probe), "listening_review": "pending"})
            save_manifest()
            print(json.dumps({"clip": name, "status": "generated_and_decoded", "reported_credit_cost": cost}), flush=True)
            used = sum(int(c["reported_credit_cost"] or 0) for c in manifest["clips"])
            if used > estimate:
                raise RuntimeError("Unexpected billing rate; stopping further generation.")
        except urllib.error.HTTPError as error:
            # Never echo response/request bodies or authentication headers.
            manifest["stopped"] = {"clip": name, "http_status": error.code}
            save_manifest()
            print(json.dumps(manifest["stopped"]), flush=True)
            return 1
        except Exception as error:
            manifest["stopped"] = {"clip": name, "error_type": type(error).__name__}
            save_manifest()
            print(json.dumps(manifest["stopped"]), flush=True)
            return 1
    manifest["subscription_after"] = subscription(key)
    save_manifest()
    print(json.dumps({"status": "complete", "clips": len(manifest["clips"]),
                      "subscription_after": manifest["subscription_after"]}), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
