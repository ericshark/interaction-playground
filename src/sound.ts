import { useEffect } from 'react';

export type SoundKind =
  'hover' | 'tap' | 'tick' | 'toggle' | 'pop' | 'whoosh' | 'success' | 'delete';

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
    output.gain.value = 0.55;
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

function envelope(start: number, duration: number, peak: number) {
  const gain = context!.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(output!);
  return gain;
}

function tone(
  frequency: number,
  delay: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine',
  endFrequency = frequency,
) {
  const start = context!.currentTime + delay;
  const oscillator = context!.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    endFrequency,
    start + duration,
  );
  oscillator.connect(envelope(start, duration, peak));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function burst(
  delay: number,
  duration: number,
  peak: number,
  type: BiquadFilterType,
  frequency: number,
  endFrequency = frequency,
) {
  const start = context!.currentTime + delay;
  const source = context!.createBufferSource();
  source.buffer = noise;
  const filter = context!.createBiquadFilter();
  filter.type = type;
  filter.Q.value = type === 'bandpass' ? 1.4 : 0.7;
  filter.frequency.setValueAtTime(frequency, start);
  filter.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  source.connect(filter);
  filter.connect(envelope(start, duration, peak));
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function playSound(kind: SoundKind, pitch = 1) {
  if (!enabled || !context || context.state !== 'running') return;
  switch (kind) {
    case 'hover':
      tone(2500 * pitch, 0, 0.028, 0.03);
      burst(0, 0.012, 0.025, 'highpass', 6500);
      break;
    case 'tap':
      tone(1500 * pitch, 0, 0.05, 0.05, 'triangle', 950 * pitch);
      burst(0, 0.016, 0.04, 'bandpass', 3200);
      break;
    case 'tick':
      tone(1900 * pitch, 0, 0.04, 0.045);
      burst(0, 0.01, 0.035, 'highpass', 4500);
      break;
    case 'toggle':
      tone(880 * pitch, 0, 0.06, 0.045);
      tone(1320 * pitch, 0.045, 0.08, 0.04);
      break;
    case 'pop':
      tone(520 * pitch, 0, 0.09, 0.07, 'sine', 1150 * pitch);
      break;
    case 'whoosh':
      burst(0, 0.38, 0.07, 'bandpass', 380, 2600);
      break;
    case 'success':
      tone(880, 0, 0.14, 0.055);
      tone(1318.5, 0.09, 0.26, 0.05);
      tone(1760, 0.18, 0.32, 0.025);
      break;
    case 'delete':
      tone(560, 0, 0.2, 0.06, 'triangle', 170);
      burst(0, 0.12, 0.04, 'lowpass', 1800, 300);
      break;
  }
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
    const onPointerDown = (event: PointerEvent) => {
      unlockAudio();
      if ((event.target as Element).closest?.(interactive)) playSound('tap');
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
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);
}
