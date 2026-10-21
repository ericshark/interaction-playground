import { useRef, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  Reorder,
  useDragControls,
} from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Command,
  File,
  Folder,
  Globe,
  Grip,
  Pencil,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import {
  Choices,
  IconButton,
  spring,
  useActiveInterval,
  useDismiss,
} from '../core';

const artworks = [
  { name: 'Ripple', price: '0.6755', number: '#808' },
  { name: 'Centrifugal', price: '0.6588', number: '#909' },
];
export function SwitchLayout() {
  const [layout, setLayout] = useState('List view');
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <LayoutGroup id="artwork-layout">
      <div className="switch-layout-demo">
        <Choices
          options={['List view', 'Card view', 'Pack view']}
          value={layout}
          onChange={setLayout}
          label="Artwork layout"
        />
        <motion.div
          layout
          className={`artworks ${layout === 'List view' ? 'list-view' : layout === 'Card view' ? 'card-view' : 'pack-view'}`}
        >
          {artworks.map((item, i) => (
            <motion.button
              layout
              key={item.name}
              className={`artwork ${selected === i ? 'selected' : ''}`}
              aria-label={`Select ${item.name} artwork`}
              aria-pressed={selected === i}
              onClick={() => setSelected(selected === i ? null : i)}
              animate={{
                rotate: layout === 'Pack view' ? (i === 0 ? -8 : 8) : 0,
                x: layout === 'Pack view' ? (i === 0 ? -25 : 35) : 0,
                y: layout === 'Pack view' ? i * 12 : 0,
              }}
              transition={spring}
            >
              <motion.img
                layout
                src={`/images/art-${i + 1}.jpg`}
                alt={`${item.name} abstract artwork`}
                loading="lazy"
              />
              <motion.div layout className="artwork-info">
                <strong>{item.name}</strong>
                <span>
                  <b>{item.price}</b> ETH
                </span>
              </motion.div>
              <motion.span layout className="artwork-number">
                <i className={selected === i ? 'saved' : ''} />
                {selected === i ? 'Saved' : item.number}
              </motion.span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}

const cities = [
  {
    name: 'New York',
    country: 'United States of America',
    zone: 'America/New_York',
  },
  {
    name: 'San Francisco',
    country: 'United States of America',
    zone: 'America/Los_Angeles',
  },
  { name: 'London', country: 'United Kingdom', zone: 'Europe/London' },
  { name: 'Paris', country: 'France', zone: 'Europe/Paris' },
  { name: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo' },
  { name: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu' },
  { name: 'Sydney', country: 'Australia', zone: 'Australia/Sydney' },
];
type ClockItem = { id: number; city: number };
function ClockWidget({
  item,
  now,
  format,
  canRemove,
  update,
  remove,
  move,
}: {
  item: ClockItem;
  now: Date;
  format: string;
  canRemove: boolean;
  update: (city: number) => void;
  remove: () => void;
  move: (direction: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dragControls = useDragControls();
  const city = cities[item.city];
  const displayTime = new Intl.DateTimeFormat('en-US', {
    timeZone: city.zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12',
  }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: city.zone,
    day: '2-digit',
    month: 'short',
  }).format(now);
  const offset = new Intl.DateTimeFormat('en', {
    timeZone: city.zone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value;
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: city.zone,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  );
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="clock-widget"
      whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px #00000012', zIndex: 5 }}
    >
      <div className="clock-widget-heading">
        <button
          className="drag-clock"
          aria-label={`Drag ${city.name} clock`}
          onPointerDown={(event) => dragControls.start(event)}
        >
          <Grip size={13} />
        </button>
        <span>
          {city.name}, {city.country}
        </span>
        <IconButton
          label={`Edit ${city.name} clock`}
          onClick={() => setEditing(!editing)}
        >
          <Pencil size={11} />
        </IconButton>
        {canRemove && (
          <IconButton label={`Remove ${city.name} clock`} onClick={remove}>
            <X size={12} />
          </IconButton>
        )}
      </div>
      <AnimatePresence>
        {editing && (
          <motion.div
            className="city-editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="sr-only" htmlFor={`city-${item.id}`}>
              Clock city
            </label>
            <select
              id={`city-${item.id}`}
              value={item.city}
              onChange={(event) => {
                update(Number(event.target.value));
                setEditing(false);
              }}
            >
              {cities.map((city, i) => (
                <option value={i} key={city.zone}>
                  {city.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="clock-offset">{offset}</span>
      <span className="clock-date">{date}</span>
      <div className="clock-timeline">
        <span
          className="clock-hand"
          style={{ left: `${7 + (hour / 24) * 86}%` }}
        >
          <i />
        </span>
        <strong className="mono">{displayTime}</strong>
        <div className="clock-ticks">
          {Array.from({ length: 25 }, (_, i) => (
            <i key={i} className={i % 6 === 0 ? 'major' : ''} />
          ))}
        </div>
        <div className="clock-hours mono">
          <span>12</span>
          <span>6</span>
          <span>12</span>
          <span>6</span>
          <span>12</span>
        </div>
      </div>
      <div className="clock-move">
        <IconButton
          label={`Move ${city.name} clock left`}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={12} />
        </IconButton>
        <IconButton
          label={`Move ${city.name} clock right`}
          onClick={() => move(1)}
        >
          <ArrowRight size={12} />
        </IconButton>
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
  const [format, setFormat] = useState('12');
  const [now, setNow] = useState(() => new Date());
  useActiveInterval(() => setNow(new Date()), 1000, true, false);
  const move = (id: number, direction: number) =>
    setItems((current) => {
      const result = [...current];
      const from = result.findIndex((item) => item.id === id);
      const to = Math.max(0, Math.min(result.length - 1, from + direction));
      [result[from], result[to]] = [result[to], result[from]];
      return result;
    });
  return (
    <div className="timezones-demo">
      <div className="timezones-heading">
        <span>Drag and Drop widgets</span>
        <Choices
          options={['12', '24']}
          value={format}
          onChange={setFormat}
          label="Clock format"
        />
      </div>
      <Reorder.Group
        axis="x"
        values={items}
        onReorder={setItems}
        className="clock-widgets"
      >
        {items.map((item) => (
          <ClockWidget
            key={item.id}
            item={item}
            now={now}
            format={format}
            canRemove={items.length > 1}
            update={(city) =>
              setItems((current) =>
                current.map((clock) =>
                  clock.id === item.id ? { ...clock, city } : clock,
                ),
              )
            }
            remove={() =>
              setItems((current) =>
                current.filter((clock) => clock.id !== item.id),
              )
            }
            move={(direction) => move(item.id, direction)}
          />
        ))}
      </Reorder.Group>
      <IconButton
        label="Add clock widget"
        className="add-clock"
        disabled={items.length >= 4}
        onClick={() => {
          const city = cities.findIndex(
            (_, i) => !items.some((item) => item.city === i),
          );
          setItems([
            ...items,
            { id: nextId.current++, city: Math.max(0, city) },
          ]);
        }}
      >
        <Plus size={15} />
      </IconButton>
    </div>
  );
}

const searchItems = [
  { name: 'New project', detail: 'Start something new', Icon: Plus },
  { name: 'Recent files', detail: 'Pick up where you left off', Icon: File },
  { name: 'Collections', detail: 'Everything in its place', Icon: Folder },
  { name: 'Explore', detail: 'Find a little inspiration', Icon: Globe },
  { name: 'Settings', detail: 'Make yourself at home', Icon: Settings },
];
export function SlimDropdown() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const filtered = searchItems.filter((item) =>
    (item.name + ' ' + item.detail).toLowerCase().includes(query.toLowerCase()),
  );
  const select = (name: string) => {
    setSelected(name);
    setOpen(false);
    setQuery('');
    trigger.current?.focus();
  };
  return (
    <div className="slim-demo" ref={ref}>
      <motion.div layout className={`slim-search ${open ? 'open' : ''}`}>
        <button
          ref={trigger}
          className="search-trigger"
          aria-label="Search"
          aria-expanded={open}
          aria-controls="slim-options"
          onClick={() => {
            setOpen(!open);
            setCursor(0);
          }}
        >
          <Search size={17} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="slim-expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <input
                autoFocus
                role="combobox"
                aria-label="Search commands"
                aria-expanded={open}
                aria-controls="slim-options"
                aria-activedescendant={
                  filtered.length ? `slim-option-${cursor}` : undefined
                }
                placeholder="What are you looking for?"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setCursor((current) =>
                      Math.min(current + 1, filtered.length - 1),
                    );
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setCursor((current) => Math.max(current - 1, 0));
                  } else if (event.key === 'Enter' && filtered[cursor]) {
                    event.preventDefault();
                    select(filtered[cursor].name);
                  } else if (event.key === 'Escape') {
                    setOpen(false);
                    trigger.current?.focus();
                  }
                }}
              />
              <kbd>esc</kbd>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="slim-options"
            id="slim-options"
            role="listbox"
            aria-label="Commands"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
          >
            {filtered.map((item, i) => (
              <button
                id={`slim-option-${i}`}
                key={item.name}
                role="option"
                aria-selected={cursor === i}
                onMouseEnter={() => setCursor(i)}
                onClick={() => select(item.name)}
              >
                <item.Icon size={15} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </span>
                <ArrowRight size={13} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="no-results">No matches. Try another search.</p>
            )}
            <div className="search-menu-footer">
              <Command size={11} />
              Small steps, new possibilities.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {selected && !open && (
        <span className="search-selected" role="status">
          <Check size={12} />
          {selected}
        </span>
      )}
    </div>
  );
}

const filters = [
  { name: 'Product', color: '#4d7c0f', background: '#f8fae5' },
  { name: 'Marketing', color: '#065f46', background: '#e5f6f0' },
  { name: 'Design', color: '#1e40af', background: '#e5eeff' },
  { name: 'Development', color: '#86198f', background: '#f5e5f7' },
  { name: 'Sales', color: '#9a3412', background: '#fff0e5' },
];
export function FilterDropdown() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div className="filter-demo" ref={ref}>
      <div className="filter-chips">
        <AnimatePresence>
          {selected.map((name) => {
            const filter = filters.find((item) => item.name === name)!;
            return (
              <motion.button
                layout
                key={name}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                aria-label={`Remove ${name} filter`}
                style={{
                  color: filter.color,
                  backgroundColor: filter.background,
                }}
                onClick={() =>
                  setSelected(selected.filter((item) => item !== name))
                }
              >
                {name}
                <X size={11} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.div layout className="filter-menu">
        <button
          className="filter-heading"
          aria-expanded={open}
          aria-controls="filter-options"
          onClick={() => setOpen(!open)}
        >
          <span>
            {selected.length
              ? `${selected.length} filter${selected.length === 1 ? '' : 's'} selected`
              : 'Select filter'}
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="filter-options"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="filter-options"
            >
              <div>
                {filters
                  .filter((item) => !selected.includes(item.name))
                  .map((filter) => (
                    <motion.button
                      layout
                      key={filter.name}
                      style={{
                        color: filter.color,
                        backgroundColor: filter.background,
                      }}
                      onClick={() => setSelected([...selected, filter.name])}
                    >
                      {filter.name}
                      <Plus size={12} />
                    </motion.button>
                  ))}
                {selected.length === filters.length && (
                  <span className="all-filters">
                    <Check size={14} />
                    All filters selected
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const tasks = [
  'Explore a new direction',
  'Make room for the details',
  'Bring the idea to life',
  'Share something good',
];
export function CalendarBlock() {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div className="calendar-frame" ref={ref}>
      <motion.div layout className="calendar-card">
        <button
          className="calendar-summary"
          aria-expanded={open}
          aria-controls="calendar-tasks"
          onClick={() => setOpen(!open)}
        >
          <span className="calendar-accent" />
          <strong>Today's Tasks</strong>
          <span>
            <Clock3 size={12} />
            {tasks.length - completed.length} tasks
            {completed.length === 4 ? ' · all done' : ''}
          </span>
          <ChevronDown size={14} className={open ? 'rotated' : ''} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="calendar-tasks"
              className="calendar-tasks"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {tasks.map((task, i) => (
                <label
                  key={task}
                  className={completed.includes(i) ? 'completed' : ''}
                >
                  <input
                    type="checkbox"
                    checked={completed.includes(i)}
                    onChange={() =>
                      setCompleted((current) =>
                        current.includes(i)
                          ? current.filter((n) => n !== i)
                          : [...current, i],
                      )
                    }
                  />
                  <span>{task}</span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
