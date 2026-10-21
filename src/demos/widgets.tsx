import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  BatteryFull,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Database,
  FastForward,
  Pause,
  Phone,
  Play,
  Rewind,
  Signal,
  Timer,
  Wifi,
  X,
} from 'lucide-react';
import {
  Choices,
  IconButton,
  RollingText,
  spring,
  useActiveInterval,
  useDismiss,
} from '../core';
import { playSound } from '../sound';
import { useCanvas } from './graphics';

const providers = ['Gemini', 'OpenAI', 'Claude', 'Siri'] as const;
type Provider = (typeof providers)[number];
const orbPalettes: Record<Provider, string[]> = {
  Gemini: ['#3d8bff', '#6a5cff', '#b46cf5', '#ff6fae', '#ffb36b'],
  OpenAI: ['#1f9d78', '#5fd1a8', '#0f6e57', '#a7ecd2', '#3cbf94'],
  Claude: ['#d97757', '#f0a582', '#b9563a', '#f6c9a8', '#e38b66'],
  Siri: ['#ff4f8b', '#a64dff', '#3fa9ff', '#4fe3d1', '#ff7ad9'],
};
const toRgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const paletteRgb = Object.fromEntries(
  providers.map((name) => [name, orbPalettes[name].map(toRgb)]),
) as Record<Provider, number[][]>;
const rgba = ([r, g, b]: number[], alpha: number) =>
  `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
const mix = (a: number[], b: number[], t: number) =>
  a.map((value, i) => value + (b[i] - value) * t);

// A soft "speech" envelope: syllable pulses gated into phrases.
function speechLevel(time: number) {
  const syllables =
    Math.max(0, Math.sin(time * 7.3)) * 0.55 +
    Math.max(0, Math.sin(time * 3.1 + 1.3)) * 0.35 +
    Math.max(0, Math.sin(time * 11.7 + 0.4)) * 0.2;
  const phrase = Math.sin(time * 0.9) > -0.35 ? 1 : 0.15;
  return Math.min(1, syllables * phrase);
}

export function ChatOrb() {
  const [provider, setProvider] = useState<Provider>('Gemini');
  const [listening, setListening] = useState(false);
  const orb = useRef({
    from: paletteRgb.Gemini,
    to: paletteRgb.Gemini,
    switchedAt: -10,
    level: 0,
    hover: 0,
    listen: 0,
    lastTime: 0,
    phase: 0,
  });
  const live = useRef({ provider, listening, hovered: false });
  live.current.provider = provider;
  live.current.listening = listening;

  const canvas = useCanvas(
    (context, width, height, time) => {
      const state = orb.current;
      const dt = Math.min(Math.max(time - state.lastTime, 0), 0.1);
      state.lastTime = time;
      const target = paletteRgb[live.current.provider];
      if (target !== state.to) {
        const t = Math.min(1, (time - state.switchedAt) / 0.6);
        state.from = state.from.map((color, i) => mix(color, state.to[i], t));
        state.to = target;
        state.switchedAt = time;
      }
      const blend = Math.min(1, (time - state.switchedAt) / 0.6);
      const eased = blend * blend * (3 - 2 * blend);
      const palette = state.from.map((color, i) =>
        mix(color, state.to[i], eased),
      );
      const approach = (value: number, goal: number, rate: number) =>
        value + (goal - value) * (1 - Math.exp(-dt * rate));
      state.listen = approach(state.listen, live.current.listening ? 1 : 0, 4);
      state.hover = approach(state.hover, live.current.hovered ? 1 : 0, 8);
      state.level = approach(
        state.level,
        live.current.listening ? speechLevel(time) : 0,
        14,
      );
      state.phase += dt * (1 + state.listen * 0.8 + state.level * 2.2);

      const cx = width / 2;
      const cy = height / 2;
      const base = Math.min(width, height) * 0.26;
      const radius =
        base *
        (1 +
          Math.sin(time * 1.6) * 0.018 +
          state.level * 0.08 +
          state.hover * 0.035);
      const phase = state.phase;
      context.clearRect(0, 0, width, height);

      const halo = context.createRadialGradient(
        cx,
        cy,
        radius * 0.7,
        cx,
        cy,
        radius * 1.9,
      );
      halo.addColorStop(
        0,
        rgba(palette[1], 0.22 + state.hover * 0.1 + state.level * 0.12),
      );
      halo.addColorStop(1, rgba(palette[1], 0));
      context.fillStyle = halo;
      context.fillRect(0, 0, width, height);

      if (state.listen > 0.01) {
        for (let ring = 0; ring < 3; ring++) {
          const progress = (time * 0.42 + ring / 3) % 1;
          context.beginPath();
          context.arc(
            cx,
            cy,
            radius * (1.05 + progress * 0.75),
            0,
            Math.PI * 2,
          );
          context.strokeStyle = rgba(
            palette[ring + 1],
            (1 - progress) * 0.32 * state.listen,
          );
          context.lineWidth = 1.2;
          context.stroke();
        }
        const bars = 72;
        context.lineCap = 'round';
        context.lineWidth = 2;
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2 + phase * 0.15;
          const ripple =
            0.5 +
            0.5 *
              Math.sin(i * 0.9 + time * 9) *
              Math.sin(i * 0.37 - time * 4.3);
          const length = 3 + state.level * ripple * radius * 0.28;
          const inner = radius * 1.14;
          context.beginPath();
          context.moveTo(
            cx + Math.cos(angle) * inner,
            cy + Math.sin(angle) * inner,
          );
          context.lineTo(
            cx + Math.cos(angle) * (inner + length),
            cy + Math.sin(angle) * (inner + length),
          );
          context.strokeStyle = rgba(
            palette[i % palette.length],
            0.55 * state.listen,
          );
          context.stroke();
        }
      }

      const shadow = context.createRadialGradient(
        cx,
        cy + radius * 1.12,
        0,
        cx,
        cy + radius * 1.12,
        radius * 0.95,
      );
      shadow.addColorStop(0, rgba(palette[0], 0.28));
      shadow.addColorStop(1, rgba(palette[0], 0));
      context.save();
      context.translate(0, cy + radius * 1.12);
      context.scale(1, 0.22);
      context.translate(0, -(cy + radius * 1.12));
      context.fillStyle = shadow;
      context.fillRect(cx - radius * 1.2, cy, radius * 2.4, radius * 2.4);
      context.restore();

      context.save();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.clip();
      const body = context.createLinearGradient(
        cx - radius,
        cy - radius,
        cx + radius,
        cy + radius,
      );
      body.addColorStop(0, rgba(palette[1], 1));
      body.addColorStop(1, rgba(palette[0], 1));
      context.fillStyle = body;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      palette.forEach((color, i) => {
        const x =
          cx + Math.cos(phase * (0.55 + i * 0.13) + i * 1.9) * radius * 0.52;
        const y =
          cy + Math.sin(phase * (0.47 + i * 0.11) + i * 2.6) * radius * 0.52;
        const blob = context.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          radius * (0.62 + 0.1 * Math.sin(phase + i)),
        );
        blob.addColorStop(0, rgba(color, 1));
        blob.addColorStop(0.5, rgba(color, 0.55));
        blob.addColorStop(1, rgba(color, 0));
        context.fillStyle = blob;
        context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      });
      const rim = context.createRadialGradient(
        cx - radius * 0.2,
        cy - radius * 0.25,
        radius * 0.45,
        cx,
        cy,
        radius,
      );
      rim.addColorStop(0, 'rgba(255,255,255,0)');
      rim.addColorStop(0.82, 'rgba(255,255,255,0.05)');
      rim.addColorStop(1, rgba(palette[0], 0.35));
      context.fillStyle = rim;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      const gloss = context.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.42,
        0,
        cx - radius * 0.32,
        cy - radius * 0.42,
        radius * 0.62,
      );
      gloss.addColorStop(0, 'rgba(255,255,255,0.78)');
      gloss.addColorStop(0.45, 'rgba(255,255,255,0.18)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gloss;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      const bounce = context.createLinearGradient(
        0,
        cy + radius * 0.4,
        0,
        cy + radius,
      );
      bounce.addColorStop(0, 'rgba(255,255,255,0)');
      bounce.addColorStop(1, 'rgba(255,255,255,0.32)');
      context.fillStyle = bounce;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      context.restore();

      context.beginPath();
      context.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255,255,255,0.65)';
      context.lineWidth = 1;
      context.stroke();
      context.beginPath();
      context.arc(cx, cy, radius + 0.5, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(20,20,40,0.07)';
      context.stroke();
    },
    false,
    0,
  );

  return (
    <div className="chat-orb-demo">
      <button
        className={`orb-button ${listening ? 'listening' : ''}`}
        aria-label={listening ? 'Stop listening' : 'Start voice preview'}
        aria-pressed={listening}
        onClick={() => {
          playSound(listening ? 'toggle' : 'pop');
          setListening(!listening);
        }}
        onPointerEnter={() => (live.current.hovered = true)}
        onPointerLeave={() => (live.current.hovered = false)}
        onFocus={() => (live.current.hovered = true)}
        onBlur={() => (live.current.hovered = false)}
      >
        <canvas ref={canvas} aria-hidden="true" />
      </button>
      <div className="orb-controls">
        <Choices
          options={providers}
          value={provider}
          onChange={setProvider}
          label="Voice provider"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={String(listening)}
            className="orb-status"
            role="status"
            initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
          >
            {listening ? (
              <>
                <i className="live-dot" />
                Listening
                <span className="listening-dots" aria-hidden="true" />
              </>
            ) : (
              'Tap the orb to talk'
            )}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

const locations = [
  { name: 'Oregon', detail: 'US West', x: 100, y: 85 },
  { name: 'Virginia', detail: 'US East', x: 152, y: 92 },
  { name: 'Frankfurt', detail: 'Europe', x: 286, y: 65 },
  { name: 'Singapore', detail: 'Asia Pacific', x: 436, y: 156 },
  { name: 'Sydney', detail: 'Australia', x: 480, y: 211 },
];
export function LocationSelector() {
  const [workspace, setWorkspace] = useState('Silverstone Dynamics');
  const [project, setProject] = useState('CircuitHub');
  const [location, setLocation] = useState('Oregon');
  const [created, setCreated] = useState(false);
  const selected = locations.find((item) => item.name === location)!;
  const reset = () => {
    setCreated(false);
    setWorkspace('Silverstone Dynamics');
    setProject('CircuitHub');
    setLocation('Oregon');
  };
  return (
    <div className="location-demo">
      <AnimatePresence mode="wait">
        {created ? (
          <motion.div
            className="database-success"
            key="created"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="success-icon">
              <Database size={23} />
              <Check size={12} />
            </span>
            <h3>You're all set.</h3>
            <p>
              <strong>{project}</strong> is ready in {location}.
            </p>
            <span className="muted small">
              Local preview · nothing was provisioned
            </span>
            <button className="secondary-button" onClick={reset}>
              Create another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="location-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={(event) => {
              event.preventDefault();
              if (workspace.trim() && project.trim()) setCreated(true);
            }}
          >
            <div className="location-fields">
              <label>
                Workspace name
                <input
                  required
                  maxLength={70}
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                />
              </label>
              <label>
                Project name
                <input
                  required
                  maxLength={70}
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                />
              </label>
              <div className="location-bottom">
                <label>
                  Database location
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {locations.map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                  <span className="region-detail">{selected.detail}</span>
                </label>
                <div className="location-map">
                  <svg
                    viewBox="0 0 560 270"
                    role="img"
                    aria-label={`Selected database region: ${location}`}
                  >
                    <defs>
                      <radialGradient id="map-fade">
                        <stop offset="50%" stopColor="white" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </radialGradient>
                      <mask id="map-mask">
                        <rect width="560" height="270" fill="url(#map-fade)" />
                      </mask>
                    </defs>
                    <g
                      mask="url(#map-mask)"
                      fill="#e9ebea"
                      stroke="#d0d6d3"
                      strokeWidth="1"
                    >
                      <path d="M42 32 95 20 158 42 188 79 162 120 143 127 127 168 109 145 105 119 79 102 62 67Z" />
                      <path d="M146 145 176 151 197 180 185 223 163 256 153 213 140 179Z" />
                      <path d="M251 51 283 29 306 45 324 31 345 57 394 40 450 56 510 90 481 111 435 99 412 129 391 117 359 147 333 107 304 100 279 86 256 90Z" />
                      <path d="M277 99 314 105 337 143 315 198 290 193 269 144Z" />
                      <path d="M452 198 488 184 520 217 502 240 462 232Z" />
                      <path
                        d="M88 20 93 105M115 41 162 120M279 49 282 86M301 43 304 100M365 60 359 124M428 70 410 128M288 129 322 139"
                        fill="none"
                      />
                    </g>
                    <motion.g
                      initial={false}
                      animate={{ x: selected.x, y: selected.y }}
                      transition={spring}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="15"
                        fill="#b390ed"
                        opacity="0.13"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="5"
                        fill="#a271df"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </motion.g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="text-button" onClick={reset}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={!workspace.trim() || !project.trim()}
              >
                Create database
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// Original geometric marks drawn for this study (not real brand logos).
const sendMarks: { name: string; mark: ReactNode }[] = [
  {
    name: 'Blocks',
    mark: (
      <>
        <path d="M8 10h10v8H8zM18 18h8v10h-8zM8 28h10v10H8zM26 10h14v8H26zM30 18h10v8H30zM26 30h8v8h-8z" />
        <circle cx="10" cy="42" r="1.6" />
      </>
    ),
  },
  {
    name: 'Prism',
    mark: (
      <>
        <path d="M22 6 10 24l12 18zM26 6v36l12-18z" />
        <path d="M30 40h2v2h-2z" />
      </>
    ),
  },
  {
    name: 'Bolt',
    mark: (
      <>
        <path d="M18 8h18L24 22h14L18 42l6-14H10z" />
        <circle
          cx="38"
          cy="38"
          r="3"
          fill="none"
          strokeWidth="1.4"
          stroke="currentColor"
        />
      </>
    ),
  },
  {
    name: 'Loop',
    mark: (
      <>
        <path d="M25 5a10 10 0 0 1 0 20zM23 23a10 10 0 0 0 0 20z" />
        <path d="M23 5a10 10 0 0 0-10 10h10zM25 43a10 10 0 0 0 10-10H25z" />
      </>
    ),
  },
];

function Mark({ index, size = 44 }: { index: number; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      fill="currentColor"
    >
      {sendMarks[index].mark}
    </svg>
  );
}

type SendStatus = 'closed' | 'open' | 'sending' | 'delivering' | 'sent';

export function ImageSend() {
  const [status, setStatus] = useState<SendStatus>('closed');
  const [selected, setSelected] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, status === 'open', () => setStatus('closed'));
  useEffect(() => {
    if (status === 'sending') {
      const timer = window.setTimeout(() => setStatus('delivering'), 650);
      return () => window.clearTimeout(timer);
    }
    if (status === 'delivering') {
      const timer = window.setTimeout(() => {
        setStatus('sent');
        setSelected([]);
        playSound('success');
      }, 1100);
      return () => window.clearTimeout(timer);
    }
  }, [status]);
  const picking = status === 'open' || status === 'sending';
  const count = selected.length;
  return (
    <div className="image-send-demo" ref={ref}>
      <AnimatePresence mode="popLayout" initial={false}>
        {picking ? (
          <motion.div
            key="picker"
            layoutId="send-surface"
            className="send-picker"
            style={{ borderRadius: 26 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <motion.div
              className="send-picker-content"
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.25, delay: 0.08 }}
            >
              <div className="send-picker-heading">
                <strong>Images</strong>
                <RollingText className="send-count" text={String(count)} />
              </div>
              <div className="send-tiles">
                {sendMarks.map(({ name }, i) => {
                  const isSelected = selected.includes(i + 1);
                  return (
                    <motion.button
                      key={name}
                      className={`send-tile ${isSelected ? 'selected' : ''}`}
                      aria-label={`Select image ${i + 1}`}
                      aria-pressed={isSelected}
                      disabled={status === 'sending'}
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={
                        status === 'sending' && isSelected
                          ? {
                              opacity: 0,
                              scale: 0.25,
                              x: (i % 2 === 0 ? 1 : -1) * 50,
                              y: i < 2 ? 190 : 80,
                              rotate: (i % 2 === 0 ? 1 : -1) * 12,
                            }
                          : { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }
                      }
                      whileTap={{ scale: 0.94 }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                        delay:
                          status === 'sending' ? i * 0.05 : 0.06 + i * 0.04,
                      }}
                      onClick={() => {
                        playSound(
                          isSelected ? 'tick' : 'pop',
                          isSelected ? 0.8 : 1,
                        );
                        setSelected((current) =>
                          current.includes(i + 1)
                            ? current.filter((n) => n !== i + 1)
                            : [...current, i + 1],
                        );
                      }}
                    >
                      <Mark index={i} />
                      <span className="send-check">
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 600,
                                damping: 24,
                              }}
                            >
                              <Check size={11} strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <button
                className="send-button"
                aria-label={
                  count
                    ? `Send ${count} image${count === 1 ? '' : 's'}`
                    : 'Send images'
                }
                disabled={count === 0 || status === 'sending'}
                onClick={() => {
                  playSound('whoosh');
                  setStatus('sending');
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="trigger"
            className="send-trigger-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <span className="send-flower" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} style={{ '--i': i } as CSSProperties} />
              ))}
            </span>
            <motion.button
              layoutId="send-surface"
              className="send-trigger"
              style={{ borderRadius: 24 }}
              aria-label="Open image picker"
              aria-expanded={false}
              disabled={status === 'delivering'}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={() => {
                setSelected([]);
                setStatus('open');
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {status === 'delivering' ? (
                  <motion.svg
                    key="progress"
                    className="send-progress"
                    viewBox="0 0 40 40"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    <circle cx="20" cy="20" r="15" />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="15"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    />
                  </motion.svg>
                ) : status === 'sent' ? (
                  <motion.span
                    key="sent"
                    className="send-done"
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    <Check size={26} strokeWidth={2.6} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="mark"
                    className="send-mark"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    <Mark index={3} size={34} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <AnimatePresence>
              {status === 'sent' && (
                <motion.div
                  className="send-success"
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <p>Delivered.</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected([]);
                      setStatus('open');
                    }}
                  >
                    Send more images
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <span role="status" className="sr-only">
        {status === 'sent'
          ? 'Images sent'
          : status === 'sending' || status === 'delivering'
            ? 'Sending images'
            : ''}
      </span>
    </div>
  );
}

const initialTransactions = [
  { name: 'Selene', currency: 'Ethereum', amount: '$69.00', color: '#7776d9' },
  { name: 'Marina', currency: 'DogeCoin', amount: '$420.00', color: '#c2a65a' },
  {
    name: 'Margarot',
    currency: 'DogeCoin',
    amount: '$24.00',
    color: '#c2a65a',
  },
  { name: 'Kelly', currency: 'DogeCoin', amount: '$96.00', color: '#c2a65a' },
];
export function Transactions() {
  const [queue, setQueue] = useState(initialTransactions);
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  useActiveInterval(
    () => {
      setQueue((current) => current.slice(1));
      playSound('tick', 1.2);
    },
    1800,
    processing && queue.length > 0,
    false,
  );
  useEffect(() => {
    if (queue.length === 0) setProcessing(false);
  }, [queue.length]);
  const reset = () => {
    setQueue(initialTransactions);
    setProcessing(false);
  };
  return (
    <div className="transactions-demo">
      <div className="transaction-header">
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          Pending Transactions <span className="mono">{queue.length}</span>
          <ChevronDown
            size={15}
            style={{ transform: open ? 'rotate(180deg)' : '' }}
          />
        </button>
      </div>
      <motion.div
        className="transaction-stack"
        animate={{
          height: queue.length ? (open ? queue.length * 66 : 90) : 104,
        }}
      >
        <AnimatePresence initial={false}>
          {queue.map((item, i) => (
            <motion.div
              layout
              key={item.name}
              className="transaction-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                y: open ? i * 66 : i * 8,
                scale: open ? 1 : 1 - i * 0.035,
                opacity: open ? 1 : 1 - i * 0.14,
              }}
              exit={{ x: 50, opacity: 0, scale: 0.9 }}
              style={{ zIndex: 10 - i }}
            >
              <div className="coin-icon" style={{ background: item.color }}>
                {item.currency === 'Ethereum' ? '♦' : 'Ð'}
                <span>
                  <ArrowUpRight size={8} />
                </span>
              </div>
              <div>
                <span className="small muted">
                  Sending to <strong>{item.name}</strong>
                </span>
                <strong className="small">{item.currency}</strong>
              </div>
              <strong className="transaction-amount">{item.amount}</strong>
            </motion.div>
          ))}
        </AnimatePresence>
        {queue.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="transactions-done"
          >
            <CircleCheck size={22} />
            <span>All caught up.</span>
          </motion.div>
        )}
      </motion.div>
      <div className="transaction-actions">
        {queue.length > 0 ? (
          <button
            className="text-button"
            onClick={() => {
              setProcessing(!processing);
              setOpen(true);
            }}
          >
            {processing ? 'Pause processing' : 'Process queue'}
            {processing ? <Pause size={11} /> : <ArrowUpRight size={11} />}
          </button>
        ) : (
          <button className="text-button" onClick={reset}>
            Replay transactions
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {queue.length} transactions pending
      </span>
    </div>
  );
}

const islandModes = ['Idle', 'Call', 'Music', 'Timer', 'Calendar'] as const;
type IslandMode = (typeof islandModes)[number];
const islandSizes: Record<
  IslandMode,
  { compact: [number, number]; expanded: [number, number] }
> = {
  Idle: { compact: [118, 34], expanded: [118, 34] },
  Call: { compact: [196, 34], expanded: [300, 78] },
  Music: { compact: [206, 34], expanded: [300, 158] },
  Timer: { compact: [190, 34], expanded: [300, 78] },
  Calendar: { compact: [196, 34], expanded: [300, 112] },
};
const timerLength = 300;
const songLength = 346;
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function Waveform({ bars, color }: { bars: number; color: string }) {
  return (
    <span className="island-wave" aria-hidden="true" style={{ color }}>
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} style={{ animationDelay: `${(i * 0.13) % 0.7}s` }} />
      ))}
    </span>
  );
}

function IslandContent({
  mode,
  compact,
  seconds,
  callEnded,
  playing,
  song,
  timer,
  timerRunning,
  actions,
}: {
  mode: IslandMode;
  compact: boolean;
  seconds: number;
  callEnded: boolean;
  playing: boolean;
  song: number;
  timer: number;
  timerRunning: boolean;
  actions: {
    endCall: () => void;
    togglePlay: () => void;
    skip: () => void;
    toggleTimer: () => void;
    cancelTimer: () => void;
  };
}) {
  if (mode === 'Idle') return <span className="island-camera" />;
  if (mode === 'Call') {
    if (compact)
      return (
        <>
          <span className="island-pill-icon green">
            <Phone size={12} />
          </span>
          <span className="island-compact-text green">
            {callEnded ? 'Ended' : clock(seconds)}
          </span>
        </>
      );
    return (
      <>
        <span className="caller-avatar">A</span>
        <div className="island-copy">
          <span>{callEnded ? 'Call ended' : 'Mobile'}</span>
          <strong>{callEnded ? 'Talk soon.' : 'Abil'}</strong>
        </div>
        {!callEnded && (
          <>
            <span className="island-timer green">{clock(seconds)}</span>
            <Waveform bars={5} color="#5fd38b" />
          </>
        )}
        <IconButton
          label={callEnded ? 'Call again' : 'End call'}
          className={callEnded ? 'call-again' : 'end-call'}
          onClick={actions.endCall}
        >
          <Phone size={17} />
        </IconButton>
      </>
    );
  }
  if (mode === 'Music') {
    if (compact)
      return (
        <>
          <img className="island-album small" src="/images/saku.jpg" alt="" />
          <Waveform bars={4} color="#e6c48a" />
        </>
      );
    return (
      <div className="island-music">
        <div className="island-music-top">
          <img
            className="island-album"
            src="/images/saku.jpg"
            alt="Saku album artwork"
          />
          <div className="island-copy">
            <strong>Saku</strong>
            <span>Susumu Yokota</span>
          </div>
          <span
            className={`music-bars ${playing ? 'playing' : ''}`}
            aria-hidden="true"
          >
            {[0, 1, 2, 3].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </span>
        </div>
        <div className="island-progress">
          <span>{clock(song)}</span>
          <div>
            <motion.i
              animate={{ scaleX: song / songLength }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          <span>-{clock(songLength - song)}</span>
        </div>
        <div className="island-controls">
          <IconButton label="Previous track" onClick={actions.skip}>
            <Rewind size={18} fill="currentColor" />
          </IconButton>
          <IconButton
            label={playing ? 'Pause music preview' : 'Play music preview'}
            onClick={actions.togglePlay}
          >
            {playing ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" />
            )}
          </IconButton>
          <IconButton label="Next track" onClick={actions.skip}>
            <FastForward size={18} fill="currentColor" />
          </IconButton>
        </div>
      </div>
    );
  }
  if (mode === 'Timer') {
    const progress = timer / timerLength;
    if (compact)
      return (
        <>
          <span className="island-pill-icon amber">
            <Timer size={12} />
          </span>
          <span className="island-compact-text amber">{clock(timer)}</span>
        </>
      );
    return (
      <>
        <svg className="timer-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="18" />
          <motion.circle
            cx="22"
            cy="22"
            r="18"
            animate={{ pathLength: progress }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </svg>
        <div className="island-copy">
          <span>Timer</span>
          <strong className="island-big amber">{clock(timer)}</strong>
        </div>
        <IconButton
          label={timerRunning ? 'Pause timer' : 'Resume timer'}
          className="timer-toggle"
          onClick={actions.toggleTimer}
        >
          {timerRunning ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </IconButton>
        <IconButton
          label="Cancel timer"
          className="timer-cancel"
          onClick={actions.cancelTimer}
        >
          <X size={16} />
        </IconButton>
      </>
    );
  }
  if (compact)
    return (
      <>
        <span className="island-pill-icon violet">
          <CalendarDays size={12} />
        </span>
        <span className="island-compact-text violet">in 10 min</span>
      </>
    );
  return (
    <div className="island-calendar">
      <span className="eyebrow">Up next · in 10 min</span>
      <strong>Make something good.</strong>
      <div>
        <span className="calendar-attendee">A</span>
        <span className="calendar-attendee">E</span>
        <span>Design exploration · 30 min</span>
      </div>
    </div>
  );
}

export function DynamicIsland() {
  const [mode, setMode] = useState<IslandMode>('Idle');
  const [compact, setCompact] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [song, setSong] = useState(84);
  const [timer, setTimer] = useState(timerLength);
  const [timerRunning, setTimerRunning] = useState(true);
  useActiveInterval(
    () => setSeconds((n) => n + 1),
    1000,
    mode === 'Call' && !callEnded,
    false,
  );
  useActiveInterval(
    () => setSong((n) => (n + 1) % songLength),
    1000,
    mode === 'Music' && playing,
    false,
  );
  useActiveInterval(
    () => setTimer((n) => (n > 0 ? n - 1 : timerLength)),
    1000,
    mode === 'Timer' && timerRunning,
    false,
  );
  const change = (value: IslandMode) => {
    setMode(value);
    setCompact(false);
    setCallEnded(false);
    setSeconds(0);
    setTimerRunning(true);
  };
  const [width, height] = islandSizes[mode][compact ? 'compact' : 'expanded'];
  const tall = height > 40;
  return (
    <div className="dynamic-demo">
      <div className="phone">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span>
            <Signal size={13} />
            <Wifi size={13} />
            <BatteryFull size={17} />
          </span>
        </div>
        <motion.div
          className={`dynamic-island island-${mode.toLowerCase()}`}
          animate={{ width, height, borderRadius: tall ? 36 : 17 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.9,
          }}
        >
          <button
            className="island-toggle"
            aria-label={
              mode === 'Idle'
                ? 'Dynamic Island'
                : `${compact ? 'Expand' : 'Collapse'} ${mode} activity`
            }
            aria-expanded={mode === 'Idle' ? undefined : !compact}
            onClick={() => {
              if (mode === 'Idle') return;
              playSound('pop', compact ? 1 : 0.85);
              setCompact(!compact);
            }}
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mode + String(compact) + String(callEnded)}
              className={`island-content ${compact || mode === 'Idle' ? 'compact' : ''}`}
              initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.92 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.92 }}
              transition={{ duration: 0.22, delay: 0.06 }}
            >
              <IslandContent
                mode={mode}
                compact={compact}
                seconds={seconds}
                callEnded={callEnded}
                playing={playing}
                song={song}
                timer={timer}
                timerRunning={timerRunning}
                actions={{
                  endCall: () => {
                    setCallEnded(!callEnded);
                    setSeconds(0);
                  },
                  togglePlay: () => setPlaying(!playing),
                  skip: () => setSong(0),
                  toggleTimer: () => setTimerRunning(!timerRunning),
                  cancelTimer: () => {
                    setTimer(timerLength);
                    setTimerRunning(false);
                  },
                }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="phone-apps" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <Choices
        options={islandModes}
        value={mode}
        onChange={change}
        label="Dynamic Island mode"
      />
      <span className="demo-hint">Tap the island to collapse or expand it</span>
    </div>
  );
}
