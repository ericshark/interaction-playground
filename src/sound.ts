import { useEffect } from 'react';

export type SoundKind =
  | 'hover'
  | 'tap'
  | 'release'
  | 'tick'
  | 'toggle'
  | 'pop'
  | 'whoosh'
  | 'success'
  | 'delete';

const interactive =
  'button:not(:disabled), a[href], select, input, label, [role="button"], [data-sound]';

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

// Each pack is built from one "voice" played at different strengths and
// pitches, so every interaction in a pack shares the same character. Packs
// without a release voice use a lighter, higher copy of the press.
type Voice = (strength: number, pitch: number, delay: number) => void;
export type SoundPack = {
  id: string;
  name: string;
  group: 'Reference' | 'Variations';
  description: string;
  voice: Voice;
  release?: Voice;
};

export const soundPacks: SoundPack[] = [
  {
    id: 'crisp',
    name: 'Crisp click',
    group: 'Reference',
    description: 'The one you liked: a bright tick over a tiny low body.',
    voice: (s, p, d) => {
      tone(230 * p, d, 0.01, 0.42 * s, { end: 190 * p });
      hiss(d, 0.004, 0.3 * s, 'highpass', 4800 * p);
      tone(3800 * p, d, 0.005, 0.03 * s);
    },
    release: (s, p, d) => {
      hiss(d, 0.003, 0.16 * s, 'highpass', 5600 * p);
      tone(270 * p, d, 0.007, 0.18 * s);
    },
  },
  {
    id: 'micro',
    name: 'Micro',
    group: 'Variations',
    description:
      'Shorter and quieter: a tiny, precise tick with barely any body.',
    voice: (s, p, d) => {
      hiss(d, 0.0025, 0.26 * s, 'highpass', 6200 * p);
      tone(280 * p, d, 0.006, 0.2 * s, { end: 240 * p });
    },
  },
  {
    id: 'snap',
    name: 'Snap',
    group: 'Variations',
    description: 'All edge, no thump: a dry snap like a small latch.',
    voice: (s, p, d) => {
      hiss(d, 0.003, 0.34 * s, 'bandpass', 3200 * p, { q: 4 });
      hiss(d, 0.002, 0.22 * s, 'highpass', 7200 * p);
    },
  },
  {
    id: 'pebble',
    name: 'Pebble',
    group: 'Variations',
    description: 'A little rounder and lower, like two smooth stones touching.',
    voice: (s, p, d) => {
      tone(180 * p, d, 0.013, 0.45 * s, { end: 150 * p });
      hiss(d, 0.004, 0.24 * s, 'bandpass', 3600 * p, { q: 2 });
    },
  },
  {
    id: 'tactile',
    name: 'Tactile',
    group: 'Variations',
    description: 'A double-edged click, like a quality mouse switch.',
    voice: (s, p, d) => {
      hiss(d, 0.0025, 0.3 * s, 'highpass', 5000 * p);
      hiss(d + 0.007, 0.002, 0.14 * s, 'highpass', 5800 * p);
      tone(240 * p, d, 0.01, 0.3 * s, { end: 200 * p });
    },
  },
  {
    id: 'glint',
    name: 'Glint',
    group: 'Variations',
    description: 'Crisp click with a faint glassy ring trailing behind it.',
    voice: (s, p, d) => {
      tone(230 * p, d, 0.009, 0.36 * s, { end: 190 * p });
      hiss(d, 0.0035, 0.26 * s, 'highpass', 5000 * p);
      tone(6200 * p, d, 0.03, 0.018 * s);
    },
  },
  {
    id: 'hollow',
    name: 'Hollow',
    group: 'Variations',
    description:
      'A crisp tap on a hollow plastic shell, with a short resonance.',
    voice: (s, p, d) => {
      hiss(d, 0.003, 0.26 * s, 'highpass', 4600 * p);
      hiss(d, 0.016, 0.12 * s, 'bandpass', 1800 * p, { q: 9 });
      tone(210 * p, d, 0.008, 0.22 * s);
    },
  },
  {
    id: 'haptic',
    name: 'Haptic',
    group: 'Variations',
    description: 'Crisp click over a deep, felt bump, like a phone haptic.',
    voice: (s, p, d) => {
      tone(90 * p, d, 0.022, 0.6 * s, { end: 70 * p, attack: 0.003 });
      hiss(d, 0.003, 0.26 * s, 'highpass', 5200 * p);
    },
  },
  {
    id: 'organic',
    name: 'Organic',
    group: 'Variations',
    description:
      'Crisp click with tiny random pitch and level changes each time, so repeats never sound identical.',
    voice: (s, p, d) => {
      const jitter = 1 + (Math.random() - 0.5) * 0.12;
      const level = s * (0.9 + Math.random() * 0.2);
      tone(230 * p * jitter, d, 0.01, 0.4 * level, { end: 190 * p * jitter });
      hiss(d, 0.004, 0.3 * level, 'highpass', 4800 * p * jitter);
    },
  },
];

const defaultPack = soundPacks[0];
function readPack() {
  try {
    const id = localStorage.getItem('playground:sound-pack');
    return soundPacks.find((item) => item.id === id) ?? defaultPack;
  } catch {
    return defaultPack;
  }
}
let pack = readPack();

export const getSoundPack = () => pack.id;
export function setSoundPack(id: string) {
  pack = soundPacks.find((item) => item.id === id) ?? pack;
  try {
    localStorage.setItem('playground:sound-pack', pack.id);
  } catch {
    // Storage can be unavailable (private windows, blocked site data).
  }
}

function render(kind: SoundKind, pitch: number, selected: SoundPack) {
  const { voice, release } = selected;
  switch (kind) {
    case 'hover':
      voice(0.3, 1.2 * pitch, 0);
      break;
    case 'tap':
      voice(1, pitch, 0);
      break;
    case 'release':
      if (release) release(0.7, pitch, 0);
      else voice(0.4, 1.2 * pitch, 0);
      break;
    case 'tick':
      voice(0.55, 1.15 * pitch, 0);
      break;
    case 'toggle':
      voice(0.9, pitch, 0);
      voice(0.7, 1.25 * pitch, 0.055);
      break;
    case 'pop':
      voice(1, 1.1 * pitch, 0);
      break;
    case 'whoosh':
      hiss(0, 0.14, 0.05, 'bandpass', 900, { end: 4200, attack: 0.03 });
      break;
    case 'success':
      voice(0.7, pitch, 0);
      voice(0.7, 1.26 * pitch, 0.07);
      voice(0.8, 1.5 * pitch, 0.14);
      break;
    case 'delete':
      voice(1, 0.7 * pitch, 0);
      voice(0.6, 0.55 * pitch, 0.06);
      break;
  }
}

export function playSound(kind: SoundKind, pitch = 1) {
  if (!enabled || !context || context.state !== 'running') return;
  render(kind, pitch, pack);
}

// Plays a sound even while page sounds are muted, for auditioning packs.
export function previewSound(kind: SoundKind, id = pack.id) {
  unlockAudio();
  if (!context) return;
  render(kind, 1, soundPacks.find((item) => item.id === id) ?? pack);
}

export function useInterfaceSounds() {
  useEffect(() => {
    let hovered: Element | null = null;
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const target = (event.target as Element).closest?.(interactive) ?? null;
      if (target && target !== hovered) {
        const now = performance.now();
        if (now - lastHover > 40) playSound('hover');
        lastHover = now;
      }
      hovered = target;
    };
    let pressed: Element | null = null;
    const onPointerDown = (event: PointerEvent) => {
      unlockAudio();
      // Sound lab controls play their own previews instead.
      const target = event.target as Element;
      pressed = target.closest?.('[data-sound-skip]')
        ? null
        : (target.closest?.(interactive) ?? null);
      if (pressed) playSound('tap');
    };
    // Trackpad-like packs also make a lighter sound when the press lets go.
    const onPointerUp = () => {
      if (pressed) playSound('release');
      pressed = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio();
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !event.repeat &&
        (event.target as Element).closest?.(interactive)
      )
        playSound('tap');
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      if (target.matches?.(':focus-visible') && target.closest(interactive))
        playSound('hover');
    };
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);
}
