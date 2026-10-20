import { ensureSkills, applySkillResults } from './coach/progressMath.js'
import { ensureTrackUnlocks, unlockAfterCompletion, enoughWorkForUnlock } from './coach/catalog.js'

const PREFIX = 'mlp:progress:'
const CONTENT_VERSION = 3 // bump to refresh generated question wording

function emptyProgress(username) {
  return {
    username,
    sessions: [],
    bestBySet: {},
    lastActive: null,
    skills: null,
    unlocked: {},
    generatedSets: {},
    lastUnlock: null,
    contentVersion: CONTENT_VERSION,
  }
}

export function loadProgress(username) {
  if (!username) return emptyProgress('')
  try {
    const raw = localStorage.getItem(PREFIX + username)
    if (!raw) {
      const p = emptyProgress(username)
      ensureSkills(p, username)
      ensureTrackUnlocks(p, username)
      return p
    }
    const data = JSON.parse(raw)
    const progress = {
      ...emptyProgress(username),
      ...data,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      bestBySet: data.bestBySet || {},
      unlocked: data.unlocked || {},
      generatedSets: data.generatedSets || {},
    }
    // Drop stale auto-generated sets when question wording is updated
    const needsSave = progress.contentVersion !== CONTENT_VERSION
    if (needsSave) {
      progress.generatedSets = {}
      progress.lastUnlock = null
      progress.contentVersion = CONTENT_VERSION
    }
    ensureSkills(progress, username)
    ensureTrackUnlocks(progress, username)
    if (needsSave) saveProgress(username, progress)
    return progress
  } catch {
    const p = emptyProgress(username)
    ensureSkills(p, username)
    ensureTrackUnlocks(p, username)
    return p
  }
}

function saveProgress(username, data) {
  localStorage.setItem(PREFIX + username, JSON.stringify(data))
  return data
}

/**
 * Record attempt, update skills, and possibly unlock the next generated set.
 * @returns {{ progress, newSet, unlocked }}
 */
export function recordAttempt(username, attempt) {
  let progress = loadProgress(username)
  ensureSkills(progress, username)

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    setId: attempt.setId,
    title: attempt.title,
    type: attempt.type,
    score: attempt.score,
    detail: attempt.detail || '',
    at: new Date().toISOString(),
  }
  progress.sessions = [entry, ...progress.sessions].slice(0, 200)
  progress.lastActive = entry.at

  const prev = progress.bestBySet[attempt.setId]
  if (!prev || attempt.score > prev.score) {
    progress.bestBySet[attempt.setId] = {
      score: attempt.score,
      detail: entry.detail,
      at: entry.at,
      title: attempt.title,
      type: attempt.type,
    }
  }

  if (attempt.itemResults?.length) {
    applySkillResults(progress, attempt.itemResults)
  }

  let newSet = null
  if (attempt.setData && attempt.responses && enoughWorkForUnlock(attempt.setData, attempt.responses)) {
    const result = unlockAfterCompletion(progress, attempt.setData)
    progress = result.progress
    newSet = result.newSet
    if (newSet) {
      progress.lastUnlock = {
        setId: newSet.id,
        title: newSet.title,
        at: entry.at,
      }
    }
  }

  saveProgress(username, progress)
  return { progress, newSet }
}

export function clearProgress(username) {
  const p = emptyProgress(username)
  ensureSkills(p, username)
  ensureTrackUnlocks(p, username)
  return saveProgress(username, p)
}

export function progressStats(progress) {
  const sessions = progress.sessions || []
  const uniqueSets = new Set(sessions.map((s) => s.setId))
  return {
    attempts: sessions.length,
    setsTried: uniqueSets.size,
    lastActive: progress.lastActive,
  }
}

export function getGeneratedSet(username, setId) {
  const p = loadProgress(username)
  return p.generatedSets?.[setId] || null
}
