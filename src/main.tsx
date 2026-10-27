import React, { useEffect, useRef, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import {
  Flashlight,
  Moon,
  Pause,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Demo, PreferencesProvider, usePreferences } from './core';
import { useInterfaceSounds } from './sound';
import { AsciiLogos, Matrix, RotatingGrid } from './demos/graphics';
import {
  InfiniteCards,
  StackedCards,
  GalleryCarousel,
  ImageGallery,
} from './demos/galleries';
import {
  Toolbar,
  Notifications,
  InfoReveal,
  HoldToDelete,
} from './demos/cards';
import {
  ChatOrb,
  LocationSelector,
  ImageSend,
  DynamicIsland,
} from './demos/widgets';
import { TimeZones, SwitchLayout } from './demos/controls';
import './styles.css';

const demos = [
  ['Matrix', Matrix],
  ['3D Gallery Carousel', GalleryCarousel],
  ['Stacked cards', StackedCards],
  ['Dynamic island', DynamicIsland],
  ['Chat Orb', ChatOrb],
  ['Notification Cards', Notifications],
  ['Rotating Objects in a Grid', RotatingGrid],
  ['Image Send', ImageSend],
  ['Infinite cards', InfiniteCards],
  ['Interactive Location Selector', LocationSelector],
  ['ASCII Logos', AsciiLogos],
  ['Switch Layout', SwitchLayout],
  ['Time Zones', TimeZones],
  ['Hold to Delete', HoldToDelete],
  ['Image Gallery', ImageGallery],
  ['Info Reveal', InfoReveal],
  ['Toolbar', Toolbar],
] as const;

function HeaderToggle({
  label,
  title,
  pressed,
  onToggle,
  icon,
  text,
}: {
  label: string;
  title: string;
  pressed: boolean;
  onToggle: () => void;
  icon: ReactNode;
  text: string;
}) {
  return (
    <button
      type="button"
      className="header-toggle"
      aria-label={label}
      aria-pressed={pressed}
      title={title}
      onClick={onToggle}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

function HeaderControls() {
  const {
    reduced,
    sound,
    dark,
    spotlight,
    setReduced,
    setSound,
    setDark,
    setSpotlight,
  } = usePreferences();
  return (
    <div className="header-controls">
      <HeaderToggle
        label="Night mode"
        title={dark ? 'Switch to light mode' : 'Switch to night mode'}
        pressed={dark}
        onToggle={() => setDark(!dark)}
        icon={dark ? <Moon size={14} /> : <Sun size={14} />}
        text={dark ? 'Night' : 'Day'}
      />
      <HeaderToggle
        label="Sound effects"
        title={sound ? 'Mute sound effects' : 'Turn on sound effects'}
        pressed={sound}
        onToggle={() => setSound(!sound)}
        icon={sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
        text={sound ? 'Sound' : 'Muted'}
      />
      <HeaderToggle
        label="Reduce motion"
        title={reduced ? 'Turn animations back on' : 'Reduce motion'}
        pressed={reduced}
        onToggle={() => setReduced(!reduced)}
        icon={reduced ? <Pause size={14} /> : <Sparkles size={14} />}
        text={reduced ? 'Still' : 'Motion'}
      />
      <HeaderToggle
        label="Cursor spotlight"
        title="Experimental: light the page with your cursor"
        pressed={spotlight}
        onToggle={() => setSpotlight(!spotlight)}
        icon={<Flashlight size={14} />}
        text="Spotlight"
      />
    </div>
  );
}

// Experimental: dims the page and follows the pointer with a soft light.
function Spotlight() {
  const x = useMotionValue(innerWidth / 2);
  const y = useMotionValue(innerHeight / 3);
  const target = useRef({ x: innerWidth / 2, y: innerHeight / 3 });
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      target.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  }, []);
  useAnimationFrame((_, delta) => {
    const follow = 1 - Math.exp(-delta / 90);
    x.set(x.get() + (target.current.x - x.get()) * follow);
    y.set(y.get() + (target.current.y - y.get()) * follow);
  });
  const background = useMotionTemplate`radial-gradient(circle 260px at ${x}px ${y}px, transparent 0%, transparent 35%, var(--spotlight-dim) 100%)`;
  return (
    <motion.div
      className="spotlight"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background }}
    />
  );
}

function SpotlightLayer() {
  const { spotlight } = usePreferences();
  return <AnimatePresence>{spotlight && <Spotlight />}</AnimatePresence>;
}

function App() {
  useInterfaceSounds();
  return (
    <PreferencesProvider>
      <div className="page-guides" aria-hidden="true" />
      <SpotlightLayer />
      <main>
        <motion.header
          className="page-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="page-title">
            <h1>Interface Explorations</h1>
            <span className="mono">
              {String(demos.length).padStart(2, '0')} studies in motion
            </span>
          </div>
          <HeaderControls />
        </motion.header>
        {demos.map(([title, Component], i) => (
          <Demo key={title} title={title} index={i + 1}>
            <Component />
          </Demo>
        ))}
        <footer>
          Interface studies, in motion.
          <a href="https://www.abilshr.com/" target="_blank" rel="noreferrer">
            Inspired by Abil Shrestha ↗
          </a>
        </footer>
      </main>
    </PreferencesProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
