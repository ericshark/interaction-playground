import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowUpRight,
  Ban,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  GitCommitHorizontal,
  LoaderCircle,
  Music2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Choices, Replay, spring, useActivity } from '../core';
import { playSound } from '../sound';

export function Toolbar() {
  const [tab, setTab] = useState('Commit');
  const [expanded, setExpanded] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const change = (value: string) => {
    setTab(value);
    setExpanded(false);
  };
  return (
    <div className="toolbar-demo">
      <motion.div
        layout
        className={`toolbar-surface ${expanded ? 'expanded' : ''}`}
        transition={spring}
        style={{
          width: expanded
            ? 280
            : tab === 'Commit'
              ? 176
              : tab === 'Analytics'
                ? 206
                : 190,
        }}
      >
        <button
          className="toolbar-summary"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {tab === 'Commit' ? (
            <>
              <GitCommitHorizontal size={19} className="rose" />
              <span className="mono">f4a9c7b</span>
              <span className="status-chip rose">Error</span>
            </>
          ) : tab === 'Analytics' ? (
            <>
              <Activity size={17} className="green" />
              <span>45 active users</span>
              <span className="status-chip">View</span>
            </>
          ) : (
            <>
              <Sparkles size={17} className="amber" />
              <span>{upgraded ? 'Pro workspace' : 'Unlock more'}</span>
              <span className="status-chip">
                {upgraded ? 'Pro' : 'Upgrade'}
              </span>
            </>
          )}
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="toolbar-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {tab === 'Commit' ? (
                <>
                  <span className="eyebrow rose">Build failed</span>
                  <p>One small fix away.</p>
                  <code>
                    src/app.tsx:12
                    <br />
                    Missing return statement
                  </code>
                  <span className="muted small">main · just now</span>
                </>
              ) : tab === 'Analytics' ? (
                <>
                  <span className="eyebrow">Last 24 hours</span>
                  <div className="metric">
                    <strong>1,284</strong>
                    <span className="green">↗ 12.8%</span>
                  </div>
                  <div
                    className="mini-chart"
                    aria-label="Traffic trending upwards"
                  >
                    {[25, 36, 31, 48, 39, 55, 62, 49, 67, 79, 70, 90].map(
                      (n, i) => (
                        <i key={i} style={{ height: n + '%' }} />
                      ),
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span className="eyebrow">A little more possibility</span>
                  <p>Make room for your next idea.</p>
                  <button
                    className="primary-button"
                    onClick={() => setUpgraded(true)}
                  >
                    {upgraded ? (
                      <>
                        <Check size={13} />
                        Pro enabled
                      </>
                    ) : (
                      <>
                        Try Pro <ArrowUpRight size={13} />
                      </>
                    )}
                  </button>
                  <span className="muted small">
                    Interactive preview · no purchase
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <Choices
        options={['Commit', 'Analytics', 'Upgrade']}
        value={tab}
        onChange={change}
        label="Toolbar mode"
      />
    </div>
  );
}

const notices = [
  {
    title: 'Deploy failed',
    description: 'Build encountered critical errors during compilation…',
    time: '2 hours ago',
    Icon: CircleX,
    color: 'rose',
  },
  {
    title: 'Building',
    description: 'Your application is currently being built and tested…',
    time: '5 minutes ago',
    Icon: LoaderCircle,
    color: 'amber',
  },
  {
    title: 'Deployed',
    description: 'Successfully deployed to production environment…',
    time: '12 minutes ago',
    Icon: CircleCheck,
    color: 'green',
  },
  {
    title: 'Testing',
    description: 'Running automated tests and quality checks…',
    time: '18 minutes ago',
    Icon: Activity,
    color: 'blue',
  },
  {
    title: 'Queued',
    description: 'Waiting for available build resources to start…',
    time: '25 minutes ago',
    Icon: Clock3,
    color: 'violet',
  },
  {
    title: 'Cancelled',
    description: 'Deployment was cancelled by user request…',
    time: '1 hour ago',
    Icon: Ban,
    color: 'muted',
  },
];
export function Notifications() {
  const [replay, setReplay] = useState(0);
  const [selected, setSelected] = useState(5);
  const [entering, setEntering] = useState(true);
  const { active } = useActivity();
  useEffect(() => {
    if (!active) {
      setEntering(true);
      return;
    }
    const timer = window.setTimeout(() => setEntering(false), 1100);
    return () => window.clearTimeout(timer);
  }, [active, replay]);
  const lift = { type: 'spring' as const, stiffness: 380, damping: 28 };
  return (
    <div className="notification-demo">
      <Replay
        onClick={() => {
          setReplay(replay + 1);
          setSelected(5);
          setEntering(true);
        }}
      />
      <div className="notification-stack" key={replay}>
        {notices.map(({ title, description, time, Icon, color }, i) => {
          const depth = (selected - i + notices.length) % notices.length;
          const rest = { x: -depth * 26, y: -depth * 33, rotate: -7 };
          return (
            <motion.button
              key={title}
              className="notification-card"
              aria-label={`Inspect ${title} notification`}
              aria-pressed={selected === i}
              initial={{ opacity: 0, y: 140, x: 0, rotate: -7 }}
              animate={
                active
                  ? { ...rest, opacity: 1, scale: 1 }
                  : { opacity: 0, y: 140, rotate: -7 }
              }
              whileHover={{
                ...rest,
                y: rest.y - 30,
                scale: 1.015,
                transition: lift,
              }}
              whileFocus={{
                ...rest,
                y: rest.y - 30,
                scale: 1.015,
                transition: lift,
              }}
              whileTap={{ scale: 0.985, transition: lift }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 26,
                delay: entering ? (notices.length - 1 - i) * 0.07 : 0,
              }}
              style={
                {
                  zIndex: 10 - depth,
                  '--depth': depth,
                } as CSSProperties
              }
              onClick={() => {
                if (selected !== i) playSound('pop');
                setSelected(i);
              }}
            >
              <strong>
                <span className={`notice-badge ${color}`}>
                  <Icon size={12} strokeWidth={2.4} />
                </span>
                {title}
              </strong>
              <p>{description}</p>
              <span>{time}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="demo-hint notification-hint">
        Hover to lift a card, click to bring it forward
      </p>
    </div>
  );
}

const agents = [
  { name: 'Nova', role: 'Advisor', color: '#7b8a6b', glyph: '◢◤' },
  { name: 'Sage', role: 'Oracle', color: '#b695c0', glyph: '◥◣' },
  { name: 'Athena', role: 'Librarian', color: '#d7ac6d', glyph: '◢◤' },
];
export function Agents() {
  const [replay, setReplay] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const { active, reduced } = useActivity();
  return (
    <div className="agents-demo">
      <Replay
        onClick={() => {
          setReplay(replay + 1);
          setSelected(null);
        }}
      />
      <h3>
        Your Agents,
        <br />
        ready to assist.
      </h3>
      <div className="agents-stage" key={replay}>
        {agents.map((agent, i) => (
          <motion.button
            key={agent.name}
            className={`agent-card ${selected === agent.name ? 'selected' : ''}`}
            aria-label={`Select ${agent.name}, ${agent.role}`}
            aria-pressed={selected === agent.name}
            initial={{ opacity: 0, y: 95, rotate: 0 }}
            animate={
              active
                ? {
                    opacity: 1,
                    y: selected === agent.name ? -22 : i === 1 ? -12 : 0,
                    rotate: selected === agent.name ? 0 : (i - 1) * -7,
                  }
                : { opacity: 0, y: 95, rotate: 0 }
            }
            transition={{ ...spring, delay: reduced ? 0 : i * 0.22 + 0.35 }}
            onClick={() =>
              setSelected(selected === agent.name ? null : agent.name)
            }
          >
            <div className="agent-meta">
              <span>{agent.name}</span>
              <span className="agent-status">
                <i />
                Active
              </span>
            </div>
            <div className="agent-symbol" style={{ color: agent.color }}>
              {agent.glyph}
              <br />
              {agent.glyph.split('').reverse().join('')}
            </div>
            <span className="muted small">{agent.role}</span>
          </motion.button>
        ))}
      </div>
      <p className="agent-caption" aria-live="polite">
        {selected
          ? `${selected} is ready. What are we making?`
          : 'A little intelligence. A lot of possibility.'}
      </p>
    </div>
  );
}

const stages = [
  {
    name: 'Publishing',
    text: 'Preparing and releasing the book to the public.',
  },
  {
    name: 'Editing',
    text: 'Revising and refining the manuscript to improve quality and readability.',
  },
  {
    name: 'Writing',
    text: 'Drafting the manuscript based on the outline and research.',
  },
  {
    name: 'Outlining',
    text: "Structuring the book's content and creating a detailed plan.",
  },
  {
    name: 'Pre-writing',
    text: 'Generating ideas, conducting research, and gathering materials for the book.',
  },
];
export function InfoReveal() {
  const [selected, setSelected] = useState(4);
  return (
    <div className="info-reveal">
      {stages.map((stage, i) => {
        const depth = (i - selected + 5) % 5;
        return (
          <motion.button
            key={stage.name}
            className="reveal-sheet"
            aria-label={`Stage ${i + 1}: ${stage.name}`}
            aria-pressed={selected === i}
            animate={{
              x: depth * 28,
              y: -depth * 28,
              backgroundColor:
                depth === 0
                  ? '#e5e5e5'
                  : `rgb(${246 + depth},${246 + depth},${246 + depth})`,
            }}
            style={{ zIndex: 10 - depth }}
            onClick={() => setSelected(i)}
            transition={spring}
          >
            <strong>{stage.name}</strong>
            <AnimatePresence mode="wait">
              {selected === i && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {stage.text}
                </motion.p>
              )}
            </AnimatePresence>
            <span className="sheet-index mono">0{i + 1}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

const songs = [
  { id: 'saku', name: 'Saku', artist: 'Susumu Yokota', duration: '5:46' },
  {
    id: 'enough',
    name: 'Enough',
    artist: 'Fred again.. & Brian Eno',
    duration: '5:23',
  },
  { id: 'tropiq', name: 'Tropiq', artist: 'I:Cube', duration: '4:25' },
];
export function HoldToDelete() {
  const [tracks, setTracks] = useState(songs);
  const [holding, setHolding] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const { active } = useActivity();
  const frame = useRef(0);
  useEffect(() => {
    if (!holding || !active) {
      setProgress(0);
      if (!active) setHolding(null);
      return;
    }
    const start = performance.now();
    let notch = 0;
    const tick = (time: number) => {
      const value = Math.min((time - start) / 1100, 1);
      setProgress(value);
      if (value >= (notch + 1) / 6 && value < 1) {
        notch++;
        playSound('tick', 0.7 + notch * 0.12);
      }
      if (value === 1) {
        playSound('delete');
        setTracks((current) => current.filter((track) => track.id !== holding));
        setMessage(
          `${songs.find((track) => track.id === holding)?.name} removed`,
        );
        setHolding(null);
      } else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [holding, active]);
  const cancel = () => setHolding(null);
  return (
    <div className="playlist">
      <div className="playlist-heading">
        <Music2 size={14} />
        <span>AlgoRHYTHMS</span>
      </div>
      <div className="track-list">
        <AnimatePresence initial={false}>
          {tracks.map((track) => (
            <motion.button
              layout
              key={track.id}
              className={`track ${holding === track.id ? 'holding' : ''}`}
              aria-label={`Hold to delete ${track.name}`}
              style={{ touchAction: 'pan-y' }}
              exit={{
                opacity: 0,
                x: 50,
                height: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setHolding(track.id);
              }}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              onBlur={cancel}
              onKeyDown={(event) => {
                if (
                  (event.key === ' ' || event.key === 'Enter') &&
                  !event.repeat
                ) {
                  event.preventDefault();
                  setHolding(track.id);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault();
                  cancel();
                }
              }}
            >
              <span
                className="delete-progress"
                style={{
                  transform: `scaleX(${holding === track.id ? progress : 0})`,
                }}
              />
              <img src={`/images/${track.id}.jpg`} alt="" loading="lazy" />
              <span className="track-info">
                <strong>{track.name}</strong>
                <span>{track.artist}</span>
              </span>
              <span className="track-duration mono">
                {holding === track.id ? 'Hold…' : track.duration}
              </span>
              <Trash2 size={15} className="track-delete" />
            </motion.button>
          ))}
        </AnimatePresence>
        {tracks.length === 0 && (
          <div className="empty-playlist">
            <Check size={20} />
            <p>A clean slate.</p>
          </div>
        )}
      </div>
      <div className="playlist-footer">
        <span className="demo-hint">Press and hold a track to delete</span>
        <button
          className="text-button"
          onClick={() => {
            cancel();
            setTracks(songs);
            setMessage('Playlist reset');
          }}
        >
          Reset playlist
        </button>
      </div>
      <span className="sr-only" role="status">
        {message}
      </span>
    </div>
  );
}
