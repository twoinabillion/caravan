/* ═══ 모바일 오디오 에셋 (빌드 시 assets/audio/ 아래 MP3를 data URI로 내장) ═══ */
D.bgm.drive_day = '__BGM_DRIVE_DAY__';
D.bgm.drive_night = '__BGM_DRIVE_NIGHT__';
D.bgm.drive_dayLoop = true;
D.bgm.drive_nightLoop = true;
/* 2026-08-07 절차 합성 4트랙 (tools/synth-bgm.py) — 사람 청취 검증 전 v1.
   Suno 정식 트랙이 도착하면 assets/audio/bgm/의 같은 파일명을 교체하면 끝. */
D.bgm.tension = '__BGM_TENSION__';
D.bgm.settlement = '__BGM_SETTLEMENT__';
D.bgm.camp = '__BGM_CAMP__';
D.bgm.story = '__BGM_STORY__';
D.bgm.tensionLoop = true;
D.bgm.settlementLoop = true;
D.bgm.campLoop = true;
D.bgm.storyLoop = true;

D.sfx = {
  sfx_van_start:'__SFX_VAN_START__',
  sfx_van_idle_loop:'__SFX_VAN_IDLE_LOOP__',
  sfx_drive_asphalt_loop:'__SFX_DRIVE_ASPHALT_LOOP__',
  sfx_drive_gravel_loop:'__SFX_DRIVE_GRAVEL_LOOP__',
  sfx_stop_brake:'__SFX_STOP_BRAKE__',
  sfx_cargo_depart:'__SFX_CARGO_DEPART__',
  sfx_rain_wiper_loop:'__SFX_RAIN_WIPER_LOOP__',
  sfx_door_printer:'__SFX_DOOR_PRINTER__',
  sfx_lab_room_loop:'__SFX_LAB_ROOM_LOOP__',
  sfx_presentation_cut:'__SFX_PRESENTATION_CUT__',
  sfx_core_loop:'__SFX_CORE_LOOP__',
  sfx_core_key_insert:'__SFX_CORE_KEY_INSERT__',
  sfx_market_loop:'__SFX_MARKET_LOOP__',
  sfx_garage_loop:'__SFX_GARAGE_LOOP__',
  sfx_van_extension:'__SFX_VAN_EXTENSION__',
  sfx_camp_loop:'__SFX_CAMP_LOOP__',
  sfx_port_arrival_loop:'__SFX_PORT_ARRIVAL_LOOP__',
  sfx_radio_static:'__SFX_RADIO_STATIC__',
  sfx_checkpoint:'__SFX_CHECKPOINT__',
  sfx_fuel_pump:'__SFX_FUEL_PUMP__',
  sfx_drone_real:'__SFX_DRONE_REAL__',
  sfx_walker_real:'__SFX_WALKER_REAL__',
  sfx_radio_400_after:'__SFX_RADIO_400_AFTER__'
};

D.vo.cheollian_core_01='__VO_CHEOLLIAN_CORE_01__';
D.vo.cheollian_core_02='__VO_CHEOLLIAN_CORE_02__';
D.vo.cheollian_core_03='__VO_CHEOLLIAN_CORE_03__';
D.vo.cheollian_core_04='__VO_CHEOLLIAN_CORE_04__';
D.vo.cheollian_core_05='__VO_CHEOLLIAN_CORE_05__';
D.vo.cheollian_core_06='__VO_CHEOLLIAN_CORE_06__';
D.vo.cheollian_core_07='__VO_CHEOLLIAN_CORE_07__';
D.vo.cheollian_core_08='__VO_CHEOLLIAN_CORE_08__';
D.vo.cheollian_core_09='__VO_CHEOLLIAN_CORE_09__';
D.vo.cheollian_core_10='__VO_CHEOLLIAN_CORE_10__';
D.vo.cheollian_core_11='__VO_CHEOLLIAN_CORE_11__';
D.vo.cheollian_core_12='__VO_CHEOLLIAN_CORE_12__';
D.vo.cheollian_core_13='__VO_CHEOLLIAN_CORE_13__';
D.vo.cheollian_core_14='__VO_CHEOLLIAN_CORE_14__';
D.vo.cheollian_core_15='__VO_CHEOLLIAN_CORE_15__';

/* Free-plan ElevenLabs auditions: local Studio only, NEVER embedded in release.
   Licensing/listening provenance stays beside each batch's masters. */
D.detailSfx={};
for(const name of ['rain_cab_light','rain_cab_heavy','rain_outdoor_light','rain_outdoor_heavy',
  'rain_shelter','wipers','wind_gentle','wind_storm','forest_day','night_insects','camp_fire',
  'river','tunnel','thunder_distant','steps_gravel','steps_wood','steps_metal','door_latch',
  'cloth','water_pour','bottle','meal','stove','repair_ratchet','repair_hammer','coins',
  'notebook','switch','cassette','dog_breath']){
  D.detailSfx['detail_'+name]='audio/auditions/elevenlabs-world-details-v1-20261010T152806Z/'+name+'.mp3';
}
for(const name of ['tool_sorting','paper_fold','cup_set_down','radio_tuning','generator_shutdown','bag_packing']){
  D.detailSfx['detail_'+name]='audio/auditions/elevenlabs-intro-20261010T152018Z/'+name+'.mp3';
}
// Three distinct takes for repeated foley. The original stays in each pool;
// an audio-only selector avoids immediate repeats and never advances game RNG.
D.detailSfxVariants={};
for(const weight of ['light','heavy']) D.detailSfx['detail_rain_cab_'+weight]=
  'audio/auditions/rain-cab-v2/rain_cab_'+weight+'_v2.mp3';
for(const name of ['steps_gravel','steps_wood','paper_fold','repair_ratchet','bag_packing']){
  const key='detail_'+name;
  for(const take of ['b','c']) D.detailSfx[key+'_'+take]=
    'audio/auditions/elevenlabs-refinement-v2-20261010T161903Z/'+name+'_'+take+'.mp3';
  D.detailSfxVariants[key]=[key,key+'_b',key+'_c'];
}
// Explicit action indexes. Never scan remembered dialogue for physical sounds.
D.introSoundCues={
  'intro-busan-room-morning-v1':{0:'detail_door_latch',1:'detail_cup_set_down',5:'detail_notebook',7:'detail_steps_wood'},
  'intro-busan-workday-v1':{0:'detail_cloth',2:'detail_tool_sorting'},
  'intro-workday-return-v1':{1:'detail_cloth',5:'detail_repair_ratchet',11:'detail_bag_packing'},
  'intro-busan-evening-call-v1':{0:'detail_tool_sorting',1:'detail_radio_tuning',7:'detail_bag_packing'},
  'intro-busan-water-line-v1':{4:'detail_water_pour',7:'detail_tool_sorting',11:'detail_water_pour'},
  'intro-busan-cold-storage-v1':{6:'detail_door_latch',7:'detail_switch',12:'detail_paper_fold'},
  'intro-busan-generator-night-v1':{5:'detail_notebook',10:'detail_cup_set_down'},
  'intro-appeal-denied':{0:'detail_paper_fold'}
};
D.audioSceneContexts={
  'event-explore-retail':'indoors','event-explore-civic':'indoors','event-explore-school':'indoors',
  'event-explore-workshop':'indoors','event-explore-shelter':'shelter',
  'event-find-broadcast-station-v1':'indoors','seoul-core':'indoors',
  'event-companion-camp':'camp','event-companion-meal':'camp'
};
