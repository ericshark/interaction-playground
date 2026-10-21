import { useEffect, useRef, useState, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { IconButton, useActivity, useActiveInterval } from '../core';

function useCanvas(
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
  ) => void,
  paused = false,
): RefObject<HTMLCanvasElement | null> {
  const canvas = useRef<HTMLCanvasElement>(null);
  const callback = useRef(draw);
  const elapsed = useRef(0);
  const { active, reduced } = useActivity();
  callback.current = draw;
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (element && context) {
      const { width, height } = element.getBoundingClientRect();
      callback.current(context, width, height, elapsed.current);
    }
  });
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let frame = 0;
    let lastTime = 0;
    let width = 0;
    let height = 0;
    const render = () =>
      callback.current(context, width, height, elapsed.current);
    const resize = () => {
      ({ width, height } = element.getBoundingClientRect());
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(width * scale);
      element.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const tick = (time: number) => {
      if (time - lastTime >= 32) {
        elapsed.current += Math.min(time - (lastTime || time), 64) / 1000;
        lastTime = time;
        render();
      }
      frame = requestAnimationFrame(tick);
    };
    if (active && !reduced && !paused) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active, reduced, paused]);
  return canvas;
}

const logoNames = [
  'OpenAI',
  'Vercel',
  'Cursor',
  'Basecase',
  'Droid',
  'Mintlify',
  'Zo',
];

export function AsciiLogos() {
  const [logo, setLogo] = useState(0);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const canvas = useCanvas((context, width, height, time) => {
    context.clearRect(0, 0, width, height);
    const columns = 82;
    const rows = 40;
    if (!mask.current) mask.current = document.createElement('canvas');
    mask.current.width = columns;
    mask.current.height = rows;
    const m = mask.current.getContext('2d', { willReadFrequently: true });
    if (!m) return;
    m.clearRect(0, 0, columns, rows);
    m.save();
    m.translate(columns / 2, rows / 2);
    m.scale(0.58, 0.58);
    m.strokeStyle = '#111';
    m.fillStyle = '#111';
    m.lineWidth = 2.4;
    if (logo === 0) {
      m.rotate(time * 0.12);
      for (let n = 0; n < 6; n++) {
        m.save();
        m.rotate((n * Math.PI) / 3);
        m.beginPath();
        m.roundRect(-6, -24, 21, 33, 10);
        m.stroke();
        m.restore();
      }
    } else if (logo === 1) {
      m.rotate(Math.sin(time * 0.7) * 0.08);
      m.beginPath();
      m.moveTo(0, -25);
      m.lineTo(28, 23);
      m.lineTo(-28, 23);
      m.closePath();
      m.fill();
    } else if (logo === 2) {
      m.rotate(time * 0.2);
      m.beginPath();
      m.moveTo(0, -27);
      m.lineTo(25, -12);
      m.lineTo(25, 14);
      m.lineTo(0, 29);
      m.lineTo(-25, 14);
      m.lineTo(-25, -12);
      m.closePath();
      m.stroke();
      m.beginPath();
      m.moveTo(-25, -12);
      m.lineTo(0, 3);
      m.lineTo(25, -12);
      m.moveTo(0, 3);
      m.lineTo(0, 29);
      m.stroke();
    } else if (logo === 3) {
      for (let n = 0; n < 3; n++) {
        m.beginPath();
        m.roundRect(-24 + n * 6, -20 + n * 8, 39, 28, 3);
        m.stroke();
      }
    } else if (logo === 4) {
      m.beginPath();
      m.roundRect(-25, -15, 50, 36, 9);
      m.stroke();
      m.fillRect(-13, -5, 6, 8);
      m.fillRect(7, -5, 6, 8);
      m.beginPath();
      m.moveTo(-20, -14);
      m.lineTo(-26, -24);
      m.moveTo(20, -14);
      m.lineTo(26, -24);
      m.stroke();
    } else if (logo === 5) {
      m.beginPath();
      m.moveTo(-26, 20);
      m.lineTo(-26, -20);
      m.lineTo(0, 2);
      m.lineTo(26, -20);
      m.lineTo(26, 20);
      m.lineTo(13, 20);
      m.lineTo(13, 2);
      m.lineTo(0, 15);
      m.lineTo(-13, 2);
      m.lineTo(-13, 20);
      m.closePath();
      m.fill();
    } else {
      m.font = 'bold 54px monospace';
      m.textAlign = 'center';
      m.textBaseline = 'middle';
      m.fillText('zo', 0, 1);
    }
    m.restore();
    const pixels = m.getImageData(0, 0, columns, rows).data;
    const cell = Math.min(width / 100, 7.2);
    const left = (width - columns * cell) / 2;
    const top = (height - rows * cell) / 2;
    context.font = `${cell * 0.95}px Departure, monospace`;
    context.textBaseline = 'top';
    const chars = '·:+x#%@';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const alpha = pixels[(y * columns + x) * 4 + 3] / 255;
        if (alpha < 0.12) continue;
        const flicker = Math.sin(x * 2.1 + y * 0.8 + time * 3);
        context.fillStyle = `rgba(23,23,23,${0.4 + alpha * 0.6})`;
        context.fillText(
          chars[
            Math.min(chars.length - 1, Math.floor(alpha * 4 + (flicker + 1)))
          ],
          left + x * cell,
          top + y * cell,
        );
      }
    }
  });
  const change = (step: number) =>
    setLogo(
      (current) => (current + step + logoNames.length) % logoNames.length,
    );
  return (
    <div className="ascii-demo">
      <canvas
        ref={canvas}
        aria-label={`Animated ASCII ${logoNames[logo]} logo`}
      />
      <IconButton
        label="Previous logo"
        className="ascii-prev"
        onClick={() => change(-1)}
      >
        <ChevronLeft size={15} />
      </IconButton>
      <IconButton
        label="Next logo"
        className="ascii-next"
        onClick={() => change(1)}
      >
        <ChevronRight size={15} />
      </IconButton>
      <span className="ascii-label mono" aria-live="polite">
        {logoNames[logo]}
      </span>
    </div>
  );
}

export function Matrix() {
  const [paused, setPaused] = useState(false);
  const canvas = useCanvas((context, width, height, time) => {
    context.clearRect(0, 0, width, height);
    const spacing = width < 400 ? 12 : 16;
    const chars = '01アイウエオカキクケコサシスセソ';
    context.font = '9px Departure, monospace';
    for (let column = 0; column < width / spacing; column++) {
      const speed = 18 + ((column * 13) % 35);
      const head = ((time * speed + column * 79) % (height + 260)) - 70;
      for (let row = 0; row < 16; row++) {
        const y = head - row * 10;
        if (y < 0 || y > height) continue;
        context.fillStyle = `rgba(32,35,39,${(1 - row / 16) * (row === 0 ? 0.9 : 0.4)})`;
        const letter =
          (column * 7 + row * 11 + Math.floor(time * 2)) % chars.length;
        context.fillText(chars[letter], column * spacing, y);
      }
    }
  }, paused);
  return (
    <div className="matrix-demo">
      <canvas
        ref={canvas}
        role="button"
        tabIndex={0}
        aria-label={
          paused ? 'Resume matrix animation' : 'Pause matrix animation'
        }
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            setPaused(!paused);
          }
        }}
      />
      <span className="demo-hint">
        {paused ? 'Paused · click to resume' : 'Click to pause'}
      </span>
    </div>
  );
}

export function RotatingGrid() {
  const [settings, setSettings] = useState({
    Width: 25,
    Height: 20,
    'H-Sep': 0,
    'V-Sep': 4,
    Rows: 20,
    Cols: 40,
  });
  const [glyph, setGlyph] = useState('/');
  const pointer = useRef({ x: -1000, y: -1000 });
  const canvas = useCanvas((context, width, height, time) => {
    context.clearRect(0, 0, width, height);
    const columns = settings.Cols,
      rows = settings.Rows;
    const pitchX = settings.Width + settings['H-Sep'];
    const pitchY = settings.Height + settings['V-Sep'];
    const scale = Math.min(
      width / (columns * pitchX),
      height / (rows * pitchY),
    );
    const cellWidth = pitchX * scale;
    const cellHeight = pitchY * scale;
    const size = settings.Width * 0.6 * scale;
    const left = (width - columns * cellWidth) / 2;
    const top = (height - rows * cellHeight) / 2;
    context.font = `${size}px Departure, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < columns; col++) {
        const x = left + (col + 0.5) * cellWidth,
          y = top + (row + 0.5) * cellHeight;
        const distance = Math.hypot(
          pointer.current.x - x,
          pointer.current.y - y,
        );
        const wave = Math.sin(time * 0.85 + col * 0.15 + row * 0.12) * 0.45;
        const attraction = Math.max(0, 1 - distance / 140) * Math.PI * 0.7;
        context.save();
        context.translate(x, y);
        context.rotate(wave + attraction);
        context.scale(1, settings.Height / 20);
        context.fillStyle = `rgba(35,35,35,${0.3 + Math.max(0, 1 - distance / 150) * 0.6})`;
        context.fillText(glyph, 0, 0);
        context.restore();
      }
  });
  return (
    <div className="rotating-demo">
      <div className="grid-settings">
        {(Object.keys(settings) as (keyof typeof settings)[]).map((key) => (
          <label key={key}>
            {key}
            <input
              aria-label={key}
              type="number"
              min={key === 'H-Sep' || key === 'V-Sep' ? 0 : 4}
              max={key === 'Cols' ? 60 : key === 'Rows' ? 30 : 40}
              value={settings[key]}
              onChange={(e) => {
                const min = key === 'H-Sep' || key === 'V-Sep' ? 0 : 4;
                const max = key === 'Cols' ? 60 : key === 'Rows' ? 30 : 40;
                setSettings({
                  ...settings,
                  [key]: Math.max(min, Math.min(max, Number(e.target.value))),
                });
              }}
            />
          </label>
        ))}
      </div>
      <div className="glyph-options" role="group" aria-label="Grid symbol">
        {['/', '\\', '|', '-', '☆', '✦', '✧', '♦'].map((symbol) => (
          <button
            key={symbol}
            aria-label={`Use ${symbol} symbol`}
            aria-pressed={glyph === symbol}
            onClick={() => setGlyph(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
      <canvas
        ref={canvas}
        aria-label={`Rotating grid of ${glyph} symbols, ${settings.Rows} rows and ${settings.Cols} columns`}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointer.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
        }}
        onPointerLeave={() => {
          pointer.current = { x: -1000, y: -1000 };
        }}
      />
    </div>
  );
}

export function AnimatedLogo() {
  return (
    <div className="animated-logo">
      <svg viewBox="0 0 660 300" role="img" aria-label="Animated V0 logo">
        <path
          className="logo-outline"
          d="M22 62H130L266 210V62H326V244Q326 292 280 269L22 62ZM351 62H570L414 215V3H565Q650 3 650 91V242H433L590 90V297H436Q351 297 351 215Z"
        />
        <path
          className="logo-tracer"
          d="M22 62H130L266 210V62H326V244Q326 292 280 269L22 62ZM351 62H570L414 215V3H565Q650 3 650 91V242H433L590 90V297H436Q351 297 351 215Z"
        />
      </svg>
    </div>
  );
}

const loadingPhrases = [
  'Scanning web for insights',
  'Thinking through the details',
  'Putting it all together',
];
export function LoadingText() {
  const [phrase, setPhrase] = useState(0);
  useActiveInterval(
    () => setPhrase((current) => (current + 1) % loadingPhrases.length),
    5500,
  );
  return (
    <div
      className="loading-demo"
      role="status"
      aria-label={loadingPhrases[phrase]}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={phrase}
          initial={{ opacity: 0, filter: 'blur(6px)', y: 6 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, filter: 'blur(6px)', y: -6 }}
          aria-hidden="true"
        >
          {[...loadingPhrases[phrase]].map((char, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              {char === ' ' ? '\u00a0' : char}
            </span>
          ))}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
