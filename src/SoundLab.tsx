import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AudioLines, ChevronDown } from 'lucide-react';
import { usePreferences } from './core';
import {
  getSoundPack,
  previewSound,
  setSoundPack,
  soundPacks,
  type SoundKind,
} from './sound';

// Temporary tool for auditioning sound packs; remove once a pack is chosen.
const previews: [string, SoundKind][] = [
  ['Hover', 'hover'],
  ['Click', 'tap'],
  ['Toggle', 'toggle'],
  ['Pop', 'pop'],
  ['Success', 'success'],
  ['Delete', 'delete'],
  ['Whoosh', 'whoosh'],
];
const groups = ['Trackpad-like', 'Current', 'Experimental'] as const;

function readLabState() {
  try {
    return localStorage.getItem('playground:sound-lab');
  } catch {
    return null;
  }
}

export function SoundLab() {
  const [state, setState] = useState(readLabState);
  const [selected, setSelected] = useState(getSoundPack);
  const { sound } = usePreferences();
  // Automated tests set this flag so the floating bar never covers controls.
  if (state === 'hidden') return null;
  const open = state !== 'closed';
  const toggle = () => {
    const next = open ? 'closed' : 'open';
    setState(next);
    try {
      localStorage.setItem('playground:sound-lab', next);
    } catch {
      // Storage can be unavailable (private windows, blocked site data).
    }
  };
  const current = soundPacks.find((pack) => pack.id === selected)!;
  return (
    <motion.aside
      layout
      className={`sound-lab ${open ? 'open' : ''}`}
      aria-label="Sound lab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{ borderRadius: open ? 20 : 999 }}
    >
      <motion.button
        layout="position"
        className="sound-lab-toggle"
        aria-expanded={open}
        onClick={toggle}
      >
        <AudioLines size={14} />
        <span>
          Sound lab <em>temporary</em>
        </span>
        {open ? <ChevronDown size={14} /> : <small>{current.name}</small>}
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="sound-lab-body"
            data-sound-skip
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {groups.map((group) => (
              <div key={group} className="sound-lab-group">
                <span>{group}</span>
                <div role="group" aria-label={`${group} sound packs`}>
                  {soundPacks
                    .filter((pack) => pack.group === group)
                    .map((pack) => (
                      <button
                        key={pack.id}
                        aria-pressed={selected === pack.id}
                        title={pack.description}
                        onClick={() => {
                          setSoundPack(pack.id);
                          setSelected(pack.id);
                          previewSound('tap', pack.id);
                          if (pack.release)
                            window.setTimeout(
                              () => previewSound('release', pack.id),
                              110,
                            );
                        }}
                      >
                        {pack.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
            <p className="sound-lab-description">
              <strong>{current.name}:</strong> {current.description}
              {!sound && ' Page sounds are muted, but previews still play.'}
            </p>
            <div
              className="sound-lab-previews"
              role="group"
              aria-label="Preview sounds"
            >
              {previews.map(([label, kind]) => (
                <button key={kind} onClick={() => previewSound(kind)}>
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
