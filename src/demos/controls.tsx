import { useRef, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useDragControls,
} from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Grip,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import {
  Choices,
  IconButton,
  RollingText,
  useActiveInterval,
  useDismiss,
} from '../core';

const artworks = [
  {
    name: 'Ripple',
    price: '0.6755',
    number: '#808',
    image: '/images/art-1.jpg',
  },
  {
    name: 'Centrifugal',
    price: '0.6588',
    number: '#909',
    image: '/images/art-2.jpg',
  },
  {
    name: 'Drift',
    price: '0.4210',
    number: '#312',
    image: '/images/info-1.jpg',
  },
  {
    name: 'Bloom',
    price: '0.5124',
    number: '#527',
    image: '/images/info-2.jpg',
  },
];
const layouts = ['List view', 'Card view', 'Pack view'] as const;
const layoutSpring = { type: 'spring' as const, stiffness: 320, damping: 32 };

export function SwitchLayout() {
  const [layout, setLayout] = useState<(typeof layouts)[number]>('List view');
  const [saved, setSaved] = useState<number[]>([]);
  const [spread, setSpread] = useState(false);
  const view =
    layout === 'List view'
      ? 'list-view'
      : layout === 'Card view'
        ? 'card-view'
        : 'pack-view';
  return (
    <LayoutGroup id="artwork-layout">
      <div className="switch-layout-demo">
        <Choices
          options={layouts}
          value={layout}
          onChange={setLayout}
          label="Artwork layout"
          icons={{
            'List view': <List size={13} />,
            'Card view': <LayoutGrid size={13} />,
            'Pack view': <Layers size={13} />,
          }}
        />
        <motion.div
          layout
          className={`artworks ${view}`}
          transition={layoutSpring}
          onHoverStart={() => setSpread(true)}
          onHoverEnd={() => setSpread(false)}
        >
          {artworks.map((item, i) => {
            const isSaved = saved.includes(i);
            const offset = i - (artworks.length - 1) / 2;
            return (
              <motion.button
                layout
                key={item.name}
                className={`artwork ${isSaved ? 'selected' : ''}`}
                aria-label={`Select ${item.name} artwork`}
                aria-pressed={isSaved}
                onClick={() =>
                  setSaved(
                    isSaved ? saved.filter((n) => n !== i) : [...saved, i],
                  )
                }
                animate={
                  view === 'pack-view'
                    ? {
                        rotate: offset * (spread ? 11 : 5),
                        x: offset * (spread ? 62 : 14),
                        y: Math.abs(offset) * (spread ? 14 : 5),
                      }
                    : { rotate: 0, x: 0, y: 0 }
                }
                whileHover={view === 'pack-view' ? undefined : { y: -2 }}
                style={{ zIndex: view === 'pack-view' ? i : undefined }}
                transition={{ ...layoutSpring, delay: i * 0.025 }}
              >
                <motion.img
                  layout
                  src={item.image}
                  alt={`${item.name} abstract artwork`}
                  loading="lazy"
                  transition={{ ...layoutSpring, delay: i * 0.025 }}
                />
                <motion.div
                  layout="position"
                  className="artwork-info"
                  transition={{ ...layoutSpring, delay: i * 0.025 }}
                >
                  <strong>{item.name}</strong>
                  <span>
                    <b>{item.price}</b> ETH
                  </span>
                </motion.div>
                <motion.span
                  layout="position"
                  className="artwork-number"
                  transition={{ ...layoutSpring, delay: i * 0.025 }}
                >
                  <motion.span
                    key={String(isSaved)}
                    className="artwork-save"
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                  >
                    <Bookmark
                      size={11}
                      fill={isSaved ? 'currentColor' : 'none'}
                    />
                  </motion.span>
                  {isSaved ? 'Saved' : item.number}
                </motion.span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}

const cities = [
  { name: 'New York', country: 'United States', zone: 'America/New_York' },
  {
    name: 'San Francisco',
    country: 'United States',
    zone: 'America/Los_Angeles',
  },
  { name: 'London', country: 'United Kingdom', zone: 'Europe/London' },
  { name: 'Paris', country: 'France', zone: 'Europe/Paris' },
  { name: 'Dubai', country: 'United Arab Emirates', zone: 'Asia/Dubai' },
  { name: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu' },
  { name: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo' },
  { name: 'Sydney', country: 'Australia', zone: 'Australia/Sydney' },
  { name: 'São Paulo', country: 'Brazil', zone: 'America/Sao_Paulo' },
  { name: 'Reykjavík', country: 'Iceland', zone: 'Atlantic/Reykjavik' },
];
type ClockItem = { id: number; city: number };

function zoneParts(zone: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '0';
  const [, sign, hours, minutes] =
    /GMT(?:([+-])(\d+)(?::(\d+))?)?/.exec(value('timeZoneName')) ?? [];
  const offset =
    (sign === '-' ? -1 : 1) * (Number(hours ?? 0) * 60 + Number(minutes ?? 0));
  return {
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    second: Number(value('second')),
    offset,
  };
}

function relativeOffset(minutes: number) {
  if (minutes === 0) return 'Same time';
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `${minutes > 0 ? '+' : '−'}${hours}h${rest ? ` ${rest}m` : ''}`;
}

type Sky = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';
function skyFor(hour: number): Sky {
  if (hour < 5 || hour >= 20.5) return 'night';
  if (hour < 7.5) return 'dawn';
  if (hour < 16.5) return 'day';
  if (hour < 18.5) return 'golden';
  return 'dusk';
}
const stars = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 97,
  top: (i * 53) % 58,
  delay: (i * 0.37) % 2.4,
}));

// The sun travels the arc from 06:00 to 18:00 and the moon the other half.
function celestial(hour: number) {
  const sun = hour >= 6 && hour < 18;
  const t = sun ? (hour - 6) / 12 : ((hour + 6) % 24) / 12;
  const x = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 50 + t ** 2 * 96;
  const y = (1 - t) ** 2 * 38 + 2 * (1 - t) * t * -10 + t ** 2 * 38;
  return { sun, x, y };
}

function ClockTile({
  item,
  now,
  format,
  index,
  count,
  canRemove,
  edit,
  remove,
  move,
  drop,
}: {
  item: ClockItem;
  now: Date;
  format: string;
  index: number;
  count: number;
  canRemove: boolean;
  edit: () => void;
  remove: () => void;
  move: (direction: number) => void;
  drop: (clientX: number, clientY: number) => void;
}) {
  const dragControls = useDragControls();
  const city = cities[item.city];
  const { hour, minute, offset } = zoneParts(city.zone, now);
  const localOffset = -now.getTimezoneOffset();
  const exactHour = hour + minute / 60;
  const sky = skyFor(exactHour);
  const body = celestial(exactHour);
  const displayHour = format === '12' ? hour % 12 || 12 : hour;
  const time = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: city.zone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now);
  return (
    <motion.li
      layout
      className={`clock-tile sky-${sky}`}
      data-clock-id={item.id}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragSnapToOrigin
      dragElastic={0.9}
      whileDrag={{ scale: 1.04, zIndex: 10, cursor: 'grabbing' }}
      onDragEnd={(event) => {
        const point = 'clientX' in event ? event : event.changedTouches?.[0];
        if (point) drop(point.clientX, point.clientY);
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      {sky === 'night' && (
        <span className="clock-stars" aria-hidden="true">
          {stars.map((star, i) => (
            <i
              key={i}
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </span>
      )}
      <svg className="clock-arc" viewBox="0 0 100 40" aria-hidden="true">
        <path d="M4 38Q50 -10 96 38" />
        <circle
          className={body.sun ? 'sun' : 'moon'}
          cx={body.x}
          cy={body.y}
          r={body.sun ? 4.2 : 3.4}
        />
      </svg>
      <button
        className="drag-clock"
        aria-label={`Drag ${city.name} clock`}
        onPointerDown={(event) => dragControls.start(event)}
      >
        <Grip size={13} />
      </button>
      <div className="clock-place">
        <strong>{city.name}</strong>
        <span>{city.country}</span>
      </div>
      <div className="clock-time">
        <RollingText className="clock-digits" text={time} />
        {format === '12' && (
          <span className="clock-meridiem">{hour < 12 ? 'AM' : 'PM'}</span>
        )}
      </div>
      <span className="clock-meta">
        {date} · {relativeOffset(offset - localOffset)}
      </span>
      <div className="clock-actions">
        <IconButton
          label={`Move ${city.name} clock earlier`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={12} />
        </IconButton>
        <IconButton
          label={`Move ${city.name} clock later`}
          disabled={index === count - 1}
          onClick={() => move(1)}
        >
          <ArrowRight size={12} />
        </IconButton>
        <IconButton label={`Change ${city.name} city`} onClick={edit}>
          <Pencil size={11} />
        </IconButton>
        {canRemove && (
          <IconButton label={`Remove ${city.name} clock`} onClick={remove}>
            <X size={12} />
          </IconButton>
        )}
      </div>
    </motion.li>
  );
}

export function TimeZones() {
  const [items, setItems] = useState<ClockItem[]>([
    { id: 0, city: 0 },
    { id: 1, city: 1 },
  ]);
  const nextId = useRef(2);
  const [format, setFormat] = useState<'12' | '24'>('12');
  const [now, setNow] = useState(() => new Date());
  const [picker, setPicker] = useState<'add' | number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  useDismiss(pickerRef, picker !== null, () => setPicker(null));
  useActiveInterval(() => setNow(new Date()), 1000, true, false);
  const move = (id: number, direction: number) =>
    setItems((current) => {
      const result = [...current];
      const from = result.findIndex((item) => item.id === id);
      const to = Math.max(0, Math.min(result.length - 1, from + direction));
      [result[from], result[to]] = [result[to], result[from]];
      return result;
    });
  const choose = (city: number) => {
    if (picker === 'add') setItems([...items, { id: nextId.current++, city }]);
    else
      setItems(
        items.map((clock) =>
          clock.id === picker ? { ...clock, city } : clock,
        ),
      );
    setPicker(null);
  };
  const editing = items.find((item) => item.id === picker);
  return (
    <div className="timezones-demo">
      <div className="timezones-heading">
        <div>
          <strong>World clock</strong>
          <span>Drag a tile onto another to swap</span>
        </div>
        <Choices
          options={['12', '24'] as const}
          value={format}
          onChange={setFormat}
          label="Clock format"
        />
        <div className="city-picker-anchor" ref={pickerRef}>
          <IconButton
            label="Add clock"
            className="add-clock"
            disabled={items.length >= 4}
            aria-expanded={picker === 'add'}
            onClick={() => setPicker(picker === 'add' ? null : 'add')}
          >
            <Plus size={15} />
          </IconButton>
          <AnimatePresence>
            {picker !== null && (
              <motion.div
                className="city-picker"
                role="listbox"
                aria-label={
                  editing ? `Change ${cities[editing.city].name}` : 'Add a city'
                }
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              >
                <span className="eyebrow">
                  {editing
                    ? `Replace ${cities[editing.city].name}`
                    : 'Add a city'}
                </span>
                {cities.map((city, i) => {
                  const shown = items.some((item) => item.city === i);
                  return (
                    <button
                      key={city.zone}
                      role="option"
                      aria-selected={editing?.city === i}
                      disabled={shown && editing?.city !== i}
                      onClick={() => choose(i)}
                    >
                      <span>{city.name}</span>
                      <small>
                        {relativeOffset(
                          zoneParts(city.zone, now).offset +
                            now.getTimezoneOffset(),
                        )}
                      </small>
                      {shown && <Check size={12} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <motion.ul layout className="clock-widgets">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <ClockTile
              key={item.id}
              item={item}
              now={now}
              format={format}
              index={index}
              count={items.length}
              canRemove={items.length > 1}
              edit={() => setPicker(item.id)}
              remove={() =>
                setItems((current) =>
                  current.filter((clock) => clock.id !== item.id),
                )
              }
              move={(direction) => move(item.id, direction)}
              drop={(clientX, clientY) => {
                const target = document
                  .elementsFromPoint(clientX, clientY)
                  .map((element) => element.closest('[data-clock-id]'))
                  .find(
                    (tile) =>
                      tile &&
                      Number(tile.getAttribute('data-clock-id')) !== item.id,
                  );
                if (!target) return;
                const targetId = Number(target.getAttribute('data-clock-id'));
                setItems((current) => {
                  const from = current.findIndex(
                    (clock) => clock.id === item.id,
                  );
                  const to = current.findIndex(
                    (clock) => clock.id === targetId,
                  );
                  const result = [...current];
                  [result[from], result[to]] = [result[to], result[from]];
                  return result;
                });
              }}
            />
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
