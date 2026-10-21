import { useEffect } from 'react';

export type SoundKind =
  'hover' | 'tap' | 'tick' | 'success' | 'delete' | 'glitch';

// Every press on these plays one click. Hover sounds are opt-in through
// `data-hover-sound`, and `data-sound-skip` opts an element out entirely.
const interactive =
  'button:not(:disabled), a[href], select, input, label, [role="button"]';

let context: AudioContext | null = null;
let output: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
let lastHover = 0;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

// Browsers only allow an AudioContext to start after a user gesture, so the
// context is created lazily from the first pointerdown or keydown.
function unlockAudio() {
  if (!context) {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();
    output = context.createGain();
    output.gain.value = 0.4;
    output.connect(context.destination);
    noise = context.createBuffer(
      1,
      context.sampleRate * 0.5,
      context.sampleRate,
    );
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === 'suspended') void context.resume();
}

function envelope(
  start: number,
  duration: number,
  peak: number,
  attack: number,
) {
  const gain = context!.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(output!);
  return gain;
}

// A single oscillator with a fast attack and exponential decay.
function tone(
  frequency: number,
  delay: number,
  duration: number,
  peak: number,
  { end = frequency, type = 'sine' as OscillatorType, attack = 0.002 } = {},
) {
  const start = context!.currentTime + delay;
  const oscillator = context!.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (end !== frequency)
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
  oscillator.connect(envelope(start, duration, peak, attack));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

// A filtered noise burst, used for clicks, transients, and air.
function hiss(
  delay: number,
  duration: number,
  peak: number,
  filter: BiquadFilterType,
  frequency: number,
  { q = 0.8, end = frequency, attack = 0.001 } = {},
) {
  const start = context!.currentTime + delay;
  const source = context!.createBufferSource();
  source.buffer = noise;
  const biquad = context!.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(frequency, start);
  if (end !== frequency)
    biquad.frequency.exponentialRampToValueAtTime(end, start + duration);
  source.connect(biquad);
  biquad.connect(envelope(start, duration, peak, attack));
  source.start(start, Math.random() * 0.3);
  source.stop(start + duration + 0.01);
}

// The "Micro" click: a tiny, precise high-passed tick over a faint body.
function click(strength: number, pitch: number, delay = 0) {
  hiss(delay, 0.0025, 0.26 * strength, 'highpass', 6200 * pitch);
  tone(280 * pitch, delay, 0.006, 0.2 * strength, { end: 240 * pitch });
}

// A soft digital "fzzt" for the Matrix glitch: a falling noise sweep, a low
// drop, and a few faint crackles, quiet enough to repeat without grating.
function glitch() {
  hiss(0, 0.22, 0.07, 'bandpass', 6000, { q: 1.5, end: 700, attack: 0.004 });
  tone(320, 0, 0.18, 0.08, { end: 90, attack: 0.004 });
  for (let i = 0; i < 4; i++)
    hiss(0.02 + Math.random() * 0.12, 0.003, 0.05, 'highpass', 5000);
}

let lastGlitch = 0;

export function playSound(kind: SoundKind, pitch = 1) {
  if (!enabled || !context || context.state !== 'running') return;
  switch (kind) {
    case 'hover':
      click(0.3, 1.2 * pitch);
      break;
    case 'tap':
      click(1, pitch);
      break;
    case 'tick':
      click(0.55, 1.15 * pitch);
      break;
    case 'success':
      tone(2600, 0, 0.07, 0.03);
      tone(3900, 0.07, 0.12, 0.025);
      break;
    case 'delete':
      click(1, 0.7 * pitch);
      click(0.6, 0.55 * pitch, 0.06);
      break;
    case 'glitch': {
      const now = performance.now();
      if (now - lastGlitch < 350) return;
      lastGlitch = now;
      glitch();
      break;
    }
  }
}

export function useInterfaceSounds() {
  useEffect(() => {
    let hovered: Element | null = null;
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const target =
        (event.target as Element).closest?.('[data-hover-sound]') ?? null;
      if (target && target !== hovered) {
        const now = performance.now();
        if (now - lastHover > 40) playSound('hover');
        lastHover = now;
      }
      hovered = target;
    };
    const pressable = (target: EventTarget | null) => {
      const element = target as Element;
      return (
        !element.closest?.('[data-sound-skip]') &&
        Boolean(element.closest?.(interactive))
      );
    };
    const onPointerDown = (event: PointerEvent) => {
      unlockAudio();
      if (pressable(event.target)) playSound('tap');
    };
    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio();
      const target = event.target as Element;
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !event.repeat &&
        !target.matches?.('input, textarea, select') &&
        pressable(target)
      )
        playSound('tap');
    };
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}
