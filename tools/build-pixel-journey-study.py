from pathlib import Path
import random,json
root=Path(__file__).resolve().parents[1];p=root/'tools/design-drafts'
r=random.Random(66)
def rect(x,y,w,h,c,extra=''):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" {extra}/>'
sky=''.join(rect(r.randrange(8,234),r.randrange(4,59),1,1,r.choice(['#8b9d99','#667e80','#455f67'])) for _ in range(47))
mountains='<path d="M0 73V60H9V57H17V53H28V49H36V53H44V60H57V63H66V57H75V52H84V49H94V54H105V59H115V63H130V57H138V54H147V49H160V53H173V56H185V51H192V47H207V54H216V60H232V65H240V88H0" fill="#263e46"/><path d="M0 85V71H14V67H24V72H42V75H55V69H71V66H86V74H111V72H133V68H145V65H161V71H179V76H201V68H214V65H227V72H240V91H0" fill="#263d3d"/>'
trees=''
for x,y,s in [(5,84,1),(25,91,1.3),(54,86,.85),(76,86,.7),(225,85,1.2),(239,98,1.5)]:
 trees+=f'<g transform="translate({x} {y}) scale({s})">'+rect(-1,-31,2,34,'#172e30')+'<path d="M-3-35H3V-30H6V-26H9V-23H4V-20H10V-16H13V-12H6V-9H15V-5H5V0H-5V-5H-15V-9H-6V-12H-13V-16H-10V-20H-4V-23H-9V-26H-6V-30H-3Z" fill="#1a3434"/></g>'
ground=rect(0,95,240,49,'#253b35')+rect(0,107,240,37,'#293e33')
for i in range(160):
 x,y=r.randrange(240),r.randrange(97,144);ground+=rect(x,y,r.choice([1,2,3,5]),1,r.choice(['#31473a','#344939','#22362f','#394d3d']))
van=rect(82,117,140,4,'#142b28')+rect(85,54,92,54,'#797b68')+rect(88,57,86,47,'#92917a')+rect(88,57,86,3,'#b0a58a')+rect(86,91,90,3,'#676d5c')+rect(86,104,91,6,'#4c5b50')+rect(87,59,2,42,'#525f52')
# Rear doors and worn side boards.
van+=rect(90,63,10,35,'#757c68')+rect(94,63,1,35,'#4e5c51')+rect(91,79,2,2,'#c0ad7c')
for x in [104,134]:
 van+=rect(x-2,65,20,22,'#505c50')+rect(x,67,16,17,'#c49a55')+rect(x+2,69,12,13,'#e6b66b')+rect(x+7,67,1,17,'#776d4d')+rect(x,82,16,2,'#a38751')
van+=rect(162,66,9,21,'#6c7765')+rect(164,68,5,17,'#3b524f')
for i in range(33):
 x,y=r.randrange(100,171),r.randrange(57,103);van+=rect(x,y,r.choice([1,2,3]),1,r.choice(['#787e67','#a29b7e','#646e5c']))
van+=rect(100,45,47,10,'#394d43')+rect(104,43,19,3,'#4d5c4c')+rect(109,45,1,10,'#8f8d68')+rect(133,44,1,11,'#8f8d68')
for x in [151,161]:van+=rect(x,43,8,12,'#7e4838')+rect(x+2,41,4,2,'#b18b59')+rect(x+2,46,1,7,'#a36142')
van+=rect(84,53,94,2,'#475b4b')+rect(175,36,1,19,'#263f37')+rect(174,35,3,1,'#738370')
# Korean cab-over, canonical grey-beige body, faded white X.
van+='<path d="M177 73H198V76H203V81H208V90H215V108H177Z" fill="#858773"/><path d="M180 77H196V80H201V88H180Z" fill="#354e52"/>'+rect(181,78,10,1,'#5b7170')+rect(197,81,2,6,'#698080')+rect(177,92,36,2,'#a49d7d')+rect(180,94,17,13,'#7b816c')+rect(180,91,2,3,'#414e43')+rect(183,94,3,1,'#485749')+rect(207,94,6,3,'#dfbc77')+rect(208,101,6,5,'#505e50')+rect(213,104,4,5,'#334a3e')+rect(86,102,2,5,'#9e4c38')
van+='<path d="M183 98H185V100H187V102H189V104H187V102H185V104H183V102H185V100H183Z" fill="#c4c1a0"/>'
for x in [106,201]:
 van+='<g>'+rect(x-8,106,16,13,'#142b29')+rect(x-6,103,12,19,'#142b29')+rect(x-8,108,16,9,'#172d2b')+rect(x-5,106,10,13,'#293d35')+rect(x-3,109,6,7,'#526451')+rect(x-1,111,2,3,'#7d8464')+rect(x-6,106,2,2,'#374b3e')+'</g>'
# Open maintenance access above the front wheel.
van+=rect(196,96,9,8,'#203831')+rect(198,98,5,4,'#485a47')+rect(200,100,2,2,'#afad82')+rect(196,94,10,2,'#ac9e76')
# Portable work lamp and toolkit, independent of the character.
lamp=rect(218,108,2,22,'#142f2a')+rect(215,130,8,2,'#1b332b')+rect(215,104,8,6,'#6e7455')+rect(216,105,6,3,'#eed18b')+'<path d="M216 109L192 124H225L222 109Z" fill="#e7bb64" opacity=".07"/>'
box=rect(155,124,16,7,'#3d5443')+rect(155,124,16,2,'#8e8961')+rect(160,122,6,2,'#263e32')+rect(162,127,2,2,'#b5a46c')
# Minji: black ponytail, mechanic goggles, worn charcoal workwear and tool pouch.
minji='<g class="minji">'+rect(175,124,11,5,'#263b32')+rect(172,127,13,3,'#162e29')+rect(185,126,9,3,'#1b322b')+rect(175,117,9,8,'#3a4a3a')+rect(181,119,6,8,'#4a5740')+rect(173,122,4,4,'#5b5e40')+'<g class="torso">'+rect(176,105,10,13,'#32463c')+rect(174,108,3,9,'#283d35')+rect(178,106,2,10,'#566044')+rect(181,110,4,2,'#21392f')+rect(175,116,10,2,'#6b6947')+rect(173,117,5,6,'#746748')+rect(174,118,3,2,'#a08b58')
minji+='<g class="head">'+rect(176,93,10,12,'#ad8965')+rect(180,95,7,8,'#c69b70')+rect(185,97,3,3,'#c69b70')+rect(185,96,1,1,'#28352c')+rect(182,102,3,1,'#76543e')+rect(175,91,11,5,'#172d2a')+rect(174,94,3,8,'#172d2a')+rect(174,90,9,2,'#283b31')+rect(172,92,3,4,'#142b28')+'<g class="ponytail">'+rect(169,94,4,4,'#142b28')+rect(167,97,4,5,'#142b28')+rect(168,101,2,4,'#1e342b')+'</g>'+rect(177,91,3,2,'#a58e58')+rect(182,91,3,2,'#a58e58')+rect(178,91,1,1,'#d0b775')+rect(183,91,1,1,'#d0b775')+'</g>'
minji+=rect(185,106,4,5,'#3e5140')+rect(186,109,3,4,'#647050')+'<g class="ratchet">'+rect(187,110,8,3,'#455740')+rect(193,109,3,3,'#9f8a60')+rect(195,109,6,1,'#b4b89a')+rect(199,108,3,3,'#8f9d7a')+rect(200,109,1,1,'#354b38')+'</g></g></g>'
# Camp fire: a functioning ambient loop, no action needed.
fire='<g class="fire-pool"><ellipse cx="52" cy="127" rx="31" ry="8" fill="#c89143" opacity=".07"/><ellipse cx="52" cy="127" rx="19" ry="5" fill="#c89143" opacity=".09"/></g>'
for x,y in [(40,129),(47,132),(55,132),(62,128),(56,126),(43,125)]:fire+=rect(x,y,5,3,'#69715a')+rect(x+1,y,3,1,'#94906b')
fire+='<path d="M43 126H59V129H43Z" fill="#70472e"/><path d="M46 125H62V127H46Z" fill="#956238"/><g class="flame flame-one"><path d="M45 126V120H48V114H50V110H52V117H55V121H58V126Z" fill="#c97737"/><path d="M48 126V120H50V117H52V121H55V126Z" fill="#efb85b"/><path d="M50 126V122H53V126Z" fill="#f6d887"/></g><g class="flame flame-two"><path d="M53 127V121H56V116H58V112H60V120H62V124H61V127Z" fill="#d58d40"/><path d="M56 127V121H59V125H60V127Z" fill="#f0c76c"/></g><g class="ember e1">'+rect(50,114,1,1,'#e9bb6b')+'</g><g class="ember e2">'+rect(57,118,1,1,'#bf8c50')+'</g><g class="smoke s1">'+rect(49,107,4,2,'#94a18a')+rect(51,105,3,2,'#94a18a')+'</g><g class="smoke s2">'+rect(52,109,5,2,'#94a18a')+'</g>'
def world(content,label):
 return f'<svg viewBox="0 0 240 144" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}" shape-rendering="crispEdges">{content}</svg>'
def person(x,y,role='resident',color='#697252'):
 goggles=role=='minji';cap=role=='driver'
 s=rect(-5,-27,9,10,'#b18e69')+rect(3,-24,2,3,'#b18e69')+rect(2,-25,1,1,'#1e322c')+rect(-5,-29,10,4,'#172e2a')
 if goggles:s+=rect(-8,-27,3,6,'#142b27')+rect(-10,-22,3,5,'#142b27')+rect(-3,-28,2,2,'#b19a62')+rect(1,-28,2,2,'#b19a62')
 if cap:s+=rect(-6,-29,12,3,'#657353')+rect(4,-27,3,1,'#657353')
 s+=rect(-5,-17,10,12,color)+rect(-6,-15,2,9,'#314b39')+rect(4,-15,2,8,'#314b39')+rect(-5,-7,10,2,'#7a7450')
 s+='<g class="leg-left">'+rect(-5,-5,4,6,'#2c4234')+rect(-6,0,5,2,'#1a302b')+'</g><g class="leg-right">'+rect(1,-5,4,6,'#334735')+rect(1,0,6,2,'#1a302b')+'</g>'
 return f'<g transform="translate({x} {y})"><g class="person-{role}">{s}</g></g>'
# Daytime road, with three independently scrolling depth layers.
road_sky=rect(0,0,240,144,'#87978b')+rect(194,19,9,9,'#d6c69a')
farhill='<path d="M0 81V67H12V63H25V58H36V54H47V58H61V63H77V70H91V65H103V61H117V57H129V60H145V66H159V62H171V56H182V59H197V65H215V69H228V67H240V96H0Z" fill="#546e68"/>'
roadfar='<g class="far-scroll">'+farhill+f'<g transform="translate(240 0)">{farhill}</g></g>'
roadtrees='<g class="tree-scroll">'+trees.replace('#1a3434','#3c594b').replace('#172e30','#3c5040')+f'<g transform="translate(240 0)">{trees}</g></g>'
roadground=rect(0,91,240,16,'#697956')+rect(0,107,240,37,'#465752')+rect(0,107,240,2,'#b1ac82')
marks='<g class="road-scroll">'+''.join(rect(x,132,17,1,'#b4b18c') for x in range(-40,321,40))+'</g>'
clouds='<g class="cloud-scroll">'+rect(33,22,31,3,'#b8c0a1')+rect(41,19,17,3,'#b8c0a1')+rect(123,34,37,3,'#acb99f')+rect(131,31,22,3,'#acb99f')+'</g>'
travel=world(road_sky+clouds+roadfar+roadtrees+roadground+marks+'<g transform="translate(-31 -5)"><g class="driving-van">'+van+rect(143,74,3,5,'#3b493c')+'</g></g><g class="road-dust">'+rect(48,120,6,1,'#a8ab8355')+rect(41,118,4,1,'#a8ab8333')+'</g>','픽셀 산과 나무가 흐르고 달구지가 달리는 길')
# Korean market, with striped awnings, steaming pot, walkers and the same van.
town=rect(0,0,240,144,'#9ba18a')+mountains.replace('#263e46','#73816a').replace('#263d3d','#7f886b')+rect(0,80,240,64,'#686e50')
for i in range(90):town+=rect(r.randrange(240),r.randrange(83,144),r.choice([1,2,4]),1,r.choice(['#717655','#5c694e','#7c7d57']))
for x,w,h in [(4,43,50),(49,42,39),(100,38,55),(146,40,43),(190,46,52)]:
 town+=rect(x,82-h,w,h,'#6d765a')+rect(x-1,80-h,w+2,3,'#454f42')+rect(x+5,87-h,7,9,'#465d51')+rect(x+w-13,87-h,7,9,'#55664f')
 town+=rect(x+w-9,77-h,5,3,'#465645')
town+=rect(13,69,78,3,'#8c6d44')+rect(15,72,74,5,'#8c6d44')
for i in range(8):town+=rect(15+i*9,72,9,5,'#8e6849' if i%2 else '#b5a077')
town+=rect(16,77,2,39,'#4b5540')+rect(86,77,2,39,'#4b5540')+rect(21,105,64,4,'#8e7850')+rect(23,109,60,18,'#5e6142')+rect(27,112,8,4,'#7c7650')+rect(68,112,10,6,'#7c7650')
town+=rect(42,98,15,8,'#3d5445')+rect(40,97,19,2,'#abb18b')+rect(44,99,11,2,'#819374')
town+='<g class="pot-steam smoke s1">'+rect(45,93,4,2,'#d8d4ab')+rect(47,90,3,2,'#d8d4ab')+'</g><g class="pot-steam smoke s2">'+rect(50,94,3,2,'#d8d4ab')+'</g>'
town+=person(61,103,'vendor','#7b7750')+'<g class="market-walker">'+person(114,126,'resident','#5f6d52')+'</g>'
town+='<g transform="translate(100 48) scale(.55)">'+van+'</g>'+person(192,129,'minji','#3d5141')+rect(0,139,240,5,'#314b37')
market=world(town,'有머름이 피어오르는 밀양 장터와 오가는 사람들'.replace('有머름','김'))
# Outdoor camp reuses the approved code-native actors, never a painted backdrop.
camp=world(rect(0,0,240,144,'#172c36')+sky+rect(26,20,5,5,'#9fae9e')+mountains+trees+ground+van+lamp+box+minji+person(78,129,'driver','#4d5e43')+fire,'밤 야영지에서 민지가 수리하고 모닥불이 타는 픽셀 장면')
# Entire interior is also code-native pixel art.
inside=rect(0,0,240,144,'#4b4c37')+rect(0,0,240,8,'#313e31')+rect(0,8,9,136,'#293c30')+rect(231,8,9,136,'#293c30')+rect(9,124,222,20,'#5a573c')
for x in range(16,231,17):inside+=rect(x,9,1,116,'#353f30')+rect(x+1,9,1,116,'#646044')
for x in range(10,231,25):inside+=f'<path d="M{x} 144L{x+5} 124H{x+6}L{x+1} 144Z" fill="#383f2e"/>'
inside+=rect(22,24,61,56,'#263f3b')+rect(26,28,53,48,'#223d46')+rect(27,65,51,10,'#304e4a')+rect(49,28,2,48,'#667055')+rect(27,47,51,2,'#667055')+rect(33,37,1,1,'#b4b58b')+rect(69,31,1,1,'#b4b58b')
inside+=rect(16,90,75,9,'#7c7651')+rect(19,99,69,25,'#454d35')+rect(23,88,58,4,'#b1a376')+rect(21,90,19,8,'#c4b38a')+rect(43,92,42,5,'#69744f')
inside+=rect(146,85,79,6,'#90794c')+rect(150,91,4,35,'#4c4a32')+rect(216,91,4,35,'#4c4a32')+rect(156,87,58,2,'#afa076')
inside+=rect(165,79,10,5,'#b5a775')+rect(167,77,7,2,'#ced0a0')+rect(165,84,11,1,'#4b5740')+rect(194,78,16,7,'#354e3e')+rect(197,80,2,3,'#b5ba85')
inside+=rect(138,24,87,3,'#8c784c')+rect(141,27,2,8,'#3c4932')+rect(217,27,2,8,'#3c4932')+rect(162,19,12,5,'#526a4c')+rect(183,17,7,7,'#867a4d')
inside+='<g class="inside-lamp work-light">'+rect(114,9,2,13,'#263d30')+rect(110,22,10,13,'#8f7845')+rect(112,24,6,9,'#e7bc6f')+rect(113,25,4,6,'#f1d49b')+'<path d="M111 35L79 116H154L119 35Z" fill="#d8ab57" opacity=".06"/></g>'
inside+=rect(198,104,12,4,'#7d8057')+rect(203,103,2,7,'#9b9e73')+minji+box
room=world(inside,'같은 픽셀로 그린 달구지 내부와 민지의 공구 정리')
def speech(who,text,href=None,cls=''):
 tag='a' if href else 'div';attr=f' href="#{href}"' if href else ''
 return f'<{tag} class="speech {cls}"{attr}><b>{who}</b><span>{text}</span>{"<small>다음 ›</small>" if href else ""}</{tag}>'
def stage(key,title,clock,worldsvg,bubbles,activity,desc,link,label):
 return f'<section id="{key}" class="journey-screen {key}" aria-label="{title}"><header class="location"><h2>{title}</h2><span>{clock}</span></header><div class="world">{worldsvg}{bubbles}</div><div class="activity"><span class="activity-label">{activity}</span><p>{desc}</p><a class="primary" href="#{link}">{label}<span>→</span></a></div></section>'
travelUI=stage('drive','밀양으로 가는 길','DAY 2 · 늦은 오후',travel,speech('민지','저기 불빛 보여? 저 마을에서 쉬자.',None,'road-speech'),'이동 중','가까운 길과 먼 산이 서로 다른 속도로 흐른다.','town','밀양 장터에 정차')
townUI=stage('town','밀양 장터','DAY 2 · 해 질 무렵',market,speech('장터 상인','따뜻할 때 드셔요. 오늘 끓인 거예요.',None,'market-speech'),'마을에 머무는 중','솥에서는 김이 나고, 사람들은 제 일을 한다.','camp','외곽에서 야영 준비')
anchors='<span id="camp-next" class="anchor"></span><span id="camp-reply" class="anchor"></span><span id="camp-done" class="anchor"></span>'
campBubbles=anchors+speech('민지','대장님, 작업등 이쪽으로 조금만.','camp-next','bubble-one')+speech('나','이렇게 비춰 주면 돼?','camp-reply','bubble-two player-speech')+speech('민지','응, 딱 좋아. 조금만 더 조이면 돼.','camp-done','bubble-three')+speech('민지','됐어. 오늘은 여기까지만 하자.',None,'bubble-four')
campUI=stage('camp','밀양 외곽 야영지','DAY 2 · 밤',camp,campBubbles,'수리 중','대화하는 동안에도 불과 작업 동작은 이어진다.','inside','차 안으로 들어가기')
roomUI=stage('inside','달구지 안','DAY 2 · 잠들기 전',room,speech('민지','공구는 여기 둘게. 내일 바로 꺼내 쓰게.',None,'inside-speech'),'내일을 준비하는 중','밖의 소란이 잦아들고 등 하나가 남았다.','drive','다시 길 위로')
html='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>서울까지 400km · 픽셀로 이어지는 하루</title><link rel="stylesheet" href="pixel-journey.css"></head><body><main class="journey"><div class="study-head"><p>CARAVAN · PIXEL JOURNEY STUDY</p><h1>같은 세계에서, 하루를 보내다.</h1><span>이동부터 대화까지 한 번 이어 보세요.</span></div><div class="game"><nav class="places" aria-label="장면 둘러보기"><a href="#drive">이동</a><a href="#town">마을</a><a href="#camp">야영</a><a href="#inside">차 안</a></nav>'''+travelUI+townUI+campUI+roomUI+'''</div><div class="review"><label><input type="checkbox" id="dock"> 대화를 하단에 표시</label><label><input type="checkbox" id="pause"> 움직임 멈춤</label></div><details class="art-option"><summary>고화질 그림을 함께 쓴다면?</summary><figure><img src="../../assets/scenes/comp-minji-underbody-night-v1.webp" alt="작업등 아래 달구지를 점검하는 민지의 기존 정본 그림"><figcaption>중요한 만남이나 발견에서 선택해서 크게 보는 방식. 평소 플레이는 위의 픽셀 장면으로 이어집니다.</figcaption></figure></details><p class="scope">네 종류의 배경·인물·차량을 모두 코드 픽셀로 만든 방향 시안입니다. 말풍선은 연출 비교용 예문이며, 실제 게임의 대사·자원·시간·저장과 연결되지 않았습니다. 고화질 그림의 사용 여부도 아직 선택할 수 있어요.</p><footer>디자인 초안 · 게임 전체에 아직 적용하지 않았어요.</footer></main></body></html>'''
(p/'pixel-journey.html').write_text(html)
oldcss=(p/'pixel-camp-life.css').read_text();animations=oldcss[oldcss.index('.ratchet{'):oldcss.index('main:has(#pause')]
css='''/* Unified pixel exploration. Native navigation/controls only; no gameplay scripts. */
:root{color-scheme:dark;--paper:#e3dfc9;--gold:#c9b57f;--muted:#9eafa1}*{box-sizing:border-box}body{margin:0;background:#101e20;color:var(--paper);font:14px/1.6 system-ui,-apple-system,sans-serif}.journey{max-width:960px;margin:auto;padding:30px 24px}.study-head{margin-bottom:20px}.study-head>p{font-size:10px;letter-spacing:.16em;color:var(--gold);margin:0 0 12px}h1{font-size:25px;letter-spacing:-.8px;font-weight:600;line-height:1.4;margin:0 0 8px}.study-head>span{font-size:12px;color:var(--muted)}.game{border:1px solid #52624d;border-radius:6px;overflow:hidden;background:#172a25;box-shadow:0 20px 65px #0003}.places{display:flex;border-bottom:1px solid #465841;background:#1c3029}.places a{flex:1;text-align:center;padding:13px 8px;min-height:48px;color:#9eafa0;text-decoration:none;font-size:13px;position:relative}.places a:focus-visible,.primary:focus-visible,.speech:focus-visible{outline:2px solid #ead3a0;outline-offset:-3px}.journey-screen{display:none;scroll-margin-top:100px}.journey:not(:has(:target)) .drive,.journey:has(#drive:target) .drive,.journey:has(#town:target) .town,.journey:has(:is(#camp,#camp-next,#camp-reply,#camp-done):target) .camp,.journey:has(#inside:target) .inside{display:block}.journey:not(:has(:target)) .places a[href="#drive"],.journey:has(#drive:target) .places a[href="#drive"],.journey:has(#town:target) .places a[href="#town"],.journey:has(:is(#camp,#camp-next,#camp-reply,#camp-done):target) .places a[href="#camp"],.journey:has(#inside:target) .places a[href="#inside"]{color:#eddbac;background:#293e30;box-shadow:inset 0 -2px #c9b57f}.location{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 18px;background:#192c26}.location h2{font-size:17px;font-weight:650;letter-spacing:-.4px;margin:0}.location>span{font-size:11px;color:#a6b59f;white-space:nowrap}.world{position:relative;overflow:hidden;background:#172a25}.world svg{display:block;width:100%;height:auto;image-rendering:pixelated}.speech{position:absolute;display:flex;flex-direction:column;gap:5px;left:43%;top:9%;width:48%;max-width:380px;background:#e5ddbf;color:#273c2e;border:2px solid #536348;border-radius:5px;padding:11px 14px;text-decoration:none;box-shadow:3px 4px 0 #132a2344;z-index:2;word-break:keep-all;overflow-wrap:anywhere;line-height:1.6}.speech:after{content:"";position:absolute;right:25%;bottom:-9px;width:12px;height:12px;background:#e5ddbf;border-right:2px solid #536348;border-bottom:2px solid #536348;transform:rotate(45deg)}.speech>b{font-size:11px;font-weight:650;color:#63714d}.speech>span{font-size:16px;font-weight:500}.speech>small{font-size:10px;align-self:flex-end;color:#62704c;min-height:18px}.market-speech{left:8%;top:8%;width:46%}.market-speech:after{right:40%}.player-speech{left:8%;right:auto;background:#c5d0b1;top:12%}.player-speech:after{background:#c5d0b1;right:45%}.road-speech{left:30%;top:8%;width:52%}.inside-speech{top:9%;left:44%;width:48%}.anchor{scroll-margin-top:140px;position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none}.bubble-two,.bubble-three,.bubble-four{display:none}.camp:has(#camp-next:target) .bubble-one,.camp:has(#camp-reply:target) .bubble-one,.camp:has(#camp-done:target) .bubble-one{display:none}.camp:has(#camp-next:target) .bubble-two,.camp:has(#camp-reply:target) .bubble-three,.camp:has(#camp-done:target) .bubble-four{display:flex}.activity{padding:17px 18px 18px;border-top:1px solid #425740;background:#1b3027}.activity-label{font-size:10px;color:#d2bb7b;letter-spacing:.06em}.activity>p{font-size:13px;color:#b1bea4;line-height:1.7;margin:7px 0 15px}.primary{display:flex;align-items:center;justify-content:space-between;min-height:48px;border:1px solid #7c815b;border-radius:3px;background:#344934;color:#e4d8ad;padding:11px 14px;font-size:14px;text-decoration:none}.primary:hover{background:#40563c}.review{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}.review label{min-height:44px;display:flex;align-items:center;gap:7px;border:1px solid #435b47;padding:7px 11px;border-radius:4px;font-size:12px;color:#b9c8af;cursor:pointer}input{margin:0;accent-color:var(--gold);width:16px;height:16px}.review label:has(:focus-visible){outline:2px solid var(--gold);outline-offset:2px}.art-option{color:#b9c8ae;font-size:12px;border-top:1px solid #324d3c;margin-top:22px;padding-top:10px}.art-option summary{min-height:44px;cursor:pointer;line-height:44px}.art-option figure{margin:4px 0 12px}.art-option img{display:block;width:100%;max-width:768px;height:auto;border-radius:3px}.art-option figcaption{font-size:12px;line-height:1.8;color:#9aae96;max-width:600px;padding-top:10px}.scope{font-size:11px;line-height:1.8;color:#849f89;max-width:700px;word-break:keep-all;overflow-wrap:anywhere;margin:18px 0}footer{font-size:10px;color:#6b8973;margin:20px 0 0}
.journey:has(#dock:checked) .speech{position:relative;inset:auto;width:100%;max-width:none;border:0;border-top:1px solid #647351;border-radius:0;box-shadow:none;padding:16px 20px}.journey:has(#dock:checked) .speech:after{display:none}.journey:has(#pause:checked) svg *{animation-play-state:paused!important}
'''+animations+'''
.far-scroll{animation:far 80s linear infinite}.tree-scroll{animation:far 28s linear infinite}.cloud-scroll{animation:cloud 70s linear infinite}.road-scroll{animation:road 1.4s linear infinite}.driving-van{transform-origin:150px 115px;animation:drive-bounce .7s ease-in-out infinite}.road-dust{animation:road-dust 1.1s ease-out infinite}.market-walker{animation:walk-market 13s ease-in-out infinite alternate}.market-walker .leg-left{transform-origin:0 0;animation:walk-leg .6s steps(2,end) infinite alternate}.market-walker .leg-right{transform-origin:0 0;animation:walk-leg .6s steps(2,end) -.3s infinite alternate}.town .pot-steam{animation-duration:3.6s}.inside .ratchet{animation-duration:8s}.inside .torso{animation-duration:8s}
@keyframes far{to{transform:translateX(-240px)}}@keyframes cloud{to{transform:translateX(40px)}}@keyframes road{to{transform:translateX(-40px)}}@keyframes drive-bounce{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(.65px) rotate(.2deg)}}@keyframes road-dust{from{opacity:.6;transform:translateX(0)}to{opacity:0;transform:translateX(-10px)}}@keyframes walk-market{from{transform:translateX(0)}to{transform:translateX(24px)}}@keyframes walk-leg{from{transform:translateY(0)}to{transform:translateY(-1px)}}
@media(max-width:540px){.journey{padding:23px 12px}.study-head{margin-bottom:16px}h1{font-size:22px}.location{padding:12px}.location h2{font-size:15px}.location>span{font-size:9px}.places a{padding:12px 6px;min-height:44px;font-size:12px}.speech{padding:8px 10px;gap:3px;left:34%;width:61%;top:4%;max-width:none}.speech>span{font-size:14px;line-height:1.55}.speech>b{font-size:10px}.speech>small{font-size:10px}.market-speech{left:5%;width:59%;top:4%}.player-speech{left:5%;width:57%}.road-speech{left:21%;width:64%;top:4%}.inside-speech{left:36%;width:59%;top:4%}.activity{padding:13px}.activity>p{font-size:12px;margin-bottom:12px}.primary{font-size:13px}.review{gap:7px}.review label{padding:7px 9px;font-size:11px}}
@media(prefers-reduced-motion:reduce){svg *{animation:none!important}.smoke,.ember,.road-dust{display:none}}
'''
(p/'pixel-journey.css').write_text(css)
f=p/'manifest.json';m=json.loads(f.read_text());m['drafts']=[d for d in m['drafts'] if d['id']!='pixel-journey-v1'];m['drafts'].insert(0,{'id':'pixel-journey-v1','file':'pixel-journey.html','title':'픽셀로 이어지는 하루 · 이동·마을·야영·차 안','revision':'1','recommended':True,'description':'전체 픽셀 전환과 말풍선 대화를 검토하는 독립 시안. 이동/밀양장터/야영/달구지내부 네 배경을 모두 코드 픽셀로 제작했습니다. 계속 움직이는 세계 안에서 세 번의 말풍선 대화를 진행하고, 하단 대화창으로 전환해 비교할 수 있습니다. 고화질 정본 그림은 별도 펼쳐 보는 대안으로 보존했습니다. 예문·가상 고정 상황이며 실제 게임의 자원/시간/저장·전체58도시 변경은 아닙니다. 초안 선택만으로 자동 적용하지 않습니다.'});f.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
