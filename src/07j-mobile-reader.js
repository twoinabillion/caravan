/* Phone-only presentation. No engine, payment, story or saved-state ownership. */
const MobileReader=(()=>{
  let hiddenAt=null,resume=null;
  const phone=()=>matchMedia('(max-width:600px)').matches;
  function openTools(sheet){
    const dialog=sheet?.querySelector('.story-mobile-menu');
    if(!dialog||dialog.open)return;
    dialog.__refresh?.();dialog.__onOpen?.();
    dialog.showModal();dialog.querySelector('button')?.focus({preventScroll:true});
  }
  function sync(sheet,hooks={}){
    if(sheet.dataset.readerLayout!=='pages'||!sheet.classList.contains('passenger-reader'))return;
    if(hooks.refit)sheet.__mobileRefit=hooks.refit;
    sheet.dataset.readerMobile='game';
    sheet.querySelector('.story-scene-atmosphere')?.remove();
    let bar=sheet.querySelector('.story-mobile-bar');
    if(!bar?.querySelector('[data-story-log]')){
      bar?.remove();
      bar=document.createElement('nav');bar.className='story-mobile-bar';bar.setAttribute('aria-label','이야기 보조 도구');
      const log=document.createElement('button');log.type='button';log.dataset.storyLog='';log.setAttribute('aria-label','읽은 대화 기록');
      log.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C8 2 4 3 3 4v15c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-1-9 1Zm0 0v14"/></svg>';
      log.onclick=event=>{event.stopPropagation();if(bar.isConnected)sheet.querySelector('.story-reader-tools [data-reader-mode="review"]')?.click();};
      const more=document.createElement('button');more.type='button';more.dataset.storyMenu='';more.setAttribute('aria-label','이야기 도구');more.setAttribute('aria-haspopup','dialog');
      more.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/></svg>';
      more.onclick=event=>{event.stopPropagation();if(bar.isConnected)openTools(sheet);};bar.append(log,more);sheet.appendChild(bar);
    }
    bar.querySelector('[data-story-log]').setAttribute('aria-pressed',String(sheet.dataset.readerMode==='review'));
    fitNote(sheet);
    let dialog=sheet.querySelector('.story-mobile-menu');
    if(dialog?.__tools){dialog.__onOpen=hooks.onOpen;dialog.__onClose=hooks.onClose;return;}
    dialog?.remove();dialog=document.createElement('dialog');dialog.className='story-mobile-menu';dialog.setAttribute('aria-label','이야기 도구');
    const heading=document.createElement('h2');heading.textContent='이야기 도구';dialog.appendChild(heading);
    for(const [selector,label] of [['[data-story-auto]','자동 읽기'],['[data-reader-mode="review"]','읽은 대화 기록'],['[data-reader-mode="inspection"]','발견한 자료 살펴보기']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.dataset.mobileTool=selector;
      button.onclick=()=>{if(!dialog.isConnected||!dialog.open)return;const target=sheet.querySelector('.story-reader-tools '+selector);if(!target)return;dialog.close();target.click();};dialog.appendChild(button);
    }
    const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>dialog.close();dialog.appendChild(close);
    dialog.__tools=true;dialog.__onOpen=hooks.onOpen;dialog.__onClose=hooks.onClose;
    const refresh=()=>{
      dialog.querySelectorAll('[data-mobile-tool]').forEach(button=>{
        const target=sheet.querySelector('.story-reader-tools '+button.dataset.mobileTool);button.hidden=!target;
        if(button.dataset.mobileTool==='[data-story-auto]')button.textContent=target?.getAttribute('aria-pressed')==='true'?'자동 읽기 끄기':'자동 읽기 켜기';
      });
    };
    dialog.__refresh=refresh;
    dialog.onkeydown=event=>{
      event.stopPropagation();if(event.key!=='Tab')return;
      const buttons=[...dialog.querySelectorAll('button')].filter(b=>!b.hidden),at=buttons.indexOf(document.activeElement);
      if(at<0||event.shiftKey&&at===0||!event.shiftKey&&at===buttons.length-1){event.preventDefault();buttons[event.shiftKey?buttons.length-1:0]?.focus();}
    };
    dialog.onclose=()=>{dialog.__onClose?.();if(bar.isConnected&&sheet.dataset.readerMode==='current')bar.querySelector('button')?.focus({preventScroll:true});};
    sheet.appendChild(dialog);refresh();
  }
  function fitNote(sheet){
    const height=sheet.querySelector('.story-resume-note')?.getBoundingClientRect().height||0;
    sheet.style.setProperty('--reader-resume-space',`${height?height+8:0}px`);
  }
  function note(sheet,title,phase){
    if(!phone()||!sheet?.isConnected)return;
    let note=sheet.querySelector('.story-resume-note');
    if(!note){note=document.createElement('aside');note.className='story-resume-note';note.setAttribute('role','status');sheet.insertBefore(note,sheet.querySelector('.story-mobile-bar'));}
    note.replaceChildren();
    const text=document.createElement('span');text.textContent=`이어서 · ${title||'여정'} · ${phase==='outcome'?'결과 읽는 중':'이야기 읽는 중'}`;
    const close=document.createElement('button');close.type='button';close.textContent='확인';close.onclick=()=>{note.remove();fitNote(sheet);sheet.__mobileRefit?.();};note.append(text,close);
    fitNote(sheet);
    sheet.__mobileRefit?.();
  }
  function bind(onResume){
    if(resume)return;resume=onResume;
    const hide=()=>{hiddenAt??=Date.now();};
    const show=()=>{if(document.hidden||hiddenAt===null)return;const elapsed=Date.now()-hiddenAt;hiddenAt=null;if(elapsed>=30000)resume();};
    document.addEventListener('visibilitychange',()=>document.hidden?hide():show());
    window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
  }
  const isOpen=()=>!!document.querySelector('.story-mobile-menu[open]');
  return {sync,openTools,note,bind,isOpen};
})();
