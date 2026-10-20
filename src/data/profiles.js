/**
 * Profiles from mathleague.org Contest Set 12721 / Event 14020 (Oct 19, 2026).
 * Practice recommendations are tailored to each twin's misses and stop-lines.
 */
export const profiles = {
  Amrit: {
    displayName: 'Amrit',
    meet: 'Contest Set 12721 · Event 14020',
    scores: {
      numberSense: 92,
      nsRank: '29/72',
      target: 50,
      targetRank: '8/74',
      sprint: 34,
      sprintRank: '32/74',
      individual: 107,
      individualRank: '20/74',
      team: 20,
    },
    detail: {
      ns: { correct: 20, incorrect: 2, note: 'Missed estimates #10 & #20; solid through ~#22' },
      target: { correct: 5, incorrect: 3, missed: [4, 6, 8], note: 'Strong — protect this; drill harder pair problems' },
      sprint: {
        correct: 9,
        incorrect: 2,
        wrong: [6, 8],
        got: [1, 2, 3, 4, 5, 10, 11, 16, 20],
        note: 'Two wrong guesses hurt (−1 each). Skip more mid-hard items.',
      },
    },
    qualified: { targetSilver: true, targetBronze: true },
    goals: {
      numberSense: 120,
      sprint: 52,
      target: 60,
      individual: 140,
    },
    focus: [
      {
        title: 'Number Sense estimates',
        why: 'Both misses were estimation (#10, #20). Every 10th problem must be within 5%.',
        sets: ['focus-amrit-estimate'],
      },
      {
        title: 'Sprint: skip > guess',
        why: '9 right but 2 wrong (#6, #8). Wrong costs −1; skip costs 0.',
        sets: ['focus-amrit-sprint-mid'],
      },
      {
        title: 'Keep Target elite',
        why: '5/8 and top-10 finish. Practice harder pairs so Q4/6/8 style don’t slip.',
        sets: ['focus-amrit-target-hard'],
      },
    ],
    schedule: [
      {
        title: 'This week (Amrit focus)',
        items: [
          'Daily 8 min: Estimation drill (focus set)',
          '2× week: Sprint mid set — practice skipping #6–15 style',
          '2× week: Hard Target pairs (6 min each)',
          '1× week: Full NS Set — stop when accuracy drops',
        ],
      },
      {
        title: 'Contest goals (next meet)',
        items: [
          'Number Sense ≥ 120 (clean estimates + a few more)',
          'Sprint ≥ 52 (more skips, fewer −1s)',
          'Target ≥ 60 (hold Silver/Bronze)',
          'Individual ≥ 140',
        ],
      },
    ],
    recommendedIds: [
      'focus-amrit-estimate',
      'focus-amrit-sprint-mid',
      'focus-amrit-target-hard',
      'ns-1',
      'sprint-2',
      'target-3',
    ],
  },

  Mohit: {
    displayName: 'Mohit',
    meet: 'Contest Set 12721 · Event 14020',
    scores: {
      numberSense: 56,
      nsRank: '51/72',
      target: 20,
      targetRank: '44/74',
      sprint: 36,
      sprintRank: '29/74',
      individual: 70,
      individualRank: '45/74',
      team: 20,
    },
    detail: {
      ns: {
        correct: 12,
        incorrect: 1,
        note: 'Clean early stretch (blank #7 counted −4). Stopped at #13 — need longer clean run.',
      },
      target: {
        correct: 2,
        incorrect: 6,
        missed: [2, 3, 4, 5, 6, 8],
        got: [1, 7],
        note: 'Biggest gap. Multi-step word problems with calculator.',
      },
      sprint: {
        correct: 9,
        incorrect: 0,
        got: [1, 2, 3, 4, 5, 6, 8, 11, 27],
        note: 'Great discipline — zero wrong. Stretch into mid questions carefully.',
      },
    },
    qualified: {},
    goals: {
      numberSense: 100,
      sprint: 48,
      target: 40,
      individual: 110,
    },
    focus: [
      {
        title: 'Target rebuilding (priority #1)',
        why: 'Only 2/8 correct. This round is where Individual score can jump fastest.',
        sets: ['focus-mohit-target-basics', 'focus-mohit-target-build'],
      },
      {
        title: 'Number Sense: longer clean stretch',
        why: '12 right then stopped. Blank #7 hurt. Goal: clean through ~#25.',
        sets: ['focus-mohit-ns-stretch'],
      },
      {
        title: 'Sprint: keep 0 wrongs, add 2–3 more',
        why: '9 correct / 0 incorrect is excellent. Attempt a few more mid items only if sure.',
        sets: ['focus-mohit-sprint-safe'],
      },
    ],
    schedule: [
      {
        title: 'This week (Mohit focus)',
        items: [
          'Daily: 1 Target pair (6 min) — highest priority',
          'Daily 8 min: NS stretch drill (no blanks in the middle)',
          '3× week: Safe Sprint (skip anything unsure)',
          'Weekend: Full Target set (all 4 pairs)',
        ],
      },
      {
        title: 'Contest goals (next meet)',
        items: [
          'Target ≥ 40 (4/8 correct)',
          'Number Sense ≥ 100 (longer clean run)',
          'Sprint ≥ 48 (keep near-zero wrongs)',
          'Individual ≥ 110',
        ],
      },
    ],
    recommendedIds: [
      'focus-mohit-target-basics',
      'focus-mohit-target-build',
      'focus-mohit-ns-stretch',
      'focus-mohit-sprint-safe',
      'target-1',
      'ns-1',
      'sprint-1',
    ],
  },
}

export function getProfile(username) {
  return profiles[username] || null
}
