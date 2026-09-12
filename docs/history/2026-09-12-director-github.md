# 디렉터 여정 개선 — GitHub 소스 체크포인트

2026-09-12에 원본 프로젝트로 전달한 부산 출발·동료 야영·메인 증거·도시와 노선·서울 결말·저장 복구·모바일 화면 개선을 함께 보관한다. 기존 작업과 개선 결과를 통합한 소스이며, 검토 작업트리의 임시 스냅샷 커밋은 게시 이력에 합치지 않는다.

## 포함 범위

- 실행 소스, 정본 장면 자산, 빌드·검증 도구, 회귀 테스트와 현재 문서.
- 회귀 검사에 필요한 저장 fixture 4개와 설명 파일 `artifacts/director-pass-2026-09-11/legacy-fixtures.md`.
- 감사 결론, 검토 보고서, 작은 검증 색인과 대표 화면. `pending-owner-correction.json`은 캠페인 검사 도구에서도 읽으므로 함께 추적한다.

생성된 HTML·AIT, 전체 캡처·영상·중간 진단 자료, 백업은 `.gitignore`에 따라 로컬에 보존한다. 감사 보고서의 전체 파일 색인과 해시는 로컬 보존본까지 설명하므로, 색인에 적힌 모든 파일이 GitHub에 포함되는 것은 아니다. Git에서 제외된 경로의 과거 증거를 확인하려면 원본 프로젝트 또는 `/Users/sang/_workspace/caravan-director-20260911`의 보존본이 필요하다. 새 검증은 소스에서 빌드한 뒤 테스트와 캡처 도구로 실행한다.

## 검증

게시 준비 과정에서 전달 내역 302개 파일의 해시가 최종 승인 기록과 같은지 확인했다. 실행 소스의 추가 변경은 없으며, 자산 보고서의 작업트리 간 차이는 생성 시각뿐이다.

- `npm run verify:quick`: 대사·콘텐츠·장면·빌드 초상 검사 통과. 기존 시각 경고 58개 유지.
- `node tools/check-release.mjs`: HTML/AIT 릴리스 검사 통과.
- `python3 tests/test_source_health.py`: 파싱·소스 크기·빌드 최신성 검사 통과.
- `python3 tests/test_content_registry.py`: 실제 콘텐츠 수와 잘못된 저작 데이터 거부 검사 통과.
- `python3 -m pytest -q tests/test_director_campaign_contract.py`: 6개 통과.
- Git index에 있는 파일만 임시 폴더에 꺼내 `bash build.sh --html-only` 실행 통과. 생성된 HTML 77,667,306 bytes의 SHA-256은 전달본과 동일한 `b6e9220728359658721ad8c4a52cb5069e94ace0d42a2b67bf4d4f5cb5bfdb56`이다.

전체 플레이·저장·화면 검증 범위는 [디렉터 개선 평가](../../audits/director-journey-2026-09-11/README.md)와 [원본 전달 기록](../../audits/director-journey-2026-09-11/phase-b/README.md)에 있다. 해당 보고서의 “원격 게시하지 않았다”는 이번 커밋·푸시 요청 이전의 전달 시점 기록이며, 보고서에 등장하는 검토 커밋 ID는 로컬 작업트리 이력이다.

`master` 푸시는 저장소에 이미 등록된 `gate` 검사와 GitHub Pages 빌드·배포 워크플로를 실행한다. 원격 워크플로 결과는 로컬 검증 결과와 별도로 확인한다.
