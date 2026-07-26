# 대한민국 OSM 2026 오프라인 기록 지도

## 역할

`대한민국 OSM`은 현재 2169년의 실시간 지도가 아니라, 천리안이 배포되던
2026년에 사람들이 남긴 국토 기록이다. 플레이어는 전국 주요 교통망 위에서
게임의 달구지 경로를 확인하고, 보존된 서울 서남부 기록을 확대해 당시의
골목·건물·역·병원·학교 등을 볼 수 있다.

이 지도는 API가 아니다. 원본 OSM 데이터를 빌드 시 게임 전용 벡터로
변환해 단일 HTML에 내장하므로 다음 특성을 갖는다.

- 네트워크, 인증키, 등록 도메인이 없어도 작동한다.
- `여정도`와 같은 WGS84 축에 게임 경로·노드·달구지 위치를 겹쳐 그린다.
- 전국 보기, 드래그, 마우스 휠, 확대/축소 버튼을 지원한다.
- `서울 서남부 기록` 버튼은 사용자가 제공한 상세 XML 범위로 이동한다.
- OSM의 일반 지명은 이동 선택지가 아니라 2026년 기록 카드로 표시한다.
  게임 노드를 누를 때만 기존 이동 버튼이 나온다.

## 현재 데이터

전국 원본은 Geofabrik의 `south-korea-latest.osm.pbf`를 사용했다.
현재 내장 데이터의 기준 시각은 `2026-07-25T20:21:51Z`다.

| 범위 | 내장 내용 |
|---|---|
| 대한민국 | 실제 해안선, 행정 경계, 주요 도로 선형 54,438개, 철도 8,922개, 도시·읍 1,497곳 |
| 서울 상세 | `37.49842–37.51386 N`, `126.90003–126.92960 E` |
| 서울 상세 객체 | 도로 1,017개, 철도 72개, 건물 804개, 녹지 45개, 물 2개, 주요 POI 120개 |

서울 상세 범위는 신길·대방·보라매와 영등포 동남부 일대 약 4.46㎢다.
서울 전체나 남산을 포함하지 않으므로 화면에서도 `서울 서남부 기록`으로
명확히 부른다. 이후 다른 지역 XML을 확보하면 같은 방식으로 상세 타일을
추가할 수 있다.

## 원본을 그대로 넣지 않는 이유

대한민국 PBF는 약 271MiB이며 압축을 풀어 읽는 객체 분량은 약 3.22GiB다.
브라우저 단일 HTML에 넣기에는 너무 크다. 변환기는 다음 정보만 남긴다.

- `motorway`, `trunk`, `primary`
- 번호가 있는 `secondary`
- 본선·지선 철도 (`service=yard/siding/spur` 제외)
- `place=city/town`
- 대한민국 행정 경계와 `natural=coastline`

OSM 편집을 위해 잘게 나뉜 도로 조각은 연결점 차수가 2인 곳에서 다시
합치고, 화면에서 구분할 수 없는 미세 굴곡은 Douglas–Peucker 방식으로
단순화한다. 좌표는 각 범위 안에서 0–8191 정수로 양자화한다. 결과
`src/03h-osm.js`는 약 2.4MB이며 원본 PBF/XML은 저장소와 배포물에 넣지 않는다.

## 다시 생성하기

macOS에서는 `osmium-tool`이 필요하다.

```bash
brew install osmium-tool
python3 tools/build_osm_extract.py \
  /path/to/south-korea-latest.osm.pbf \
  --local-osm /path/to/map.osm
./build.sh
node tools/scan.js
python3 tests/test_smoke.py
```

전국 필터는 `tools/osm-game-filter.txt`, 변환기는
`tools/build_osm_extract.py`, 런타임 렌더러는 `src/06-mapgraph.js`의
`OSMMAP`에 있다.

확장자 없는 `Downloads/map (1)`은 대한민국 원본이 아니다. Overpass가
약 2GiB 메모리를 사용한 뒤 실패한 451바이트 오류 응답이며 지도 객체가
0개다. 대한민국 전체 원본은 Overpass 단일 요청 대신 Geofabrik 국가
추출본을 사용한다.

## 라이선스와 표기

데이터는 OpenStreetMap 기여자의 ODbL 1.0 자료이며 대한민국 추출본은
Geofabrik이 제공한다. OSM 화면 오른쪽 아래의 다음 표기는 숨기지 않는다.

```text
© OpenStreetMap contributors · ODbL · Geofabrik 대한민국 추출본
```

- OpenStreetMap 저작권: https://www.openstreetmap.org/copyright
- Geofabrik 대한민국 추출본: https://download.geofabrik.de/asia/south-korea.html
