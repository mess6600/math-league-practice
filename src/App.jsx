import { useEffect, useMemo, useState } from 'react'
import { sets } from './data/sets.js'
import { answers } from './data/answers.js'
import { contestDate, baseline } from './data/meta.js'

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'practice', label: 'Practice' },
  { id: 'mock', label: 'Mock Contest' },
]

const SCHEDULE = [
  {
    title: 'Week 1 — Oct 20–26 · Number Sense habits',
    items: [
      'Mon: Drill A (8–10 min)',
      'Tue: Drill B',
      'Wed: Sprint Set 1 Q1–15 (20 min)',
      'Thu: Drill C',
      'Fri: Target Set 1 pairs 1–2',
      'Sat: Number Sense Set 1 + review',
    ],
  },
  {
    title: 'Week 2 — Oct 27–Nov 2 · Sprint skipping',
    items: [
      'Mon: Drill D',
      'Tue: Sprint Set 1 full (40 min)',
      'Wed: Drill E',
      'Thu: Target Set 1 all pairs',
      'Fri: Number Sense Set 2',
      'Sat: Sprint Set 2 + review',
    ],
  },
  {
    title: 'Week 3 — Nov 3–9 · Combine rounds',
    items: [
      'Mon: Number Sense Set 3',
      'Tue: Target Set 2',
      'Wed: Sprint Set 3',
      'Thu: Drill F (estimation)',
      'Fri: Target Set 3',
      'Sat: Mock Contest A',
      'Sun: Review Mock A only',
    ],
  },
  {
    title: 'Week 4 — Nov 10–14 · Taper',
    items: [
      'Mon: Number Sense Set 4',
      'Tue: Sprint Set 4',
      'Wed: Target Set 4',
      'Thu: Drill G (light)',
      'Fri: Rest',
      'Sat Nov 14: Contest day!',
    ],
  },
]

function normalize(s) {
  if (s == null) return ''
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/⅔/g, '2/3')
    .replace(/⅓/g, '1/3')
    .replace(/¼/g, '1/4')
    .replace(/½/g, '1/2')
    .replace(/¾/g, '3/4')
    .replace(/⅕/g, '1/5')
    .replace(/⅜/g, '3/8')
    .replace(/⅝/g, '5/8')
    .replace(/⅞/g, '7/8')
    .replace(/⅚/g, '5/6')
    .replace(/⅙/g, '1/6')
    .replace(/⅛/g, '1/8')
    .replace(/⅔/g, '2/3')
}

function answersMatch(user, correct) {
  if (!user || !correct) return false
  const u = normalize(user)
  const c = normalize(correct)
  if (u === c) return true
  // allow 7/3 vs 2⅓ style — if correct contains slash or decimal, try numeric
  const un = Number(u.replace(/\$/g, ''))
  const cn = Number(c.replace(/\$/g, '').split('(')[0])
  if (!Number.isNaN(un) && !Number.isNaN(cn) && Math.abs(un - cn) < 0.011) return true
  // estimate within 5% if both numeric
  if (!Number.isNaN(un) && !Number.isNaN(cn) && cn !== 0) {
    if (Math.abs(un - cn) / Math.abs(cn) <= 0.05) return true
  }
  return false
}

function useCountdown(seconds, running) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
  }, [seconds])
  useEffect(() => {
    if (!running) return undefined
    if (left <= 0) return undefined
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000)
    return () => clearInterval(t)
  }, [running, left])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return { left, label: `${mm}:${ss}`, reset: () => setLeft(seconds) }
}

function TimerBadge({ seconds, running }) {
  const { left, label } = useCountdown(seconds, running)
  return <div className={`timer ${left <= 60 && running ? 'warn' : ''}`}>{label}</div>
}

function Home() {
  return (
    <div className="panel">
      <h2>Ready for {contestDate}</h2>
      <p className="lead">
        Original practice in mathleague.org style — Number Sense, Sprint, and Target.
        Built around your last meet: Individual <strong>{baseline.individual}</strong>,
        Target <strong>{baseline.target}</strong>, Sprint <strong>{baseline.sprint}</strong>,
        Number Sense <strong>{baseline.numberSense}</strong>.
      </p>
      <div className="grid">
        <div className="set-btn" style={{ cursor: 'default' }}>
          <div className="kind">Focus</div>
          <div className="name">Number Sense stop-line</div>
          <div className="meta">Accuracy before going deep (−4 blanks hurt)</div>
        </div>
        <div className="set-btn" style={{ cursor: 'default' }}>
          <div className="kind">Focus</div>
          <div className="name">Sprint skipping</div>
          <div className="meta">Wrong −1 · Skip 0 · Guess less</div>
        </div>
        <div className="set-btn" style={{ cursor: 'default' }}>
          <div className="kind">Keep</div>
          <div className="name">Target strength</div>
          <div className="meta">You hit 5/8 — protect it</div>
        </div>
      </div>
      <p className="lead" style={{ marginTop: '1.2rem', marginBottom: 0 }}>
        Open <strong>Schedule</strong> for the day-by-day plan, or <strong>Practice</strong> to start a timed set.
      </p>
    </div>
  )
}

function Schedule() {
  return (
    <div className="panel">
      <h2>Practice schedule</h2>
      <p className="lead">Short daily sessions beat long cram nights. Contest: Saturday, Nov 14.</p>
      <div className="schedule">
        {SCHEDULE.map((w) => (
          <div className="week" key={w.title}>
            <h3>{w.title}</h3>
            <ul>
              {w.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PracticePicker({ onPick }) {
  const groups = useMemo(() => {
    const g = { drill: [], 'number-sense': [], sprint: [], target: [] }
    for (const s of sets) g[s.group]?.push(s)
    return g
  }, [])

  const sections = [
    { key: 'drill', title: 'Number Sense Drills (8–10 min)' },
    { key: 'number-sense', title: 'Number Sense Sets (10 min)' },
    { key: 'sprint', title: 'Sprint Sets (40 min)' },
    { key: 'target', title: 'Target Sets (6 min × 4 pairs)' },
  ]

  return (
    <div className="panel">
      <h2>Choose a set</h2>
      <p className="lead">Timers match contest rules. Answers stay hidden until you score.</p>
      {sections.map((sec) => (
        <div key={sec.key} style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', margin: '0 0 0.55rem' }}>
            {sec.title}
          </h3>
          <div className="grid">
            {groups[sec.key].map((s) => (
              <button key={s.id} type="button" className="set-btn" onClick={() => onPick(s)}>
                <div className="kind">{s.type.replace('-', ' ')}</div>
                <div className="name">{s.title}</div>
                <div className="meta">
                  {s.type === 'number-sense' && `${s.problems.length} problems`}
                  {s.type === 'sprint' && `${s.problems.length} questions`}
                  {s.type === 'target' && `${s.pairs.length} pairs`}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NumberSensePractice({ setData, onBack }) {
  const seconds = setData.problems.length <= 20 ? 10 * 60 : 10 * 60
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const key = answers[setData.id] || {}

  function score() {
    let correct = 0
    let wrong = 0
    let last = 0
    for (const p of setData.problems) {
      const a = responses[p.n]
      if (a != null && String(a).trim() !== '') last = Math.max(last, p.n)
    }
    for (const p of setData.problems) {
      if (p.n > last) break
      const a = responses[p.n]
      const ok = answersMatch(a, key[p.n])
      if (ok) correct += 1
      else wrong += 1
    }
    const total = 5 * correct - 4 * wrong
    setScored({ correct, wrong, last, total })
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <TimerBadge seconds={seconds} running={running} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(true)}>Start</button>
          ) : (
            <button type="button" className="btn btn-coral" onClick={() => setRunning(false)}>Pause</button>
          )}
          <button type="button" className="btn btn-primary" onClick={score}>Score</button>
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">Mental only · +5 correct · −4 wrong/blank through last attempt · estimates within 5%</p>
      {setData.problems.map((p) => {
        const marked = scored
          ? p.n <= scored.last
            ? answersMatch(responses[p.n], key[p.n])
              ? 'ok'
              : 'bad'
            : null
          : null
        return (
          <div className="problem" key={p.n}>
            <span className="num">{p.n}.</span>
            {p.q}
            {p.estimate && <span className="estimate-tag">estimate</span>}
            <div className="answer-row">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Answer"
                value={responses[p.n] || ''}
                onChange={(e) => setResponses((r) => ({ ...r, [p.n]: e.target.value }))}
              />
              {marked === 'ok' && <span className="mark-ok">✓ {key[p.n]}</span>}
              {marked === 'bad' && <span className="mark-bad">✗ {key[p.n]}</span>}
            </div>
          </div>
        )
      })}
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} wrong/blank through #{scored.last}
            {' '}· Individual NS credit: {Math.max(0, scored.total) / 4}
          </div>
        </div>
      )}
    </div>
  )
}

function SprintPractice({ setData, onBack }) {
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const key = answers[setData.id] || {}

  function score() {
    let correct = 0
    let wrong = 0
    let skipped = 0
    for (const p of setData.problems) {
      const a = responses[p.n]
      if (!a) {
        skipped += 1
        continue
      }
      if (a === key[p.n]) correct += 1
      else wrong += 1
    }
    setScored({ correct, wrong, skipped, total: 4 * correct - wrong })
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <TimerBadge seconds={40 * 60} running={running} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(true)}>Start</button>
          ) : (
            <button type="button" className="btn btn-coral" onClick={() => setRunning(false)}>Pause</button>
          )}
          <button type="button" className="btn btn-primary" onClick={score}>Score</button>
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">No calculator · +4 correct · −1 wrong · skip free · NOTA = none of the above</p>
      {setData.problems.map((p) => {
        const marked = scored && responses[p.n]
          ? responses[p.n] === key[p.n]
            ? 'ok'
            : 'bad'
          : null
        return (
          <div className="problem" key={p.n}>
            <span className="num">{p.n}.</span>
            {p.q}
            <div className="choices">
              {p.options.map((o) => {
                let cls = 'choice'
                if (responses[p.n] === o.key) cls += ' selected'
                if (scored) {
                  if (o.key === key[p.n]) cls += ' correct'
                  else if (responses[p.n] === o.key && o.key !== key[p.n]) cls += ' wrong'
                }
                return (
                  <button
                    key={o.key}
                    type="button"
                    className={cls}
                    onClick={() =>
                      setResponses((r) => ({
                        ...r,
                        [p.n]: r[p.n] === o.key ? undefined : o.key,
                      }))
                    }
                  >
                    {o.key}) {o.text}
                  </button>
                )
              })}
            </div>
            {marked === 'ok' && <div className="mark-ok">✓</div>}
            {marked === 'bad' && <div className="mark-bad">Correct: {key[p.n]}</div>}
            {scored && !responses[p.n] && <div style={{ color: 'var(--ink-soft)', marginTop: 6 }}>Skipped · answer {key[p.n]}</div>}
          </div>
        )
      })}
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} wrong · {scored.skipped} skipped
          </div>
        </div>
      )}
    </div>
  )
}

function TargetPractice({ setData, onBack }) {
  const [pairIndex, setPairIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const key = answers[setData.id] || {}
  const pair = setData.pairs[pairIndex]

  function score() {
    let correct = 0
    for (const p of setData.pairs) {
      for (const q of p.questions) {
        if (answersMatch(responses[q.n], key[q.n])) correct += 1
      }
    }
    setScored({ correct, total: correct * 10 })
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <TimerBadge seconds={6 * 60} running={running} key={pairIndex} />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(true)}>Start pair</button>
          ) : (
            <button type="button" className="btn btn-coral" onClick={() => setRunning(false)}>Pause</button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pairIndex === 0}
            onClick={() => {
              setPairIndex((i) => i - 1)
              setRunning(false)
            }}
          >
            Prev pair
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pairIndex >= setData.pairs.length - 1}
            onClick={() => {
              setPairIndex((i) => i + 1)
              setRunning(false)
            }}
          >
            Next pair
          </button>
          <button type="button" className="btn btn-primary" onClick={score}>Score all</button>
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">Calculator OK · 6 minutes per pair · +10 each · no penalty</p>
      <div className="pair-box">
        <h3>Pair {pair.pair} of {setData.pairs.length}</h3>
        {pair.questions.map((q) => (
          <div className="problem" key={q.n}>
            <span className="num">{q.n}.</span>
            {q.q}
            <div className="answer-row">
              <input
                type="text"
                value={responses[q.n] || ''}
                onChange={(e) => setResponses((r) => ({ ...r, [q.n]: e.target.value }))}
                placeholder="Answer"
              />
              {scored && (
                answersMatch(responses[q.n], key[q.n])
                  ? <span className="mark-ok">✓ {key[q.n]}</span>
                  : <span className="mark-bad">✗ {key[q.n]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>{scored.correct} / 8 correct</div>
        </div>
      )}
    </div>
  )
}

function MockContest({ onOpen }) {
  return (
    <div className="panel">
      <h2>Mock Contest A</h2>
      <p className="lead">Use Saturday, Nov 8. Same order as a real meet — short breaks between rounds.</p>
      <ol style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
        <li>Number Sense Set 3 — 10 minutes</li>
        <li>Break 5 minutes</li>
        <li>Sprint Set 3 — 40 minutes</li>
        <li>Break 5–10 minutes</li>
        <li>Target Set 2 — all 4 pairs</li>
      </ol>
      <p className="lead">Goals vs last meet (NS 92 / Sprint 34 / Target 50 / Ind 107): NS 110+, Sprint 48+, Target 50–60, Individual 130+.</p>
      <div className="grid">
        <button type="button" className="set-btn" onClick={() => onOpen(sets.find((s) => s.id === 'ns-3'))}>
          <div className="kind">Round 1</div>
          <div className="name">Number Sense Set 3</div>
        </button>
        <button type="button" className="set-btn" onClick={() => onOpen(sets.find((s) => s.id === 'sprint-3'))}>
          <div className="kind">Round 2</div>
          <div className="name">Sprint Set 3</div>
        </button>
        <button type="button" className="set-btn" onClick={() => onOpen(sets.find((s) => s.id === 'target-2'))}>
          <div className="kind">Round 3</div>
          <div className="name">Target Set 2</div>
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [active, setActive] = useState(null)

  function openSet(s) {
    setActive(s)
    setTab('practice')
  }

  return (
    <div className="app">
      <header className="hero">
        <h1 className="brand">Math League Practice</h1>
        <p>Original 5th-grade practice for Number Sense, Sprint &amp; Target — countdown to {contestDate}.</p>
        <div className="hero-meta">
          <span className="chip">Contest · Nov 14</span>
          <span className="chip">mathleague.org style</span>
          <span className="chip">Not official tests</span>
        </div>
      </header>

      <nav className="nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id && !active ? 'active' : tab === 'practice' && t.id === 'practice' && active ? 'active' : tab === t.id && t.id !== 'practice' ? 'active' : ''}
            onClick={() => {
              setTab(t.id)
              if (t.id !== 'practice') setActive(null)
              if (t.id === 'practice') setActive(null)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'home' && <Home />}
      {tab === 'schedule' && <Schedule />}
      {tab === 'mock' && !active && <MockContest onOpen={openSet} />}
      {tab === 'practice' && !active && <PracticePicker onPick={setActive} />}
      {active?.type === 'number-sense' && (
        <NumberSensePractice setData={active} onBack={() => setActive(null)} />
      )}
      {active?.type === 'sprint' && (
        <SprintPractice setData={active} onBack={() => setActive(null)} />
      )}
      {active?.type === 'target' && (
        <TargetPractice setData={active} onBack={() => setActive(null)} />
      )}

      <p className="footnote">
        Original practice questions for family use. Not affiliated with or copied from mathleague.org.
        For authentic past contests, buy from mathleague.org.
      </p>
    </div>
  )
}
