const PREFIX = 'mlp:progress:'

function emptyProgress(username) {
  return {
    username,
    sessions: [],
    bestBySet: {},
    lastActive: null,
  }
}

export function loadProgress(username) {
  if (!username) return emptyProgress('')
  try {
    const raw = localStorage.getItem(PREFIX + username)
    if (!raw) return emptyProgress(username)
    const data = JSON.parse(raw)
    return {
      ...emptyProgress(username),
      ...data,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      bestBySet: data.bestBySet || {},
    }
  } catch {
    return emptyProgress(username)
  }
}

function saveProgress(username, data) {
  localStorage.setItem(PREFIX + username, JSON.stringify(data))
  return data
}

/**
 * Record a completed practice attempt for this user.
 */
export function recordAttempt(username, attempt) {
  const progress = loadProgress(username)
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
  const higherIsBetter = true
  if (!prev || (higherIsBetter && attempt.score > prev.score)) {
    progress.bestBySet[attempt.setId] = {
      score: attempt.score,
      detail: entry.detail,
      at: entry.at,
      title: attempt.title,
      type: attempt.type,
    }
  }

  return saveProgress(username, progress)
}

export function clearProgress(username) {
  return saveProgress(username, emptyProgress(username))
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
