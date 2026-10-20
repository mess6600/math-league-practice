import { useEffect, useState } from 'react'
import { recordAttempt } from './progress.js'
import { getAnswerKey, getExplain, getItemSkill } from './coach/explain.js'

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

export function answersMatch(user, correct) {
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
    if (!running || left <= 0) return undefined
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

function ExplainBox({ text }) {
  if (!text) return null
  return (
    <div className="explain-box">
      <strong>How to get this right:</strong> {text}
    </div>
  )
}

function UnlockBanner({ newSet, onStart }) {
  if (!newSet) return null
  return (
    <div className="unlock-banner">
      <strong>New set unlocked!</strong>
      <div>{newSet.title} is ready — generated for your next practice.</div>
      <button type="button" className="btn btn-primary" onClick={() => onStart(newSet)}>
        Start {newSet.title}
      </button>
    </div>
  )
}

export function NumberSensePractice({ setData, onBack, username, onSaved, onStartUnlocked }) {
  const seconds = 10 * 60
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const [unlocked, setUnlocked] = useState(null)
  const key = getAnswerKey(setData)

  function score() {
    let correct = 0
    let wrong = 0
    let last = 0
    const itemResults = []
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
      itemResults.push({
        skill: getItemSkill(setData, p.n),
        result: ok ? 'right' : 'wrong',
      })
    }
    const total = 5 * correct - 4 * wrong
    const detail = `${correct} correct · ${wrong} wrong through #${last}`
    setScored({ correct, wrong, last, total })
    const { newSet } = recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail,
      itemResults,
      setData,
      responses,
    })
    setUnlocked(newSet)
    onSaved?.()
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <TimerBadge seconds={seconds} running={running} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(true)}>Start timer</button>
          ) : (
            <button type="button" className="btn btn-coral" onClick={() => setRunning(false)}>Pause</button>
          )}
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">Mental only · +5 correct · −4 wrong/blank through last attempt · estimates within 5%</p>
      {setData.problems.map((p) => {
        const marked =
          scored && p.n <= scored.last
            ? answersMatch(responses[p.n], key[p.n])
              ? 'ok'
              : 'bad'
            : null
        return (
          <div className={`problem ${marked === 'bad' ? 'problem-wrong' : ''} ${marked === 'ok' ? 'problem-right' : ''}`} key={p.n}>
            <span className="num">{p.n}.</span>
            {p.q}
            {p.estimate && <span className="estimate-tag">estimate</span>}
            <div className="answer-row">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Answer"
                value={responses[p.n] || ''}
                disabled={!!scored}
                onChange={(e) => setResponses((r) => ({ ...r, [p.n]: e.target.value }))}
              />
              {marked === 'ok' && <span className="mark-ok">✓ Correct ({key[p.n]})</span>}
              {marked === 'bad' && <span className="mark-bad">✗ Correct: {key[p.n]}</span>}
            </div>
            {marked === 'bad' && <ExplainBox text={getExplain(setData, p.n, key[p.n])} />}
          </div>
        )
      })}
      {!scored && (
        <div className="submit-bar">
          <button type="button" className="btn btn-primary submit-btn" onClick={score}>Submit</button>
          <span className="submit-hint">See what’s right/wrong, save progress, unlock more practice</span>
        </div>
      )}
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} incorrect through #{scored.last} · skills updated
          </div>
        </div>
      )}
      <UnlockBanner newSet={unlocked} onStart={onStartUnlocked} />
    </div>
  )
}

export function SprintPractice({ setData, onBack, username, onSaved, onStartUnlocked }) {
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const [unlocked, setUnlocked] = useState(null)
  const key = getAnswerKey(setData)

  function score() {
    let correct = 0
    let wrong = 0
    let skipped = 0
    const itemResults = []
    for (const p of setData.problems) {
      const a = responses[p.n]
      const skill = getItemSkill(setData, p.n)
      if (!a) {
        skipped += 1
        itemResults.push({ skill, result: 'skip' })
        continue
      }
      if (a === key[p.n]) {
        correct += 1
        itemResults.push({ skill, result: 'right' })
      } else {
        wrong += 1
        itemResults.push({ skill, result: 'wrong' })
      }
    }
    const total = 4 * correct - wrong
    setScored({ correct, wrong, skipped, total })
    const { newSet } = recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail: `${correct} correct · ${wrong} wrong · ${skipped} skipped`,
      itemResults,
      setData,
      responses,
    })
    setUnlocked(newSet)
    onSaved?.()
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <TimerBadge seconds={40 * 60} running={running} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {!running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(true)}>Start timer</button>
          ) : (
            <button type="button" className="btn btn-coral" onClick={() => setRunning(false)}>Pause</button>
          )}
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">No calculator · +4 correct · −1 wrong · skip free</p>
      {setData.problems.map((p) => {
        const marked = scored
          ? !responses[p.n]
            ? 'skip'
            : responses[p.n] === key[p.n]
              ? 'ok'
              : 'bad'
          : null
        return (
          <div className={`problem ${marked === 'bad' ? 'problem-wrong' : ''} ${marked === 'ok' ? 'problem-right' : ''}`} key={p.n}>
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
                    disabled={!!scored}
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
            {marked === 'ok' && <div className="mark-ok">✓ Correct</div>}
            {marked === 'bad' && <div className="mark-bad">✗ Correct: {key[p.n]}</div>}
            {marked === 'skip' && <div style={{ color: 'var(--ink-soft)', marginTop: 6 }}>Skipped · answer {key[p.n]}</div>}
            {marked === 'bad' && <ExplainBox text={getExplain(setData, p.n, key[p.n])} />}
            {marked === 'skip' && (
              <ExplainBox text={`You skipped — that’s OK on Sprint (0 points). Correct was ${key[p.n]}. ${getExplain(setData, p.n, key[p.n])}`} />
            )}
          </div>
        )
      })}
      {!scored && (
        <div className="submit-bar">
          <button type="button" className="btn btn-primary submit-btn" onClick={score}>Submit</button>
          <span className="submit-hint">See what’s right/wrong, save progress, unlock more practice</span>
        </div>
      )}
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>
            {scored.correct} correct · {scored.wrong} wrong · {scored.skipped} skipped · skills updated
          </div>
        </div>
      )}
      <UnlockBanner newSet={unlocked} onStart={onStartUnlocked} />
    </div>
  )
}

export function TargetPractice({ setData, onBack, username, onSaved, onStartUnlocked }) {
  const [pairIndex, setPairIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState({})
  const [scored, setScored] = useState(null)
  const [unlocked, setUnlocked] = useState(null)
  const key = getAnswerKey(setData)
  const pair = setData.pairs[pairIndex]

  function score() {
    let correct = 0
    const itemResults = []
    for (const p of setData.pairs) {
      for (const q of p.questions) {
        const ok = answersMatch(responses[q.n], key[q.n])
        if (ok) correct += 1
        itemResults.push({
          skill: getItemSkill(setData, q.n),
          result: ok ? 'right' : responses[q.n] ? 'wrong' : 'skip',
        })
      }
    }
    const total = correct * 10
    setScored({ correct, total })
    const { newSet } = recordAttempt(username, {
      setId: setData.id,
      title: setData.title,
      type: setData.type,
      score: total,
      detail: `${correct} / 8 correct`,
      itemResults,
      setData,
      responses,
    })
    setUnlocked(newSet)
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
        </div>
      </div>
      <h2>{setData.title}</h2>
      <p className="lead">Calculator OK · 6 minutes per pair · +10 each · no penalty</p>

      {!scored && (
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
              </div>
            </div>
          ))}
        </div>
      )}

      {scored &&
        setData.pairs.map((pr) => (
          <div className="pair-box" key={pr.pair}>
            <h3>Pair {pr.pair}</h3>
            {pr.questions.map((q) => {
              const ok = answersMatch(responses[q.n], key[q.n])
              return (
                <div className={`problem ${ok ? 'problem-right' : 'problem-wrong'}`} key={q.n}>
                  <span className="num">{q.n}.</span>
                  {q.q}
                  <div className="answer-row">
                    <span>Your answer: {responses[q.n] || '(blank)'}</span>
                    {ok ? (
                      <span className="mark-ok">✓ Correct ({key[q.n]})</span>
                    ) : (
                      <span className="mark-bad">✗ Correct: {key[q.n]}</span>
                    )}
                  </div>
                  {!ok && <ExplainBox text={getExplain(setData, q.n, key[q.n])} />}
                </div>
              )
            })}
          </div>
        ))}

      {!scored && (
        <div className="submit-bar">
          <button type="button" className="btn btn-primary submit-btn" onClick={score}>Submit</button>
          <span className="submit-hint">Scores all pairs, explains mistakes, unlocks more practice</span>
        </div>
      )}
      {scored && (
        <div className="score-banner">
          <strong>Score: {scored.total}</strong>
          <div>{scored.correct} / 8 correct · skills updated</div>
        </div>
      )}
      <UnlockBanner newSet={unlocked} onStart={onStartUnlocked} />
    </div>
  )
}
