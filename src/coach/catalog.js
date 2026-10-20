import { TRACK_GENERATORS } from './generators.js'
import { pickNextFocus, weakestSkills, strongestSkills } from './progressMath.js'
import { focusSets } from '../data/focusSets.js'

/**
 * Practice tracks available in the app.
 * seedSetIds = first published set(s) that unlock level 1.
 * forUsers lists exact login names only — never share one twin's focus with the other.
 */
export const TRACKS = [
  {
    id: 'estimation',
    label: 'Estimation Lab',
    primarySkill: 'estimation',
    skills: ['estimation'],
    forUsers: ['Amrit'],
    seedSetIds: ['focus-amrit-estimate'],
  },
  {
    id: 'sprint-mid',
    label: 'Sprint Mid',
    primarySkill: 'sprint_mid',
    skills: ['sprint_mid', 'sprint_accuracy'],
    forUsers: ['Amrit'],
    seedSetIds: ['focus-amrit-sprint-mid'],
  },
  {
    id: 'target-multi',
    label: 'Harder Target',
    primarySkill: 'target_multistep',
    skills: ['target_multistep', 'ratios', 'geometry'],
    forUsers: ['Amrit'],
    seedSetIds: ['focus-amrit-target-hard'],
  },
  {
    id: 'target-basic',
    label: 'Target Basics',
    primarySkill: 'target_basic',
    skills: ['target_basic', 'geometry'],
    forUsers: ['Mohit'],
    seedSetIds: ['focus-mohit-target-basics'],
  },
  {
    id: 'target-multi-m',
    label: 'Target Builder',
    primarySkill: 'target_multistep',
    skills: ['target_multistep', 'fractions', 'ratios'],
    forUsers: ['Mohit'],
    seedSetIds: ['focus-mohit-target-build'],
    generatorKey: 'target-multi',
  },
  {
    id: 'ns-stretch',
    label: 'NS Clean Stretch',
    primarySkill: 'ns_stretch',
    skills: ['ns_stretch', 'ns_basic', 'estimation'],
    forUsers: ['Mohit'],
    seedSetIds: ['focus-mohit-ns-stretch'],
  },
  {
    id: 'sprint-safe',
    label: 'Safe Sprint',
    primarySkill: 'sprint_accuracy',
    skills: ['sprint_accuracy', 'sprint_mid'],
    forUsers: ['Mohit'],
    seedSetIds: ['focus-mohit-sprint-safe'],
  },
]

export function tracksForUser(username) {
  return TRACKS.filter((t) => t.forUsers.includes(username))
}

/** Whether this login may open a focus / generated adaptive set. Shared drills are always ok. */
export function userCanAccessSet(username, setData) {
  if (!setData) return false
  const id = String(setData.id || '')
  const group = String(setData.group || '')
  const isPersonalized =
    id.startsWith('focus-') || group.startsWith('focus') || group === 'generated' || Boolean(setData.trackId)
  if (!isPersonalized) return true

  const mine = tracksForUser(username)
  if (setData.trackId && mine.some((t) => t.id === setData.trackId)) return true
  if (mine.some((t) => t.seedSetIds.includes(setData.id))) return true
  if (group === `focus-${String(username).toLowerCase()}`) return true
  return false
}

function genKey(track) {
  return track.generatorKey || track.id
}

/**
 * After a set is completed, unlock/generate the next level on that track.
 * Only unlocks tracks that belong to this username.
 */
export function unlockAfterCompletion(progress, completedSet, username) {
  if (!progress.unlocked) progress.unlocked = {}
  if (!progress.generatedSets) progress.generatedSets = {}

  const allowed = new Set(tracksForUser(username).map((t) => t.id))

  // Match by trackId on generated sets or seed membership
  let matched =
    TRACKS.find((t) => t.id === completedSet.trackId) ||
    TRACKS.find((t) => genKey(t) === completedSet.trackId) ||
    TRACKS.find((t) => t.seedSetIds.includes(completedSet.id))

  if (!matched) {
    // Infer from title prefixes — still must be a track this user owns
    const title = completedSet.title || ''
    if (/estimation/i.test(title)) matched = TRACKS.find((t) => t.id === 'estimation')
    else if (/safe sprint/i.test(title)) matched = TRACKS.find((t) => t.id === 'sprint-safe')
    else if (/sprint mid/i.test(title)) matched = TRACKS.find((t) => t.id === 'sprint-mid')
    else if (/target basics/i.test(title)) matched = TRACKS.find((t) => t.id === 'target-basic')
    else if (/target builder|harder target/i.test(title))
      matched = TRACKS.find((t) => t.seedSetIds.includes(completedSet.id)) || TRACKS.find((t) => t.id === 'target-multi')
    else if (/ns clean stretch/i.test(title)) matched = TRACKS.find((t) => t.id === 'ns-stretch')
  }

  if (!matched || !allowed.has(matched.id)) return { progress, newSet: null }

  const curLevel = completedSet.level || (matched.seedSetIds.includes(completedSet.id) ? 1 : 1)
  const nextLevel = Math.max(curLevel + 1, (progress.unlocked[matched.id] || 1) + 1)
  progress.unlocked[matched.id] = Math.max(progress.unlocked[matched.id] || 1, nextLevel)

  const existing = Object.values(progress.generatedSets).find(
    (s) => s.trackId === matched.id && s.level === nextLevel
  )
  if (existing) return { progress, newSet: existing }

  const generator = TRACK_GENERATORS[genKey(matched)]
  if (!generator) return { progress, newSet: null }

  const newSet = generator({
    level: nextLevel,
    seed: Date.now() + nextLevel * 997,
  })
  // Keep track id as catalog track id for unlocks
  newSet.trackId = matched.id
  newSet.title = `${matched.label} ${nextLevel}`
  progress.generatedSets[newSet.id] = newSet

  return { progress, newSet }
}

/** @returns {boolean} true if foreign / stale unlock data was removed */
export function ensureTrackUnlocks(progress, username) {
  if (!progress.unlocked) progress.unlocked = {}
  if (!progress.generatedSets) progress.generatedSets = {}
  const mine = tracksForUser(username)
  const mineIds = new Set(mine.map((t) => t.id))
  let dirty = false
  for (const t of mine) {
    if (progress.unlocked[t.id] == null) {
      progress.unlocked[t.id] = 1
      dirty = true
    }
  }
  // Drop another user's tracks / generated sets left over from the old shared '*' bug
  for (const key of Object.keys(progress.unlocked)) {
    if (!mineIds.has(key)) {
      delete progress.unlocked[key]
      dirty = true
    }
  }
  for (const [id, s] of Object.entries(progress.generatedSets)) {
    if (s?.trackId && !mineIds.has(s.trackId)) {
      delete progress.generatedSets[id]
      dirty = true
    }
  }
  if (progress.lastUnlock?.setId && !progress.generatedSets[progress.lastUnlock.setId]) {
    const seedOk = mine.some((t) => t.seedSetIds.includes(progress.lastUnlock.setId))
    if (!seedOk) {
      progress.lastUnlock = null
      dirty = true
    }
  }
  return dirty
}

/**
 * Build the list of adaptive/focus sets visible to this user.
 */
export function visibleAdaptiveSets(progress, username, allSeedFocusSets = focusSets) {
  ensureTrackUnlocks(progress, username)
  const mine = tracksForUser(username)
  const seedIds = new Set(mine.flatMap((t) => t.seedSetIds))
  const seeds = allSeedFocusSets.filter((s) => seedIds.has(s.id))

  const generated = Object.values(progress.generatedSets || {}).filter((s) =>
    mine.some((t) => t.id === s.trackId)
  )

  // Coach suggestion: which track to push next
  const trackMeta = mine.map((t) => ({
    ...t,
    primarySkill: t.primarySkill,
    skills: t.skills,
  }))
  const focus = pickNextFocus(progress, trackMeta)
  const weak = weakestSkills(progress, 2)
  const strong = strongestSkills(progress, 2)

  return {
    seeds,
    generated: generated.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title)),
    coach: {
      nextTrack: focus,
      weak,
      strong,
      message: coachMessage(weak, strong, focus),
    },
  }
}

function coachMessage(weak, strong, focus) {
  const w = weak.map((s) => s.id.replace(/_/g, ' ')).join(', ')
  const s = strong.map((x) => x.id.replace(/_/g, ' ')).join(', ')
  const track = focus?.label || 'your focus sets'
  return `Coach tip: spend most practice on ${w || 'weaker skills'}. Keep ${s || 'strong skills'} warm with light revision. Suggested track: ${track}.`
}

/** Enough work to count as completing a set for unlock. */
export function enoughWorkForUnlock(setData, responses) {
  if (setData.type === 'number-sense') {
    const filled = setData.problems.filter((p) => responses[p.n] != null && String(responses[p.n]).trim() !== '').length
    return filled >= Math.ceil(setData.problems.length * 0.4)
  }
  if (setData.type === 'sprint') {
    const filled = setData.problems.filter((p) => responses[p.n]).length
    return filled >= Math.ceil(setData.problems.length * 0.35)
  }
  if (setData.type === 'target') {
    const qs = setData.pairs.flatMap((p) => p.questions)
    const filled = qs.filter((q) => responses[q.n] != null && String(responses[q.n]).trim() !== '').length
    return filled >= 3
  }
  return true
}
