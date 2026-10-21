import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  animate,
  AnimatePresence,
  LayoutGroup,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  Phone,
  Smartphone,
  Terminal,
} from 'lucide-react';
import {
  IconButton,
  RollingText,
  photo,
  spring,
  useActivity,
  useAutoplay,
  wrap,
} from '../core';
import { playSound } from '../sound';

const stackDepth = 5;
const stackRise = 22;
const stackShrink = 0.065;
const cardMotion = {
  enter: (direction: number) =>
    direction > 0
      ? {
          y: -(stackDepth - 1) * stackRise - 16,
          scale: 1 - (stackDepth - 1) * stackShrink,
          opacity: 0,
        }
      : { y: 150, scale: 1.04, opacity: 0, rotate: 3 },
  exit: (direction: number) =>
    direction > 0
      ? {
          y: 160,
          scale: 1.04,
          opacity: 0,
          rotate: -3,
          zIndex: 9,
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as const,
            zIndex: { duration: 0 },
          },
        }
      : {
          y: -(stackDepth - 1) * stackRise - 16,
          scale: 1 - (stackDepth - 1) * stackShrink,
          opacity: 0,
          transition: { duration: 0.3 },
        },
};

// Trackpads keep streaming inertial wheel events after a flick, so a step is
// only taken once per gesture (a gap in events starts a new one). Mouse wheels
// report large discrete notches and may step on every notch.
function useWheelSteps(
  ref: RefObject<HTMLElement | null>,
  onStep: (direction: number) => void,
) {
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let accumulated = 0;
    let lastEvent = 0;
    let lastStep = -Infinity;
    let gesture = 0;
    let stepGesture = -1;
    const onWheel = (event: WheelEvent) => {
      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastEvent > 150) {
        gesture++;
        accumulated = 0;
      }
      lastEvent = now;
      const notch =
        event.deltaMode !== 0 ||
        (Math.abs(delta) >= 100 && Number.isInteger(delta));
      const ready = notch
        ? now - lastStep > 320
        : gesture !== stepGesture && now - lastStep > 400;
      if (!ready) return;
      accumulated += delta;
      if (!notch && Math.abs(accumulated) < 30) return;
      stepRef.current(Math.sign(accumulated));
      lastStep = now;
      stepGesture = gesture;
      accumulated = 0;
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [ref]);
}

export function InfiniteCards() {
  const { index, position, direction, advance, setPaused } = useAutoplay(
    5,
    4000,
  );
  const stack = useRef<HTMLDivElement>(null);
  const step = (amount: number) => {
    advance(amount);
    playSound('tick', amount > 0 ? 1 : 0.85);
  };
  useWheelSteps(stack, step);
  return (
    <div
      className="infinite-demo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div
        className="infinite-stack"
        ref={stack}
        aria-label="Cycling photograph stack"
      >
        <AnimatePresence initial={false} custom={direction}>
          {Array.from({ length: stackDepth }, (_, i) => {
            const depth = stackDepth - 1 - i;
            const item = position + depth;
            return (
              <motion.div
                key={item}
                className="infinite-card"
                custom={direction}
                variants={cardMotion}
                initial="enter"
                exit="exit"
                animate={{
                  y: -depth * stackRise,
                  scale: 1 - depth * stackShrink,
                  opacity: depth === stackDepth - 1 ? 0.7 : 1,
                  rotate: 0,
                }}
                style={{ zIndex: stackDepth - depth }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              >
                {depth === 0 ? (
                  <motion.button
                    aria-label="Next photograph"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.45}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.y) > 35)
                        step(info.offset.y > 0 ? 1 : -1);
                    }}
                    onClick={() => step(1)}
                    className="photo-button"
                  >
                    <img
                      src={photo(wrap(item, 5))}
                      alt={`Photographic study ${index + 1}`}
                      draggable={false}
                    />
                  </motion.button>
                ) : (
                  <img src={photo(wrap(item, 5))} alt="" draggable={false} />
                )}
                <span className="infinite-shade" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="gallery-navigation">
        <IconButton
          label="Previous stacked photograph"
          onClick={() => step(-1)}
        >
          <ArrowUp size={14} />
        </IconButton>
        <RollingText className="mono" text={`0${index + 1} / 05`} />
        <IconButton label="Next stacked photograph" onClick={() => step(1)}>
          <ArrowDown size={14} />
        </IconButton>
      </div>
      <p className="demo-hint infinite-hint">Scroll or swipe to browse</p>
    </div>
  );
}

// Oblique projection: cards stand upright (vertical edges stay vertical)
// while horizontal edges recede at 16°, and each step back moves up-right.
const cardWidth = 200;
const cardHeight = 228;
const slope = Math.tan((16 * Math.PI) / 180);
const depthStep = { x: 50, y: -21 };
const scene = { width: 640, height: 440 };
const origin = { x: 120, y: 348 };

function point(along: number, depth: number, lift = 0) {
  return {
    x: origin.x + along + depth * depthStep.x,
    y: origin.y + along * slope + depth * depthStep.y - lift,
  };
}

function line(
  from: { x: number; y: number },
  direction: { x: number; y: number },
) {
  const length = 900;
  const scale = length / Math.hypot(direction.x, direction.y);
  return `M${from.x - direction.x * scale} ${from.y - direction.y * scale}L${from.x + direction.x * scale} ${from.y + direction.y * scale}`;
}

const planeDirection = { x: 1, y: slope };
const guidePaths = [
  ...[-1.5, 0, 4, 6.5].map((depth) => line(point(0, depth), planeDirection)),
  ...[0, 4].map((depth) => line(point(0, depth, cardHeight), planeDirection)),
  ...[-0.7, 0, 1, 1.9].map((along) =>
    line(point(along * cardWidth, 0), depthStep),
  ),
  ...[0, 1].map((along) =>
    line(point(along * cardWidth, 0, cardHeight), depthStep),
  ),
];
const guideVerticals = [
  ...[-1, 0, 1, 2, 3, 4].map((depth) => origin.x + depth * depthStep.x),
  ...[1, 2, 3, 4].map((depth) => origin.x + cardWidth + depth * depthStep.x),
];

// Deterministic "circuit board" texture for the floor slab.
const circuitTraces = (() => {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const traces: string[] = [];
  for (let n = 0; n < 26; n++) {
    const x = Math.round(random() * 44);
    const y = Math.round(random() * 44);
    const length = 3 + Math.round(random() * 12);
    if (random() > 0.5) traces.push(`M${x} ${y}h${length}`);
    else traces.push(`M${x} ${y}v${length}`);
    if (random() > 0.6) traces.push(`M${x - 0.8} ${y - 0.8}h1.6v1.6h-1.6z`);
  }
  return traces.join('');
})();
const slab = [
  point(cardWidth * 1.12, -0.4),
  point(cardWidth * 2.1, -0.4),
  point(cardWidth * 2.1, 6.2),
  point(cardWidth * 1.12, 6.2),
];

const stackNames = ['Connections', 'Messages', 'Terminal', 'Browser', 'Notes'];
function SpatialCardContent({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="connection-icons">
        <Smartphone />
        <Phone />
        <Globe />
      </div>
    );
  if (index === 1)
    return (
      <div className="mini-message">
        <span className="tiny-avatar">A</span>
        <p>
          Hello, I'm here.<span>Just now</span>
        </p>
      </div>
    );
  if (index === 2)
    return (
      <div className="mini-terminal">
        <div>
          <Terminal size={13} />
          Ghostty
        </div>
        <p>
          <span>➜</span> ~/dev
        </p>
        <p>
          npm install<span className="typing-cursor">▌</span>
        </p>
      </div>
    );
  if (index === 3)
    return (
      <div className="mini-browser">
        <span>
          <i />
          <i />
          <i />
        </span>
        <div />
        <div />
        <div />
      </div>
    );
  return (
    <div className="mini-notes">
      <span>Things worth making.</span>
      <i />
      <i />
      <i />
    </div>
  );
}

export function StackedCards() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="stacked-demo">
      <div className="stacked-scene">
        <svg
          className="stacked-guides"
          viewBox={`0 0 ${scene.width} ${scene.height}`}
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="circuit"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              patternTransform={`matrix(1 ${slope} 0.92 -0.39 0 0)`}
            >
              <path d={circuitTraces} />
            </pattern>
            <radialGradient id="guide-fade" cx="50%" cy="52%" r="58%">
              <stop offset="45%" stopColor="#fff" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="guide-mask">
              <rect
                width={scene.width}
                height={scene.height}
                fill="url(#guide-fade)"
              />
            </mask>
          </defs>
          <g mask="url(#guide-mask)">
            <polygon
              className="circuit-slab"
              points={slab.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
            {guideVerticals.map((x) => (
              <path
                key={x}
                className="guide"
                d={`M${x} -20V${scene.height + 20}`}
              />
            ))}
            {guidePaths.map((d) => (
              <path key={d} className="guide" d={d} />
            ))}
          </g>
        </svg>
        <motion.div
          className="floor-glow"
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{
            left: origin.x,
            top: origin.y,
            width: cardWidth,
          }}
        />
        <div
          className="spatial-stack"
          style={{
            left: origin.x,
            top: origin.y - cardHeight,
            width: cardWidth,
            height: cardHeight,
          }}
        >
          {[4, 3, 2, 1, 0].map((i) => {
            const depth = (i - selected + 5) % 5;
            return (
              <motion.button
                key={i}
                className="spatial-card"
                aria-label={`Show ${stackNames[i]} card`}
                aria-pressed={selected === i}
                initial={false}
                animate={{
                  x: depth * depthStep.x,
                  y: depth * depthStep.y,
                  '--depth': depth,
                }}
                style={{ zIndex: 10 - depth, skewY: 16 }}
                transition={{ type: 'spring', stiffness: 210, damping: 26 }}
                onClick={() => setSelected(selected === i ? (i + 1) % 5 : i)}
              >
                <span className="spatial-face">
                  <SpatialCardContent index={i} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <p className="demo-hint">Click a card to bring it forward</p>
    </div>
  );
}

const ringPhotos = [
  { src: '/images/gallery-1.jpg', alt: 'A study in pink' },
  { src: '/images/photo-1.jpg', alt: 'A quiet landscape' },
  { src: '/images/gallery-2.jpg', alt: 'Nature in detail' },
  { src: '/images/photo-2.jpg', alt: 'Light and shadow' },
  { src: '/images/gallery-3.jpg', alt: 'Organic forms' },
  { src: '/images/photo-3.jpg', alt: 'Morning haze' },
  { src: '/images/gallery-4.jpg', alt: 'Sunlit leaves' },
  { src: '/images/photo-4.jpg', alt: 'Still water' },
];
const ringStep = 360 / ringPhotos.length;
const ringSpeed = 8;

function RingCard({
  index,
  rotation,
  front,
  onSelect,
}: {
  index: number;
  rotation: MotionValue<number>;
  front: boolean;
  onSelect: () => void;
}) {
  const facing = useTransform(rotation, (value) =>
    Math.cos(((index * ringStep + value) * Math.PI) / 180),
  );
  const opacity = useTransform(facing, [-1, 0, 1], [0.16, 0.55, 1]);
  return (
    <motion.button
      className="ring-card"
      aria-label={`View gallery photograph ${index + 1}`}
      aria-pressed={front}
      onClick={onSelect}
      style={{
        transform: `rotateY(${index * ringStep}deg) translateZ(var(--ring-radius))`,
        opacity,
      }}
    >
      <img
        src={ringPhotos[index].src}
        alt={ringPhotos[index].alt}
        draggable={false}
      />
    </motion.button>
  );
}

export function GalleryCarousel() {
  const { active, reduced } = useActivity();
  const rotation = useMotionValue(0);
  const speed = useRef(1);
  const [hovered, setHovered] = useState(false);
  const [front, setFront] = useState(0);
  const drag = useRef<{
    x: number;
    time: number;
    velocity: number;
    moved: number;
  } | null>(null);
  const settling = useRef<AnimationPlaybackControls | null>(null);
  const suppressClick = useRef(false);

  useAnimationFrame((_, delta) => {
    if (!active || reduced) return;
    const target = hovered || drag.current || settling.current ? 0 : 1;
    speed.current += (target - speed.current) * Math.min(1, delta / 450);
    if (!drag.current && !settling.current)
      rotation.set(rotation.get() - (speed.current * ringSpeed * delta) / 1000);
  });
  useMotionValueEvent(rotation, 'change', (value) =>
    setFront(wrap(Math.round(-value / ringStep), ringPhotos.length)),
  );

  const settleTo = (target: number, velocity = 0) => {
    settling.current?.stop();
    settling.current = animate(rotation, target, {
      type: 'spring',
      stiffness: 110,
      damping: 20,
      velocity,
      onComplete: () => {
        settling.current = null;
      },
    });
  };
  const goTo = (index: number) => {
    const current = -rotation.get() / ringStep;
    const offset =
      wrap(index - current + ringPhotos.length / 2, ringPhotos.length) -
      ringPhotos.length / 2;
    settleTo(-(current + offset) * ringStep);
    playSound('tick');
  };
  const advance = (step: number) => {
    const current = Math.round(-rotation.get() / ringStep);
    settleTo(-(current + step) * ringStep);
    playSound('tick');
  };

  return (
    <div
      className="carousel-demo"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="ring-viewport"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          settling.current?.stop();
          settling.current = null;
          drag.current = {
            x: event.clientX,
            time: performance.now(),
            velocity: 0,
            moved: 0,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          const now = performance.now();
          const dx = event.clientX - state.x;
          if (state.moved < 6 && Math.abs(state.moved + dx) >= 6)
            event.currentTarget.setPointerCapture(event.pointerId);
          state.moved += Math.abs(dx);
          const degrees = dx * 0.32;
          rotation.set(rotation.get() + degrees);
          state.velocity = (degrees / Math.max(now - state.time, 1)) * 1000;
          state.x = event.clientX;
          state.time = now;
        }}
        onPointerUp={() => {
          const state = drag.current;
          drag.current = null;
          if (!state || state.moved < 6) return;
          suppressClick.current = true;
          window.setTimeout(() => (suppressClick.current = false), 0);
          const projected = rotation.get() + state.velocity * 0.22;
          settleTo(Math.round(projected / ringStep) * ringStep, state.velocity);
          playSound('tick');
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) event.stopPropagation();
        }}
      >
        <div className="ring-tilt">
          <motion.div className="ring" style={{ rotateY: rotation }}>
            {ringPhotos.map((_, i) => (
              <RingCard
                key={i}
                index={i}
                rotation={rotation}
                front={front === i}
                onSelect={() => goTo(i)}
              />
            ))}
          </motion.div>
        </div>
        <div className="ring-floor" />
      </div>
      <div className="gallery-navigation">
        <IconButton label="Previous gallery image" onClick={() => advance(-1)}>
          <ChevronLeft size={16} />
        </IconButton>
        <RollingText className="mono" text={`0${front + 1} / 08`} />
        <IconButton label="Next gallery image" onClick={() => advance(1)}>
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  );
}

export function ImageGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <LayoutGroup id="image-gallery">
      <div
        className={`image-gallery ${selected !== null ? 'has-selection' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setSelected(null);
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <motion.button
            key={i}
            layout
            className={`gallery-tile tile-${i} ${selected === i ? 'selected' : ''}`}
            aria-label={`${selected === i ? 'Close' : 'Expand'} floral photograph ${i + 1}`}
            aria-pressed={selected === i}
            onClick={() => setSelected(selected === i ? null : i)}
            transition={spring}
          >
            <motion.img
              layout
              src={`/images/gallery-${i + 1}.jpg`}
              alt={
                [
                  'Painterly red flowers',
                  'A tulip in soft focus',
                  'An orange bloom',
                  'Sunlight through leaves',
                ][i]
              }
              loading="lazy"
            />
            <AnimatePresence>
              {selected === i && (
                <motion.span
                  className="image-caption"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  A closer look <span>↗</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </LayoutGroup>
  );
}

const info = [
  {
    category: 'Color Trends',
    title: 'Vibrant Gradients: The New Wave in Digital Design',
  },
  {
    category: 'Design Inspiration',
    title: 'Soothing Pastels: Creating Calm in Digital Spaces',
  },
  {
    category: 'Design Techniques',
    title: 'Mastering Gradient Blending for Stunning Visuals',
  },
];
const slideFront = {
  y: 0,
  scale: 1,
  opacity: 1,
  filter: 'blur(0px)',
};
const slideBehind = {
  y: 14,
  scale: 0.92,
  opacity: 1,
  filter: 'blur(0px)',
};
const slideLifted = {
  y: -38,
  scale: 1.03,
  opacity: 0,
  filter: 'blur(8px)',
};

export function InfoCarousel() {
  const { index, progress, setIndex, setPaused } = useAutoplay(3, 5000);
  const previous = useRef(info.map((_, i) => i));
  useEffect(() => {
    previous.current = info.map((_, i) => wrap(i - index, 3));
  });
  return (
    <div
      className="info-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="info-carousel-stack">
        {info.map((item, i) => {
          const position = wrap(i - index, 3);
          const fromHidden = previous.current[i] === 2;
          return (
            <motion.div
              key={item.title}
              className="info-slide"
              aria-hidden={position !== 0}
              initial={false}
              animate={
                position === 0
                  ? slideFront
                  : position === 1
                    ? fromHidden
                      ? {
                          ...slideBehind,
                          y: [30, slideBehind.y],
                          scale: [0.84, slideBehind.scale],
                          opacity: [0, 1],
                        }
                      : slideBehind
                    : slideLifted
              }
              style={{ zIndex: 3 - position }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <img src={`/images/info-${i + 1}.jpg`} alt="" loading="lazy" />
              <div>
                <span>{item.category}</span>
                <p>{item.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div
        className="carousel-dots"
        role="group"
        aria-label="Info carousel slides"
      >
        {info.map((item, i) => (
          <motion.button
            key={item.title}
            aria-label={`Show slide ${i + 1}: ${item.category}`}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            animate={{ width: index === i ? 40 : 6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {index === i && (
              <motion.span
                className="slide-progress"
                style={{ scaleX: progress }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
