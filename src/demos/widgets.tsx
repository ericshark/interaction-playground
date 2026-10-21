import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  BatteryFull,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
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
  useActiveInterval,
  useDismiss,
  usePreferences,
} from '../core';
import { playSound } from '../sound';
import { useCanvas } from './graphics';
import { dotPath, landDots, mapHeight, mapWidth, project } from './worldMap';

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
  const { dark } = usePreferences();
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
  const live = useRef({ provider, listening, hovered: false, dark });
  live.current.provider = provider;
  live.current.listening = listening;
  live.current.dark = dark;

  const canvas = useCanvas(
    (context, width, height, time) => {
      const state = orb.current;
      const dt = Math.min(Math.max(time - state.lastTime, 0), 0.1);
      state.lastTime = time;
      const target = paletteRgb[live.current.provider];
      if (target !== state.to) {
        const t = Math.min(1, (time - state.switchedAt) / 0.8);
        state.from = state.from.map((color, i) => mix(color, state.to[i], t));
        state.to = target;
        state.switchedAt = time;
      }
      const blend = Math.min(1, (time - state.switchedAt) / 0.8);
      const eased = blend * blend * (3 - 2 * blend);
      const palette = state.from.map((color, i) =>
        mix(color, state.to[i], eased),
      );
      const approach = (value: number, goal: number, rate: number) =>
        value + (goal - value) * (1 - Math.exp(-dt * rate));
      state.listen = approach(state.listen, live.current.listening ? 1 : 0, 3);
      state.hover = approach(state.hover, live.current.hovered ? 1 : 0, 6);
      state.level = approach(
        state.level,
        live.current.listening ? speechLevel(time) : 0,
        9,
      );
      state.phase += dt * (0.35 + state.listen * 0.25 + state.level * 0.6);

      const cx = width / 2;
      const cy = height / 2;
      const radius =
        Math.min(width, height) *
        0.3 *
        (1 + Math.sin(time * 1.2) * 0.012 + state.hover * 0.025);
      const phase = state.phase;
      const voice = state.listen * state.level;
      context.clearRect(0, 0, width, height);

      const halo = context.createRadialGradient(
        cx,
        cy,
        radius * 0.6,
        cx,
        cy,
        radius * 1.75,
      );
      halo.addColorStop(
        0,
        rgba(palette[1], 0.12 + state.hover * 0.06 + voice * 0.22),
      );
      halo.addColorStop(1, rgba(palette[1], 0));
      context.fillStyle = halo;
      context.fillRect(0, 0, width, height);

      const shadowY = cy + radius * 1.18;
      context.save();
      context.translate(cx, shadowY);
      context.scale(1, 0.18);
      const shadow = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      shadow.addColorStop(0, rgba(palette[0], live.current.dark ? 0.35 : 0.22));
      shadow.addColorStop(1, rgba(palette[0], 0));
      context.fillStyle = shadow;
      context.fillRect(-radius, -radius, radius * 2, radius * 2);
      context.restore();

      // The outline is a circle perturbed by a few slow harmonics, so the orb
      // softly changes shape with the simulated voice instead of jittering.
      context.beginPath();
      for (let i = 0; i <= 96; i++) {
        const angle = (i / 96) * Math.PI * 2;
        const wobble =
          voice *
          (0.04 * Math.sin(angle * 3 + time * 1.3) +
            0.025 * Math.sin(angle * 5 - time * 1.7) +
            0.02 * Math.sin(angle * 2 + time * 0.9));
        const r = radius * (1 + wobble);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.save();
      context.clip();
      const extent = radius * 1.2;
      const body = context.createLinearGradient(
        cx - extent,
        cy - extent,
        cx + extent,
        cy + extent,
      );
      body.addColorStop(0, rgba(palette[1], 1));
      body.addColorStop(1, rgba(palette[0], 1));
      context.fillStyle = body;
      context.fillRect(cx - extent, cy - extent, extent * 2, extent * 2);
      palette.forEach((color, i) => {
        const x =
          cx + Math.cos(phase * (0.5 + i * 0.09) + i * 1.9) * radius * 0.45;
        const y =
          cy + Math.sin(phase * (0.42 + i * 0.07) + i * 2.6) * radius * 0.45;
        const blob = context.createRadialGradient(x, y, 0, x, y, radius * 0.8);
        blob.addColorStop(0, rgba(color, 0.85));
        blob.addColorStop(1, rgba(color, 0));
        context.fillStyle = blob;
        context.fillRect(cx - extent, cy - extent, extent * 2, extent * 2);
      });
      const light = context.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.45,
        0,
        cx - radius * 0.35,
        cy - radius * 0.45,
        radius * 0.9,
      );
      light.addColorStop(0, 'rgba(255,255,255,0.42)');
      light.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = light;
      context.fillRect(cx - extent, cy - extent, extent * 2, extent * 2);
      const rim = context.createRadialGradient(
        cx,
        cy,
        radius * 0.7,
        cx,
        cy,
        radius * 1.05,
      );
      rim.addColorStop(0, rgba(palette[0], 0));
      rim.addColorStop(1, rgba(palette[0], 0.28));
      context.fillStyle = rim;
      context.fillRect(cx - extent, cy - extent, extent * 2, extent * 2);
      context.restore();
      context.strokeStyle = live.current.dark
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(255,255,255,0.55)';
      context.lineWidth = 1;
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
        onClick={() => setListening(!listening)}
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

const regions = [
  {
    name: 'Oregon',
    region: 'US West',
    code: 'US',
    id: 'us-west-2',
    lon: -122.7,
    lat: 45.5,
    latency: 68,
  },
  {
    name: 'Virginia',
    region: 'US East',
    code: 'US',
    id: 'us-east-1',
    lon: -77.5,
    lat: 38.9,
    latency: 12,
  },
  {
    name: 'São Paulo',
    region: 'South America',
    code: 'BR',
    id: 'sa-east-1',
    lon: -46.6,
    lat: -23.5,
    latency: 118,
  },
  {
    name: 'London',
    region: 'Europe West',
    code: 'GB',
    id: 'eu-west-2',
    lon: -0.1,
    lat: 51.5,
    latency: 76,
  },
  {
    name: 'Frankfurt',
    region: 'Europe Central',
    code: 'DE',
    id: 'eu-central-1',
    lon: 8.7,
    lat: 50.1,
    latency: 89,
  },
  {
    name: 'Mumbai',
    region: 'Asia South',
    code: 'IN',
    id: 'ap-south-1',
    lon: 72.9,
    lat: 19.1,
    latency: 182,
  },
  {
    name: 'Singapore',
    region: 'Asia Southeast',
    code: 'SG',
    id: 'ap-southeast-1',
    lon: 103.8,
    lat: 1.4,
    latency: 214,
  },
  {
    name: 'Tokyo',
    region: 'Asia Northeast',
    code: 'JP',
    id: 'ap-northeast-1',
    lon: 139.7,
    lat: 35.7,
    latency: 148,
  },
  {
    name: 'Sydney',
    region: 'Oceania',
    code: 'AU',
    id: 'ap-southeast-2',
    lon: 151.2,
    lat: -33.9,
    latency: 198,
  },
];
const home = regions[1];
const worldDots = dotPath(landDots);
const zoomedWidth = mapWidth / 1.65;
const zoomedHeight = zoomedWidth / 2.1;

function viewBoxFor(region: (typeof regions)[number]) {
  const { x, y } = project(region.lon, region.lat);
  const left = Math.min(
    Math.max(x - zoomedWidth / 2, 0),
    mapWidth - zoomedWidth,
  );
  const top = Math.min(
    Math.max(y - zoomedHeight / 2, 0),
    mapHeight - zoomedHeight,
  );
  return `${left} ${top} ${zoomedWidth} ${zoomedHeight}`;
}

function LocationSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  useDismiss(ref, open, () => setOpen(false));
  const current = regions[value];
  const show = () => {
    setActive(value);
    setOpen(true);
  };
  const commit = (index: number) => {
    onChange(index);
    setOpen(false);
  };
  return (
    <div className="location-select" ref={ref}>
      <button
        type="button"
        className="location-trigger"
        role="combobox"
        aria-label="Database location"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="location-options"
        aria-activedescendant={open ? `location-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          const move = (index: number) => {
            event.preventDefault();
            if (!open) show();
            setActive(Math.max(0, Math.min(regions.length - 1, index)));
          };
          if (event.key === 'ArrowDown') move(open ? active + 1 : value);
          else if (event.key === 'ArrowUp') move(open ? active - 1 : value);
          else if (event.key === 'Home') move(0);
          else if (event.key === 'End') move(regions.length - 1);
          else if ((event.key === 'Enter' || event.key === ' ') && open) {
            event.preventDefault();
            commit(active);
          } else if (event.key.length === 1 && /\S/.test(event.key)) {
            // Type-ahead: jump to the next location starting with the typed text.
            const now = performance.now();
            typed.current.text =
              (now - typed.current.at > 700 ? '' : typed.current.text) +
              event.key.toLowerCase();
            typed.current.at = now;
            const start = open ? active : value;
            const order = regions.map(
              (_, i) => (start + 1 + i) % regions.length,
            );
            const match = order.find((i) =>
              regions[i].name.toLowerCase().startsWith(typed.current.text),
            );
            if (match !== undefined) move(match);
          }
        }}
      >
        <span className="region-code">{current.code}</span>
        <span className="location-trigger-text">
          <strong>{current.name}</strong>
          <small>
            {current.region} · {current.id}
          </small>
        </span>
        <ChevronDown size={15} className={open ? 'rotated' : ''} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="location-options"
            className="location-options"
            role="listbox"
            aria-label="Database locations"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
          >
            {regions.map((region, i) => (
              <li
                key={region.id}
                id={`location-option-${i}`}
                role="option"
                aria-selected={value === i}
                className={active === i ? 'active' : ''}
                onPointerEnter={() => setActive(i)}
                onClick={() => commit(i)}
              >
                <span className="region-code">{region.code}</span>
                <span className="location-option-text">
                  <strong>{region.name}</strong>
                  <small>{region.region}</small>
                </span>
                <span
                  className="latency"
                  aria-label={`${region.latency} milliseconds`}
                >
                  <i
                    style={{ width: `${Math.min(100, region.latency / 2.2)}%` }}
                  />
                  {region.latency}ms
                </span>
                <Check
                  size={13}
                  className="location-check"
                  style={{ opacity: value === i ? 1 : 0 }}
                />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LocationSelector() {
  const [selected, setSelected] = useState(0);
  const region = regions[selected];
  const point = project(region.lon, region.lat);
  const origin = project(home.lon, home.lat);
  const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
  const arc = `M${origin.x} ${origin.y}Q${(origin.x + point.x) / 2} ${
    Math.min(origin.y, point.y) - distance * 0.28
  } ${point.x} ${point.y}`;
  const label = `${region.name} · ${region.latency}ms`;
  const nearby = dotPath(
    landDots.filter(
      (dot) =>
        Math.hypot(dot.longitude - region.lon, dot.latitude - region.lat) < 13,
    ),
  );
  return (
    <div className="location-demo">
      <div className="location-heading">
        <div>
          <strong>Database region</strong>
          <span>Choose where your data lives</span>
        </div>
        <LocationSelect value={selected} onChange={setSelected} />
      </div>
      <div className="location-map">
        <motion.svg
          role="img"
          aria-label={`Selected database region: ${region.name}`}
          initial={false}
          animate={{ viewBox: viewBoxFor(region) }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          preserveAspectRatio="xMidYMid slice"
        >
          <path className="map-dots" d={worldDots} />
          <motion.path
            key={`near-${region.id}`}
            className="map-dots near"
            d={nearby}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          />
          {region !== home && (
            <motion.path
              key={`arc-${region.id}`}
              className="map-arc"
              d={arc}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <circle className="map-home" cx={origin.x} cy={origin.y} r="3" />
          <g transform={`translate(${point.x} ${point.y})`}>
            <circle className="map-pulse" r="5" />
            <circle className="map-marker" r="4.2" />
            <motion.g
              key={`label-${region.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.35 }}
            >
              <rect
                className="map-label"
                x="10"
                y="-23"
                width={label.length * 5.2 + 18}
                height="19"
                rx="9.5"
              />
              <text className="map-label-text" x="19" y="-10">
                {label}
              </text>
            </motion.g>
          </g>
        </motion.svg>
      </div>
      <p className="location-footnote">
        <span className="live-dot" />
        {region.id} · about {region.latency}ms from you
      </p>
    </div>
  );
}

const sendPhotos = [
  { name: 'Wildflowers', src: '/images/photo-1.jpg' },
  { name: 'Soft landscape', src: '/images/photo-3.jpg' },
  { name: 'Orange bloom', src: '/images/gallery-3.jpg' },
  { name: 'Glass garden', src: '/images/photo-5.jpg' },
];

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
                {sendPhotos.map(({ name, src }, i) => {
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
                      onClick={() =>
                        setSelected((current) =>
                          current.includes(i + 1)
                            ? current.filter((n) => n !== i + 1)
                            : [...current, i + 1],
                        )
                      }
                    >
                      <img src={src} alt={name} draggable={false} />
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
                onClick={() => setStatus('sending')}
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
                    {sendPhotos.slice(0, 3).map(({ src }, i) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        style={{ '--i': i } as CSSProperties}
                      />
                    ))}
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
    () => setQueue((current) => current.slice(1)),
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
              if (mode !== 'Idle') setCompact(!compact);
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
