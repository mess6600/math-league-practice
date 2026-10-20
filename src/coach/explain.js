import { answers } from '../data/answers.js'

/** Hand-written explains for seeded focus sets; fallback generic otherwise. */
const FOCUS_EXPLAIN = {
  'focus-amrit-estimate': Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => {
      const n = i + 1
      const ans = answers['focus-amrit-estimate']?.[n]
      return [
        n,
        `Exact product is ${ans}. On Number Sense estimation, any integer within 5% of ${ans} is accepted. Tip: (n−1)(n+1)=n²−1.`,
      ]
    })
  ),
  'focus-amrit-sprint-mid': {
    1: 'Multiply first: 7×8=56, then −6 → 50. Order of operations.',
    2: 'Perimeter = 2(L+W)=2(9+4)=26.',
    3: '29 is only divisible by 1 and itself — it is prime.',
    4: 'LCM of 4 and 6 is 12 (multiples of 4: 4,8,12…; of 6: 6,12…).',
    5: '36−25=11. Or a²−b²=(a−b)(a+b)=1×11=11.',
    6: 'On Sprint, skip when unsure. Wrong = −1, skip = 0.',
    7: 'Mean = (4+8+10+6)÷4 = 28÷4 = 7.',
    8: '2+1+6=9, which is divisible by 9, so 216 is divisible by 9.',
    9: '⅔ of 24 = (24÷3)×2 = 16.',
    10: 'Angles in a triangle always sum to 180°.',
    11: '2.5 m = 2.5×100 = 250 cm.',
    12: 'GCF of 18 and 24 is 6.',
    13: '2:45 + 1:40 = 4:25.',
    14: '18/24 ÷6/6 = 3/4.',
    15: '$1.50÷3 = $0.50.',
  },
  'focus-amrit-target-hard': {
    1: 'Width 8 → length = 2×8+3=19. Perimeter = 2(19+8)=54.',
    2: 'Five scores average 86 → sum 430. 80+90+88+84=342. Fifth = 430−342=88.',
    3: '25% off $80 → $60, then −$6 → $54.',
    4: '3-4-5 triangle scaled by 3: legs 9 and 12 → hypotenuse 15.',
    5: '3+5=8 parts. 32÷8=4 per part. Girls = 5×4=20.',
    6: 'Surface area 150 = 6s² → s²=25 → s=5.',
    7: '55×2.4 = 132 miles.',
    8: 'GCF×LCM = product → 4×LCM=84 → LCM=21.',
  },
  'focus-mohit-ns-stretch': Object.fromEntries(
    Object.entries(answers['focus-mohit-ns-stretch'] || {}).map(([n, ans]) => [
      n,
      `Answer: ${ans}. Work carefully and don’t leave blanks in the middle — blanks before your last attempt cost −4.`,
    ])
  ),
  'focus-mohit-target-basics': {
    1: '(36+24)÷12 = 60÷12 = 5 boxes.',
    2: 'Three consecutive sum to 54 → middle 18; largest 19.',
    3: 'Area = 15×6 = 90.',
    4: 'Mean = (2+3+4)÷3 = 3.',
    5: '30% of 200 = 60.',
    6: 'Perimeter 36 → side 36÷4 = 9.',
    7: '2×7 + 3×4 = 14+12 = 26.',
    8: '56÷7 = 8.',
  },
  'focus-mohit-target-build': {
    1: '¾ of 40 = 30 liters.',
    2: '144−64 = 80.',
    3: 'Ate 6 of 10 → 4 left → 4/10 = 2/5.',
    4: '45÷5 = 9.',
    5: '3×10 + 4×2 = 30+8 = 38.',
    6: '2x+9=31 → 2x=22 → x=11.',
    7: '40×2.5 = 100 miles.',
    8: '1+2=3 parts. 24÷3=8. Girls = 2×8=16.',
  },
  'focus-mohit-sprint-safe': {
    1: '48÷6=8.',
    2: '15×4=60.',
    3: '1/2 = 0.5.',
    4: '9+16=25.',
    5: '2.5 hours = 150 minutes.',
    6: '30 is a multiple of both 3 and 5.',
    7: '100−37=63.',
    8: '25% of 60 = 15.',
    9: 'If unsure on Sprint, skip. Wrong costs −1.',
    10: 'Area of square = 7×7=49.',
    11: 'Pattern doubles: 24×2=48.',
    12: 'A hexagon has 6 sides.',
  },
}

export function getAnswerKey(setData) {
  if (setData.answerKey) return setData.answerKey
  return answers[setData.id] || {}
}

export function getExplain(setData, n, correctAnswer) {
  if (setData.explain?.[n]) return setData.explain[n]
  if (FOCUS_EXPLAIN[setData.id]?.[n]) return FOCUS_EXPLAIN[setData.id][n]
  if (correctAnswer != null) {
    return `Correct answer: ${correctAnswer}. Review the problem step by step and check arithmetic carefully.`
  }
  return 'Review this problem carefully and try a similar one next time.'
}

export function getItemSkill(setData, n) {
  if (setData.itemSkills?.[n]) return setData.itemSkills[n]
  if (setData.problems) {
    const p = setData.problems.find((x) => x.n === n)
    if (p?.skill) return p.skill
    if (p?.estimate) return 'estimation'
  }
  if (setData.pairs) {
    for (const pair of setData.pairs) {
      const q = pair.questions.find((x) => x.n === n)
      if (q?.skill) return q.skill
    }
  }
  if (setData.type === 'number-sense') return 'ns_basic'
  if (setData.type === 'sprint') return 'sprint_mid'
  if (setData.type === 'target') return 'target_basic'
  return null
}
