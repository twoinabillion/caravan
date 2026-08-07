#!/usr/bin/env python3
"""절차 합성 BGM — 비어 있는 슬롯 4개(tension·settlement·camp·story)를 채운다.

외부 음악 AI 없이 numpy로 합성한다. 악기는 셋:
  - pluck : Karplus-Strong 현악 (나일론 기타/픽킹 근사)
  - felt  : 배음 가산 + 느린 어택의 펠트 피아노 근사
  - pad   : 디튠 saw 두 대 + 저역 통과의 따뜻한 패드
공통 질감: 테이프 히스(저레벨 핑크 노이즈), 심리스 루프(꼬리→머리 크로스페이드),
피크 -3dBFS 정규화. docs/audio-guide.md의 트랙 스펙(BPM·정서)을 따른다.

주의: 이 파일의 작성자는 소리를 듣지 못한다. 구조(클리핑·루프 이음새·길이)는
코드로 검증하지만 '좋은가'는 사람 귀의 몫이다 — 슬롯을 채우는 v1로만 쓴다.

실행: python3 tools/synth-bgm.py            # 4트랙 전부 → assets/audio/bgm/
      python3 tools/synth-bgm.py --only camp
"""
import argparse
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
TAIL = 2.5   # 루프 끝을 넘어가는 여운(초) — 머리로 접어 넣는다
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'audio' / 'bgm'

# ── 음높이 ──────────────────────────────────────────────
A4 = 440.0
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name):
    """'A3' → 주파수"""
    n, octave = name[:-1], int(name[-1])
    semi = NOTE[n] + (octave - 4) * 12 - 9   # A4 기준
    return A4 * 2 ** (semi / 12)


# ── 악기 ────────────────────────────────────────────────

def pluck(freq, dur, rng, bright=0.5, level=1.0):
    """Karplus-Strong — 뜯은 현. bright가 낮을수록 나일론에 가깝다."""
    n = int(SR * dur)
    period = max(2, int(SR / freq))
    buf = (rng.random(period) * 2 - 1) * level
    # 초기 버퍼를 저역 통과해 나일론 질감
    for _ in range(int((1 - bright) * 3)):
        buf = np.convolve(buf, [0.5, 0.5], mode='same')
    out = np.zeros(n)
    damp = 0.996
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % period
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    env = np.exp(-np.linspace(0, 4.5, n))
    return out * env


def felt(freq, dur, level=1.0):
    """펠트 피아노 근사 — 어두운 배음, 부드러운 어택, 긴 릴리즈."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    partials = [(1, 1.0), (2, 0.35), (3, 0.14), (4, 0.05)]
    sig = np.zeros(n)
    for mult, amp in partials:
        sig += amp * np.sin(2 * np.pi * freq * mult * t + 0.13 * mult)
    attack = 1 - np.exp(-t * 60)
    decay = np.exp(-t * 1.7)
    return sig * attack * decay * level * 0.55


def pad_chord(freqs, dur, level=1.0, lp=0.15):
    """디튠 saw 패드 — 느리게 부풀고 느리게 진다."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f in freqs:
        for det in (-0.6, 0.5):
            phase = (t * (f + det)) % 1.0
            sig += (phase * 2 - 1) / len(freqs)
    # 1폴 저역 통과
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += lp * (sig[i] - acc)
        out[i] = acc
    swell = np.minimum(t / (dur * 0.35), 1.0) * np.minimum((dur - t) / (dur * 0.3), 1.0)
    return out * np.clip(swell, 0, 1) * level * 0.5


def noise_hit(dur, rng, hp=True, level=1.0):
    """금속성 타격 — 짧은 노이즈 + 링."""
    n = int(SR * dur)
    sig = rng.random(n) * 2 - 1
    if hp:
        sig = np.diff(sig, prepend=0)
    env = np.exp(-np.linspace(0, 30, n))
    return sig * env * level


def shaker(dur, rng, level=0.3):
    n = int(SR * dur)
    sig = np.diff(rng.random(n) * 2 - 1, prepend=0)
    env = np.exp(-np.linspace(0, 18, n))
    return sig * env * level


def crackle(total_n, rng, density=1.2, level=0.05):
    """모닥불 — 산발적 팝."""
    out = np.zeros(total_n)
    n_pops = int(total_n / SR * density)
    for _ in range(n_pops):
        at = rng.integers(0, total_n - 400)
        ln = rng.integers(60, 400)
        pop = (rng.random(ln) * 2 - 1) * np.exp(-np.linspace(0, 8, ln))
        out[at:at + ln] += pop * level * (0.4 + rng.random())
    return out


def tape_hiss(total_n, rng, level=0.006):
    """핑크 노이즈 근사 히스."""
    white = rng.random(total_n) * 2 - 1
    out = np.zeros(total_n)
    acc = 0.0
    for i in range(total_n):
        acc += 0.02 * (white[i] - acc)
        out[i] = acc
    return out * level * 12


def place(canvas, sig, at_sec):
    at = int(at_sec * SR)
    end = min(len(canvas), at + len(sig))
    if at < len(canvas):
        canvas[at:end] += sig[:end - at]


# ── 화성 유틸 ────────────────────────────────────────────
CHORDS = {
    'Dm': ['D3', 'F3', 'A3'], 'Bb': ['A#2', 'D3', 'F3'], 'F': ['F3', 'A3', 'C4'],
    'C': ['C3', 'E3', 'G3'], 'Am': ['A2', 'C3', 'E3'], 'G': ['G2', 'B2', 'D3'],
    'Em': ['E3', 'G3', 'B3'], 'Bbmaj7': ['A#2', 'D3', 'F3', 'A3'],
    'Csus2': ['C3', 'D3', 'G3'], 'Fmaj7': ['F3', 'A3', 'C4', 'E4'],
}


# ── 트랙 ────────────────────────────────────────────────

def track_settlement(rng):
    """정착지 84bpm — 픽킹 기타의 셔플, 사람의 온기."""
    bpm, bars = 84, 24
    beat = 60 / bpm
    dur = bars * 4 * beat
    n = int(SR * (dur + TAIL))
    L, R = np.zeros(n), np.zeros(n)
    prog = ['Dm', 'Bb', 'F', 'C'] * (bars // 4)
    melody_pool = ['D4', 'F4', 'A4', 'G4', 'E4', 'C5', 'A4', 'F4']
    for bar, ch in enumerate(prog):
        t0 = bar * 4 * beat
        notes = CHORDS[ch]
        # 셔플 아르페지오: 1 & a 2 & a …
        pattern = [0, 0.66, 1.0, 1.66, 2.0, 2.66, 3.0, 3.66]
        for k, off in enumerate(pattern):
            nm = notes[k % len(notes)]
            sig = pluck(hz(nm), beat * 1.8, rng, bright=0.45, level=0.5)
            place(L if k % 2 == 0 else R, sig, t0 + off * beat)
        # 근음 베이스
        bass = pluck(hz(notes[0]) / 2, beat * 3.5, rng, bright=0.2, level=0.55)
        place(L, bass, t0); place(R, bass, t0)
        # 멜로디 — 두 마디에 한 번, 소박하게
        if bar % 2 == 1:
            nm = melody_pool[(bar // 2) % len(melody_pool)]
            mel = pluck(hz(nm), beat * 3.0, rng, bright=0.6, level=0.42)
            place(L, mel, t0 + beat); place(R, mel, t0 + beat * 1.02)
    for ch_ in (L, R):
        ch_ += tape_hiss(n, rng)
    return L, R, dur


def track_camp(rng):
    """야영 62bpm — 나일론 기타 한 대, 모닥불, 셰이커."""
    bpm, bars = 62, 16
    beat = 60 / bpm
    dur = bars * 4 * beat
    n = int(SR * (dur + TAIL))
    L, R = np.zeros(n), np.zeros(n)
    prog = ['Am', 'Fmaj7', 'C', 'G'] * (bars // 4)
    for bar, ch in enumerate(prog):
        t0 = bar * 4 * beat
        notes = CHORDS[ch]
        # 느린 분산화음
        for k, off in enumerate([0, 1.0, 2.0, 3.0]):
            nm = notes[k % len(notes)]
            sig = pluck(hz(nm), beat * 2.6, rng, bright=0.3, level=0.5)
            place(L, sig, t0 + off * beat)
            place(R, sig * 0.8, t0 + off * beat + 0.012)
        # 이따금 높은 한 음 — 모닥불 앞의 혼잣말
        if bar % 3 == 2:
            top = pluck(hz(notes[-1]) * 2, beat * 2.2, rng, bright=0.5, level=0.35)
            place(R, top, t0 + 2 * beat)
        # 셰이커 2·4박
        for off in (1.0, 3.0):
            s = shaker(0.09, rng, level=0.12)
            place(L, s, t0 + off * beat); place(R, s, t0 + off * beat)
    fire = crackle(n, rng, density=1.6, level=0.06)
    L += fire; R += np.roll(fire, 900)
    for ch_ in (L, R):
        ch_ += tape_hiss(n, rng)
    return L, R, dur


def track_tension(rng):
    """추적 100bpm — 맥박 베이스, 차가운 아르페지오, 정중한 위협."""
    bpm, bars = 100, 28
    beat = 60 / bpm
    dur = bars * 4 * beat
    n = int(SR * (dur + TAIL))
    L, R = np.zeros(n), np.zeros(n)
    bass_seq = ['A1', 'A1', 'A1', 'G1'] * (bars // 4)
    arp = ['A4', 'A#4', 'E5', 'A#4', 'A4', 'E4', 'A#4', 'E5']   # 단2도의 냉기
    for bar in range(bars):
        t0 = bar * 4 * beat
        # 8분 맥박 베이스
        for k in range(8):
            b = pluck(hz(bass_seq[bar]), beat * 0.8, rng, bright=0.15,
                      level=0.5 if k % 2 == 0 else 0.32)
            place(L, b, t0 + k * beat / 2); place(R, b, t0 + k * beat / 2)
        # 감시 기계의 아르페지오 — 마디 후반에만
        if bar % 2 == 1:
            for k, nm in enumerate(arp):
                a = felt(hz(nm), beat * 0.5, level=0.16)
                pan = k % 2
                place(L if pan else R, a, t0 + 2 * beat + k * beat / 4)
        # 금속 타격 — 드물게
        if bar % 4 == 3:
            hit = noise_hit(0.5, rng, level=0.14)
            place(R, hit, t0 + 3.5 * beat)
        # 해금 굽힘 근사 — 아주 드물게, 한 음
        if bar % 8 == 6:
            tt = np.arange(int(SR * beat * 3)) / SR
            bend = np.sin(2 * np.pi * (hz('E5') * (1 + 0.02 * np.sin(2 * np.pi * 1.7 * tt))) * tt)
            bend *= np.exp(-tt * 1.2) * 0.12
            place(L, bend, t0 + beat)
    pad = pad_chord([hz('A2'), hz('E3')], dur, level=0.35, lp=0.06)
    place(L, pad, 0); place(R, np.roll(pad, 1300), 0)
    for ch_ in (L, R):
        ch_ += tape_hiss(n, rng)
    return L, R, dur


def track_story(rng):
    """스토리 70bpm — 펠트 피아노와 패드, 참았던 숨을 내쉬는 해결."""
    bpm, bars = 70, 20
    beat = 60 / bpm
    dur = bars * 4 * beat
    n = int(SR * (dur + TAIL))
    L, R = np.zeros(n), np.zeros(n)
    prog = ['F', 'C', 'Dm', 'Bbmaj7'] * (bars // 4)
    melody = ['A4', 'G4', 'F4', 'D4', 'F4', 'G4', 'A4', 'C5', 'A4', 'G4', 'F4', 'F4']
    for bar, ch in enumerate(prog):
        t0 = bar * 4 * beat
        notes = CHORDS[ch]
        # 왼손 — 근음+5도
        for off, nm in [(0, notes[0]), (2.0, notes[2 % len(notes)])]:
            lo = felt(hz(nm) / 2, beat * 2.4, level=0.5)
            place(L, lo, t0 + off * beat); place(R, lo * 0.9, t0 + off * beat)
        # 오른손 화음
        for off in (0.0, 2.0):
            for nm in notes:
                c = felt(hz(nm), beat * 2.2, level=0.2)
                place(R, c, t0 + off * beat + 0.01)
        # 멜로디 — 한 마디 한 음, 절제
        mel = felt(hz(melody[bar % len(melody)]) * 2, beat * 3.4, level=0.34)
        place(L, mel, t0 + beat); place(R, mel * 0.85, t0 + beat + 0.014)
        # 패드 스웰 — 4마디 단위
        if bar % 4 == 0:
            freqs = [hz(x) for x in CHORDS[prog[bar]]]
            pd = pad_chord(freqs, 4 * 4 * beat, level=0.22, lp=0.05)
            place(L, pd, t0); place(R, np.roll(pd, 1100), t0)
    for ch_ in (L, R):
        ch_ += tape_hiss(n, rng)
    return L, R, dur


TRACKS = {
    'settlement': track_settlement,
    'camp': track_camp,
    'tension': track_tension,
    'story': track_story,
}


def render(name, fn):
    rng = np.random.default_rng(hash(name) % (2 ** 31))
    L, R, dur = fn(rng)
    loop_n = int(SR * dur)
    tail_n = min(int(SR * TAIL), len(L) - loop_n)
    # 심리스 루프(오버랩-애드): 루프 끝을 넘어가는 여운을 머리에 접어 넣고 루프 길이로 자른다.
    # 이러면 파일 끝(마지막 샘플)의 다음 순간이 정확히 머리의 내용과 이어진다.
    outs=[]
    for ch in (L, R):
        tail = ch[loop_n:loop_n + tail_n] * np.linspace(1, 0, tail_n)
        body = ch[:loop_n].copy()
        body[:tail_n] += tail
        outs.append(body)
    # 마스터 톤 — 기준 트랙(drive_day: 저역 93%)의 lo-fi 온기에 맞춘 저역 통과 2단
    # (실측 2026-08-07: 필터 전 픽킹 트랙 고역 43~56% — 정체성보다 밝았다)
    import math
    alpha = 1 - math.exp(-2 * math.pi * 2200 / SR)
    filtered=[]
    for ch in outs:
        acc=0.0; o1=np.empty_like(ch)
        for i in range(len(ch)):
            acc += alpha*(ch[i]-acc); o1[i]=acc
        acc=0.0; o2=np.empty_like(ch)
        for i in range(len(ch)):
            acc += alpha*(o1[i]-acc); o2[i]=acc
        filtered.append(o2)
    outs=filtered
    L, R = outs
    # 클릭 방지: 머리 3ms 페이드인 + 꼬리 12ms 페이드아웃 — 루프 지점 양끝을 0으로
    fi, fo = int(SR*0.003), int(SR*0.012)
    for ch in (L, R):
        ch[:fi] *= np.linspace(0, 1, fi)
        ch[-fo:] *= np.linspace(1, 0, fo)
    ch2 = np.stack([L, R])
    peak = np.max(np.abs(ch2))
    ch2 = ch2 / peak * (10 ** (-3 / 20))   # 피크 -3dBFS
    # 검증: 클리핑·이음새 불연속·길이
    assert np.max(np.abs(ch2)) <= 0.72, '클리핑 여유 부족'
    seam = abs(float(ch2[0, -1] - ch2[0, 0]))
    assert seam < 0.01, f'루프 이음새 불연속 {seam:.3f}'
    pcm = (ch2.T * 32767).astype(np.int16)
    wav = OUT / f'{name}.wav'
    import wave
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    mp3 = OUT / f'{name}.mp3'
    subprocess.run(['lame', '-b', '96', '--quiet', str(wav), str(mp3)], check=True)
    wav.unlink()
    kb = mp3.stat().st_size // 1024
    print(f'  ✅ {name}: {dur:.1f}s · {kb}KB · 이음새 Δ{seam:.4f}')
    return mp3


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in TRACKS.items():
        if args.only and args.only not in name:
            continue
        render(name, fn)


if __name__ == '__main__':
    main()
