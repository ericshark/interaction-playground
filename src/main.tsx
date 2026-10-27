import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { motion } from 'motion/react';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';
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
import { LocationSelector, ImageSend, DynamicIsland } from './demos/widgets';
import { TimeZones, SwitchLayout } from './demos/controls';
import './styles.css';

const groups = [
  {
    id: 'images',
    label: 'Images',
    title: 'Images & galleries',
    description: 'Ways to browse, arrange, and share images.',
    studies: [
      [
        '3D Gallery Carousel',
        GalleryCarousel,
        'Watch it turn, or use the arrows to browse.',
      ],
      [
        'Infinite Cards',
        InfiniteCards,
        'Scroll over the stack or use the arrows to browse.',
      ],
      [
        'Image Gallery',
        ImageGallery,
        'Select a photograph to take a closer look.',
      ],
      [
        'Image Send',
        ImageSend,
        'Pick a few photographs and send them on their way.',
      ],
      ['Switch Layout', SwitchLayout, 'Try the list, card, and pack views.'],
    ],
  },
  {
    id: 'widgets',
    label: 'Widgets',
    title: 'Cards & widgets',
    description:
      'Small interfaces for information, activity, and everyday tools.',
    studies: [
      [
        'Stacked Cards',
        StackedCards,
        'Select a card to bring it to the front.',
      ],
      [
        'Notification Cards',
        Notifications,
        'Inspect a notification or replay the stack.',
      ],
      ['Info Reveal', InfoReveal, 'Select a sheet to explore each stage.'],
      [
        'Dynamic Island',
        DynamicIsland,
        'Switch activities and expand the island.',
      ],
      [
        'Interactive Location Selector',
        LocationSelector,
        'Choose a region to explore the map.',
      ],
      [
        'Time Zones',
        TimeZones,
        'Add cities, rearrange clocks, and change the time format.',
      ],
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    title: 'Controls & experiments',
    description: 'Focused actions and playful studies in motion.',
    studies: [
      ['Toolbar', Toolbar, 'Choose a mode, then open its summary for more.'],
      ['Hold to Delete', HoldToDelete, 'Press and hold a track to remove it.'],
      ['ASCII Logos', AsciiLogos, 'Use the arrows to explore the collection.'],
      [
        'Rotating Objects in a Grid',
        RotatingGrid,
        'Change the grid and symbols to shape the pattern.',
      ],
      ['Matrix', Matrix, 'Click to glitch; use Space to pause and resume.'],
    ],
  },
] as const;

const studyCount = groups.reduce(
  (total, group) => total + group.studies.length,
  0,
);

function SectionNavigation() {
  const [active, setActive] = useState<string>(groups[0].id);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const sections = groups.map((group) => document.getElementById(group.id)!);
    const end = document.getElementById('gallery-end')!;
    let observer: IntersectionObserver;
    const update = () => {
      const boundary = (ref.current?.getBoundingClientRect().height ?? 56) + 2;
      const current = sections
        .filter((section) => section.getBoundingClientRect().top <= boundary)
        .slice(-1)[0];
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      setActive(
        atBottom ? groups[groups.length - 1].id : (current?.id ?? groups[0].id),
      );
    };
    const observe = () => {
      observer?.disconnect();
      const boundary = (ref.current?.getBoundingClientRect().height ?? 56) + 2;
      // A thin observation strip tracks section crossings beneath the sticky bar,
      // even when a group is much taller than the viewport.
      observer = new IntersectionObserver(update, {
        rootMargin: `-${boundary}px 0px -${Math.max(0, window.innerHeight - boundary - 1)}px 0px`,
      });
      sections.forEach((section) => observer.observe(section));
      update();
    };
    const endObserver = new IntersectionObserver(update, { threshold: [0, 1] });
    endObserver.observe(end);
    observe();
    window.addEventListener('resize', observe);
    return () => {
      observer.disconnect();
      endObserver.disconnect();
      window.removeEventListener('resize', observe);
    };
  }, []);
  return (
    <nav ref={ref} className="section-nav" aria-label="Study sections">
      {groups.map((group) => (
        <a
          key={group.id}
          href={`#${group.id}`}
          aria-current={active === group.id ? 'location' : undefined}
        >
          {group.label}
          <span className="mono">
            {String(group.studies.length).padStart(2, '0')}
          </span>
        </a>
      ))}
    </nav>
  );
}

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
  const { sound, dark, setSound, setDark } = usePreferences();
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
              {String(studyCount).padStart(2, '0')} studies in motion
            </span>
          </div>
          <HeaderControls />
        </motion.header>
        <SectionNavigation />
        {groups.map((group, groupIndex) => (
          <section
            key={group.id}
            id={group.id}
            className="study-group"
            aria-labelledby={`${group.id}-title`}
          >
            <header className="group-header">
              <span className="group-kicker mono">
                Collection {String(groupIndex + 1).padStart(2, '0')}
              </span>
              <h2 id={`${group.id}-title`}>{group.title}</h2>
              <p>{group.description}</p>
            </header>
            {group.studies.map(([title, Component, hint], studyIndex) => (
              <Demo
                key={title}
                title={title}
                hint={hint}
                index={
                  groups
                    .slice(0, groupIndex)
                    .reduce(
                      (total, previous) => total + previous.studies.length,
                      0,
                    ) +
                  studyIndex +
                  1
                }
              >
                <Component />
              </Demo>
            ))}
          </section>
        ))}
        <footer>
          Interface studies, in motion.
          <a href="https://www.abilshr.com/" target="_blank" rel="noreferrer">
            Inspired by Abil Shrestha ↗
          </a>
        </footer>
        <div id="gallery-end" aria-hidden="true" />
      </main>
    </PreferencesProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
