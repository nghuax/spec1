(() => {
  const infoButton = document.getElementById('info-button');
  const infoPopover = document.getElementById('info-popover');
  const infoClose = document.getElementById('info-close');
  const subtitle = document.getElementById('state-subtitle');
  const subtitleText = document.getElementById('state-subtitle-text');

  const subtitleCopy = {
    1: 'Balance clean energy to clear pollution and restore life',
    2: 'Clean energy brings life back to Earth'
  };
  let subtitleTimer = null;

  function queueSubtitle(state) {
    const safeState = Number(state) === 2 ? 2 : 1;
    const copy = subtitleCopy[safeState];
    document.body.dataset.artworkState = String(safeState);
    if (!subtitle || !subtitleText) return;

    window.clearTimeout(subtitleTimer);
    subtitle.classList.remove('is-visible');
    subtitle.setAttribute('aria-hidden', 'true');
    subtitle.dataset.state = String(safeState);
    subtitleText.textContent = copy;
    subtitle.setAttribute('aria-label', copy);

    subtitleTimer = window.setTimeout(() => {
      subtitle.classList.add('is-visible');
      subtitle.setAttribute('aria-hidden', 'false');
    }, 1000);
  }

  window.addEventListener('adapt:statechange', (event) => {
    queueSubtitle(event.detail?.state);
  });

  const previewState = new URLSearchParams(window.location.search).get('state');
  queueSubtitle(previewState === '2' || previewState === 'restored' ? 2 : 1);

  if (!infoButton || !infoPopover || !infoClose) return;

  function setInfoOpen(open, returnFocus = false) {
    infoPopover.hidden = !open;
    infoButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('info-is-open', open);

    if (open) infoClose.focus({ preventScroll: true });
    else if (returnFocus) infoButton.focus({ preventScroll: true });
  }

  infoButton.addEventListener('click', () => {
    setInfoOpen(infoPopover.hidden, false);
  });

  infoClose.addEventListener('click', () => setInfoOpen(false, true));

  document.addEventListener('pointerdown', (event) => {
    if (infoPopover.hidden) return;
    if (infoPopover.contains(event.target) || infoButton.contains(event.target)) return;
    setInfoOpen(false, false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !infoPopover.hidden) {
      event.preventDefault();
      setInfoOpen(false, true);
    }
  });

  const previewInfo = new URLSearchParams(window.location.search).get('info');
  if (previewInfo === '1' || previewInfo === 'open') setInfoOpen(true, false);
})();
