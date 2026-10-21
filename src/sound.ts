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
// pitches, so every interaction in a pack shares the same character.
type Voice = (strength: number, pitch: number, delay: number) => void;
export type SoundPack = {
  id: string;
  name: string;
  group: 'Trackpad-like' | 'Current' | 'Experimental';
  description: string;
  voice: Voice;
  release?: Voice;
};

export const soundPacks: SoundPack[] = [
  {
    id: 'trackpad',
    name: 'Trackpad',
    group: 'Trackpad-like',
    description: 'A short low thump with a dry tick, like a Force Touch click.',
    voice: (s, p, d) => {
      tone(190 * p, d, 0.016, 0.55 * s, { end: 150 * p });
      hiss(d, 0.006, 0.22 * s, 'bandpass', 2600 * p, { q: 1.2 });
    },
    release: (s, p, d) => {
      tone(240 * p, d, 0.011, 0.3 * s, { end: 200 * p });
      hiss(d, 0.004, 0.12 * s, 'bandpass', 3400 * p, { q: 1.2 });
    },
  },
  {
    id: 'trackpad-soft',
    name: 'Soft press',
    group: 'Trackpad-like',
    description: 'A rounder, muffled click with almost no edge.',
    voice: (s, p, d) => {
      tone(140 * p, d, 0.024, 0.55 * s, { end: 110 * p, attack: 0.003 });
      hiss(d, 0.009, 0.1 * s, 'lowpass', 1800 * p);
    },
    release: (s, p, d) => {
      tone(175 * p, d, 0.016, 0.25 * s, { end: 150 * p, attack: 0.003 });
    },
  },
  {
    id: 'trackpad-crisp',
    name: 'Crisp click',
    group: 'Trackpad-like',
    description: 'A tight, bright click with a tiny body underneath.',
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
    id: 'thock',
    name: 'Thock',
    group: 'Trackpad-like',
    description: 'A deep keyboard-style thock with a woody resonance.',
    voice: (s, p, d) => {
      tone(115 * p, d, 0.032, 0.6 * s, { end: 80 * p });
      hiss(d, 0.018, 0.16 * s, 'bandpass', 1200 * p, { q: 2 });
    },
    release: (s, p, d) => {
      hiss(d, 0.008, 0.1 * s, 'bandpass', 1800 * p, { q: 2 });
    },
  },
  {
    id: 'blip',
    name: 'Blip',
    group: 'Current',
    description: 'The current set: short, high, soft sine blips.',
    voice: (s, p, d) =>
      tone(4200 * p, d, 0.012 + 0.016 * s, 0.045 * s, { end: 3600 * p }),
  },
  {
    id: 'glass',
    name: 'Glass',
    group: 'Experimental',
    description: 'A tiny struck-glass chime with an inharmonic shimmer.',
    voice: (s, p, d) => {
      tone(2100 * p, d, 0.06 + 0.12 * s, 0.05 * s);
      tone(5300 * p, d, 0.04 + 0.08 * s, 0.022 * s);
    },
  },
  {
    id: 'wood',
    name: 'Woodblock',
    group: 'Experimental',
    description: 'A hollow wooden knock.',
    voice: (s, p, d) => {
      tone(780 * p, d, 0.05, 0.28 * s, { end: 700 * p });
      hiss(d, 0.025, 0.14 * s, 'bandpass', 1600 * p, { q: 6 });
    },
  },
  {
    id: 'bubble',
    name: 'Bubble',
    group: 'Experimental',
    description: 'A playful rising pop, like a bubble surfacing.',
    voice: (s, p, d) =>
      tone(380 * p, d, 0.06, 0.16 * s, { end: 1100 * p, attack: 0.004 }),
  },
  {
    id: 'retro',
    name: '8-bit',
    group: 'Experimental',
    description: 'Square-wave bleeps from an old handheld.',
    voice: (s, p, d) =>
      tone(880 * p, d, 0.035 + 0.03 * s, 0.05 * s, { type: 'square' }),
  },
  {
    id: 'silk',
    name: 'Silk',
    group: 'Experimental',
    description: 'A breathy puff of air instead of a tone.',
    voice: (s, p, d) =>
      hiss(d, 0.03 + 0.03 * s, 0.12 * s, 'bandpass', 6000 * p, {
        end: 4200 * p,
        attack: 0.006,
      }),
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    group: 'Experimental',
    description: 'A mechanical strike with a short metallic tail.',
    voice: (s, p, d) => {
      hiss(d, 0.01, 0.3 * s, 'highpass', 2500 * p);
      tone(320 * p, d, 0.02, 0.18 * s);
      hiss(d + 0.006, 0.04, 0.05 * s, 'bandpass', 900 * p, { q: 3 });
    },
  },
  {
    id: 'sonar',
    name: 'Sonar',
    group: 'Experimental',
    description: 'A soft ping that rings out, like a submarine sonar.',
    voice: (s, p, d) =>
      tone(1050 * p, d, 0.1 + 0.25 * s, 0.05 * s, { attack: 0.004 }),
  },
];

const defaultPack = soundPacks.find((item) => item.id === 'blip')!;
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
      release?.(0.7, pitch, 0);
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
