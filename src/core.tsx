import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  type MotionValue,
} from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { setSoundEnabled } from './sound';

export const spring = { type: 'spring' as const, stiffness: 280, damping: 28 };
export const snappy = { type: 'spring' as const, stiffness: 420, damping: 34 };
export const photo = (index: number) => `/images/photo-${(index % 5) + 1}.jpg`;
export const wrap = (value: number, count: number) =>
  ((value % count) + count) % count;

function readPreference(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

function writePreference(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage can be unavailable (private windows, blocked site data).
  }
}

const PreferencesContext = createContext({
  reduced: false,
  sound: true,
  setReduced: (_value: boolean) => {},
  setSound: (_value: boolean) => {},
});

// The playground is a motion study, so it animates by default even when the
// OS asks for reduced motion; the header toggle is the opt-out.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(() =>
    readPreference('playground:reduce-motion', false),
  );
  const [sound, setSound] = useState(() =>
    readPreference('playground:sound', true),
  );
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    writePreference('playground:reduce-motion', reduced);
  }, [reduced]);
  useEffect(() => {
    setSoundEnabled(sound);
    writePreference('playground:sound', sound);
  }, [sound]);
  return (
    <PreferencesContext.Provider
      value={{ reduced, sound, setReduced, setSound }}
    >
      <MotionConfig
        reducedMotion={reduced ? 'always' : 'never'}
        transition={spring}
      >
        {children}
      </MotionConfig>
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);

const ActivityContext = createContext({ active: false, reduced: false });

export function Demo({
  title,
  index,
  children,
  className = '',
}: {
  title: string;
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const active = useInView(ref, { margin: '60px' });
  const { reduced } = usePreferences();
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <ActivityContext.Provider value={{ active, reduced }}>
      <section
        ref={ref}
        className={`demo ${className}`}
        aria-labelledby={id}
        data-active={active}
        data-demo={id}
      >
        <span className="demo-index mono" aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
        <h2 id={id}>{title}</h2>
        <motion.div
          className="stage"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </section>
    </ActivityContext.Provider>
  );
}

export const useActivity = () => useContext(ActivityContext);

export function useActiveInterval(
  callback: () => void,
  delay: number,
  enabled = true,
  respectReducedMotion = true,
) {
  const { active, reduced } = useActivity();
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (!active || !enabled || (reduced && respectReducedMotion)) return;
    const timer = window.setInterval(() => savedCallback.current(), delay);
    return () => window.clearInterval(timer);
  }, [active, reduced, enabled, delay, respectReducedMotion]);
}

// Autoplay driven by a frame-synced progress value, so progress indicators and
// slide changes stay in step when playback pauses and resumes. `position` is
// unbounded so stacked items can keep stable keys while cycling.
export function useAutoplay(count: number, duration: number) {
  const { active, reduced } = useActivity();
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const running = active && !paused && !reduced;
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = progress.get() + Math.min(now - last, 100) / duration;
      last = now;
      if (next >= 1) {
        progress.set(0);
        setDirection(1);
        setPosition((current) => current + 1);
      } else progress.set(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, duration, progress]);
  const advance = (step = 1) => {
    progress.set(0);
    setDirection(Math.sign(step) || 1);
    setPosition((current) => current + step);
  };
  const index = wrap(position, count);
  return {
    index,
    position,
    direction,
    paused,
    progress: progress as MotionValue<number>,
    advance,
    setIndex: (target: number) => advance(target - index),
    setPaused,
  };
}

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, ref]);
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Replay({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Replay animation" className="replay" onClick={onClick}>
      <RotateCcw size={15} />
    </IconButton>
  );
}

// Characters slide vertically when they change, like a mechanical counter.
export function RollingText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`rolling ${className}`}>
      {[...text].map((char, i) => (
        <span key={i} className="rolling-slot">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              initial={{ y: '90%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-90%', opacity: 0 }}
              transition={snappy}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

export function Choices<T extends string>({
  options,
  value,
  onChange,
  label,
  icons,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  icons?: Partial<Record<T, ReactNode>>;
}) {
  const id = useId();
  return (
    <div className="choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {value === option && (
            <motion.span
              layoutId={`${id}-pill`}
              className="choice-pill"
              transition={snappy}
            />
          )}
          <span className="choice-label">
            {icons?.[option]}
            {option}
          </span>
        </button>
      ))}
    </div>
  );
}
