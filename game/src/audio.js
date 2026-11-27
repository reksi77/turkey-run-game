// WebAudio synth sounds for Giblet Runs for It. No audio files, no network:
// every sound is a short oscillator blip shaped by an envelope.

let ctx = null;
let muted = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, vol, slideTo = null, delay = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  // Two-note gobble when the turkey grabs corn.
  gobble() { blip(520, 0.07, 'square', 0.10, 380); blip(660, 0.09, 'square', 0.10, 480, 0.07); },
  // Soft thump on landing after a jump.
  thump() { blip(140, 0.10, 'sine', 0.16, 70); },
  // Whoosh of a dash.
  dash() { blip(300, 0.16, 'sawtooth', 0.06, 900); },
  // Sharp clink when a knife or rolling pin is dodged closely.
  clink() { blip(1900, 0.06, 'triangle', 0.10, 1200); },
  // Low alarm when the farmer spots the turkey.
  spotted() { blip(220, 0.22, 'sawtooth', 0.14, 440); blip(330, 0.22, 'sawtooth', 0.12, 660, 0.10); },
  // Hurt sting when a hazard lands a hit.
  hurt() { blip(180, 0.25, 'sawtooth', 0.16, 60); },
  // Warm little fanfare when the turkey slips out the back door.
  escaped() {
    [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.12, null, i * 0.12));
  },
  // Sad slide down when the farmer finally grabs the turkey.
  caught() { blip(392, 0.5, 'sawtooth', 0.14, 98); },
  // Page-turn chirp when a stage changes.
  stageUp() { blip(440, 0.10, 'triangle', 0.10, 660); blip(660, 0.14, 'triangle', 0.10, 880, 0.09); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
};
