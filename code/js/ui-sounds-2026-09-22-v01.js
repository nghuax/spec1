// Website chrome only: iframe artwork audio keeps its own controls and state.
export class UISounds {
  constructor({ root = document, view = window, sources, createAudio = () => new Audio() }) {
    this.root = root;
    this.players = Object.fromEntries(Object.entries(sources).map(([kind, src]) => {
      const audio = createAudio();
      audio.preload = 'auto';
      audio.volume = kind === 'hover' ? .25 : .35;
      audio.src = src;
      audio.load();
      return [kind, audio];
    }));
    // Delegation includes dynamically revealed completion controls. Filtering
    // relatedTarget makes pointerover equivalent to one entry per control,
    // even when the pointer crosses its nested text, SVG or decorative frame.
    root.addEventListener('pointerover', event => {
      if (!event.isTrusted || event.pointerType === 'touch') return;
      const control = this.control(event.target);
      if (control && !control.contains(event.relatedTarget)) this.play('hover');
    }, { passive: true });
    // Native button/link activation also emits click for keyboard users.
    // Capture runs before navigation/fullscreen handlers, without awaiting audio.
    root.addEventListener('click', event => {
      if (event.isTrusted && this.control(event.target)) this.play('click');
    }, { capture: true, passive: true });
    root.addEventListener('visibilitychange', () => { if (root.hidden) this.stop(); });
    view.addEventListener('pagehide', () => this.stop());
  }

  control(target) {
    const control = target?.closest?.('button, a[href], summary, [role="button"]');
    return control && !control.closest('[inert], [hidden], :disabled, [aria-disabled="true"]') ? control : null;
  }

  stop() {
    for (const audio of Object.values(this.players)) {
      audio.pause();
      try { audio.currentTime = 0; } catch { /* Metadata may not be ready. */ }
    }
  }

  play(kind) {
    if (this.root.hidden) return;
    this.stop();
    try {
      // Autoplay rejection before the first gesture is expected and harmless.
      this.players[kind]?.play()?.catch(() => {});
    } catch { /* Audio availability must never affect the control's action. */ }
  }
}
