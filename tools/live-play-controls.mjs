// Development shell only. The game/save remains in the single existing iframe.
export function attachPlayControls({ win, game, toolbar, badge, restart, state, apply, report }) {
  const parentOrigin = (() => {
    try {
      const url = new URL(win.document.referrer);
      return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol) ? url.origin : '';
    } catch { return ''; }
  })();
  let session = '', serial = 0, locked = false;
  const api = () => game.contentWindow?.caravanLiveControls;
  function status() {
    const value = state();
    return { ...value, busy: locked || value.busy, canRestart: Boolean(api()?.ready()), infinite: Boolean(api()?.infinite()) };
  }
  function publish() {
    const value = status();
    restart.disabled = value.busy || value.frozen || !value.canRestart;
    if (session) win.parent.postMessage({ type: 'live-game-studio:play-state', session, state: value }, parentOrigin);
  }
  async function run(action) {
    const value = status();
    if (value.busy || value.frozen || (action === 'restart' && !value.canRestart)) return;
    locked = true; publish();
    try {
      if (action === 'apply') await apply();
      else if (action === 'restart') {
        // Only explicit user actions reach this function; the host confirms first.
        api().restart();
        report('처음부터 테스트 시작됨');
      }
    } catch (error) { report('실행 실패 · ' + error.message, true); }
    finally { locked = false; publish(); }
  }
  function receive(event) {
    if (win.parent === win || event.source !== win.parent || !parentOrigin || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'live-game-studio:play-connect' && typeof data.session === 'string' && data.session.length <= 100) {
      if (!data.session) return;
      if (session !== data.session) { session = data.session; serial = 0; }
      toolbar.hidden = true;
      publish();
    } else if (data.type === 'live-game-studio:play-command' && session && data.session === session &&
      Number.isSafeInteger(data.serial) && data.serial > serial && ['apply', 'restart'].includes(data.action)) {
      serial = data.serial; // Consume duplicates, including commands rejected while busy/frozen.
      void run(data.action);
    }
  }
  win.addEventListener('message', receive);
  badge.addEventListener('click', () => void run('apply'));
  restart.addEventListener('click', () => {
    if (!restart.disabled && win.confirm('처음부터 테스트할까요? 현재 여정 저장을 새 여정으로 바꿉니다. 필요하면 게임 메뉴에서 먼저 저장 파일을 내보내 주세요.')) void run('restart');
  });
  game.addEventListener('load', publish);
  // Ready availability changes after title -> new journey without an iframe load.
  const timer = win.setInterval(publish, 1000);
  publish();
  return { publish, dispose() { win.clearInterval(timer); win.removeEventListener('message', receive); } };
}
