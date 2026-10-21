import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

const ActivityContext = createContext({ active: false, reduced: false });

export function Demo({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const active = useInView(ref, { margin: '60px' });
  const reduced = Boolean(useReducedMotion());
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
        <h2 id={id}>{title}</h2>
        <div className="stage">{children}</div>
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

export function Choices<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export const spring = { type: 'spring' as const, stiffness: 280, damping: 28 };
export const photo = (index: number) => `/images/photo-${(index % 5) + 1}.jpg`;

export function useCycle(count: number, interval = 3500) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const advance = (step = 1) =>
    setIndex((current) => (current + step + count) % count);
  useActiveInterval(advance, interval, !paused);
  return { index, advance, setIndex, setPaused };
}
