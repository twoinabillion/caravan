# agent06 — 작업대·무기 선반 집중 QA

생산 코드와 실제 Studio는 수정하지 않았다. 정상 이전 저장 재개1회, 인위 경계 fixture27개, 실제 브라우저0회다. 상세 판정은 [report.json](report.json), 원시 실행은 [raw-log.json](raw-log.json)과 [terminal-followup-log.json](terminal-followup-log.json)에 있다.

확인한 문제는 종료 후 제작 모달 재열림(P1), armory 할인금액과 제작 허용선·표시원가 불일치(P2)다. 화염병의 보존 연료3L가 안내되지 않는 점은 명확성 후보(P3)로 분리했다.

## 정상 저장 재개

원본은 `expedition-thirty-20261021/player30/attempt01/player30-save.json`이다. 같은 폴더 trace n94에서 `perimeter_first`의 `…지나간다` 선택을 `applied=true`로 마쳤고, 첫 경고사격 기록이 남았다. 저장은 armed_age=true, ended=false, pendingPresentation=null인8일차 청주다. sha256은 `ad9485a0b0be4dd53c4f1e30c7fcf9069c5c4883ab212d4cce7250934b243141`이다. 음식0 때문에 기존 정책이 중단했지만 여정 종료는 아니었다.

분리 VM에 그 저장을 그대로 로드했다. 자원·퍼크·장소를 주입하지 않고 실제 showCraft가 생성한 버튼 handler로5종과 파이프 재제작1회를 실행했다. 기본 고철6/12/3/2/8, 석궁·탄약 부품1, 화염병 연료2, 출력1/1/3/2/2와 각40분이 일치했다. 매 제작 후 save/load5회에서 상태가 그대로였다. 작업대 접기는 자원 변화 없이 road render로 돌아왔고 네 인접 경로의 canTravelTo가 ok였다. 실제 경로 이동은 하지 않았다.

## 경계 결과

무기 선반은 인위 소유 fixture다. 충분한 고철에서는 실제로5/10/3/2/7만 지불하고20분이 들지만 UI 필요고철은6/12/3/2/8이다. 정확한 할인비용5/10/7만 가진 파이프·석궁·탄약은 고철 부족으로 버튼이 disabled된다. ceil 때문에3/2가 그대로인 볼트·화염병은 별도 문제로 세지 않았다.

고철 원가-1의5종, 석궁/탄약 부품0, 연료1.99/2/4.99L의 화염병은 상태를 바꾸지 않고 거절됐다. 연료5/5.01L는2L만 지불해3/3.01L가 남았다. 정상 자정 경계는23:50→다음날00:30, armory는00:10이고 저장/재로드도 유지됐다.

갈증3/물0/23:50 fixture에서는 실제 제작 handler가 `ending → audio:craft → driving:false → open`을 호출했다. 종료 후 실제 접기 handler는 `auto:clear`만 하고 모달을 닫지 않는다. 다시 제작하면 시간이0분인 채 고철53→47, 파이프1→2로 바뀐다. 엔진의 기존 종료 시간차단은 작동하지만 UI callback이 끝상태를 다시 연다. 저장은 삭제된 채이고 archive는 추가 클릭으로 바뀌지 않았다.

## 증거 수준과 재현

`showCraft`와 `closeEvent`는 현행 src의 실제 함수를 추출했다. DOM·modal·ending·audio·road render는 stub이며 화면을 봤다는 뜻이 아니다. 실제 openModal/showEnding 코드도 정적으로 확인했다. 모바일, 이미지 crop, 소리, 버튼의 실제 접근성은 미검증이다. API로 해금 전 제작이 가능한 것은 공개 UI 우회를 입증하지 않아 버그 판정에서 제외했다.

실행 명령:

```
node qa-artifacts/gap-ten-20261021/agent06/qa-crafting.cjs
node qa-artifacts/gap-ten-20261021/agent06/qa-terminal-followup.cjs
```

첫 두 실행의 QA 스크립트 오류는 별도 txt로 남겼다. 이후 실행은 모두 exit0이었다. 결과 파일을 보존하려면 재실행 전에 새 출력 위치를 마련해야 한다.
