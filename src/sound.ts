import { useEffect } from 'react';

export type SoundKind =
  'hover' | 'tap' | 'tick' | 'toggle' | 'pop' | 'whoosh' | 'success' | 'delete';

const interactive =
  'button:not(:disabled), a[href], select, input, label, [role="button"], [data-sound]';

let context: AudioContext | null = null;
let output: GainNode | null = null;
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
    output.gain.value = 0.35;
    output.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
}

// Every sound is a short, high sine blip: a ~2ms attack and an exponential
// decay keep them soft and click-free.
function blip(
  frequency: number,
  delay: number,
  duration: number,
  peak: number,
  endFrequency = frequency,
) {
  const start = context!.currentTime + delay;
  const oscillator = context!.createOscillator();
  const gain = context!.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== frequency)
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      start + duration,
    );
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(output!);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

export function playSound(kind: SoundKind, pitch = 1) {
  if (!enabled || !context || context.state !== 'running') return;
  switch (kind) {
    case 'hover':
      blip(4800 * pitch, 0, 0.014, 0.018);
      break;
    case 'tap':
      blip(3200 * pitch, 0, 0.03, 0.04, 2600 * pitch);
      break;
    case 'tick':
      blip(4200 * pitch, 0, 0.018, 0.03);
      break;
    case 'toggle':
      blip(2600 * pitch, 0, 0.03, 0.035);
      blip(3500 * pitch, 0.04, 0.035, 0.03);
      break;
    case 'pop':
      blip(2200 * pitch, 0, 0.05, 0.04, 3400 * pitch);
      break;
    case 'whoosh':
      blip(1800, 0, 0.12, 0.025, 3600);
      break;
    case 'success':
      blip(2600, 0, 0.06, 0.03);
      blip(3300, 0.06, 0.07, 0.026);
      blip(3900, 0.12, 0.12, 0.022);
      break;
    case 'delete':
      blip(2400, 0, 0.09, 0.035, 1400);
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
