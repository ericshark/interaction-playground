import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageCircle,
  Phone,
  Terminal,
} from 'lucide-react';
import { IconButton, photo, spring, useCycle } from '../core';

export function InfiniteCards() {
  const { index, advance, setPaused } = useCycle(5, 4000);
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
      <div className="infinite-stack" aria-label="Cycling photograph stack">
        {[4, 3, 2, 1, 0].map((depth) => (
          <motion.div
            key={`${index}-${depth}`}
            className="infinite-card"
            initial={{
              y: -depth * 22 - 14,
              scale: 1 - depth * 0.065,
              opacity: 0,
            }}
            animate={{ y: -depth * 22, scale: 1 - depth * 0.065, opacity: 1 }}
            transition={spring}
            style={{ zIndex: 5 - depth }}
          >
            {depth === 0 ? (
              <motion.button
                aria-label="Next photograph"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.45}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.y) > 35)
                    advance(info.offset.y > 0 ? 1 : -1);
                }}
                onClick={() => advance()}
                className="photo-button"
              >
                <img
                  src={photo(index + depth)}
                  alt={`Photographic study ${index + 1}`}
                  loading="lazy"
                  draggable={false}
                />
              </motion.button>
            ) : (
              <img
                src={photo(index + depth)}
                alt=""
                loading="lazy"
                draggable={false}
              />
            )}
          </motion.div>
        ))}
      </div>
      <div className="gallery-navigation">
        <IconButton
          label="Previous stacked photograph"
          onClick={() => advance(-1)}
        >
          <ArrowUp size={14} />
        </IconButton>
        <span className="mono">0{index + 1} / 05</span>
        <IconButton label="Next stacked photograph" onClick={() => advance()}>
          <ArrowDown size={14} />
        </IconButton>
      </div>
    </div>
  );
}

const stackNames = ['Connections', 'Messages', 'Terminal', 'Browser', 'Notes'];
export function StackedCards() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="stacked-demo">
      <div className="perspective-guides" aria-hidden="true" />
      <div className="spatial-stack">
        {[4, 3, 2, 1, 0].map((i) => {
          const position = (i - selected + 5) % 5;
          return (
            <motion.button
              key={i}
              className={`spatial-card spatial-card-${i}`}
              aria-label={`Show ${stackNames[i]} card`}
              aria-pressed={selected === i}
              animate={{
                x: position * 30 - 50,
                y: -position * 13,
                rotateY: -30,
                rotateX: 8,
                z: -position * 28,
                opacity: 1 - position * 0.1,
              }}
              style={{ zIndex: 5 - position }}
              transition={spring}
              onClick={() => setSelected(selected === i ? (i + 1) % 5 : i)}
            >
              {i === 0 ? (
                <div className="connection-icons">
                  <Phone />
                  <MessageCircle />
                  <Globe />
                </div>
              ) : i === 1 ? (
                <div className="mini-message">
                  <span className="tiny-avatar">A</span>
                  <p>
                    Hello, I'm here.<span>Just now</span>
                  </p>
                </div>
              ) : i === 2 ? (
                <div className="mini-terminal">
                  <div>
                    <Terminal size={14} />
                    Ghostty
                  </div>
                  <p>
                    <span>➜</span> ~/dev
                  </p>
                  <p>
                    npm install<span className="typing-cursor">▌</span>
                  </p>
                </div>
              ) : i === 3 ? (
                <div className="mini-browser">
                  <span>◦ ◦ ◦</span>
                  <div />
                  <div />
                  <div />
                </div>
              ) : (
                <div className="mini-notes">
                  <span>Things worth making.</span>
                  <i />
                  <i />
                  <i />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      <p className="demo-hint">Click a card to explore</p>
    </div>
  );
}

export function GalleryCarousel() {
  const { index, advance, setPaused } = useCycle(5, 4200);
  return (
    <div
      className="carousel-demo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="orbit-gallery"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 30) advance(info.offset.x < 0 ? 1 : -1);
        }}
      >
        {Array.from({ length: 5 }, (_, i) => {
          let position = (i - index + 5) % 5;
          if (position > 2) position -= 5;
          return (
            <motion.button
              key={i}
              className="orbit-image"
              aria-label={`View gallery photograph ${i + 1}`}
              aria-pressed={position === 0}
              onClick={() => advance(position)}
              animate={{
                x: position * 100,
                y: Math.abs(position) * 18,
                scale: 1 - Math.abs(position) * 0.23,
                rotateY: position * -28,
                opacity: 1 - Math.abs(position) * 0.13,
              }}
              style={{ zIndex: 5 - Math.abs(position) }}
              transition={{ ...spring, stiffness: 160 }}
            >
              <img
                src={`/images/gallery-${(i % 4) + 1}.jpg`}
                alt={
                  [
                    'A study in pink',
                    'A quiet landscape',
                    'Nature in detail',
                    'Light and shadow',
                    'Organic forms',
                  ][i]
                }
                loading="lazy"
                draggable={false}
              />
            </motion.button>
          );
        })}
      </motion.div>
      <div className="gallery-navigation">
        <IconButton label="Previous gallery image" onClick={() => advance(-1)}>
          <ChevronLeft size={16} />
        </IconButton>
        <span className="mono">0{index + 1} / 05</span>
        <IconButton label="Next gallery image" onClick={() => advance()}>
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
export function InfoCarousel() {
  const { index, setIndex, setPaused } = useCycle(3, 5000);
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
          const position = (i - index + 3) % 3;
          return (
            <motion.div
              key={item.title}
              className="info-slide"
              aria-hidden={position !== 0}
              animate={{
                y: position * 12,
                scale: 1 - position * 0.08,
                opacity: position === 2 ? 0 : 1,
                rotateX: position * 6,
              }}
              style={{ zIndex: 3 - position }}
              transition={spring}
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
          <button
            key={item.title}
            aria-label={`Show slide ${i + 1}: ${item.category}`}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={index === i ? 'active' : ''}
          >
            {index === i && <span key={index} className="slide-progress" />}
          </button>
        ))}
      </div>
    </div>
  );
}
