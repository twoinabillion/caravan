// Authored geography briefs for independent studies. Never consumed by the game.
export const sources = {
  atlas: { title: '국토지리정보원 · 국가지도집 지형', url: 'https://nationalatlas.ngii.go.kr/pages/page_4057.php', supports: '한반도 산지축과 동해안·서남해안의 큰 지형 차이. 개별 도로 조망을 검증하지 않음.' },
  nakdong: { title: '낙동강유역환경청 · 지형 및 지질', url: 'https://mcee.go.kr/ndg/web/index.do?menuId=3552', supports: '낙동강 유역의 분지·하천 평야, 김해 삼각주와 하류 협곡 구간.' },
  busan: { title: '부산시 · 강동 생활권', url: 'https://www.busan.go.kr/living_space/gangdong', supports: '낙동강변 생활권과 남북 산림축.' },
  jeonju: { title: '전주시 · 행정구역과 지형', url: 'https://jeonju.go.kr/index.9is?contentUid=ff8080818990c349018b041a9ed03a70', supports: '전주 분지와 전주천·삼천이 연결되는 지형.' },
  plain: { title: '평택시사 · 하천', url: 'https://sisa.pyeongtaek.go.kr/bbs/board.php?bo_table=ca02&wr_id=9', supports: '안성천·진위천 수계의 평택평야와 수원에서 이어지는 황구지천.' },
  danyang: { title: '단양군 · 지역 특성', url: 'https://www.danyang.go.kr/dy21/29', supports: '산지가 많은 단양과 남한강·충주호로 이어지는 수계.' },
  wetland: { title: '순천만습지 · 순천만 이야기', url: 'https://scbay.suncheon.go.kr/wetland/story/0003/0001', supports: '동천·이사천과 연결된 순천만 하구·갈대 경관.' },
  coast: { title: '국토지리정보원 · 간척지', url: 'https://nationalatlas.ngii.go.kr/pages/page_2275.php', supports: '서남해안 갯벌과 간척 저지대의 큰 지형 특징.' },
  pass: { title: '정책브리핑·산림청 · 대관령숲길', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148896342', supports: '대관령의 숲·소나무림과 고갯길. 특정 차량 도로의 조망 자료는 아님.' }
};
export const groups = {
  southeast: '낙동강·동남부', southwest: '서남부·평야', central: '충청·중부', highland: '강원·산지', east: '동해안', metro: '수도권'
};
// id | region | terrain design target | research references. Fictional facilities
// remain fictional; these are visual direction notes, not claims of a GIS survey.
const rows = `
busan|southeast|항만 창고와 낮은 시가지 뒤로 이어지는 산지|nakdong,busan
gimhae|southeast|넓고 낮은 삼각주 들판, 수로와 멀리 물러난 산|nakdong
yangsan|southeast|강변 평지와 산기슭 시가지, 같은 능선 아래 고가|nakdong,busan
miryang|southeast|하천 주변 농경지와 낮은 시장 지붕, 분지 가장자리|nakdong
jinju|southeast|남강 수변 평지, 강 건너 완만한 구릉과 시가지|nakdong
hapcheon|southeast|하천을 낀 농경지, 과수원과 주변 낮은 산지|nakdong
geochang|southeast|산에 둘러싸인 분지 바닥, 마을과 농지의 연속|atlas
daegu|southeast|넓은 분지와 낮은 공장 지붕, 멀리 둘러선 산|nakdong
gumi|southeast|강변 산업지와 평지, 공장 뒤로 물러난 구릉|nakdong
gimcheon|southeast|내륙 하천 골짜기의 농경지와 교통 거점|nakdong
muju|central|둥근 산들이 겹치는 숲 골짜기, 터널 입구는 작은 단서|atlas
namwon|southwest|산간 분지의 들판과 하천, 낮은 지붕이 모이는 마을|atlas
jeonju|southwest|구릉으로 감싼 분지, 하천을 따라 열리는 농경지|jeonju
yeongdong|central|숲 능선 사이 과수·포도 재배지와 작은 취락|atlas
daejeon|central|분지의 연구시설·주거지와 외곽 구릉|atlas
nonsan|central|낮고 넓은 농경지, 배수로와 멀리 낮은 구릉|atlas,coast
gongju|central|강가 저지대와 낮은 산성 능선, 과장하지 않은 언덕|atlas
cheongju|central|분지 평야와 하천, 낮은 시가지에서 외곽 농지로|atlas
cheonan|central|완만한 구릉 사이 시가지·물류지와 농경지|atlas
pyeongtaek|metro|넓은 하천 평야와 산업·항만 권역의 게임식 압축|plain
suwon|metro|저지대 시가지와 하천, 먼 구릉 아래 연속된 주거지|plain
seoul|metro|수변·시가지와 낮은 산의 겹침, 남산은 끝부분의 단서|atlas
lake|southeast|밀양 인근으로 설정된 작은 산간 호수, 바다로 오인하지 않게|nakdong
mall|southeast|구미 산업지의 빈 상업 건물, 주변 평지와 크기 유지|nakdong
tower|southeast|거창 인근 능선 위 가상 통신탑, 알프스형 절벽 금지|atlas
spring|central|영동 산골의 작은 가상 온천, 주변 숲과 계곡 유지|atlas
airfield|central|논산 평야의 가상 비행장, 낮은 활주로·풀밭 수평선|atlas,coast
solar|metro|평택 저지대의 가상 태양광 밭, 과장된 산 배제|plain
reststop|southeast|김천 구릉 사이 가상 휴게소, 도로 주변 숲과 연속|nakdong
tunnelbook|central|무주 숲길의 가상 터널, 입구 주변 같은 바위·숲 유지|atlas
ulsan|east|동해 쪽 산업 시가지와 낮은 해안 구릉|atlas
yeosu|southwest|잔잔한 만과 낮은 섬·반도, 항만과 구릉 시가지|atlas,coast
suncheon|southwest|낮은 하구의 갈대와 갯벌, 농경지에서 물가로|wetland
gwangju|southwest|분지 시가지와 먼 산지, 시장은 낮은 지붕 규모|atlas
damyang|southwest|내륙 농경지·대숲과 완만한 산지의 겹침|atlas
mokpo|southwest|서남해 만과 낮은 섬, 물가의 항만 시설|atlas,coast
andong|southeast|낙동강 상류 분지와 강 굽이, 마을 뒤의 산지|nakdong
mungyeong|highland|골짜기를 따라 가까워지는 숲 능선과 고갯길|atlas
danyang|highland|산 사이 강과 계곡, 강변의 좁은 정주 공간|danyang
wonju|highland|산자락 분지의 시가지, 둥근 능선의 반복|atlas
daegwallyeong|highland|둥근 고지 능선·숲·작은 개활지, 만년설 산 금지|pass
gangneung|east|산록에서 열린 해안 저지대, 소나무·모래해안|atlas,pass
sokcho|east|동해 해안의 낮은 취락과 항만, 배후 산지는 먼 층|atlas
icheon|metro|완만한 구릉과 농경지·작은 작업장, 가마는 국소 단서|atlas
gyeongju|east|분지의 낮은 취락·농지, 둥근 왕릉과 산의 크기 구분|atlas
pohang|east|해안 산업지의 낮은 구조물과 멀리 이어지는 구릉|atlas
sangju|southeast|강 주변 농경지와 넓은 골짜기, 자전거길은 작은 선|nakdong
gunsan|southwest|낮은 하구·항만과 평야, 섬과 구릉은 먼 배경|coast
chungju|highland|강과 호수로 이어지는 내륙 분지, 주변 산의 완만한 반복|danyang
sejong|central|하천과 낮은 구릉 사이 새 시가지의 폐허|atlas
lighthouse|southwest|서해안 가상 등대, 갯벌·낮은 구릉과 해안 풀밭|coast
drivein|central|천안 근교 가상 자동차극장, 농지와 작은 구릉 유지|atlas
sunflower|southeast|합천 근교 가상 밭, 계절 꽃보다 농지 형태를 유지|nakdong
maehwa|southwest|섬진강변 과수원과 산비탈, 상시 만개한 꽃은 피하기|atlas
mingyu_ridge|central|영동 인근 가상 능선, 멀리 같은 산줄기 유지|atlas
jaeyi_cache|southeast|김천 근교 가상 창고, 공터와 낮은 구릉 유지|nakdong
cablecar|highland|문경 근교 가상 케이블카, 골짜기와 산비탈에 종속|atlas
filmset|southwest|남원 근교 가상 세트장, 작은 목조 지붕과 분지 농지|atlas
`.trim().split('\n');
const fictional = new Set('lake mall tower spring airfield solar reststop tunnelbook lighthouse drivein sunflower mingyu_ridge jaeyi_cache cablecar filmset'.split(' '));
export const places = Object.fromEntries(rows.map(row => {
  const [id, group, terrain, refs] = row.split('|');
  return [id, { group, terrain, sources: refs.split(','), fictional: fictional.has(id), evidence: '지형 자료를 참고한 미술적 추론; 개별 조망·시설 위치 미실측' }];
}));
// Specific connective intention for every undirected edge; read with manifest
// from/to, not alphabetically sorted id. Reverse playback reverses camera only.
const flows = `
busan--yangsan|항만 창고가 드문드문 줄고 강변 풀밭·산기슭 주거지가 섞인다. 강과 능선은 계속 남는다.
busan--gimhae|항만의 낮은 시설이 수로와 들판으로 이어진다. 평지가 넓어지되 산을 새로 크게 세우지 않는다.
miryang--yangsan|강변 시가지가 농지와 낮은 취락으로 느슨해진다. 같은 하천 골짜기를 따라간다.
gimhae--jinju|하류 평지에서 구릉 사이 농경지를 거쳐 강변 분지로 이어지는 긴 구간을 압축한다.
daegu--miryang|농경지와 창고가 차츰 촘촘해지고 분지 시가지로 이어진다. 산지 크기는 급히 바꾸지 않는다.
hapcheon--miryang|강변 농지에 과수원이 섞이며 낮은 취락이 바뀐다. 새로운 산악 세계로 전환하지 않는다.
geochang--hapcheon|과수원 사이로 분지를 감싼 산이 조금씩 가까워진다. 산줄기는 연속된 층으로 남긴다.
geochang--muju|분지 농지가 좁아지고 숲 골짜기가 깊어진다. 터널은 마지막의 작은 단서다.
muju--yeongdong|숲 골짜기가 조금 열리며 과수원과 포도밭이 늘어난다. 같은 둥근 능선을 유지한다.
jinju--namwon|강변 취락 뒤로 산간 농지가 이어지고 골짜기 안의 분지가 열린다. 수계는 미술적으로 압축한다.
jeonju--namwon|분지 농경지와 작은 마을이 이어지다가 도시 지붕의 밀도만 높아진다.
jeonju--nonsan|낮은 시장 지붕을 벗어나 수로·논밭이 넓어진다. 낮은 먼 구릉을 끝까지 유지한다.
gongju--nonsan|평야 사이 낮은 구릉이 가까워지고 강가 취락이 모인다. 산성은 원경을 덮지 않는다.
cheonan--gongju|강변 저지대에서 완만한 구릉 사이 농지·취락으로 이어진다. 도로망과 실측 거리는 축약이다.
daejeon--nonsan|논밭 사이 취락이 촘촘해져 분지 외곽의 시설로 이어진다. 시가지는 천천히 늘린다.
daegu--gumi|낮은 공장과 강변 저지대가 계속된다. 먼 산은 유지하고 공장 배치만 달라진다.
gimcheon--gumi|산업지 지붕이 줄고 내륙 농경지와 교통 시설이 늘어난다. 하천 골짜기의 폭을 점진적으로 좁힌다.
gimcheon--yeongdong|갈림길 주변 취락에서 낮은 산골 과수지로 이어진다. 능선의 결을 유지한다.
gimcheon--muju|완만한 구릉이 숲 골짜기로 깊어진다. 여러 고개를 한 장면으로 순간 교체하지 않는다.
daejeon--yeongdong|과수원에서 강변 농지·분지 외곽으로 이어진다. 연구시설은 마지막에만 작은 군집으로 늘린다.
cheongju--daejeon|분지와 하천 저지대가 이어지고 외곽 농지·주거지가 섞인다. 두 도시 사이에 새 산맥을 끼우지 않는다.
cheonan--cheongju|농지와 낮은 물류시설 사이로 완만한 구릉이 이어진다. 주거 밀도는 천천히 변한다.
cheonan--pyeongtaek|구릉 사이 들판이 넓은 평야로 열린다. 항만 명칭은 압축 설정이며 거대한 바다는 필수가 아니다.
pyeongtaek--suwon|수로와 논밭 사이 산업시설·아파트가 점진적으로 늘어난다. 평지의 넓이를 보존한다.
seoul--suwon|낮은 주거·작업장 사이에 아파트가 차츰 늘어난다. 같은 구릉과 수변 축을 길게 유지한다.
geochang--namwon|분지 사이 숲 고개를 지나 다시 농지가 열린다. 알프스형 암봉 대신 둥근 산을 겹친다.
jeonju--muju|도시 외곽 농지가 점차 산지 계곡으로 좁아진다. 고도 변화는 연속된 능선으로 보인다.
lake--miryang|작은 호수의 물가가 마을 농지로 이어진다. 거대한 바다나 별도 항만을 만들지 않는다.
daegu--lake|호숫가 숲이 낮은 농지와 분지 외곽으로 이어진다. 도시 실루엣은 조금씩 늘린다.
gumi--mall|구미 산업지의 길을 유지한 채 빈 상업 건물만 가까워진다. 짧은 곁길에서 생태를 바꾸지 않는다.
geochang--tower|분지 옆 능선의 숲을 유지하며 작은 통신탑을 드러낸다. 짧은 우회로에 만년설은 없다.
spring--yeongdong|같은 산골 숲과 과수지 사이 작은 온천 건물이 나타난다. 독립적인 관광 풍경으로 점프하지 않는다.
airfield--nonsan|평야의 풀밭과 콘크리트 흔적이 논밭으로 이어진다. 활주로의 낮은 수평선을 유지한다.
pyeongtaek--solar|평택 들판의 일부가 낮은 패널 밭으로 바뀐다. 산·날씨·빛은 변하지 않는다.
gimcheon--reststop|갈림길 주변 낮은 구릉과 도로를 따라 휴게소 지붕이 보인다. 짧은 길의 변화량은 작게 둔다.
muju--tunnelbook|무주와 같은 숲·바위 사이에 작은 터널 입구가 나타난다. 터널 하나가 지역 전체를 바꾸지 않는다.
mingyu_ridge--yeongdong|인근 숲 능선에서 산골 과수원으로 시야가 열린다. 같은 산줄기를 다른 거리에서 본다.
gimcheon--jaeyi_cache|김천 근교 구릉의 작은 창고와 공터가 마을 외곽으로 이어진다. 공단 도시로 확대하지 않는다.
cablecar--mungyeong|문경 산자락의 케이블 시설은 숲에 작게 묻힌다. 깊이와 빛은 같은 골짜기 안에서 유지한다.
filmset--namwon|분지 농지와 낮은 목조 지붕이 이어진다. 시대극 세트장을 실제 거대 성곽 도시로 바꾸지 않는다.
lighthouse--nonsan|서해 저지대와 논산 평야를 연결한 가상 압축 길이다. 실제 15km 도로 재현으로 취급하지 않는다.
cheonan--drivein|천안 근교 농지에 작은 빈 상영판과 공터가 나타난다. 구릉은 그대로 유지한다.
hapcheon--sunflower|같은 과수·농경지의 일부만 밭으로 달라진다. 개화기를 고정하지 않는다.
ulsan--yangsan|산기슭 취락과 구릉 사이 산업시설이 점진적으로 늘어난다. 갑자기 바다 절벽으로 바뀌지 않는다.
gyeongju--ulsan|산업지 외곽이 농경지·분지 취락으로 느슨해진다. 왕릉은 낮은 둔덕 규모로 나타난다.
daegu--gyeongju|분지 농지에서 산지 연결부를 거쳐 도시 외곽으로 열린다. 두 분지 사이의 중간 지형을 남긴다.
gyeongju--pohang|내륙 농지와 낮은 구릉을 지나 해안 산업지가 늘어난다. 바다와 제철소가 한순간에 전경을 덮지 않는다.
gimcheon--sangju|내륙 농지·낮은 취락이 넓은 강변 골짜기로 이어진다. 산은 배후에 남는다.
sangju--yeongdong|강변 평지에서 숲 구릉 사이 과수농지로 이어진다. 반복되는 둥근 능선으로 연결한다.
gunsan--jeonju|내륙 분지 외곽에서 서쪽 저지대가 넓어진다. 항구는 도착 쪽의 낮은 구조물로 암시한다.
gunsan--lighthouse|하구 항만 시설이 줄고 갯벌·해안 풀밭이 늘어난다. 서해를 동해 절벽으로 바꾸지 않는다.
cheongju--chungju|농지·구릉을 따라 내륙 분지와 수변으로 이어진다. 호수는 연속된 지형 안에서 드러난다.
gongju--sejong|강 주변 저지대를 유지한 채 낮은 오래된 취락에서 계획도시 건물로 밀도가 달라진다.
daejeon--sejong|하천과 구릉 사이 도시 외곽이 이어진다. 공주·청주 방향과도 같은 세종 지형 성격을 공유한다.
cheongju--sejong|낮은 시가지에서 농경지·구릉을 거쳐 분지 외곽으로 이어진다. 한 가지 중부 내륙 색감을 유지한다.
jinju--yeosu|내륙 강변과 구릉 사이 취락이 남해 만의 항만으로 열린다. 작은 반도·섬은 멀리 둔다.
suncheon--yeosu|항만 주변 구릉에서 잔잔한 만과 하구 저지대로 이어진다. 동해의 직선 모래해안과 구별한다.
namwon--suncheon|하구 농지를 벗어나 숲 골짜기와 내륙 분지로 이어진다. 산이 가까워지는 시간을 충분히 둔다.
gwangju--suncheon|농경지·구릉이 반복되다가 분지 시가지 밀도가 늘어난다. 습지와 도시를 단번에 바꾸지 않는다.
damyang--gwangju|도시 외곽 지붕이 줄고 밭·대숲이 늘어난다. 대숲을 거대한 별도 생물군계로 바꾸지 않는다.
damyang--namwon|농지와 낮은 취락에서 숲 고개를 거쳐 분지가 열린다. 산의 높이는 단계적으로 변한다.
gwangju--mokpo|분지 외곽에서 넓은 서남부 저지대와 하구 쪽으로 이어진다. 물과 섬은 끝 쪽의 먼 층이다.
gwangju--jeonju|구릉 사이 논밭과 작은 도시 외곽이 반복된다. 긴 길에서도 채도·날씨를 일정하게 유지한다.
maehwa--suncheon|하구 농지와 구릉 사이 과수원을 따라 강변으로 이어진다. 매화 만개는 계절 선택 없이는 고정하지 않는다.
andong--gumi|강 주변 산업지에서 농경지와 상류 분지로 이어진다. 마을 지붕만 지역에 맞게 달라진다.
andong--danyang|강 골짜기와 숲 고개가 반복되고 산 사이 수변이 좁아진다. 강줄기를 모두 같은 강으로 단정하지 않는다.
mungyeong--sangju|넓은 농경지가 점차 숲 골짜기로 좁아진다. 고갯길이 배후에서 천천히 가까워진다.
chungju--mungyeong|숲 고개를 벗어나 내륙 분지와 강변 농지가 열린다. 다음 도시로 그림을 교체하지 않는다.
chungju--danyang|산 사이 강과 호수가 이어지는 긴 수변 경관을 유지한다. 건물은 물가의 작은 취락 규모다.
icheon--suwon|연속된 시가지가 농경지·완만한 구릉·작은 작업장으로 느슨해진다. 가마 굴뚝은 작은 지역 단서다.
chungju--icheon|농지와 낮은 구릉을 지나 내륙 분지로 이어진다. 산을 급히 거대화하지 않는다.
chungju--wonju|내륙 수변과 농지를 지나 산자락 시가지가 늘어난다. 먼 둥근 능선이 전 구간 남는다.
danyang--wonju|깊은 강 골짜기에서 숲 고개를 거쳐 산자락 분지로 열린다. 높이 변화는 여러 겹의 산으로 연결한다.
daegwallyeong--wonju|산자락 취락에서 숲 능선과 작은 고지 개활지로 이어진다. 눈 덮인 암봉 대신 둥근 산줄기를 유지한다.
daegwallyeong--gangneung|숲 능선이 조금씩 낮아지며 먼 해안 저지대가 열린다. 바다는 끝 쪽에서만 좁게 보인다.
gangneung--sokcho|모래해안·해송·낮은 취락이 오래 이어진다. 같은 바다 수평선 안에서 마을 밀도만 바뀐다.
gangneung--pohang|동해 해안의 긴 마을·낮은 곶·모래해안이 반복된다. 도착 직전에만 산업시설이 조금씩 늘어난다.
icheon--wonju|산자락 시가지에서 완만한 구릉과 농지로 열린다. 먼 산의 색과 크기는 급히 바뀌지 않는다.
`.trim().split('\n');
export const routeFlows = Object.fromEntries(flows.map(row => { const [id, text] = row.split('|'); return [id, text]; }));
export const newRoutes = ['jeonju--nonsan','daegwallyeong--wonju','daegwallyeong--gangneung','gangneung--sokcho','seoul--suwon'];
export const featured = ['busan--yangsan', ...newRoutes];
