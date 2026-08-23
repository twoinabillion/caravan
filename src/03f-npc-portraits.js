/* 정착지·저항 인물 초상. build.sh가 플레이스홀더를 data URI로 치환한다. */
D.portraits.geumja     = '__NPC_geumja__';
D.portraits.sundeok    = '__NPC_sundeok__';
D.portraits.taeho      = '__NPC_taeho__';
D.portraits.jaepil     = '__NPC_jaepil__';
D.portraits.miyoung    = '__NPC_miyoung__';
D.portraits.drhan      = '__NPC_drhan__';
D.portraits.deokgu     = '__NPC_deokgu__';
D.portraits.suwan      = '__NPC_suwan__';
D.portraits.byungchul  = '__NPC_byungchul__';
D.portraits.yeongok    = '__NPC_yeongok__';
D.portraits.sera       = '__NPC_sera__';
D.portraits.jeomrye    = '__NPC_jeomrye__';
D.portraits.dongsu     = '__NPC_dongsu__';
D.portraits.noah       = '__NPC_noah__';
D.portraits.hwasun     = '__NPC_hwasun__';
D.portraits.gitae      = '__NPC_gitae__';
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
D.portraits.mother     = '__NPC_mother__';
D.portraits.father     = '__NPC_father__';
D.portraits.intro_child = '__NPC_intro_child__';
D.portraits.player_child = '__NPC_player_child__';
D.portraits.passer_man = '__NPC_passer_man__';
D.portraits.passer_woman = '__NPC_passer_woman__';
D.portraits.passer_elder = '__NPC_passer_elder__';
D.portraits.passer_child = '__NPC_passer_child__';
D.portraits.passer_merchant = '__NPC_passer_merchant__';
D.portraits.passer_guard = '__NPC_passer_guard__';
D.portraits.passer_refugee = '__NPC_passer_refugee__';
D.portraits.passer_worker = '__NPC_passer_worker__';
D.portraits.passer_medic = '__NPC_passer_medic__';

/* 반복 인물 중심 이벤트에 초상을 자동 연결한다. 명시적 매핑이 항상 우선한다. */
(D.eventPortraitTitleRules || []).forEach(function(rule){
  D.events.forEach(function(event){
    if(!D.eventPortraits[event.id] && rule.titles.test(event.title || '')){
      D.eventPortraits[event.id] = rule.portrait;
    }
  });
});
D.portraits.seojin = '__NPC_seojin__';
D.portraits.taesik = '__NPC_taesik__';
D.eventPortraits['resist_first_contact'] = 'seojin';
D.eventPortraits['resist_human_check_trial'] = 'seojin';
D.eventPortraits['resist_membership_council'] = 'seojin';
D.eventPortraits['resist_refusal_return'] = 'seojin';
D.eventPortraits['resist_mid_depot_conflict'] = 'taesik';
D.eventPortraits['resist_bridge_consequence'] = 'seojin';
D.eventPortraits['resist_break_consequence'] = 'taesik';
D.eventPortraits['resist_check_consequence'] = 'seojin';
D.eventPortraits['resist_signal_leak'] = 'seojin';
D.eventPortraits['resist_people_aftermath'] = 'seojin';
D.eventPortraits['resist_archive_aftermath'] = 'taesik';
D.eventPortraits['resist_both_aftermath'] = 'taesik';
D.eventPortraits['resist_north_route_rehearsal'] = 'seojin';
D.eventPortraits['resist_seoul_edge_preserve'] = 'seojin';
D.eventPortraits['resist_seoul_edge_cutoff'] = 'taesik';
D.eventPortraits['resist_seoul_edge_dual'] = 'seojin';
D.eventPortraits['story_parent_route_shared'] = 'seojin';
