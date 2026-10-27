# 25차 문구 수선 완료

승인된 두 문구 소유자만 수정했다. `src/03i-story-expansion.js`의 식사 첫 줄은 “민지 양, 밥 제대로 안 먹었지.”로, `src/03-data.js`의 재회 도입은 날씨 이름 없이 “갓길에서”로 시작한다. 사용하지 않는 날씨 지역 변수 한 줄도 제거했다. `production.patch`와 `copy-delta.json`이 전체 생산 변경이다.

수선 전 두 파일은 frozen24와 바이트 SHA가 같았으며 `before-src/`에 보존했다. 전체 파일에 승인된 정확한 세 문자열 변환만 적용하면 현재 파일과 일치한다. 사건 정의·가용 조건·효과·시간·확률·선택 순서·화자·기록 규칙 변경은 없다.

- 의미 있는 red: 3 pass / 8 fail (`before-normalized.tap`). 세 old unpaid/paid/text-only 검사는 수선 전부터 통과했고, 새 문구 및 날씨 중립 검사만 실패했다.
- green: 11/11 (`after-owned-scope.tap`, 최초 통과 `after.tap`도 보존). 3시각 chat의 실제 가용성·관계·당일 중복·다음날 재허용·reload, 22가지 날씨/옛 일감 상태의 entry 및 세 결과, 실제 reader와 새 paid reload를 포함한다. 영구 회귀는 소유한 chat/함수/사건 정의만 고정하며, 두 소스 파일 전체의 바이트 불변 확인은 구현 시점 검증 자료로만 남겨 이후 무관한 사건 수선을 막지 않는다.
- 실제 frozen24 정상 unpaid export를 양 소스에 불러와 세 선택을 검증했다. 옛 entry 문구와 결과가 보존됐다. 별도 frozen24 paid 세 결과는 saved-reader/text-only 양 형태 모두 재지급 없이 보존됐다.
- 기존 역사 대사·기계 계약 17/17, road echo 일감 출처 계약 1/1 통과. 대사 lint 몰입 파괴 항목 0. 인용 수·화자 경로가 바뀌지 않아 역사 해시나 투영을 추가·갱신하지 않았다.

첫 `before.tap`은 fixture의 초기 load 정규화 및 raw import 뒤 저장 전 reload 오류도 포함한다. 원본은 보존했고, 이 QA 준비 오류를 생산 결함으로 세지 않았다. fixture 시계를 고정하고 기존 초기 load 정규화/실제 save 절차를 거친 뒤 `before-normalized.tap`으로 수선 전 실패를 다시 남겼다.

짧은말은 별도의 paid 이벤트 영수증이 없다. 옛 발화 원문은 24차 raw speech 파일 그대로 보존하고, 테스트에서는 저장된 당일 stamp/관계 보상과 reload 정책 불변을 검사했다. 과거 발화 화면을 새 원문으로 바꾸는 이주 코드는 추가하지 않았다. 실제 브라우저 검수·전체 test/build는 root 담당이다.
