import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  Database,
  ImagePlus,
  Pause,
  Phone,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';
import { Choices, IconButton, spring, useActiveInterval } from '../core';

const orbColors: Record<string, string> = {
  Gemini: '#78c7e3, #6f8bf7, #f5a5d6, #ff7054, #ffcd54, #86e7b1, #78c7e3',
  OpenAI: '#b8dbc9, #429e82, #bdebd9, #75bfa7, #d3efe5, #429e82',
  Claude: '#df9272, #f5cfb1, #c77459, #e6b497, #df9272',
  Siri: '#b968f4, #ff698f, #5bbef1, #77e3dc, #b968f4',
};
export function ChatOrb() {
  const [provider, setProvider] = useState('Gemini');
  const [listening, setListening] = useState(false);
  return (
    <div className="chat-orb-demo">
      <button
        className={`orb-button ${listening ? 'listening' : ''}`}
        aria-label={listening ? 'Stop listening' : 'Start voice preview'}
        aria-pressed={listening}
        onClick={() => setListening(!listening)}
        style={{ '--orb-colors': orbColors[provider] } as CSSProperties}
      >
        <span className="orb-halo" />
        <span className="orb-core" />
        <span className="orb-wave">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
      </button>
      <div className="orb-controls">
        <label className="sr-only" htmlFor="orb-provider">
          Voice provider
        </label>
        <select
          id="orb-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          {Object.keys(orbColors).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <span className="demo-hint" role="status">
          {listening
            ? 'Listening · tap to stop'
            : 'Tap to start a voice preview'}
        </span>
      </div>
    </div>
  );
}

const locations = [
  { name: 'Oregon', detail: 'US West', x: 100, y: 85 },
  { name: 'Virginia', detail: 'US East', x: 152, y: 92 },
  { name: 'Frankfurt', detail: 'Europe', x: 286, y: 65 },
  { name: 'Singapore', detail: 'Asia Pacific', x: 436, y: 156 },
  { name: 'Sydney', detail: 'Australia', x: 480, y: 211 },
];
export function LocationSelector() {
  const [workspace, setWorkspace] = useState('Silverstone Dynamics');
  const [project, setProject] = useState('CircuitHub');
  const [location, setLocation] = useState('Oregon');
  const [created, setCreated] = useState(false);
  const selected = locations.find((item) => item.name === location)!;
  const reset = () => {
    setCreated(false);
    setWorkspace('Silverstone Dynamics');
    setProject('CircuitHub');
    setLocation('Oregon');
  };
  return (
    <div className="location-demo">
      <AnimatePresence mode="wait">
        {created ? (
          <motion.div
            className="database-success"
            key="created"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="success-icon">
              <Database size={23} />
              <Check size={12} />
            </span>
            <h3>You're all set.</h3>
            <p>
              <strong>{project}</strong> is ready in {location}.
            </p>
            <span className="muted small">
              Local preview · nothing was provisioned
            </span>
            <button className="secondary-button" onClick={reset}>
              Create another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="location-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={(event) => {
              event.preventDefault();
              if (workspace.trim() && project.trim()) setCreated(true);
            }}
          >
            <div className="location-fields">
              <label>
                Workspace name
                <input
                  required
                  maxLength={70}
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                />
              </label>
              <label>
                Project name
                <input
                  required
                  maxLength={70}
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                />
              </label>
              <div className="location-bottom">
                <label>
                  Database location
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {locations.map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                  <span className="region-detail">{selected.detail}</span>
                </label>
                <div className="location-map">
                  <svg
                    viewBox="0 0 560 270"
                    role="img"
                    aria-label={`Selected database region: ${location}`}
                  >
                    <defs>
                      <radialGradient id="map-fade">
                        <stop offset="50%" stopColor="white" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </radialGradient>
                      <mask id="map-mask">
                        <rect width="560" height="270" fill="url(#map-fade)" />
                      </mask>
                    </defs>
                    <g
                      mask="url(#map-mask)"
                      fill="#e9ebea"
                      stroke="#d0d6d3"
                      strokeWidth="1"
                    >
                      <path d="M42 32 95 20 158 42 188 79 162 120 143 127 127 168 109 145 105 119 79 102 62 67Z" />
                      <path d="M146 145 176 151 197 180 185 223 163 256 153 213 140 179Z" />
                      <path d="M251 51 283 29 306 45 324 31 345 57 394 40 450 56 510 90 481 111 435 99 412 129 391 117 359 147 333 107 304 100 279 86 256 90Z" />
                      <path d="M277 99 314 105 337 143 315 198 290 193 269 144Z" />
                      <path d="M452 198 488 184 520 217 502 240 462 232Z" />
                      <path
                        d="M88 20 93 105M115 41 162 120M279 49 282 86M301 43 304 100M365 60 359 124M428 70 410 128M288 129 322 139"
                        fill="none"
                      />
                    </g>
                    <motion.g
                      initial={false}
                      animate={{ x: selected.x, y: selected.y }}
                      transition={spring}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="15"
                        fill="#b390ed"
                        opacity="0.13"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="5"
                        fill="#a271df"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </motion.g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="text-button" onClick={reset}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={!workspace.trim() || !project.trim()}
              >
                Create database
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ImageSend() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  useEffect(() => {
    if (status !== 'sending') return;
    const timer = window.setTimeout(() => {
      setStatus('sent');
      setSelected([]);
      setOpen(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [status]);
  const reset = () => {
    setStatus('idle');
    setOpen(true);
    setSelected([]);
  };
  return (
    <div className="image-send-demo">
      <AnimatePresence>
        {status === 'sent' ? (
          <motion.div
            key="sent"
            className="send-success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <CircleCheck size={31} />
            <p>Delivered.</p>
            <button className="text-button" onClick={reset}>
              Send more images
            </button>
          </motion.div>
        ) : (
          <motion.div key="picker" className="send-composer" layout>
            <button
              className="send-orb"
              aria-label={open ? 'Close image picker' : 'Open image picker'}
              aria-expanded={open}
              onClick={() => {
                setStatus('idle');
                setOpen(!open);
              }}
            >
              <span className="send-flower" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      transform: `rotate(${i * 60}deg) translateY(-9px)`,
                    }}
                  />
                ))}
              </span>
              <ImagePlus size={22} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  className="image-picker"
                  initial={{ opacity: 0, y: 18, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.9 }}
                >
                  <span className="eyebrow">A little something to send</span>
                  <div className="picker-photos">
                    {[1, 2, 3].map((i) => (
                      <motion.button
                        key={i}
                        aria-label={`Select image ${i}`}
                        aria-pressed={selected.includes(i)}
                        className={selected.includes(i) ? 'selected' : ''}
                        animate={
                          status === 'sending' && selected.includes(i)
                            ? {
                                y: -120,
                                x: (2 - i) * 40,
                                scale: 0.2,
                                opacity: 0,
                                rotate: (i - 2) * 30,
                              }
                            : { y: 0, x: 0, scale: 1, opacity: 1, rotate: 0 }
                        }
                        transition={{
                          duration: 0.6,
                          delay: status === 'sending' ? i * 0.1 : 0,
                        }}
                        disabled={status === 'sending'}
                        onClick={() =>
                          setSelected((current) =>
                            current.includes(i)
                              ? current.filter((n) => n !== i)
                              : [...current, i],
                          )
                        }
                      >
                        <img
                          src={`/images/send-${i}.jpg`}
                          alt={
                            [
                              '',
                              'Botanical study',
                              'Soft landscape',
                              'Light study',
                            ][i]
                          }
                          loading="lazy"
                        />
                        {selected.includes(i) && (
                          <span>
                            <Check size={12} />
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <button
                    className="primary-button"
                    disabled={selected.length === 0 || status === 'sending'}
                    onClick={() => setStatus('sending')}
                  >
                    <Send size={13} />
                    {status === 'sending'
                      ? 'Sending…'
                      : `Send ${selected.length || ''} image${selected.length !== 1 ? 's' : ''}`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <span role="status" className="sr-only">
        {status === 'sent'
          ? 'Images sent'
          : status === 'sending'
            ? 'Sending images'
            : ''}
      </span>
    </div>
  );
}

const initialTransactions = [
  { name: 'Selene', currency: 'Ethereum', amount: '$69.00', color: '#7776d9' },
  { name: 'Marina', currency: 'DogeCoin', amount: '$420.00', color: '#c2a65a' },
  {
    name: 'Margarot',
    currency: 'DogeCoin',
    amount: '$24.00',
    color: '#c2a65a',
  },
  { name: 'Kelly', currency: 'DogeCoin', amount: '$96.00', color: '#c2a65a' },
];
export function Transactions() {
  const [queue, setQueue] = useState(initialTransactions);
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  useActiveInterval(
    () => setQueue((current) => current.slice(1)),
    1800,
    processing && queue.length > 0,
    false,
  );
  useEffect(() => {
    if (queue.length === 0) setProcessing(false);
  }, [queue.length]);
  const reset = () => {
    setQueue(initialTransactions);
    setProcessing(false);
  };
  return (
    <div className="transactions-demo">
      <div className="transaction-header">
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          Pending Transactions <span className="mono">{queue.length}</span>
          <ChevronDown
            size={15}
            style={{ transform: open ? 'rotate(180deg)' : '' }}
          />
        </button>
      </div>
      <motion.div
        className="transaction-stack"
        animate={{
          height: queue.length ? (open ? queue.length * 66 : 90) : 104,
        }}
      >
        <AnimatePresence initial={false}>
          {queue.map((item, i) => (
            <motion.div
              layout
              key={item.name}
              className="transaction-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                y: open ? i * 66 : i * 8,
                scale: open ? 1 : 1 - i * 0.035,
                opacity: open ? 1 : 1 - i * 0.14,
              }}
              exit={{ x: 50, opacity: 0, scale: 0.9 }}
              style={{ zIndex: 10 - i }}
            >
              <div className="coin-icon" style={{ background: item.color }}>
                {item.currency === 'Ethereum' ? '♦' : 'Ð'}
                <span>
                  <ArrowUpRight size={8} />
                </span>
              </div>
              <div>
                <span className="small muted">
                  Sending to <strong>{item.name}</strong>
                </span>
                <strong className="small">{item.currency}</strong>
              </div>
              <strong className="transaction-amount">{item.amount}</strong>
            </motion.div>
          ))}
        </AnimatePresence>
        {queue.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="transactions-done"
          >
            <CircleCheck size={22} />
            <span>All caught up.</span>
          </motion.div>
        )}
      </motion.div>
      <div className="transaction-actions">
        {queue.length > 0 ? (
          <button
            className="text-button"
            onClick={() => {
              setProcessing(!processing);
              setOpen(true);
            }}
          >
            {processing ? 'Pause processing' : 'Process queue'}
            {processing ? <Pause size={11} /> : <ArrowUpRight size={11} />}
          </button>
        ) : (
          <button className="text-button" onClick={reset}>
            Replay transactions
          </button>
        )}
      </div>
      <span className="sr-only" role="status">
        {queue.length} transactions pending
      </span>
    </div>
  );
}

export function DynamicIsland() {
  const [tab, setTab] = useState('Default');
  const [playing, setPlaying] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useActiveInterval(
    () => setSeconds((n) => n + 1),
    1000,
    tab === 'Call' && !callEnded,
    false,
  );
  const change = (value: string) => {
    setTab(value);
    setCallEnded(false);
    setSeconds(0);
  };
  return (
    <div className="dynamic-demo">
      <motion.div
        className={`dynamic-island island-${tab.toLowerCase()}`}
        layout
        style={{
          width: tab === 'Default' ? 126 : tab === 'Calendar' ? 310 : 290,
          height: tab === 'Default' ? 44 : tab === 'Calendar' ? 145 : 94,
        }}
        transition={spring}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + String(callEnded)}
            className="island-content"
            initial={{ opacity: 0, filter: 'blur(5px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(5px)', y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'Default' ? (
              <span className="island-explore mono">
                <Sparkles size={12} />
                Explore
              </span>
            ) : tab === 'Call' ? (
              <>
                <span className="caller-avatar">A</span>
                <div className="island-copy">
                  <strong>{callEnded ? 'Call ended' : 'Abil'}</strong>
                  <span>
                    {callEnded
                      ? 'Talk soon.'
                      : `0${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}
                  </span>
                </div>
                <IconButton
                  label={callEnded ? 'Call again' : 'End call'}
                  className={callEnded ? 'call-again' : 'end-call'}
                  onClick={() => {
                    setCallEnded(!callEnded);
                    setSeconds(0);
                  }}
                >
                  <Phone size={17} />
                </IconButton>
              </>
            ) : tab === 'Calendar' ? (
              <div className="island-calendar">
                <span className="eyebrow">Up next · in 10 min</span>
                <strong>Make something good.</strong>
                <span className="small muted">
                  Design exploration · 30 minutes
                </span>
                <div>
                  <span className="calendar-attendee">A</span>
                  <span className="calendar-attendee">E</span>
                  <span className="small muted">You + 1</span>
                </div>
              </div>
            ) : (
              <>
                <img
                  className="island-album"
                  src="/images/saku.jpg"
                  alt="Saku album artwork"
                  loading="lazy"
                />
                <div className="island-copy">
                  <strong>Saku</strong>
                  <span>Susumu Yokota</span>
                </div>
                <IconButton
                  label={playing ? 'Pause music preview' : 'Play music preview'}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? <Pause size={18} /> : <Play size={18} />}
                </IconButton>
                <span
                  className={`music-bars ${playing ? 'playing' : ''}`}
                  aria-hidden="true"
                >
                  {[0, 1, 2].map((i) => (
                    <i key={i} style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <Choices
        options={['Default', 'Call', 'Calendar', 'Music']}
        value={tab}
        onChange={change}
        label="Dynamic Island mode"
      />
    </div>
  );
}
