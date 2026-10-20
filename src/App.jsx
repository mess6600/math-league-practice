import { useMemo, useState } from 'react'
import { sets as baseSets } from './data/sets.js'
import { focusSets } from './data/focusSets.js'
import { contestDate } from './data/meta.js'
import { getProfile } from './data/profiles.js'
import { getSession, login, logout } from './auth.js'
import { loadProgress, progressStats, clearProgress } from './progress.js'
import { visibleAdaptiveSets } from './coach/catalog.js'
import { SKILLS } from './coach/skills.js'
import { rankedSkills } from './coach/progressMath.js'
import {
  NumberSensePractice,
  SprintPractice,
  TargetPractice,
} from './PracticeSession.jsx'

const sets = [...focusSets, ...baseSets]

function resolveSet(setId, progress) {
  return (
    progress?.generatedSets?.[setId] ||
    sets.find((s) => s.id === setId) ||
    null
  )
}

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
          <p className="lead" style={{ marginTop: '1rem', marginBottom: 0 }}>
            {visibleAdaptiveSets(progress, session.username).coach.message}
          </p>
        </>
      ) : (
        <>
          <p className="lead">Ready for {contestDate}. Open Practice to begin.</p>
          <p className="lead">{visibleAdaptiveSets(progress, session.username).coach.message}</p>
        </>
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

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>Skill map (coach)</h3>
      <p className="lead">Weak skills get more practice. Strong skills get light revision.</p>
      <ul className="skill-list">
        {rankedSkills(progress).map((s) => (
          <li key={s.id}>
            <span>{SKILLS[s.id]?.label || s.id}</span>
            <span className={`skill-band ${s.band}`}>{s.band}</span>
            <div className="skill-bar"><div style={{ width: `${s.score}%` }} /></div>
            <span className="muted">{s.score}</span>
          </li>
        ))}
      </ul>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>Best scores</h3>
      {bests.length === 0 ? (
        <p className="lead">No scores yet — finish a set and hit Submit to save.</p>
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

function SetCard({ s, progress, recommended, onPick, badge }) {
  const best = progress.bestBySet?.[s.id]
  return (
    <div className="set-card">
      <div className="kind">
        {s.type.replace('-', ' ')}
        {recommended ? ' · recommended' : ''}
        {badge ? ` · ${badge}` : ''}
      </div>
      <div className="name">{s.title}</div>
      <div className="meta">
        {s.type === 'number-sense' && `${s.problems.length} problems`}
        {s.type === 'sprint' && `${s.problems.length} questions`}
        {s.type === 'target' && `${s.pairs.length} pairs`}
        {best ? ` · best ${best.score}` : ''}
      </div>
      <button type="button" className="btn btn-primary start-btn" onClick={() => onPick(s)}>
        Start
      </button>
    </div>
  )
}

function PracticePicker({ onPick, progress, session }) {
  const profile = getProfile(session.username)
  const adaptive = useMemo(
    () => visibleAdaptiveSets(progress, session.username, focusSets),
    [progress, session.username]
  )

  const groups = useMemo(() => {
    const g = { drill: [], 'number-sense': [], sprint: [], target: [] }
    for (const s of baseSets) {
      if (g[s.group]) g[s.group].push(s)
    }
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
      <p className="lead">{adaptive.coach.message}</p>
      {progress.lastUnlock && (
        <div className="unlock-banner" style={{ marginBottom: '1rem' }}>
          <strong>Recently unlocked:</strong> {progress.lastUnlock.title}
        </div>
      )}

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
        ⭐ For you, {session.displayName}
      </h3>
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        {adaptive.seeds.map((s) => (
          <SetCard
            key={s.id}
            s={s}
            progress={progress}
            recommended={profile?.recommendedIds?.includes(s.id)}
            onPick={onPick}
            badge="level 1"
          />
        ))}
        {adaptive.generated.map((s) => (
          <SetCard
            key={s.id}
            s={s}
            progress={progress}
            recommended
            onPick={onPick}
            badge={`unlocked · L${s.level}`}
          />
        ))}
      </div>

      {sections.map((sec) => (
        <div key={sec.key} style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', margin: '0 0 0.55rem' }}>
            {sec.title}
          </h3>
          <div className="grid">
            {(groups[sec.key] || []).map((s) => (
              <SetCard key={s.id} s={s} progress={progress} onPick={onPick} />
            ))}
          </div>
        </div>
      ))}
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
          onStartUnlocked={(s) => openSet(s)}
        />
      )}
      {active?.type === 'sprint' && (
        <SprintPractice
          setData={active}
          onBack={() => setActive(null)}
          username={session.username}
          onSaved={refreshProgress}
          onStartUnlocked={(s) => openSet(s)}
        />
      )}
      {active?.type === 'target' && (
        <TargetPractice
          setData={active}
          onBack={() => setActive(null)}
          username={session.username}
          onSaved={refreshProgress}
          onStartUnlocked={(s) => openSet(s)}
        />
      )}

      <p className="footnote">
        Original practice for family use. Not affiliated with mathleague.org.
        Coach adapts to each student · progress saved on this device.
      </p>
    </div>
  )
}
