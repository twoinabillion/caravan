# 17차 survival — seed277001

정상 유한 자원 새 원정 1회로 민지·레오·박 선생과 보리를 동행해 `core_transfer` 본편 결말까지 진행했다. DAY14, 1383km. 새 게임에서 시작했고 재시도·중간 재개·부분 재생·자원/사건/flags 주입은 없다. 원문과 이전 정책을 알고 덜 본 선택을 고른 목표형 QA다.

131선택 / 697trace, 모든 진입 export131개를 남겼다. 진입131+지급131 reload에서 실패·재지급·상태 변경·actual reader 불일치 모두0. 시작·종료·전편 검토 종료의 40src는 동결17과 같다. 엔진 hash `f5d3cb35f0d4ae365ad70ba532e6ef8f21e0ee26172fc78b0ebd52958f1ad0b9`: frozen engineFiles 순서의 UTF8 본문을 LF 하나로 연결하고 기존 끝 개행을 유지, 파일명 제외.

정상 영입3, 탐색23, 이동40, 거래78, 일거리7, 좌석 증축1, 일반 동료 대화22, 야영대화12, 식사1, 쇠파이프 제작1, NPC 대화6(인사·후속12)을 사용했다. 민지의 연료 마법사·개조 전문가, 레오의 모닥불 콘서트·길 위의 명성, 박 선생의 밤의 상담가·강철 위장, 총6능력을 실제 유대로 얻어 선택했다. 민지 신호 추적과 레오 방송이 열렸고 레오 방송은 완료했다. 공개 게시판 연속 배달1/3을 밀양→광주로 완료했으며 2/3은 받지 않았다. 민규 능선도 발견만 하고 방문하지 않았다.

최저 식량2·물10·연료18.92·고철8·차체82. trace233/481 영입 후속은 하룻밤 조건 미충족으로 false였으므로 성공6회와 구별했다. trace504 만석 알림은 직전 정상 합류의 지연 알림이다. 보리 tag는 director 출력 후보에 두 번 들어왔으나 선택되지 않았고, nose/family는 미발생이다. 라디오 수리는 관측106회 모두 비활성; 레오 방송과 합산하지 않는다. 호송3선택은 목표 달성했고 별도 전술전투는 없었다.

131개 진입·결과·선택 힌트와 실제 reader 전편, 노트132개, 짧은 발화 큐156개, NPC12발화, 일거리7개의 본문·변화·보상과 모든 알림을 읽었다. 이전 정상 범위 trace64개와 본문113개가 동일했고18개가 새롭거나 달랐다. 신규 선택쌍5개는 exp_overturned:1, exp_police:1, talk_mj_08:1, talk_mj_10:1, wx_bigwash:0이다. 64개는 비교 파일 수이며 독립 참가자 수가 아니다.

자연 화자 메타 결함3건을 보고한다: exp_arcade[0] 승자 노인의 역할 손실, wx_bigwash 내부 동료의 선언이 익명 외부인으로 표시, comp_food_debate 동료들의 질문·정정이 모두 같은 익명 외부인으로 표시. `findings.json`과 `finding-evidence.json`에 정상 export·실제 reader·기대·최소 제안이 있다. 아직 수정하지 않았다. 죽통밥의 익명 요리사는 명료성 후보로, 첫 소개 전 민지의 익명 표시는 정상으로 판정했다. 시각·반복·과거 언급 등 검토한 다른 후보는 `candidates.json`에 종결 근거를 남겼다.

읽기 자료는 attempt01의 reader-full-review.txt, choices-compact.txt, notes-compact.txt, speech-compact.txt, work-readable.json, messages-read-through.md다. reader 출력의 `name`이 비어 있어도 실제 `displayName`이 정상인 경우가 있으므로 최종 판정은 raw readerEvidence의 displayName/speakerUncertain을 대조했다. 장면104키는 scene-index.md/scene-evidence.json에 실제 본문과 연결했다. 고래·와인 신규 그림도 자연 진입했으며 export를 남겼다. 실제 브라우저 그림·crop 검수는 root 담당으로, 이 보고를 시각 검증이라고 주장하지 않는다.

root 요청의 내부 동행 사건 정적 파생 감사는 이 원정과 별도 수행한다. 자연 발견3건과 추가 정적 결과를 섞지 않는다. 생산 소스는 계속 읽기 전용이다.
