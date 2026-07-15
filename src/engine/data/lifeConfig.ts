// LIFE_SYSTEM.md — all off-pitch tunables: meter drift + coupling, Character,
// the QUIET scheduler, interrupt rules. All playtest starting points.
import type { MeterId } from '../types/core';

export const LIFE = {
  meterStart: {
    professionalism: 60, lifestyle: 30, morale: 65,
    reputation: 20, finances: 40, family: 70,
  } as Record<MeterId, number>,

  // Weekly drift toward baseline (fraction of the gap closed per week).
  drift: {
    baseline: {
      professionalism: 55, lifestyle: 35, morale: 60,
      reputation: 30, finances: 50, family: 60,
    } as Record<MeterId, number>,
    rate: 0.04,
  },

  // The coupling web (small weekly pushes, each with a Reason).
  coupling: {
    lifestyleErodesProfessionalism: 0.04, // per point of Lifestyle over 50
    lifestyleErodesFinances: 0.05,
    familyBuffersMorale: 0.03,            // per point of Family over 60
    lowMoraleThreshold: 35,
    benchedMoraleHit: 3,
    startMoraleBoost: 1.5,
    winMoraleBoost: 2,
    lossMoraleHit: 2,
    goalMoraleBoost: 2.5,
  },

  character: {
    weights: { reputation: 0.4, professionalism: 0.4, history: 0.2 },
    bands: { modelPro: 70, grounded: 40 },
    // characterBias multiplier by band: how much an event's bias scales its weight
    biasMult: {
      high: { ModelPro: 1.8, Grounded: 1.0, LooseCannon: 0.4 },
      neutral: { ModelPro: 1.0, Grounded: 1.0, LooseCannon: 1.0 },
      low: { ModelPro: 0.35, Grounded: 1.0, LooseCannon: 1.9 },
    } as Record<'high' | 'neutral' | 'low', Record<'ModelPro' | 'Grounded' | 'LooseCannon', number>>,
    historyFlagsPositive: ['turned_down_temptation', 'peacemaker', 'saver', 'good_heart', 'integrated', 'mentor', 'loyal'],
    historyFlagsNegative: ['parties_hard', 'hothead', 'big_spender', 'cocky', 'mercenary', 'betting_ties', 'denied_child'],
  },

  scheduler: {
    quietWeight: 45,
    scaleCurve: { min: 0.25, max: 2.5 },  // scales_with: 0.25 at 0 -> 2.5 at 100
    maxEventsPerWeek: 1,
  },

  // Tally -> status flag thresholds (EVENT_CHAINS §2). Payoff events use these flags.
  tallyThresholds: {
    pro_points: { threshold: 3, flag: 'pro_track' },
    maverick_points: { threshold: 4, flag: 'icon_track', forbidsFlag: 'major_scandal' },
    loyalty_points: { threshold: 2, flag: 'one_club_man' },
    family_points: { threshold: 3, flag: 'family_anchor' },
    wealth_points: { threshold: 3, flag: 'financially_secure', forbidsFlag: 'bad_investment' },
    leader_points: { threshold: 3, flag: 'natural_leader' },
  } as const,
} as const;

export type CharacterBand = 'ModelPro' | 'Grounded' | 'LooseCannon';

export const BAND_LABEL: Record<CharacterBand, string> = {
  ModelPro: 'Model Pro', Grounded: 'Grounded', LooseCannon: 'Loose Cannon',
};

export const METER_LABEL: Record<MeterId, string> = {
  professionalism: 'Professionalism', lifestyle: 'Lifestyle', morale: 'Morale',
  reputation: 'Reputation', finances: 'Finances', family: 'Family',
};
