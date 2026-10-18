# 천리안 음성 제작 재개 — 2026-10-18

현재 상태는 **새 Voice Design 미리 듣기3종 생성 / 원래 보이스ID 미확정·새 보이스 저장·청음 승인·게임 연결 대기**다.
기존 코어 음성15개와 SFX는 교체하지 않는다.

## 2026-10-18 새 음색 후보 생성 — 아직 게임 미연결

Sang이 기존15개를 보존한 별도 후보의 청음 비교를 승인했다. 로그인된 Chrome의
Voice Creation → Voice Design에서 아래 지침으로 생성 버튼을 **한 번만** 눌렀다.
화면에 Voice 1·2·3 재생 컨트롤이 나타났으며 비교 탭을 열어 두었다.
`Select voice`는 누르지 않았다. 따라서 영구 보이스ID는 아직 없으며,
이 미리 듣기를 기존 천리안의 복원이나 저장된 최종 목소리로 취급하지 않는다.
비교 탭을 닫거나 새로고침하지 말고 먼저 청음한다.

```text
Native Korean. Gender-ambiguous, ageless. Studio quality.
Persona: automated national control system, impossibly polite.
Emotion: serene, standardized courtesy, subtly unsettling.
Perfectly even, smooth mid-pitched timbre with zero emotional variance.
Speaks slightly slower than a human customer service agent, every sentence
ending with a calm downward intonation. Flawlessly clean, clinical delivery.
```

Guidance Scale40%, Loudness75%, Generate Preview Text 끔.
UI에는 생성 모델ID가 표시되지 않았으므로 옛 TTS의 `eleven_multilingual_v2`와
같은 모델로 만들었다고 주장하지 않는다. 최소100자 제약 때문에 실제 게임의
천리안 대사5개를 한 번의 청음용 문단으로 이었다(124자). 게임의 사건 순서가 아니다.

> 안녕하십니까. 정기 현황 파악 중입니다. 탑승 인원을 확인해도 되겠습니까. 협조에 감사드립니다. 확인되었습니다. 안전 운행하십시오. 통과 전 확인 사항이 있습니다. 남은 거리 동안 안전 운행하십시오. 목적지에서 뵙겠습니다.

화면의 예상 비용124와 실제 Free 잔여7580→7456이 일치했다. 결제·구독·추가 과금
설정은 변경하지 않았다. 원본 녹음·게임 src·저장·생성HTML·적용 배지도 변경하지 않았다.
MP3 다운로드/외부 공유 링크는 만들지 않았다. 공유 링크 동작은 외부 공개 가능성으로
보안 검토에서 거절돼 우회하지 않았으며, 청음은 열린 Chrome 비교 탭에서 진행한다.
설정 패널을 접으려던 인덱스 클릭도 안전 검토에서 중단되어 추가 생성 없이 화면만 캡처했다.
재생 컨트롤과 진행 표시는 생성 확인일 뿐, 발음·연기·동기화의 청음 승인이 아니다.

[생성 화면](../qa-artifacts/cheollian-voice-design-20261018/three-previews.jpg) ·
[지침·비용·경계 기록](../reports/cheollian-voice-design-20261018.json).
다음은 Sang 청음→후보 선택/저장→영구 보이스ID·모델·생성 이력 기록이다.
나머지12개 녹음과 게임 연결·상업 사용 권리 검토는 그 뒤에 별도로 진행한다.

## 2026-10-18 실제 인증·출처 재확인

사용자가 실행한0600 요약에서 실제 인증 성공(Free, 사용2420/10000,
잔여7580, 추가 과금 한도0)을 확인했다. 샘플 POST 전에 보이스 식별에서 중단됐다.
현재 저장된 비기본 보이스6개에 천리안 이름이 없다는 것은 원래 보이스가
그중 하나라는 증거가 아니다. 제작자가 근거를 추적해야 하며 Sang에게
추측으로 목소리를 골라 달라고 요구하지 않는다.

Downloads의 실제 원본은 `ElevenLabs_2026-07-31T07_49_47_천리안_gen_sp90_s50_sb75_se0_b_m2.mp3`
부터07_53_53까지15종(07_52_14의 복사본 포함16파일)이다.
첫 원본의MP3 태그는 encoder만 있고, 첫2개의 다운로드 출처 메타데이터는
`https://elevenlabs.io/`만 가리킨다. 보이스ID·historyID·쿼리 정보는 없다.
`tools/import-download-audio.sh`의15개 시간 패턴과 일치하지만 ID를 복원하지는 못한다.

Chrome의 로그인된 ElevenLabs 화면에서 현재 My Voices의 천리안 검색과
Text to Speech의 기존 대사/생성 날짜 주변 이력·보이스 필터를 읽었다.
확인한 UI 범위에서 원래 천리안 ID를 찾지 못했다. 삭제·개명·다른 계정을
원인으로 단정하지 않는다. 브라우저 쿠키/저장소/키 화면을 읽거나
녹음·보이스를 삭제/복제/교체/새 생성하지 않았다. 새 요청 비용은 없다.

원래 ID가 확인되면 기존 음색 샘플을 만들 수 있다. 복구 없이 Voice Design으로
만드는 것은 **기존 음색의 정확한 복원이 아닌 새 후보**다. 이 방향은 Sang과
확인한 뒤 진행하고, 기존15개를 보존한 상태로 청음 비교한다. 인증은 더 이상
미확인 상태가 아니지만 키가 이 프로세스에 영구 연결된 것도 아니다.

## 키를 노출하지 않고 실행

Mac의 터미널에서 다음을 실행한다. API 키는 명령어, 채팅, 파일에 넣지 않는다.

```sh
python3 /Users/sang/caravan/tools/elevenlabs-voice.py --sample
```

숨김 입력에 키를 붙여넣는다. 입력한 글자가 보이지 않는 것이 정상이다.
도구는 계정 할당량과 저장된 보이스를 GET으로만 확인한다. 이름에 천리안 또는
cheollian이 들어가는 기존 보이스가 정확히 하나일 때만 샘플을 제안한다.
이름 검색은 기존 녹음과의 음색 일치를 증명하지 않는다.
다른 이름으로 저장했다면 `reports/elevenlabs-voice-preflight.json`의
`saved_voices`를 확인하고 `--voice-id <기존 보이스 ID>`로 명시한다.
새 보이스 생성·복제·계정 설정 변경은 하지 않는다.

표시된 보이스·현재 드론 인사 대사와 크레딧을 확인하고 `YES`를 입력해야
**단 한 문장**을 생성한다. 그 외 입력은 취소다. 추가 과금 확장 한도가
정확히0임을 확인할 수 없거나 잔여1000크레딧 미만이면 생성하지 않는다.
이 도구는 추가 과금 설정을 대신 바꾸거나 결제·구독 API를 호출하지 않는다.
`--sample` 없이 실행하면 인증/목록 확인만 하고 생성하지 않는다.

키는 프로세스 메모리에만 있고 종료 후 재사용할 수 없다. 기존 환경에
`ELEVENLABS_API_KEY`가 제공된 경우에만 해당 값을 사용한다. 환경변수를
설정하더라도 이미 실행 중인 다른 프로세스에 소급 적용되지는 않는다.

## 출력·권리·실패

- 안전한 계정/보이스 요약: `reports/elevenlabs-voice-preflight.json` (권한0600).
  인보이스, 키, 전체 API 응답은 보존하지 않는다. 이 파일은 인증 토큰이 아니다.
- 생성한 경우에만 `assets/audio/auditions/elevenlabs-voice-<시각>-<구분자>/`에
  원본MP3와 대사·보이스ID·모델/설정·출처해시·실제 응답 비용·파일해시를 보존한다.
- 후보는 구독 등급과 무관하게 아직 **비상업 청음용·게임 미연결**로 제한한다.
  Free 생성물을 상업 번들에 넣지 않는다. 정식 사용 권리와 실제 청음 승인을
  확인한 다음에만 별도로 연결한다.
- POST 전에 시도 기록을 남긴다. 실패/시간초과는 이미 크레딧을 썼을 수 있어
  자동 재시도하지 않는다. 실패 뒤 재실행 전 기록과 계정 사용량을 확인한다.
- 디코드는 포맷 확인일 뿐 발음·연기·장면 동기화 승인이나 실제 청취가 아니다.

## 생성 범위

`node tools/elevenlabs-voice-plan.cjs`는 현재 데이터와 실제 `buildStoryTurns`
파서를 격리 실행해 발화만 추린다. 온실 결과1개, 집계 드론3개,
검문소8개(개/우편부 이력별 적하 목록4종 포함), 합계12개다.
각 문장의 실제 사건/본문·결과/선택/턴/개·우편부 조건과 소스해시를 보존한다.
플레이어·은수의 대사는 천리안 목소리로 읽지 않는다.

자판기·주유소·남산 관문은 현재 화면에 쓰인 글이므로 목소리를 임의로 만들지
않는다. 옛6이벤트 매핑이나 옛13줄 문서를 현재 대사의 녹음 목록으로 사용하지
않는다. 이는 게임 전체의 모든 화자/방송/인트로 음성이 완성됐다는 뜻이 아니다.
샘플 승인 뒤 나머지 생성과 정확한 턴·저장/재접속/음소거 계약의 연결 작업이 남는다.

## API 도구 준비 시점의 검증 — 위 UI 생성 이전

- 계획/실제 파서4개 + 네트워크를 모사한 인증·취소·과금 차단·키 비저장·실패 검사15개.
- 이 도구 준비 시점에는 실제 API 인증·음성 생성을 실행하지 않았다. 이후 사용자
  실행으로 인증됐고, 위 Chrome UI에서 별도 Voice Design 미리 듣기를 생성했다.
  키 없는 비대화형 실행은
  숨김 입력이 가능한 터미널을 안내하고 네트워크 요청 전에 종료한다.
- 게임 런타임/UI/CSS/저장·기존 녹음·생성HTML은 변경하지 않는다.

공식 API 근거:
[TTS](https://elevenlabs.io/docs/api-reference/text-to-speech/convert),
[보이스 검색/페이지 처리](https://elevenlabs.io/docs/api-reference/voices/search),
[할당량·추가 과금 한도](https://elevenlabs.io/docs/api-reference/user/subscription/get).
