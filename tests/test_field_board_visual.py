#!/usr/bin/env python3
"""Visual contract for the 7-city Field Board surface finish."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "서울까지400km.html").as_uri()
CITIES = {
    'gwangju': ((85,53,40),(47,35,31),(246,199,135)),
    'miryang': ((100,84,58),(53,48,38),(246,215,157)),
    'daegu': ((45,49,51),(30,34,36),(239,194,129)),
    'muju': ((36,38,38),(26,29,30),(240,209,153)),
    'jeonju': ((56,51,46),(35,35,34),(244,207,153)),
    'daejeon': ((44,56,64),(30,37,41),(171,214,199)),
    'suwon': ((54,58,52),(34,37,36),(239,204,147)),
}
MODES = ('market','garage','people','alley')
BOOT = """({city,mode}) => {
  localStorage.clear(); G.newGame('onroad','다온','full');
  document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));
  document.querySelector('#scr-game').classList.add('on');
  S.at=city; S.known=[...new Set([...S.known,city])]; S.visited=[...new Set([...S.visited,city])];
  S.scrap=999; S.fuel=40; S.water=99; S.food=99; S.van=60; S.items['부품']=99; S.items['의약품']=9;
  S.party=['minji']; S._stlField={daily:{},once:{},impact:{},log:[]}; UI.renderAll(); UI.showStl(city,mode);
}"""

def channels(value):
    nums = [float(part) for part in re.findall(r"[0-9.]+", value)]
    if value.startswith('color(srgb'):
        return tuple(round(channel * 255) for channel in nums[:3])
    return tuple(round(channel) for channel in nums[:3])

def close(actual, expected, tolerance=2):
    return all(abs(a-b) <= tolerance for a,b in zip(channels(actual), expected))

def luminance(rgb):
    values=[]
    for channel in rgb:
        value=channel/255
        values.append(value/12.92 if value <= .04045 else ((value+.055)/1.055)**2.4)
    return .2126*values[0]+.7152*values[1]+.0722*values[2]

def contrast(left, right):
    hi,lo=sorted((luminance(left),luminance(right)),reverse=True)
    return (hi+.05)/(lo+.05)

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.goto(URL)
    for city,(head_expected,body_expected,title_expected) in CITIES.items():
        page.evaluate(BOOT,{'city':city,'mode':'market'})
        board=page.locator('[data-field-board="market"]')
        metrics=board.evaluate("""node=>{
          const probe=document.createElement('i');
          const color=name=>{probe.style.color=`var(${name})`;node.appendChild(probe);const out=getComputedStyle(probe).color;probe.remove();return out};
          const dots=getComputedStyle(node.querySelector('.field-board-head'),'::after');
          const note=node.querySelector('.field-board-note'),row=node.querySelector('#trade .field-board-row');
          return {head:color('--fb-head-bg'),body:color('--fb-body-bg'),title:color('--fb-title'),
            dotsOpacity:dots.opacity,dotsSize:dots.backgroundSize,noteBg:getComputedStyle(note).backgroundImage,
            rowBg:getComputedStyle(row).backgroundImage,noteBorder:getComputedStyle(note).borderLeftWidth,
            pinContent:getComputedStyle(note,'::before').content};
        }""")
        assert close(metrics['head'],head_expected),(city,metrics)
        assert close(metrics['body'],body_expected),(city,metrics)
        assert close(metrics['title'],title_expected),(city,metrics)
        assert contrast(title_expected,head_expected)>=4.5,(city,contrast(title_expected,head_expected))
        assert metrics['dotsOpacity']=='0.5' and metrics['dotsSize']=='3px 3px',(city,metrics)
        assert metrics['noteBg']!=metrics['rowBg'] and metrics['noteBorder']=='2px',(city,metrics)
        assert metrics['pinContent'] not in ('none','normal',''),(city,metrics)

    page.close()
    page=browser.new_page(viewport={'width':320,'height':578},device_scale_factor=1)
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.goto(URL)
    for city in CITIES:
        for mode in MODES:
            page.evaluate(BOOT,{'city':city,'mode':mode})
            board=page.locator(f'[data-field-board="{mode}"]')
            assert board.evaluate('node=>node.scrollWidth<=node.clientWidth+1'),(city,mode,'board overflow')
            assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),(city,mode,'page overflow')
            assert board.locator('.field-board-row').evaluate_all("""rows=>rows.every(row=>{
              const copy=row.querySelector('.field-board-row-copy'),meta=row.querySelector('.field-board-row-meta');
              if(!copy||!meta)return true;const a=copy.getBoundingClientRect(),b=meta.getBoundingClientRect();
              return a.right<=b.left+1&&b.right<=innerWidth+1;
            })"""),(city,mode,'row text/meta overlap')
    assert not errors,errors
    browser.close()

print('✅ 현장 판 시각 마감 · 7도시 색/대비/재질 · 28화면 320px 정렬 통과')
