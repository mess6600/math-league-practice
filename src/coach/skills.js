/** Skill tags used for adaptive coaching. */
export const SKILLS = {
  estimation: { label: 'Estimation (Number Sense)', round: 'number-sense' },
  ns_basic: { label: 'Number Sense basics', round: 'number-sense' },
  ns_stretch: { label: 'Number Sense stamina', round: 'number-sense' },
  order_ops: { label: 'Order of operations', round: 'number-sense' },
  fractions: { label: 'Fractions & percents', round: 'mixed' },
  sprint_accuracy: { label: 'Sprint: skip vs guess', round: 'sprint' },
  sprint_mid: { label: 'Sprint mid questions', round: 'sprint' },
  target_basic: { label: 'Target basics', round: 'target' },
  target_multistep: { label: 'Target multi-step', round: 'target' },
  geometry: { label: 'Perimeter / area / shapes', round: 'mixed' },
  ratios: { label: 'Ratios & averages', round: 'mixed' },
}

/** Starting skill ratings 0–100 from Contest 12721 scoresheets. */
export const PROFILE_SKILL_SEEDS = {
  Amrit: {
    estimation: 35,
    ns_basic: 70,
    ns_stretch: 55,
    order_ops: 65,
    fractions: 60,
    sprint_accuracy: 40,
    sprint_mid: 45,
    target_basic: 75,
    target_multistep: 70,
    geometry: 65,
    ratios: 60,
  },
  Mohit: {
    estimation: 50,
    ns_basic: 55,
    ns_stretch: 35,
    order_ops: 50,
    fractions: 45,
    sprint_accuracy: 85,
    sprint_mid: 50,
    target_basic: 30,
    target_multistep: 25,
    geometry: 40,
    ratios: 40,
  },
}

export function defaultSkills() {
  const s = {}
  for (const id of Object.keys(SKILLS)) s[id] = 50
  return s
}

export function skillBand(score) {
  if (score < 40) return 'weak'
  if (score < 65) return 'building'
  return 'strong'
}
