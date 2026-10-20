import { defaultSkills, PROFILE_SKILL_SEEDS, skillBand } from './skills.js'

const RIGHT_DELTA = 4
const WRONG_DELTA = 7
const SKIP_DELTA = 1 // tiny — skipping Sprint is OK strategically

export function ensureSkills(progress, username) {
  if (progress.skills && Object.keys(progress.skills).length) return progress
  const seeded = PROFILE_SKILL_SEEDS[username]
  progress.skills = { ...defaultSkills(), ...(seeded || {}) }
  return progress
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * @param {object} progress
 * @param {Array<{ skill: string, result: 'right'|'wrong'|'skip' }>} itemResults
 */
export function applySkillResults(progress, itemResults) {
  if (!progress.skills) progress.skills = defaultSkills()
  for (const { skill, result } of itemResults) {
    if (!skill) continue
    if (progress.skills[skill] == null) progress.skills[skill] = 50
    if (result === 'right') progress.skills[skill] = clamp(progress.skills[skill] + RIGHT_DELTA)
    else if (result === 'wrong') progress.skills[skill] = clamp(progress.skills[skill] - WRONG_DELTA)
    else if (result === 'skip') progress.skills[skill] = clamp(progress.skills[skill] + SKIP_DELTA)
  }
  return progress
}

export function rankedSkills(progress) {
  const skills = progress.skills || defaultSkills()
  return Object.entries(skills)
    .map(([id, score]) => ({ id, score, band: skillBand(score) }))
    .sort((a, b) => a.score - b.score)
}

export function weakestSkills(progress, n = 2) {
  return rankedSkills(progress).slice(0, n)
}

export function strongestSkills(progress, n = 2) {
  return rankedSkills(progress).slice(-n).reverse()
}

/** ~70% weak, ~20% revise strong, ~10% stretch — returns next track preference. */
export function pickNextFocus(progress, availableTrackIds) {
  if (!availableTrackIds.length) return null
  const weak = weakestSkills(progress, 3).map((s) => s.id)
  const strong = strongestSkills(progress, 2).map((s) => s.id)
  const roll = Math.random()

  const bySkill = (skillIds) =>
    availableTrackIds.filter((t) => skillIds.some((s) => t.skills?.includes(s) || t.primarySkill === s))

  if (roll < 0.7) {
    const hits = bySkill(weak)
    if (hits.length) return hits[0]
  } else if (roll < 0.9) {
    const hits = bySkill(strong)
    if (hits.length) return hits[Math.floor(Math.random() * hits.length)]
  }
  return availableTrackIds[Math.floor(Math.random() * availableTrackIds.length)]
}
