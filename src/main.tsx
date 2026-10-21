import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { Demo } from './core';
import {
  AsciiLogos,
  Matrix,
  RotatingGrid,
  AnimatedLogo,
  LoadingText,
} from './demos/graphics';
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
import {
  TimeZones,
  SlimDropdown,
  FilterDropdown,
  CalendarBlock,
  SwitchLayout,
} from './demos/controls';
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
  ['Slightly Animated V0 Logo', AnimatedLogo],
  ['Loading Text', LoadingText],
  ['Slim Dropdown', SlimDropdown],
  ['Filter Dropdown', FilterDropdown],
  ['Calendar block', CalendarBlock],
  ['Info Carousel', InfoCarousel],
  ['Matrix', Matrix],
  ['Rotating Objects in a Grid', RotatingGrid],
] as const;

function App() {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <div className="page-guides" aria-hidden="true" />
      <main>
        <header className="page-header">
          <h1>Interface Explorations</h1>
          <span className="header-mark" aria-hidden="true">
            ✳
          </span>
        </header>
        {demos.map(([title, Component]) => (
          <Demo key={title} title={title}>
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
    </MotionConfig>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
