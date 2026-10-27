# 18차 story — seed 278003

정상 새 게임 한 번으로 112개 선택 후 본편 집행권 인계(core_transfer) 결말에 도달했다. 민지·박 선생이 합류했고, 유료 후미 좌석칸도 설치했다. 목표였던 코어 보존은 실제 마지막 메뉴에서 감시 인원 2/3으로 잠겨 있었다. 은수 영입은 박 선생의 진행 중 영입과 동선이 겹쳐 이루어지지 않았다. 조건을 강제하거나 목표를 맞추기 위해 재시작하지 않았다.

시작·종료·전편 검토 마감의 40src가 모두 동결18과 같았다. engine dcd096880f7d50fa359ee2e7b17e92a3745877e6b9582ba250648d7495d46c87. D11 20:18, 1109km. 원시 577개 **기록** 중 입장 reload112·paid reload112를 제외한 기록은353개다. 577을 공개 행동 수라고 부르지 않는다. 정책은 소스와 앞선 여정을 참고했으며 블라인드 플레이가 아니다.

실제 reader 입장·결과112쌍(원문36,335자), 짧은말109줄, 노트120개, NPC첫인사·소문15쌍(30메뉴), 현장일5회·게시판5개·능력4개·좌석설치·의뢰수락/완료·야영 메시지를 모두 읽었다. story_family_principle 결과의 도구 출력 한 부분이 잘려 해당 부분을 따로 다시 읽었다. 입장112 reload는 상태 동일, paid112 reload는 원문·reader·상태 동일이며 재지급0이다. 관측한 주행 chat7개는 당일 중복0이고 다음날 반복은 허용 규칙과 일치한다.

앞선 story1–17과 완전 동일한 입장/결과/선택97쌍, 다른15쌍이다. 결과 문자열은102개 동일/10개 다르다. 모든 보존 원정의 누적 선택쌍과 비교한 새 쌍은 comp_van_name:1, duo_minji_parkss_space:0, exp_pcroom:1, hist_bot_stop_manual:1 네 개다. harness의 내부 오래된 기준 novelPairs22와 구분한다.

새 자연 확정은 주행 중 짧은말의 현재 행동 불일치2건이다. 민지의 운전석 레일 대사가 이미 운전 중인 주인공에게 ‘앉아 봐’라고 하고, 부모 검증키 chat은 주행 도중 주인공이 장치를 내려놓고 수첩을 펴는 동작을 현재형으로 서술한다. 손씻기 chat은 다음 정차인지 모호하므로 별도 명료성 후보1건이다. findings.json/candidates.json 및 driving-copy-observations.json에 근거를 분리했다. 추가로 주행 짧은말의 운전자 손·책·좌석·걷기 문장만 제한 검색해 승객 행동과 작은 물건 전달을 문맥 대조했고 추가확정은 없었다. 이 원정과 전편 검토 중 생산 소스는 수정하지 않았다. 이후 승인된 19차 준비 수선과 콜백 분류 정정은 repair19/README.md에 분리했다.

할아버지 이중 봉투를 정상 획득해 서울 아래에서 열었고, 약을 보태 박 선생 영입을 마쳤다. 호수8시간낚시·폐비행장·방송국부품·PC방부품·보통 항아리배달·작전 응답과 네 거점 인계를 검수했다. 은수/레오/강우/재이/보리, 제주/아버지전시/민규구출, 라디오수리/제작은 미도달이다. 야영 후반 민지 대사의 반복도 실제 관측 범위로 남기며 새로운 대사라고 세지 않는다.

새 외부 단말의 자연 미지급 저장본은 agent03/attempt01/normal-unpaid-57-story_bridge_departure_echo.json이다. actual scene key를 D.scenes의 실제 파일 경로로 따라가 단말 근접컷·무인 생활칸·지도컷 세 원본을 view_image로 확인했다. 시간 중립 단말과 등장인물을 강제하지 않는 생활칸은 본문에 맞는다. 지도컷은 아래 별도 재생에서만 검수했다. 원정에 등장한91개 scene key 전체 원본이나 실제 화면 crop을 검사했다는 뜻은 아니다. root가 실제 UI를 검사한다.

별도 browser-visual-entry-replay는 원17 seed277003의 정책·기존 선택 기준을 그대로18소스에서 부분 재생했다. 79선택·402비오류 기록의 상태/자원/위치/선택은 원17과 같고, 새 comp_hometown 미지급 저장본은 browser-visual-entry-replay/agent03/attempt01/normal-unpaid-401-comp_hometown.json이다. view는 생성 전 nullish 상태다. 승인된 단말 문구·scene 및 일반 생활칸 scene만 관측 표현이 달라졌으며 verification.json에8개 차이를 열거했다. 목표 진입에서 의도적으로 중단했고 raw error도 그대로 보존했다. 게임 오류·실패 원정·추가 완주로 세지 않는다. rawsummary와 trace.summary 모두 cohortExcluded:true다. 새게임 상태/사건 주입이나 옛 view 삭제는 없었다.

수치와 범위의 기계적 근거는 report.json, source-review-close-verification.json, reader-reload-deep-comparison.json, chat-audit.json이다.
