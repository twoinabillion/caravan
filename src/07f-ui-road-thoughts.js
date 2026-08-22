/* Road narration belongs with the journey log, not over the moving vehicle. */
(()=>{
  const bubbleRoot=document.getElementById('bubbles');
  if(!bubbleRoot) return;

  let dismissTimer=0;
  const escapeText=value=>String(value||'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  const showRoadThought=bubble=>{
    if(!bubble.classList.contains('narration')||typeof S==='undefined'||!S.driving) return;
    const log=document.getElementById('road-notice-slot');
    const copy=[...bubble.querySelectorAll('.bubble-copy > span')]
      .find(node=>!node.classList.contains('who'));
    const thought=copy&&copy.textContent.trim();
    if(!log||!thought) return;

    let card=document.getElementById('road-thought-card');
    if(!card){
      card=document.createElement('aside');
      card.id='road-thought-card';
      card.className='road-thought-card';
      card.setAttribute('aria-live','polite');
      log.insertAdjacentElement('afterend',card);
    }

    const art=typeof D!=='undefined'&&D.scenes&&D.scenes['event-crisis-exhaustion'];
    card.innerHTML=`${art?`<img src="${art}" alt="" aria-hidden="true">`:''}
      <div class="road-thought-copy"><span>운전 중 생각</span><p>${escapeText(thought)}</p></div>`;
    card.classList.remove('is-leaving');
    void card.offsetWidth;
    card.classList.add('is-visible');
    bubble.remove();

    clearTimeout(dismissTimer);
    dismissTimer=setTimeout(()=>{
      card.classList.add('is-leaving');
      card.classList.remove('is-visible');
    },9000);
  };

  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(!(node instanceof HTMLElement)) return;
      if(node.matches('.bubble.narration')) showRoadThought(node);
      node.querySelectorAll&&node.querySelectorAll('.bubble.narration').forEach(showRoadThought);
    }));
  }).observe(bubbleRoot,{childList:true,subtree:true});
})();
