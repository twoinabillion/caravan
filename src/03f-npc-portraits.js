/* 정착지·저항 인물 초상. build.sh가 플레이스홀더를 data URI로 치환한다. */
D.portraits.geumja     = '__NPC_geumja__';
D.portraits.sundeok    = '__NPC_sundeok__';
D.portraits.taeho      = '__NPC_taeho__';
D.portraits.jaepil     = '__NPC_jaepil__';
D.portraits.miyoung    = '__NPC_miyoung__';
D.portraits.drhan      = '__NPC_drhan__';
D.portraits.deokgu     = '__NPC_deokgu__';
D.portraits.kimcaptain = '__NPC_kimcaptain__';
D.portraits.hayeosa    = '__NPC_hayeosa__';
D.portraits.sanjigi    = '__NPC_sanjigi__';
D.portraits.hanbyeol   = '__NPC_hanbyeol__';
D.portraits.seoyeon    = '__NPC_seoyeon__';
D.portraits.mansu      = '__NPC_mansu__';
D.portraits.postman    = '__NPC_postman__';
D.portraits.mapmaker   = '__NPC_mapmaker__';
D.portraits.mingyu     = '__NPC_mingyu__';
D.portraits.grandfather = '__NPC_grandfather__';
D.portraits.bori       = '__NPC_bori__';

/* 반복 인물 중심 이벤트에 초상을 자동 연결한다. 명시적 매핑이 항상 우선한다. */
(D.eventPortraitTitleRules || []).forEach(function(rule){
  D.events.forEach(function(event){
    if(!D.eventPortraits[event.id] && rule.titles.test(event.title || '')){
      D.eventPortraits[event.id] = rule.portrait;
    }
  });
});
