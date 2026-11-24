(() => {
  const ACTIONS = Object.freeze([
    'idle','observe','curious','explore','walk','run','sneak','follow','avoid',
    'jump','fall','landing','climb','hang','grab','drag','push','pull','wave','think',
    'talk','draw','interact','tab-prank','play','rest','sleep','celebrate','startled','escape','socialize','create'
  ]);
  const valid = new Set(ACTIONS);
  const LEGACY = Object.freeze({
    look:'observe', wander:'explore', socialize:'socialize', create:'create',
    animate:'play', hello:'wave', move:'walk', chase:'follow'
  });
  const normalize = value => {
    const action = String(value || 'idle').toLowerCase();
    const canonical = LEGACY[action] || action;
    return valid.has(canonical) ? canonical : 'idle';
  };
  const labels = Object.freeze({
    idle:'Idle',observe:'Observing',curious:'Curious',explore:'Exploring',walk:'Walking',run:'Running',
    sneak:'Sneaking',follow:'Following',avoid:'Avoiding',jump:'Jumping',fall:'Falling',landing:'Landing',climb:'Climbing',
    hang:'Hanging',grab:'Grabbing',drag:'Dragging',push:'Pushing',pull:'Pulling',wave:'Waving',think:'Thinking',
    talk:'Talking',draw:'Drawing',interact:'Interacting', 'tab-prank':'Tab Prank',play:'Playing',rest:'Resting',sleep:'Sleeping',
    celebrate:'Celebrating',startled:'Startled',escape:'Escaping',socialize:'Socializing',create:'Creating'
  });
  window.XPActions = Object.freeze({ ACTIONS, normalize, isValid:value=>valid.has(String(value||'').toLowerCase()) || Object.hasOwn(LEGACY,String(value||'').toLowerCase()), label:value=>labels[normalize(value)] });
})();
