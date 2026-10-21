import { useRef, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  Grip,
  Layers,
  LayoutGrid,
  List,
  Moon,
  Pencil,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import {
  Choices,
  IconButton,
  RollingText,
  useActiveInterval,
  useDismiss,
} from '../core';
import { playSound } from '../sound';

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
          onChange={(value) => {
            setLayout(value);
            playSound('whoosh');
          }}
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
                onClick={() => {
                  playSound(isSaved ? 'tick' : 'toggle');
                  setSaved(
                    isSaved ? saved.filter((n) => n !== i) : [...saved, i],
                  );
                }}
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

function Dial({
  hour,
  minute,
  second,
  night,
}: {
  hour: number;
  minute: number;
  second: number;
  night: boolean;
}) {
  // Angles accumulate from the epoch so CSS transitions always sweep forward,
  // even when the second hand wraps from 59 to 0.
  const total = Math.floor(Date.now() / 1000);
  const secondTurns = total * 6;
  const minuteAngle = minute * 6 + second * 0.1;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  return (
    <svg
      className={`clock-dial ${night ? 'night' : ''}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="24"
          y1={i % 3 === 0 ? 4.5 : 5.5}
          x2="24"
          y2="7.5"
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
      <line
        className="hour-hand"
        x1="24"
        y1="24"
        x2="24"
        y2="13"
        style={{ transform: `rotate(${hourAngle}deg)` }}
      />
      <line
        className="minute-hand"
        x1="24"
        y1="24"
        x2="24"
        y2="8.5"
        style={{ transform: `rotate(${minuteAngle}deg)` }}
      />
      <line
        className="second-hand"
        x1="24"
        y1="28"
        x2="24"
        y2="7"
        style={{ transform: `rotate(${secondTurns}deg)` }}
      />
      <circle className="dial-pin" cx="24" cy="24" r="1.6" />
    </svg>
  );
}

function ClockRow({
  item,
  now,
  format,
  index,
  count,
  canRemove,
  edit,
  remove,
  move,
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
}) {
  const dragControls = useDragControls();
  const city = cities[item.city];
  const { hour, minute, second, offset } = zoneParts(city.zone, now);
  const localOffset = -now.getTimezoneOffset();
  const night = hour < 6 || hour >= 19;
  const displayHour = format === '12' ? hour % 12 || 12 : hour;
  const time = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: city.zone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now);
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="clock-widget"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
      whileDrag={{
        scale: 1.025,
        boxShadow: '0 20px 40px -18px #1b1b2340',
        zIndex: 5,
      }}
      onDragEnd={() => playSound('tick')}
    >
      <button
        className="drag-clock"
        aria-label={`Drag ${city.name} clock`}
        onPointerDown={(event) => dragControls.start(event)}
      >
        <Grip size={13} />
      </button>
      <Dial hour={hour} minute={minute} second={second} night={night} />
      <div className="clock-place">
        <strong>{city.name}</strong>
        <span>
          {date} · {relativeOffset(offset - localOffset)}
        </span>
      </div>
      <div className="clock-time">
        {night ? <Moon size={13} /> : <Sun size={13} />}
        <RollingText className="clock-digits" text={time} />
        {format === '12' && (
          <span className="clock-meridiem">{hour < 12 ? 'AM' : 'PM'}</span>
        )}
      </div>
      <div className="clock-daybar" aria-hidden="true">
        <i style={{ left: `${((hour + minute / 60) / 24) * 100}%` }} />
      </div>
      <div className="clock-actions">
        <IconButton
          label={`Move ${city.name} clock up`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ArrowUp size={12} />
        </IconButton>
        <IconButton
          label={`Move ${city.name} clock down`}
          disabled={index === count - 1}
          onClick={() => move(1)}
        >
          <ArrowDown size={12} />
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
    </Reorder.Item>
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
    playSound('pop');
    setPicker(null);
  };
  const editing = items.find((item) => item.id === picker);
  return (
    <div className="timezones-demo">
      <div className="timezones-heading">
        <div>
          <strong>World clock</strong>
          <span>Drag to reorder</span>
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
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="clock-widgets"
      >
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <ClockRow
              key={item.id}
              item={item}
              now={now}
              format={format}
              index={index}
              count={items.length}
              canRemove={items.length > 1}
              edit={() => setPicker(item.id)}
              remove={() => {
                playSound('delete');
                setItems((current) =>
                  current.filter((clock) => clock.id !== item.id),
                );
              }}
              move={(direction) => move(item.id, direction)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
