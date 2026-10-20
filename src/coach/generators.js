/** Template-based set generators. Each problem includes answer + explain. */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function irand(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1))
}

function nearSquarePair(rng) {
  const n = irand(rng, 12, 55)
  return [n - 1, n + 1, n * n - 1]
}

export function generateEstimationSet({ level = 2, seed = Date.now() }) {
  const rng = mulberry32(seed >>> 0)
  const problems = []
  const answerKey = {}
  const explain = {}
  const skills = {}
  const count = 16 + Math.min(level, 4) * 2

  for (let i = 1; i <= count; i++) {
    const [a, b, exact] = nearSquarePair(rng)
    problems.push({
      n: i,
      q: `${a} × ${b}`,
      estimate: true,
      skill: 'estimation',
    })
    answerKey[i] = String(exact)
    explain[i] =
      `${a}×${b} is like ${((a + b) / 2) | 0}² − 1. Exact is ${exact}. On Number Sense, any integer within 5% of ${exact} counts.`
    skills[i] = 'estimation'
  }

  return {
    id: `gen-estimation-${level}-${seed}`,
    title: `Estimation Lab ${level}`,
    type: 'number-sense',
    group: 'generated',
    trackId: 'estimation',
    level,
    problems,
    answerKey,
    explain,
    itemSkills: skills,
    generated: true,
  }
}

export function generateNsStretchSet({ level = 2, seed = Date.now() }) {
  const rng = mulberry32(seed >>> 0)
  const problems = []
  const answerKey = {}
  const explain = {}
  const itemSkills = {}
  const count = 20 + level * 2

  for (let i = 1; i <= count; i++) {
    let q
    let ans
    let skill = 'ns_basic'
    let exp
    const kind = i % 10 === 0 ? 'est' : pick(rng, ['add', 'sub', 'mul', 'div', 'half', 'pct', 'ops'])

    if (kind === 'est') {
      const [a, b, exact] = nearSquarePair(rng)
      q = `${a} × ${b}`
      ans = String(exact)
      skill = 'estimation'
      exp = `Estimate: exact ${exact}. Within 5% is OK.`
      problems.push({ n: i, q, estimate: true, skill })
    } else if (kind === 'add') {
      const a = irand(rng, 15, 90)
      const b = irand(rng, 15, 90)
      q = `${a} + ${b}`
      ans = String(a + b)
      exp = `${a} + ${b} = ${a + b}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else if (kind === 'sub') {
      const a = irand(rng, 40, 200)
      const b = irand(rng, 10, a - 5)
      q = `${a} − ${b}`
      ans = String(a - b)
      exp = `${a} − ${b} = ${a - b}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else if (kind === 'mul') {
      const a = irand(rng, 6, 12)
      const b = irand(rng, 6, 15)
      q = `${a} × ${b}`
      ans = String(a * b)
      exp = `${a} × ${b} = ${a * b}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else if (kind === 'div') {
      const b = irand(rng, 4, 12)
      const qn = irand(rng, 4, 12)
      const a = b * qn
      q = `${a} ÷ ${b}`
      ans = String(qn)
      exp = `${a} ÷ ${b} = ${qn}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else if (kind === 'half') {
      const a = irand(rng, 10, 50) * 2
      q = `½ of ${a}`
      ans = String(a / 2)
      skill = 'fractions'
      exp = `Half of ${a} is ${a / 2}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else if (kind === 'pct') {
      const a = pick(rng, [40, 50, 60, 80, 100, 200])
      q = `25% of ${a}`
      ans = String(a / 4)
      skill = 'fractions'
      exp = `25% means ÷4. ${a} ÷ 4 = ${a / 4}.`
      problems.push({ n: i, q, estimate: false, skill })
    } else {
      const a = irand(rng, 2, 8)
      const b = irand(rng, 2, 9)
      q = `${a} + ${b} × 3`
      ans = String(a + b * 3)
      skill = 'order_ops'
      exp = `Multiply first: ${b}×3=${b * 3}, then +${a} = ${a + b * 3}.`
      problems.push({ n: i, q, estimate: false, skill })
    }

    answerKey[i] = ans
    explain[i] = exp
    itemSkills[i] = skill
  }

  // Mark stretch skill on later problems
  for (let i = 15; i <= count; i++) {
    if (itemSkills[i] === 'ns_basic') itemSkills[i] = 'ns_stretch'
  }

  return {
    id: `gen-ns-stretch-${level}-${seed}`,
    title: `NS Clean Stretch ${level}`,
    type: 'number-sense',
    group: 'generated',
    trackId: 'ns-stretch',
    level,
    problems,
    answerKey,
    explain,
    itemSkills,
    generated: true,
  }
}

const SPRINT_BANK = [
  {
    skill: 'sprint_mid',
    make: (rng) => {
      const a = irand(rng, 6, 9)
      const b = irand(rng, 6, 9)
      const c = irand(rng, 2, 9)
      const ans = a * b - c
      return {
        q: `${a} × ${b} − ${c} =`,
        answer: 'B',
        options: [
          { key: 'A', text: String(ans - 6) },
          { key: 'B', text: String(ans) },
          { key: 'C', text: String(a * b) },
          { key: 'D', text: String(ans + 6) },
          { key: 'E', text: 'NOTA' },
        ],
        explain: `Multiply first: ${a}×${b}=${a * b}, then subtract ${c} → ${ans}. If unsure on Sprint, skip instead of guessing.`,
      }
    },
  },
  {
    skill: 'geometry',
    make: (rng) => {
      const l = irand(rng, 5, 14)
      const w = irand(rng, 3, 10)
      const peri = 2 * (l + w)
      return {
        q: `Rectangle ${l} by ${w}. Perimeter?`,
        answer: 'B',
        options: [
          { key: 'A', text: String(l + w) },
          { key: 'B', text: String(peri) },
          { key: 'C', text: String(l * w) },
          { key: 'D', text: String(peri + 2) },
          { key: 'E', text: 'NOTA' },
        ],
        explain: `Perimeter = 2(L+W) = 2(${l}+${w}) = ${peri}.`,
      }
    },
  },
  {
    skill: 'fractions',
    make: (rng) => {
      const whole = pick(rng, [24, 30, 36, 48])
      const ans = (whole * 2) / 3
      return {
        q: `⅔ of ${whole} =`,
        answer: 'C',
        options: [
          { key: 'A', text: String(whole / 3) },
          { key: 'B', text: String(whole / 2) },
          { key: 'C', text: String(ans) },
          { key: 'D', text: String(whole) },
          { key: 'E', text: 'NOTA' },
        ],
        explain: `⅔ of ${whole} = (${whole}÷3)×2 = ${whole / 3}×2 = ${ans}.`,
      }
    },
  },
  {
    skill: 'sprint_accuracy',
    make: () => ({
      q: 'On Sprint, if you are not sure of the answer, what should you do?',
      answer: 'B',
      options: [
        { key: 'A', text: 'Guess quickly' },
        { key: 'B', text: 'Skip (0 points)' },
        { key: 'C', text: 'Mark two answers' },
        { key: 'D', text: 'Spend 5 minutes' },
        { key: 'E', text: 'NOTA' },
      ],
      explain: 'Wrong = −1, skip = 0. Skipping protects your score.',
    }),
  },
  {
    skill: 'sprint_mid',
    make: (rng) => {
      const a = irand(rng, 5, 12)
      return {
        q: `${a}² − ${(a - 1)}² =`,
        answer: 'B',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: String(2 * a - 1) },
          { key: 'C', text: String(a * a) },
          { key: 'D', text: String(2 * a) },
          { key: 'E', text: 'NOTA' },
        ],
        explain: `${a}²=${a * a}, ${(a - 1)}²=${(a - 1) * (a - 1)}, difference ${2 * a - 1}. (Or use a²−b²=(a−b)(a+b).)`,
      }
    },
  },
]

export function generateSprintSet({ level = 2, seed = Date.now(), trackId = 'sprint-mid', titlePrefix = 'Sprint Mid' }) {
  const rng = mulberry32(seed >>> 0)
  const count = 12 + Math.min(level, 5)
  const problems = []
  const answerKey = {}
  const explain = {}
  const itemSkills = {}

  for (let i = 1; i <= count; i++) {
    const bank = pick(rng, SPRINT_BANK)
    const made = bank.make(rng)
    problems.push({
      n: i,
      q: made.q,
      options: made.options,
      skill: bank.skill,
    })
    answerKey[i] = made.answer
    explain[i] = made.explain
    itemSkills[i] = bank.skill
  }

  return {
    id: `gen-${trackId}-${level}-${seed}`,
    title: `${titlePrefix} ${level}`,
    type: 'sprint',
    group: 'generated',
    trackId,
    level,
    problems,
    answerKey,
    explain,
    itemSkills,
    generated: true,
  }
}

function targetPair(rng, level) {
  const l = irand(rng, 10, 22)
  const w = irand(rng, 4, 12)
  const area = l * w
  const pct = pick(rng, [20, 25, 30, 40, 50])
  const base = pick(rng, [80, 100, 120, 200, 240])
  const pctAns = (base * pct) / 100
  const hard = level >= 3

  if (!hard) {
    const boxes = 12
    const m = boxes * irand(rng, 2, 5)
    const a = boxes * irand(rng, 1, 4)
    return [
      {
        q: `A bakery sold ${m} muffins in the morning and ${a} in the afternoon. Boxes hold ${boxes}. How many full boxes in all?`,
        answer: String((m + a) / boxes),
        explain: `Total muffins ${m + a}. Divide by ${boxes} → ${(m + a) / boxes} boxes.`,
        skill: 'target_basic',
      },
      {
        q: `Rectangle length ${l} cm and width ${w} cm. What is the area in square cm?`,
        answer: String(area),
        explain: `Area = length × width = ${l}×${w} = ${area}.`,
        skill: 'geometry',
      },
    ]
  }

  const avg = irand(rng, 80, 95)
  const four = [irand(rng, 70, 95), irand(rng, 70, 95), irand(rng, 70, 95), irand(rng, 70, 95)]
  const fifth = avg * 5 - four.reduce((s, x) => s + x, 0)
  return [
    {
      q: `Average of five scores is ${avg}. Four scores are ${four.join(', ')}. What is the fifth?`,
      answer: String(fifth),
      explain: `Five scores sum to ${avg}×5=${avg * 5}. Subtract the four known scores (${four.reduce((s, x) => s + x, 0)}) → fifth = ${fifth}.`,
      skill: 'ratios',
    },
    {
      q: `${pct}% of ${base} is?`,
      answer: String(pctAns),
      explain: `${pct}% of ${base} = ${pct}/100 × ${base} = ${pctAns}.`,
      skill: 'fractions',
    },
  ]
}

export function generateTargetSet({ level = 2, seed = Date.now(), trackId = 'target-basic', titlePrefix = 'Target Practice' }) {
  const rng = mulberry32(seed >>> 0)
  const pairs = []
  const answerKey = {}
  const explain = {}
  const itemSkills = {}
  let n = 1

  for (let p = 1; p <= 4; p++) {
    const qs = targetPair(rng, level)
    const questions = qs.map((item) => {
      const num = n++
      answerKey[num] = item.answer
      explain[num] = item.explain
      itemSkills[num] = item.skill
      return { n: num, q: item.q, skill: item.skill }
    })
    pairs.push({ pair: p, questions })
  }

  return {
    id: `gen-${trackId}-${level}-${seed}`,
    title: `${titlePrefix} ${level}`,
    type: 'target',
    group: 'generated',
    trackId,
    level,
    pairs,
    answerKey,
    explain,
    itemSkills,
    generated: true,
  }
}

export const TRACK_GENERATORS = {
  estimation: (opts) => generateEstimationSet(opts),
  'ns-stretch': (opts) => generateNsStretchSet(opts),
  'sprint-mid': (opts) =>
    generateSprintSet({ ...opts, trackId: 'sprint-mid', titlePrefix: 'Sprint Mid' }),
  'sprint-safe': (opts) =>
    generateSprintSet({ ...opts, trackId: 'sprint-safe', titlePrefix: 'Safe Sprint' }),
  'target-basic': (opts) =>
    generateTargetSet({ ...opts, trackId: 'target-basic', titlePrefix: 'Target Basics' }),
  'target-multi': (opts) =>
    generateTargetSet({ ...opts, trackId: 'target-multi', titlePrefix: 'Target Builder', level: Math.max(opts.level || 2, 3) }),
}
