import { useEffect, useRef, useState, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton, useActivity } from '../core';

export function useCanvas(
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
  ) => void,
  paused = false,
  frameInterval = 32,
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
      if (time - lastTime >= frameInterval) {
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
  }, [active, reduced, paused, frameInterval]);
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

const rainGlyphs = 'ABILX<>=+*-';
const codeSnippets = [
  'if is_admin or is_moderator:',
  'quicksort (x:xs) = quicksort [a | a <- xs, a < x]',
  'data class Person(val name: String, val age: Int)',
  'for item in items: yield transform(item)',
  'List<String> names = new ArrayList<>();',
  'const [user, setUser] = useState(null);',
  'class Animal { constructor(private name: string) {} }',
  'SELECT * FROM users WHERE active = 1;',
  'fn main() { println!("hello, world"); }',
  'let total = cart.reduce((sum, i) => sum + i.price, 0);',
  'if (isAuthenticated && user.role === "admin") {',
  'def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)',
  'git commit -m "make something good"',
  'export default function App() { return <Main /> }',
];
const randomGlyph = () =>
  rainGlyphs[Math.floor(Math.random() * rainGlyphs.length)];

type Drop = { head: number; speed: number; length: number };
type Snippet = {
  source: string;
  text: string;
  row: number;
  column: number;
  typed: number;
  phase: 'typing' | 'holding' | 'erasing' | 'dissolving';
  timer: number;
  thresholds: number[];
};
type MatrixState = {
  columns: number;
  rows: number;
  glyphs: string[];
  drops: Drop[];
  snippets: Snippet[];
  spawnTimer: number;
  lastTime: number;
};

function newDrop(rows: number, anywhere: boolean): Drop {
  const length = 6 + Math.floor(Math.random() * 18);
  return {
    head: anywhere
      ? Math.random() * (rows + length)
      : -Math.random() * rows * 0.45 - 1,
    speed: 4 + Math.random() * 9,
    length,
  };
}

function spawnSnippet(state: MatrixState, prefill = false) {
  const busy = new Set(
    state.snippets.flatMap((s) => [s.row - 1, s.row, s.row + 1]),
  );
  const free = Array.from({ length: state.rows - 2 }, (_, i) => i + 1).filter(
    (row) => !busy.has(row),
  );
  if (!free.length) return;
  const shown = new Set(state.snippets.map((s) => s.source));
  const options = codeSnippets.filter((text) => !shown.has(text));
  const source = options[Math.floor(Math.random() * options.length)];
  const maxLength = Math.max(8, state.columns - 2);
  const text = source.slice(0, maxLength);
  const column = Math.floor(
    Math.random() * Math.max(1, state.columns - text.length),
  );
  state.snippets.push({
    source,
    text,
    row: free[Math.floor(Math.random() * free.length)],
    column,
    typed: prefill ? Math.random() * text.length : 0,
    phase: 'typing',
    timer: 0,
    thresholds: [...text].map(() => Math.random()),
  });
}

function stepMatrix(state: MatrixState, dt: number) {
  state.drops.forEach((drop, column) => {
    const before = Math.floor(drop.head);
    drop.head += drop.speed * dt;
    for (let row = before + 1; row <= Math.floor(drop.head); row++)
      if (row >= 0 && row < state.rows)
        state.glyphs[row * state.columns + column] = randomGlyph();
    if (drop.head - drop.length > state.rows)
      state.drops[column] = newDrop(state.rows, false);
  });
  for (let n = 0; n < state.glyphs.length * dt * 0.6; n++)
    state.glyphs[Math.floor(Math.random() * state.glyphs.length)] =
      randomGlyph();
  state.snippets = state.snippets.filter((snippet) => {
    snippet.timer += dt;
    if (snippet.phase === 'typing') {
      snippet.typed = Math.min(snippet.text.length, snippet.typed + dt * 22);
      if (snippet.typed === snippet.text.length) {
        snippet.phase = 'holding';
        snippet.timer = 0;
      }
    } else if (snippet.phase === 'holding') {
      if (snippet.timer > 1.4 + snippet.text.length * 0.02) {
        snippet.phase = Math.random() < 0.5 ? 'erasing' : 'dissolving';
        snippet.timer = 0;
      }
    } else if (snippet.phase === 'erasing') {
      snippet.typed = Math.max(0, snippet.typed - dt * 48);
      return snippet.typed > 0;
    } else return snippet.timer < 1;
    return true;
  });
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.snippets.length < 6) {
    spawnSnippet(state);
    state.spawnTimer = 0.5 + Math.random() * 1.1;
  }
}

export function Matrix() {
  const [paused, setPaused] = useState(false);
  const state = useRef<MatrixState | null>(null);
  const canvas = useCanvas(
    (context, width, height, time) => {
      const cell = width < 400 ? 11 : 13.5;
      const columns = Math.floor(width / cell);
      const rows = Math.floor(height / cell);
      if (
        !state.current ||
        state.current.columns !== columns ||
        state.current.rows !== rows
      ) {
        state.current = {
          columns,
          rows,
          glyphs: Array.from({ length: columns * rows }, randomGlyph),
          drops: Array.from({ length: columns }, () => newDrop(rows, true)),
          snippets: [],
          spawnTimer: 0.4,
          lastTime: time,
        };
        for (let n = 0; n < 4; n++) spawnSnippet(state.current, true);
      }
      const matrix = state.current;
      const dt = Math.min(time - matrix.lastTime, 0.1);
      matrix.lastTime = time;
      if (dt > 0) stepMatrix(matrix, dt);

      context.clearRect(0, 0, width, height);
      const left = (width - columns * cell) / 2;
      const top = (height - rows * cell) / 2;
      context.font = `500 ${cell * 0.78}px "Geist Mono", Departure, monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      matrix.drops.forEach((drop, column) => {
        const head = Math.floor(drop.head);
        for (let k = 0; k < drop.length; k++) {
          const row = head - k;
          if (row < 0 || row >= rows) continue;
          const alpha = k === 0 ? 0.92 : 0.5 * (1 - k / drop.length) + 0.05;
          context.fillStyle =
            k === 0 ? `rgba(18,19,24,${alpha})` : `rgba(70,72,82,${alpha})`;
          context.fillText(
            matrix.glyphs[row * columns + column],
            left + (column + 0.5) * cell,
            top + (row + 0.5) * cell,
          );
        }
      });
      context.font = `600 ${cell * 0.86}px "Geist Mono", Departure, monospace`;
      for (const snippet of matrix.snippets) {
        const typed = Math.floor(snippet.typed);
        const y = top + snippet.row * cell;
        const progress = snippet.phase === 'dissolving' ? snippet.timer : -1;
        context.fillStyle = '#fff';
        context.fillRect(
          left + snippet.column * cell - 2,
          y,
          (typed + 1) * cell + 4,
          cell,
        );
        for (let i = 0; i < typed; i++) {
          const threshold = snippet.thresholds[i];
          if (progress > threshold) continue;
          const char =
            progress > threshold - 0.25
              ? matrix.glyphs[
                  (snippet.row * columns + snippet.column + i) %
                    matrix.glyphs.length
                ]
              : snippet.text[i];
          context.fillStyle =
            progress > threshold - 0.25 ? 'rgba(70,72,82,0.55)' : '#121318';
          context.fillText(
            char,
            left + (snippet.column + i + 0.5) * cell,
            y + cell / 2,
          );
        }
        const showCursor =
          snippet.phase === 'typing' ||
          snippet.phase === 'erasing' ||
          (snippet.phase === 'holding' && Math.floor(time * 2.4) % 2 === 0);
        if (showCursor)
          context.fillRect(
            left + (snippet.column + typed) * cell + cell * 0.18,
            y + cell * 0.8,
            cell * 0.64,
            1.5,
          );
      }
    },
    paused,
    33,
  );
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

const shortestTurn = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

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
  const pointer = useRef({ x: 0, y: 0, inside: false });
  const swirl = useRef({ x: 0, y: 0, influence: 0, lastTime: 0 });
  const canvas = useCanvas(
    (context, width, height, time) => {
      const vortex = swirl.current;
      const dt = Math.min(Math.max(time - vortex.lastTime, 0), 0.1);
      vortex.lastTime = time;
      // Ease the vortex in and out so the radius grows and fades gradually,
      // and let its centre trail the pointer.
      vortex.influence +=
        ((pointer.current.inside ? 1 : 0) - vortex.influence) *
        (1 - Math.exp(-dt * 2.4));
      const follow = vortex.influence < 0.02 ? 1 : 1 - Math.exp(-dt * 9);
      vortex.x += (pointer.current.x - vortex.x) * follow;
      vortex.y += (pointer.current.y - vortex.y) * follow;
      const eased = 1 - Math.pow(1 - vortex.influence, 3);
      const radius = 200 * eased;

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
          const wave = Math.sin(time * 0.85 + col * 0.15 + row * 0.12) * 0.45;
          let angle = wave;
          let strength = 0;
          if (radius > 1) {
            const dx = x - vortex.x;
            const dy = y - vortex.y;
            const distance = Math.hypot(dx, dy);
            if (distance < radius) {
              const t = 1 - distance / radius;
              strength = t * t * (3 - 2 * t);
              const spiral =
                Math.atan2(dy, dx) +
                Math.PI / 2 +
                t * Math.PI * 2.2 +
                time * 1.8;
              angle = wave + shortestTurn(wave, spiral) * strength;
            }
          }
          context.save();
          context.translate(x, y);
          context.rotate(angle);
          context.scale(
            1 + strength * 0.4,
            (settings.Height / 20) * (1 + strength * 0.4),
          );
          context.fillStyle = `rgba(35,35,40,${0.3 + strength * 0.65})`;
          context.fillText(glyph, 0, 0);
          context.restore();
        }
      if (radius > 1) {
        context.beginPath();
        context.arc(vortex.x, vortex.y, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(103,104,176,${0.12 * eased})`;
        context.setLineDash([2, 5]);
        context.lineDashOffset = -time * 12;
        context.stroke();
        context.setLineDash([]);
      }
    },
    false,
    0,
  );
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
            inside: true,
          };
        }}
        onPointerLeave={() => {
          pointer.current = { ...pointer.current, inside: false };
        }}
      />
      <span className="demo-hint">Hover the grid to stir a spiral</span>
    </div>
  );
}
