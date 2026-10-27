# Cycle21 survival · seed281001

정상 유한자원 fresh 1회로 민지·강우·레오와 보리를 영입하고 `core_sleep` 본편 엔딩까지 완주했다. 115선택·588trace, DAY11 19:24, 누적1041km. 실패·재시도·재개·부분재생은 모두0이다. 기존 소스와 이전 기록을 아는 목표형 QA이며 블라인드 인간 플레이가 아니다.

전편 판정은 **본문·화자·기계동작 신규 확정0, 자연 장면 그림 불일치3, 그림 명료성 개선1**이다. 이전 스냅샷과 최초 후보판정은 그대로 남겼고 root의 독립 실파일 판정 후 `report-final-v2.json`과 `parent-triage.json`에 최종 분류했다.

- S21-V01 `story_bridge_crew_question`: 정차한 달구지 안에서 증거를 펼치는데 광주 장터 그림. 기존 중립 생활칸 자산 재사용 승인.
- S21-V02 `exp_overturned`: 전복 화물차·방수포·상자 본문에 철도 객차/플랫폼 수색 그림. 전용 entry 그림 생성 승인.
- S21-V03 `ev_gasstation_tank`: 폐주유소·지하 탱크 본문에 같은 기차역 그림. 전용 entry 그림 생성 승인.
- S21-V04 `lc_nonsan_camp`: 훈련소 정문에 산길 행인 그림. root는 핵심 장소 명료성 개선으로 분류했다.

`visual-candidates.json`에 발생 시각·party·전체 entry/result·선택·정상 export 경로를 보존했다. 실제 열람10파일 및 SHA는 `image-file-review.json`. 이 중 새 우체국 그림은 이번 원정 미발생이므로 자산만 별도 확인했다. 신규 제작 두 장은 `../visual-survival/`에만 두었고 이 에이전트는 생산 연결·갤러리·기존 assets를 바꾸지 않았다.

실제 reader115진입/115선택결과, 표시 선택지115, 결과chips115, 노트122, 짧은말143, NPC첫인사/후속14와 선택목록14, 일감4, 퍼크6, 제작1, 메시지70묶음98문장을 전부 읽었다. scene91키와 컷 의미도 대조했다. 실제 자산파일은10개만 열었으며 전체91개 픽셀/브라우저 crop·확대·터치·오디오 전수검수 주장은 하지 않는다.

미지급115 + 기지급115 = **230 실제 reload**, reader/상태 불일치·효과 재지급·생략0. 거래55건 모두 실제enabled·용량fits·성공이며 선택115개도 visible/enabled였다. API false0. 좌석3명 확장은 영입 전에 정상 구매했다. 별도 준비검사만 실패 재시도 차단 경계를 확인했고 이번 원정에는 거절 자체가 없었다.

보리는 정상구조/영입했다. 영입 후 야영2·탐색5·drive14액션이 있었으나 코/인식표/가족 후속 선택0, 전체 director후보 호출7회 중 관련후보0. 마지막 상태의 코/tag available=true를 실제 후보 추첨이나 발화로 세지 않는다. 가족은 선행 tag가 없었다. 이 공백은 이번 경로 한정이며 이전 누적 정상 인식표/가족 분기 증거와 별개다.

직접 라디오 수리/청취0, 독립전투action0. 방송국 장비수집·서쪽 수레호송3단계·경고사격·탄약제작1·야영식사/정비각1·세마을무전의뢰1/3 완료를 실제 범위로 기록했다. 무전 후속2/3는 진행하지 않았다. 최저 food9/water16/fuel29.56/scrap8/van82, 목마름/도보연료/탈진 없음. 서쪽 고정노선 뒤 광주 영입 우회가 길어 최단경로 플레이는 아니다.

이전 primary72구간과 비교해 동일 entry/result105, 새롭거나 달라진텍스트10, 새 normalized 선택쌍은 `exp_overturned[0]` 1개였다. 다른 결과 확률/roster/지급 상태의 차이는 별도이며 10개의 완전히 새 사건을 봤다는 뜻이 아니다.

시작·실행끝·전편검토끝 모두40src 일치. engine LF hash:
`43b982b514b86d2227f8b15b5cd2551c170c715b4173617123e9f4fb98fe6f3c`

`freeze.engineFiles` 순서의 UTF8 파일내용을 LF 하나로 join하며 원래 파일 끝 개행은 남기고 파일명은 넣지 않는다. 실제 원정은 격리 VM의 실제엔진·actual reader·NPC closure다. presentation/audio/timer는 stub이므로 브라우저 입력 증거가 아니다. 이번 reload는 같은21소스의 연속성 검사이며 새 cross-version legacy검사는 수행하지 않았다.

4개 문제의 정상export에는 이미 옛sceneKey가 reading.view에 저장돼 있다. 새 맵으로 load해 옛그림이 유지되는 것은 보존계약이다. pre-reader 원본은 따로 없고, 수동 삭제나 sceneKey변경도 하지 않았다. root 지시를 받으면22freeze fresh검토 종료후 별도 normalpartial(cohortExcluded)로 새 entry를 확보할 수 있다.

원자료는 `attempt01/player49-trace.json`, `player49-summary.json`, `player49-save.json`, 정상entry115개다. `analysis-initial.json`의 pending은 수집 직후 스냅샷이며 완료판정은 이 문서와 `report-final-v2.json`을 따른다. 중간후보/원본로그는 덮어쓰지 않았다.
