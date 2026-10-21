import React from 'react';
import ReactDOM from 'react-dom/client';
import { motion } from 'motion/react';
import { Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Demo, PreferencesProvider, usePreferences } from './core';
import { useInterfaceSounds } from './sound';
import { AsciiLogos, Matrix, RotatingGrid } from './demos/graphics';
import {
  InfiniteCards,
  StackedCards,
  GalleryCarousel,
  ImageGallery,
  InfoCarousel,
} from './demos/galleries';
import {
  Toolbar,
  Notifications,
  Agents,
  InfoReveal,
  HoldToDelete,
} from './demos/cards';
import {
  ChatOrb,
  LocationSelector,
  ImageSend,
  Transactions,
  DynamicIsland,
} from './demos/widgets';
import { TimeZones, SwitchLayout } from './demos/controls';
import './styles.css';

const demos = [
  ['ASCII Logos', AsciiLogos],
  ['Toolbar', Toolbar],
  ['Infinite cards', InfiniteCards],
  ['Stacked cards', StackedCards],
  ['3D Gallery Carousel', GalleryCarousel],
  ['Notification Cards', Notifications],
  ['Agent Cards', Agents],
  ['Info Reveal', InfoReveal],
  ['Hold to Delete', HoldToDelete],
  ['Chat Orb', ChatOrb],
  ['Switch Layout', SwitchLayout],
  ['Interactive Location Selector', LocationSelector],
  ['Image Send', ImageSend],
  ['Transactions Pending', Transactions],
  ['Image Gallery', ImageGallery],
  ['Time Zones', TimeZones],
  ['Dynamic island', DynamicIsland],
  ['Info Carousel', InfoCarousel],
  ['Matrix', Matrix],
  ['Rotating Objects in a Grid', RotatingGrid],
] as const;

function HeaderControls() {
  const { reduced, sound, setReduced, setSound } = usePreferences();
  return (
    <div className="header-controls">
      <button
        type="button"
        className="header-toggle"
        aria-label="Sound effects"
        aria-pressed={sound}
        title={sound ? 'Mute sound effects' : 'Turn on sound effects'}
        onClick={() => setSound(!sound)}
      >
        {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
        <span>{sound ? 'Sound' : 'Muted'}</span>
      </button>
      <button
        type="button"
        className="header-toggle"
        aria-label="Reduce motion"
        aria-pressed={reduced}
        title={reduced ? 'Turn animations back on' : 'Reduce motion'}
        onClick={() => setReduced(!reduced)}
      >
        {reduced ? <Pause size={14} /> : <Sparkles size={14} />}
        <span>{reduced ? 'Still' : 'Motion'}</span>
      </button>
    </div>
  );
}

function App() {
  useInterfaceSounds();
  return (
    <PreferencesProvider>
      <div className="page-guides" aria-hidden="true" />
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
