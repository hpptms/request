declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// Reused across calls rather than created fresh each time: browsers cap how
// many AudioContexts can exist at once, and there's no reason to pay
// construction cost repeatedly for what's otherwise a stateless one-shot
// sound.
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

// Synthesizes a short two-note "ピコン"-style notification chime with the
// Web Audio API instead of shipping an audio file asset — used by
// useBroadcastOverlay when a new 意思表示 (message/image) is triggered.
// No-ops silently (missing/blocked AudioContext, autoplay policy, etc.) so
// a failed chime can never break the overlay itself.
export function playChime(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1318.51, start: 0.09, duration: 0.18 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;

      const startAt = now + note.start;
      const endAt = startAt + note.duration;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.3, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, endAt);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(endAt + 0.02);
    }
  } catch {
    // Ignore.
  }
}
