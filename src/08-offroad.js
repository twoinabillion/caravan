/* ═══════════════════ AUTHORED STORY MODE ═══════════════════
   외부 API와 API 키 입력 경로는 2026-08-18에 제거했다. 구형 저장 데이터와
   엔진의 안전한 fallback 호출이 깨지지 않도록 OFF 인터페이스만 무통신
   호환 객체로 유지한다. 이 파일은 네트워크 요청이나 키 저장을 하지 않는다. */
try{ localStorage.removeItem('seoul400_apikey'); }catch(e){}
const OFF = Object.freeze({
  ready:()=>false,
  checkReachable:async()=>false,
  testKey:async()=>({ok:false,msg:'외부 API 모드는 사용하지 않습니다.'}),
  prefetch:()=>{},
  playGenerated:(fallback)=>{ if(typeof fallback==='function') fallback(); },
  npcChat:async()=>null,
  reachable:false,
  model:''
});

/* ═══ BOOT ═══ */
UI.boot();
