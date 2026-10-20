import { useEffect, useMemo, useState } from 'react'
import { sets as baseSets } from './data/sets.js'
import { focusSets } from './data/focusSets.js'
import { answers } from './data/answers.js'
import { contestDate } from './data/meta.js'
import { getProfile } from './data/profiles.js'
import { getSession, login, logout } from './auth.js'
import { loadProgress, recordAttempt, progressStats, clearProgress } from './progress.js'

const sets = [...focusSets, ...baseSets]

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'practice', label: 'Practice' },
  { id: 'progress', label: 'My Progress' },
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
}

function answersMatch(user, correct) {
  if (!user || !correct) return false
  const u = normalize(user)
  const c = normalize(correct)
  if (u === c) return true
  const un = Number(u.replace(/\$/g, ''))
  const cn = Number(c.replace(/\$/g, '').split('(')[0])
  if (!Number.isNaN(un) && !Number.isNaN(cn) && Math.abs(un - cn) < 0.011) return true
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
  return { left, label: `${mm}:${ss}` }
}

function TimerBadge({ seconds, running }) {
  const { left, label } = useCountdown(seconds, running)
  return <div className={`timer ${left <= 60 && running ? 'warn' : ''}`}>{label}</div>
}

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const result = login(username, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onLogin(result.session)
  }

  return (
    <div className="app">
      <header className="hero">
        <h1 className="brand">Math League Practice</h1>
        <p>Sign in to save your scores and track practice through {contestDate}.</p>
      </header>
      <form className="panel login-panel" onSubmit={submit}>
        <h2>Student login</h2>
        <p className="lead">Each twin has their own account so progress stays separate.</p>
        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Amrit or Mohit"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          Sign in
        </button>
      </form>
    </div>
  )
}

function Home({ session, progress, onOpen }) {
  const stats = progressStats(progress)
  const profile = getProfile(session.username)
  const s = profile?.scores

  return (
    <div className="panel">
      <h2>Hi, {session.displayName}!</h2>
      {profile ? (
        <>
          <p className="lead">
            From your last qualifier ({profile.meet}): Number Sense <strong>{s.numberSense}</strong> ({s.nsRank}),
            Target <strong>{s.target}</strong> ({s.targetRank}), Sprint <strong>{s.sprint}</strong> ({s.sprintRank}),
            Individual <strong>{s.individual}</strong> ({s.individualRank}).
            Next contest: {contestDate}.
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '1rem' }}>
            Your focus (from that scoresheet)
          </h3>
          <div className="grid" style={{ marginBottom: '1rem' }}>
            {profile.focus.map((f) => (
              <div key={f.title} className="set-card">
                <div className="kind">Focus</div>
                <div className="name">{f.title}</div>
                <div className="meta">{f.why}</div>
                <button
                  type="button"
                  className="btn btn-primary start-btn"
                  onClick={() => {
                    const set = sets.find((x) => x.id === f.sets[0])
                    if (set) onOpen(set)
                  }}
                >
                  Start
                </button>
              </div>
            ))}
          </div>
          <div className="grid">
            <div className="set-btn" style={{ cursor: 'default' }}>
              <div className="kind">Goals</div>
              <div className="name">NS {profile.goals.numberSense}+ · Sprint {profile.goals.sprint}+</div>
              <div className="meta">Target {profile.goals.target}+ · Ind {profile.goals.individual}+</div>
            </div>
            <div className="set-btn" style={{ cursor: 'default' }}>
              <div className="kind">Your log</div>
              <div className="name">{stats.attempts} attempts</div>
              <div className="meta">{stats.setsTried} sets tried</div>
            </div>
          </div>
        </>
      ) : (
        <p className="lead">Ready for {contestDate}. Open Practice to begin.</p>
      )}
    </div>
  )
}

function Schedule({ session }) {
  const profile = getProfile(session.username)
  const blocks = profile?.schedule?.length ? profile.schedule : SCHEDULE

  return (
    <div className="panel">
      <h2>{session.displayName}&apos;s schedule</h2>
      <p className="lead">
        Built from your Contest 12721 scoresheet. Contest day: Saturday, Nov 14.
      </p>
      <div className="schedule">
        {blocks.map((w) => (
          <div className="week" key={w.title}>
            <h3>{w.title}</h3>
            <ul>
              {w.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
        {profile && (
          <div className="week">
            <h3>Shared calendar (both twins)</h3>
            <ul>
              {SCHEDULE.flatMap((w) => w.items.slice(0, 2)).slice(0, 6).map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressPanel({ session, progress, onRefresh }) {
  const stats = progressStats(progress)
  const bests = Object.entries(progress.bestBySet || {}).sort((a, b) => b[1].score - a[1].score)

  return (
    <div className="panel">
      <h2>{session.displayName}&apos;s progress</h2>
      <p className="lead">
        {stats.attempts} scored attempts · {stats.setsTried} sets · Last active {formatWhen(stats.lastActive)}
      </p>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>Best scores</h3>
      {bests.length === 0 ? (
        <p className="lead">No scores yet — finish a set and hit Score to save.</p>
      ) : (
        <div className="grid" style={{ marginBottom: '1.2rem' }}>
          {bests.map(([setId, b]) => (
            <div key={setId} className="set-btn" style={{ cursor: 'default' }}>
              <div className="kind">{b.type?.replace('-', ' ')}</div>
              <div className="name">{b.title}</div>
              <div className="meta">Best {b.score} · {formatWhen(b.at)}</div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>Recent attempts</h3>
      {(progress.sessions || []).length === 0 ? (
        <p className="lead">Nothing saved yet.</p>
      ) : (
        <ul className="history-list">
          {progress.sessions.slice(0, 25).map((s) => (
            <li key={s.id}>
              <strong>{s.title}</strong>
              <span>Score {s.score}</span>
              <span className="muted">{s.detail}</span>
              <span className="muted">{formatWhen(s.at)}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginTop: '1rem' }}
        onClick={() => {
          if (window.confirm(`Clear all saved progress for ${session.displayName}?`)) {
            clearProgress(session.username)
            onRefresh()
          }
        }}
      >
        Clear my progress
      </button>
    </div>
  )
}

function PracticePicker({ onPick, progress, session }) {
  const profile = getProfile(session.username)
  const focusGroup = session.username === 'Amrit' ? 'focus-amrit' : session.username === 'Mohit' ? 'focus-mohit' : null

  const groups = useMemo(() => {
    const g = {
      focus: [],
      drill: [],
      'number-sense': [],
      sprint: [],
      target: [],
    }
    for (const s of sets) {
      if (focusGroup && s.group === focusGroup) g.focus.push(s)
      else if (s.group === 'drill') g.drill.push(s)
      else if (s.group === 'number-sense') g['number-sense'].push(s)
      else if (s.group === 'sprint') g.sprint.push(s)
      else if (s.group === 'target') g.target.push(s)
    }
    return g
  }, [focusGroup])

  const sections = [
    focusGroup && {
      key: 'focus',
      title: `⭐ For you, ${session.displayName} (from last scoresheet)`,
    },
    { key: 'drill', title: 'Number Sense Drills (8–10 min)' },
    { key: 'number-sense', title: 'Number Sense Sets (10 min)' },
    { key: 'sprint', title: 'Sprint Sets (40 min)' },
    { key: 'target', title: 'Target Sets (6 min × 4 pairs)' },
  ].filter(Boolean)

  return (
    <div className="panel">
      <h2>Choose a set</h2>
      <p className="lead">
        {profile
          ? `Start with your starred focus sets — they target what the scoresheet showed.`
          : `Timers match contest rules. Scores save when you hit Score.`}
      </p>
      {sections.map((sec) => (
        <div key={sec.key} style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', margin: '0 0 0.55rem' }}>
            {sec.title}
          </h3>
          <div className="grid">
            {(groups[sec.key] || []).map((s) => {
              const best = progress.bestBySet?.[s.id]
              const recommended = profile?.recommendedIds?.includes(s.id)
              return (
                <div key={s.id} className="set-card">
                  <div className="kind">
                    {s.type.replace('-', ' ')}
                    {recommended ? ' · recommended' : ''}
                  </div>
                  <div className="name">{s.title}</div>
                  <div className="meta">
                    {s.type === 'number-sense' && `${s.problems.length} problems`}
                    {s.type === 'sprint' && `${s.problems.length} questions`}
                    {s.type === 'target' && `${s.pairs.length} pairs`}
                    {best ? ` · best ${best.score}` : ''}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary start-btn"
                    onClick={() => onPick(s)}
                  >
                    Start
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function NumberSensePractice({ setData, onBack, username, onSaved }) {
  const seconds = 10 * 60
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
      if (answersMatch(a, key[p.n])) correct += 1
      else wrong += 1
    }
    const total = 5 * correct - 4 * wrong
    const detail = `${correct} correct · ${wrong} wrong through #${last}`
    setScored({ correct, wrong, last, total })
    recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail,
    })
    onSaved?.()
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
      <div className="submit-bar">
        <button type="button" className="btn btn-primary submit-btn" onClick={score}>
          Submit
        </button>
        <span className="submit-hint">Scores your answers and saves to your progress</span>
      </div>
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} wrong/blank through #{scored.last}
            {' '}· saved to your progress
          </div>
        </div>
      )}
    </div>
  )
}

function SprintPractice({ setData, onBack, username, onSaved }) {
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
    const total = 4 * correct - wrong
    const detail = `${correct} correct · ${wrong} wrong · ${skipped} skipped`
    setScored({ correct, wrong, skipped, total })
    recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail,
    })
    onSaved?.()
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
            {scored && !responses[p.n] && (
              <div style={{ color: 'var(--ink-soft)', marginTop: 6 }}>Skipped · answer {key[p.n]}</div>
            )}
          </div>
        )
      })}
      <div className="submit-bar">
        <button type="button" className="btn btn-primary submit-btn" onClick={score}>
          Submit
        </button>
        <span className="submit-hint">Scores your answers and saves to your progress</span>
      </div>
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} wrong · {scored.skipped} skipped · saved
          </div>
        </div>
      )}
    </div>
  )
}

function TargetPractice({ setData, onBack, username, onSaved }) {
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
    const total = correct * 10
    setScored({ correct, total })
    recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail: `${correct} / 8 correct`,
    })
    onSaved?.()
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
      <div className="submit-bar">
        <button type="button" className="btn btn-primary submit-btn" onClick={score}>
          Submit
        </button>
        <span className="submit-hint">Scores all pairs and saves to your progress</span>
      </div>
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>{scored.correct} / 8 correct · saved</div>
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
      <p className="lead">
        Goals vs last meet (NS 92 / Sprint 34 / Target 50 / Ind 107): NS 110+, Sprint 48+, Target 50–60,
        Individual 130+.
      </p>
      <div className="grid">
        {[
          { id: 'ns-3', kind: 'Round 1', name: 'Number Sense Set 3' },
          { id: 'sprint-3', kind: 'Round 2', name: 'Sprint Set 3' },
          { id: 'target-2', kind: 'Round 3', name: 'Target Set 2' },
        ].map((r) => (
          <div key={r.id} className="set-card">
            <div className="kind">{r.kind}</div>
            <div className="name">{r.name}</div>
            <button
              type="button"
              className="btn btn-primary start-btn"
              onClick={() => onOpen(sets.find((s) => s.id === r.id))}
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => getSession())
  const [tab, setTab] = useState('home')
  const [active, setActive] = useState(null)
  const [progress, setProgress] = useState(() =>
    session ? loadProgress(session.username) : loadProgress('')
  )

  function refreshProgress() {
    if (!session) return
    setProgress(loadProgress(session.username))
  }

  function openSet(s) {
    setActive(s)
    setTab('practice')
  }

  function handleLogout() {
    logout()
    setSession(null)
    setActive(null)
    setTab('home')
  }

  if (!session) {
    return (
      <LoginScreen
        onLogin={(s) => {
          setSession(s)
          setProgress(loadProgress(s.username))
        }}
      />
    )
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <h1 className="brand">Math League Practice</h1>
          <button type="button" className="btn btn-ghost logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <p>
          Signed in as <strong>{session.displayName}</strong> — countdown to {contestDate}.
        </p>
        <div className="hero-meta">
          <span className="chip">Twin {session.twin} · {session.displayName}</span>
          <span className="chip">Contest · Nov 14</span>
          <span className="chip">Progress saved on this device</span>
        </div>
      </header>

      <nav className="nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              (tab === t.id && !active) || (active && t.id === 'practice' && tab === 'practice')
                ? 'active'
                : ''
            }
            onClick={() => {
              setTab(t.id)
              if (t.id !== 'practice') setActive(null)
              if (t.id === 'practice') setActive(null)
              if (t.id === 'progress') refreshProgress()
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'home' && (
        <Home session={session} progress={progress} onOpen={openSet} />
      )}
      {tab === 'schedule' && <Schedule session={session} />}
      {tab === 'progress' && (
        <ProgressPanel session={session} progress={progress} onRefresh={refreshProgress} />
      )}
      {tab === 'mock' && !active && <MockContest onOpen={openSet} />}
      {tab === 'practice' && !active && (
        <PracticePicker onPick={setActive} progress={progress} session={session} />
      )}
      {active?.type === 'number-sense' && (
        <NumberSensePractice
          setData={active}
          onBack={() => setActive(null)}
          username={session.username}
          onSaved={refreshProgress}
        />
      )}
      {active?.type === 'sprint' && (
        <SprintPractice
          setData={active}
          onBack={() => setActive(null)}
          username={session.username}
          onSaved={refreshProgress}
        />
      )}
      {active?.type === 'target' && (
        <TargetPractice
          setData={active}
          onBack={() => setActive(null)}
          username={session.username}
          onSaved={refreshProgress}
        />
      )}

      <p className="footnote">
        Original practice for family use. Not affiliated with mathleague.org.
        Progress is stored per student on this browser/device.
      </p>
    </div>
  )
}
