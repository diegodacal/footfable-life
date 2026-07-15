// Global TUNE numbers. Training tunables live in trainingConfig.ts,
// life tunables in lifeConfig.ts. All values are playtest starting points.

export const ENGINE_VERSION = '1.0.0-m1';

export const CALENDAR = {
  // Senior season: 20 weeks. 16 league rounds (11 round-robin + 5 split),
  // preseason week 1, rest weeks, finale week 20. Cup rounds land on rest
  // weeks from M3. Transfer windows (M2): mid-season + season boundary.
  seniorWeeks: 20,
  leagueRoundWeeks: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19],
  restWeeks: [7, 14],
  windowWeeks: [10, 11, 12, 13],
  finaleWeek: 20,
  splitAfterRound: 11,          // 11-round RR, then top-6 / bottom-6 split
  prologueWeeks: 10,
  prologueMatchWeeks: [2, 4, 6, 8, 9],
} as const;

export const SQUAD = {
  slots: { ST: 2, CM: 5, CB: 4 } as const,   // the XI by line
  roster: { ST: 4, CM: 8, CB: 6 } as const,  // senior roster by line
  youthPerClub: 4,
} as const;

export const SELECTION = {
  wAbility: 0.6,
  wForm: 0.3,
  wFitness: 0.1,
  standingFactor: 0.05,          // standing is a minor factor only
  subGapMax: 6,                  // within this score of last starter -> named sub
  devBenchBase: 0.38,            // young high-potential players get squad cameos
} as const;

export const MATCH = {
  baseRating: 6.0,
  decisionChance: 0.18,
  varianceSd: 0.55,
  goalsBase: 1.35,               // per team per match, scaled by strength diff
  strengthGoalSlope: 0.022,
  subOnRange: [55, 80] as const,
  subOffRange: [60, 85] as const,
  subOffChanceStarter: 0.3,
  formAlpha: 0.35,               // form = alpha*rating + (1-alpha)*form
} as const;

export const STATUS = {
  // minutes-share window (weeks) and thresholds per PROTOTYPE_SPEC §5
  windowWeeks: 8,
  backupToRotation: 0.25,
  rotationToRegular: 0.6,
  regularToStar: 0.8,
  demotionSlack: 0.6,            // fall below threshold*slack -> risk demotion
} as const;

export const ECONOMY = {
  moneyUnit: 1000,               // 1 cash unit = €1k (display only)
  wageByStatus: { Youth: 1, Backup: 8, Rotation: 18, Regular: 35, Star: 70 } as const,
  clubStrengthWageSlope: 0.02,   // wage *= 1 + slope*(clubStrength-60)
  upkeepBase: 2,
  upkeepLifestyleSlope: 0.12,    // + lifestyle * slope per week
  debtMoraleHit: 4,              // weekly morale drain while in debt
  brokeThreshold: -150,          // sustained beyond this -> broke hard-fail (M3 enforces ending)
} as const;

export const WORLD = {
  nationsCount: 12,
  clubsPerDivision: 12,
  divisions: 2,
  npcAgeRange: [17, 35] as const,
  youthAgeRange: [16, 18] as const,
} as const;

export const SIGNALS = {
  bigMatchStrengthGap: 6,        // |our table pos - theirs| small or top-2 clash
  lowReadinessBeforeMatch: 45,
  ambitionCloseness: 0.8,        // >=80% progress = worth stopping
} as const;
