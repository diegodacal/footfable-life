// EVENT_CHAINS.md realized: the compounding payoffs of both identities.
// Neither path dominates — each pays differently and fails differently.
import type { LifeEventDef } from '../types/core';

export const CHAIN_EVENTS: LifeEventDef[] = [
  // ------------------------------------------------------ CHAIN A: the Pro
  {
    id: 'evt_pro_noticed', title: 'The Staff Notice', category: 'career',
    stages: ['break', 'prime'], weightBase: 1.6, characterBias: 'high', seasonCap: 1,
    gates: { tallyAtLeast: { pro_points: 3 }, forbidsFlag: ['pro_track'] },
    isMomentScreen: true,
    prompt: 'The fitness coach pulls you aside: your professionalism is setting the standard. The staff are taking note.',
    choices: [
      { label: 'Keep it up', effects: { standing: 6, meters: { professionalism: 4 }, readiness: 4, flags: ['pro_track'], reasonText: 'Your recovery habits mean training lands harder — a standing edge the party players cannot earn.' } },
    ],
  },
  {
    id: 'evt_premium_sponsor', title: 'A Prestige Approach', category: 'life:finance',
    stages: ['prime'], weightBase: 1.2, characterBias: 'high', seasonCap: 1, cooldownWeeks: 40,
    gates: { requiresFlag: ['pro_track'], forbidsFlag: ['parties_hard', 'betting_ties', 'hothead'], minMeter: { reputation: 45 } },
    prompt: 'A luxury watch house wants a clean-image ambassador. The kind of deal that only goes to players without baggage.',
    choices: [
      { label: 'Sign — represent the brand', effects: { meters: { finances: 20, reputation: 8 }, cash: 250, flags: ['prestige_sponsor', 'conduct_clause'], reasonText: 'Serious, stable money and prestige. A conduct clause means a future scandal would cost you — but you don’t do scandals.' } },
      { label: 'Hold out for the right fit', effects: { meters: { reputation: 3 }, reasonText: 'Selective — protects your value.' } },
    ],
  },
  {
    id: 'evt_brand_ambassador', title: 'The Long Deal', category: 'life:finance',
    stages: ['prime', 'vet'], weightBase: 1.0, characterBias: 'high', seasonCap: 1,
    gates: { requiresFlag: ['prestige_sponsor'] },
    prompt: 'The brand wants you as their face for the long haul.',
    choices: [
      { label: 'Commit', effects: { meters: { finances: 12, reputation: 5 }, cash: 150, flags: ['secure_income'], tally: { wealth_points: 1 }, reasonText: 'Compounding, boring, beautiful money — the kind that outlives careers.' } },
    ],
  },
  // ------------------------------------------------- CHAIN B: the Maverick
  {
    id: 'evt_icon_rising', title: 'Box Office', category: 'life:reputation',
    stages: ['break', 'prime'], weightBase: 1.6, characterBias: 'low', seasonCap: 1,
    gates: { tallyAtLeast: { maverick_points: 4 }, forbidsFlag: ['major_scandal', 'icon_track'] },
    isMomentScreen: true,
    prompt: 'Your flair and your nights are turning you into box office. The camera loves you.',
    choices: [
      { label: 'Lean into the persona', effects: { meters: { reputation: 12, finances: 6, lifestyle: 5 }, cash: 80, flags: ['icon_track'], reasonText: 'A star is born — if you can stay upright. The scandal chains are still live under you.' } },
      { label: 'Pull back from the spotlight', effects: { meters: { professionalism: 4 }, tally: { pro_points: 1 }, reasonText: 'You saw where it leads and chose otherwise.' } },
    ],
  },
  {
    id: 'evt_lifestyle_brand', title: 'The Bold Deal', category: 'life:finance',
    stages: ['prime'], weightBase: 1.1, characterBias: 'low', seasonCap: 1, cooldownWeeks: 40,
    gates: { requiresFlag: ['icon_track'] },
    prompt: 'An energy-drink giant wants your rockstar image — bigger reach than any watch deal, but it lives or dies on you staying hot.',
    choices: [
      { label: 'Sign the mega-deal', effects: { meters: { finances: 18, reputation: 6 }, cash: 400, flags: ['volatile_income'], reasonText: 'Massive upside, tied to relevance — a slump would hurt the wallet too.' } },
      { label: 'Too flashy, even for you', effects: { meters: { professionalism: 2 }, reasonText: 'Restraint, from you? People notice that too.' } },
    ],
  },
  {
    id: 'evt_global_icon', title: 'Bigger Than Football', category: 'life:reputation',
    stages: ['prime'], weightBase: 1.0, characterBias: 'low', seasonCap: 1,
    gates: { requiresFlag: ['icon_track'], minMeter: { reputation: 75 } },
    isMomentScreen: true,
    prompt: 'You’ve transcended the sport. Fashion shoots, film cameos, the works.',
    choices: [
      { label: 'Embrace global celebrity', effects: { meters: { reputation: 15, finances: 10, lifestyle: 8 }, cash: 300, flags: ['global_icon'], reasonText: 'The ceiling the Pro never reaches — with the fall the Pro never risks.' } },
    ],
  },
  // ------------------------------------------ Maverick catastrophes (rare)
  {
    id: 'evt_dna_test', title: 'The DNA Request', category: 'life:family',
    stages: ['break', 'prime'], weightBase: 0.35, characterBias: 'low', seasonCap: 1, cooldownWeeks: 999, interrupt: true,
    gates: { requiresFlag: ['parties_hard'] },
    prompt: 'A woman from that wild season contacts you. She’s requesting a paternity test.',
    choices: [
      { label: 'Take responsibility, do the test', effects: { meters: { reputation: -4, morale: -6 }, flags: ['dna_pending'], followupId: 'evt_child_confirmed', reasonText: 'Owning it — reputation dips now, but it’s the honest path.' } },
      { label: 'Deny and lawyer up', effects: { meters: { reputation: -10, professionalism: -4, finances: -6 }, cash: -80, flags: ['denied_child'], reasonText: 'The story leaks; image and legal costs hit harder.' } },
    ],
  },
  {
    id: 'evt_child_confirmed', title: 'It’s Confirmed', category: 'life:family',
    stages: ['break', 'prime'], weightBase: 0, characterBias: 'neutral',
    gates: { requiresFlag: ['dna_pending'] },
    prompt: 'The test is positive. You’re a parent.',
    choices: [
      { label: 'Step up — support them properly', effects: { meters: { family: 10, morale: 4, finances: -6 }, cash: -30, flags: ['child_support', 'dependent'], reasonText: 'Recurring support begins; family and character rise with it.' } },
      { label: 'Pay the minimum, stay distant', effects: { meters: { family: -6, reputation: -5 }, cash: -10, flags: ['child_support_min'], reasonText: 'Cheaper — but it follows your reputation around.' } },
    ],
  },
  {
    id: 'evt_scandal_leak', title: 'The Video', category: 'life:media',
    stages: ['break', 'prime'], weightBase: 0.4, characterBias: 'low', seasonCap: 1, cooldownWeeks: 50, interrupt: true,
    gates: { requiresAnyFlag: ['parties_hard', 'hothead', 'betting_ties'] },
    prompt: 'A private clip is leaking to the press. By morning it’s everywhere.',
    choices: [
      { label: 'Get ahead of it, apologize', effects: { meters: { reputation: -5, professionalism: 3 }, reasonText: 'Damage limited. Owning it beats hiding.' } },
      { label: 'Deny everything', effects: { meters: { reputation: -12, morale: -6 }, flags: ['major_scandal'], reasonText: 'It gets worse. Denials age badly in the phone era.' } },
    ],
  },
  {
    id: 'evt_betting_deal', title: 'The Shady Sponsor', category: 'life:finance',
    stages: ['prime', 'vet'], weightBase: 0.45, characterBias: 'low', seasonCap: 1, cooldownWeeks: 60,
    gates: { maxMeter: { finances: 45 } },
    prompt: 'A betting outfit offers a big, quiet endorsement — the kind clubs frown on.',
    choices: [
      { label: 'Take the money', effects: { meters: { finances: 15, reputation: -10, professionalism: -6 }, cash: 200, flags: ['betting_ties'], reasonText: 'Cash now, exposure later — this arms future scandals.' } },
      { label: 'Refuse', effects: { meters: { reputation: 4 }, tally: { pro_points: 1 }, reasonText: 'Clean, if poorer.' } },
    ],
  },
  // ------------------------------------------------------ Reinvention arcs
  {
    id: 'evt_reinvention_reform', title: 'The Turning Point', category: 'life:reputation',
    stages: ['prime', 'vet'], weightBase: 1.2, characterBias: 'neutral', seasonCap: 1,
    gates: { requiresAnyFlag: ['parties_hard', 'icon_track', 'big_spender'], tallyAtLeast: { pro_points: 2 }, forbidsFlag: ['reinvented'] },
    isMomentScreen: true,
    prompt: 'The wild years are behind you; word spreads that you’ve genuinely changed.',
    choices: [
      { label: 'Own the redemption story', effects: { meters: { reputation: 8, professionalism: 6, morale: 6 }, flags: ['reinvented', 'redemption_arc'], reasonText: 'The public loves a reformed maverick — doors reopen even with old baggage.' } },
      { label: 'Let your football do the talking', effects: { meters: { professionalism: 5 }, flags: ['reinvented'], reasonText: 'Quiet reform. The dressing room knows, and that’s enough.' } },
    ],
  },
  {
    id: 'evt_reinvention_unleashed', title: 'Off the Leash', category: 'life:lifestyle',
    stages: ['prime', 'vet'], weightBase: 1.0, characterBias: 'neutral', seasonCap: 1,
    gates: { requiresFlag: ['pro_track'], tallyAtLeast: { maverick_points: 2 }, forbidsFlag: ['reinvented'] },
    prompt: 'A lifetime of being the model pro, and something in you wants to finally cut loose.',
    choices: [
      { label: 'Reinvent as a free spirit', effects: { meters: { morale: 8, lifestyle: 8, reputation: 4, professionalism: -4 }, flags: ['reinvented', 'late_bloomer'], reasonText: 'A livelier final act — new fans, new brands, raised eyebrows.' } },
      { label: 'Stay the course', effects: { meters: { professionalism: 3 }, reasonText: 'Not who you are. Never was.' } },
    ],
  },
  // ------------------------------------------------------ Leader & loyalty
  {
    id: 'evt_captaincy', title: 'The Armband', category: 'career',
    stages: ['prime'], weightBase: 1.2, characterBias: 'high', seasonCap: 1,
    gates: { minStatus: 'Regular', tallyAtLeast: { leader_points: 2 }, forbidsFlag: ['captain'] },
    isMomentScreen: true,
    prompt: 'The coach offers you the captaincy.',
    choices: [
      { label: 'Accept', effects: { standing: 10, meters: { reputation: 8, professionalism: 5 }, flags: ['captain'], tally: { leader_points: 1 }, reasonText: 'Leader now — the room, the coach, the crowd all look to you first.' } },
      { label: 'Decline, lead quietly', effects: { meters: { professionalism: 4, morale: 2 }, reasonText: 'No spotlight, no burden. Influence without the armband.' } },
    ],
  },
  {
    id: 'evt_natural_leader', title: 'The Dressing Room’s Voice', category: 'career:relationships',
    stages: ['prime', 'vet'], weightBase: 1.2, characterBias: 'high', seasonCap: 1,
    gates: { tallyAtLeast: { leader_points: 3 }, forbidsFlag: ['natural_leader'] },
    prompt: 'When it’s tense, the room looks to you.',
    choices: [
      { label: 'Own the role', effects: { standing: 8, flags: ['natural_leader'], reasonText: 'Dressing-room conflicts now resolve your way; the coach counts on it.' } },
    ],
  },
  {
    id: 'evt_club_icon', title: 'Their Favorite Son', category: 'life:reputation',
    stages: ['prime', 'vet'], weightBase: 1.1, characterBias: 'high', seasonCap: 1,
    gates: { tallyAtLeast: { loyalty_points: 2 }, forbidsFlag: ['one_club_icon'] },
    isMomentScreen: true,
    prompt: 'A generation of fans has only ever known you in this shirt.',
    choices: [
      { label: 'You’re a club icon', effects: { meters: { reputation: 14 }, standing: 8, flags: ['one_club_icon'], reasonText: 'A standing floor here for life; a statue in waiting.' } },
    ],
  },
  // ------------------------------------------------------ Wealth & family
  {
    id: 'evt_wise_investment', title: 'A Real Opportunity', category: 'life:finance',
    stages: ['prime', 'vet'], weightBase: 1.0, characterBias: 'high', seasonCap: 1,
    gates: { tallyAtLeast: { wealth_points: 3 }, forbidsFlag: ['bad_investment', 'smart_money'] },
    prompt: 'A vetted, genuine opportunity — the kind only shown to people with capital and a track record of not blowing it.',
    choices: [
      { label: 'Invest wisely', effects: { meters: { finances: 10 }, cash: 120, flags: ['smart_money'], reasonText: 'Money making money. The empire starts quietly.' } },
    ],
  },
  {
    id: 'evt_family_anchor', title: 'Something Solid', category: 'life:family',
    stages: ['prime'], weightBase: 1.1, characterBias: 'high', seasonCap: 1,
    gates: { tallyAtLeast: { family_points: 3 }, forbidsFlag: ['family_anchor_set'] },
    prompt: 'Between the partner, the family and the quiet weekends, you’ve built something that holds.',
    choices: [
      { label: 'This is your foundation', effects: { meters: { family: 10, morale: 8 }, flags: ['family_anchor_set'], reasonText: 'A resilience the lonely player lacks — slumps will find you harder to break.' } },
    ],
  },
  {
    id: 'evt_slump_resilience', title: 'They’ve Got You', category: 'life:family',
    stages: ['prime', 'vet'], weightBase: 1.4, characterBias: 'neutral', cooldownWeeks: 20,
    gates: { requiresFlag: ['family_anchor_set'], maxMeter: { morale: 40 } },
    prompt: 'The football is going badly. But you go home to people who don’t care about your rating.',
    choices: [
      { label: 'Draw strength from them', effects: { meters: { morale: 12 }, flags: ['weathered_it'], reasonText: 'The party player free-falls here. You don’t.' } },
    ],
  },
  {
    id: 'evt_marriage', title: 'The Wedding', category: 'life:family',
    stages: ['prime'], weightBase: 0.9, characterBias: 'high', seasonCap: 1,
    gates: { requiresFlag: ['partner'], forbidsFlag: ['married'] },
    isMomentScreen: true,
    prompt: 'Your partner wants to make it official.',
    choices: [
      { label: 'The big wedding', effects: { meters: { family: 14, morale: 10, reputation: 4, finances: -8 }, cash: -120, flags: ['married'], tally: { family_points: 1 }, reasonText: 'Joyful, public, costly. The photos go everywhere.' } },
      { label: 'Small and private', effects: { meters: { family: 10, morale: 6, finances: -2 }, cash: -20, flags: ['married'], tally: { family_points: 1 }, reasonText: 'Intimate — just the people who knew you before.' } },
      { label: 'Not yet', effects: { meters: { family: -8, morale: -4 }, reasonText: 'The pause lands like a verdict. Strain follows.' } },
    ],
  },
  {
    id: 'evt_new_baby', title: 'A New Arrival', category: 'life:family',
    stages: ['prime', 'vet'], weightBase: 0.8, characterBias: 'high', seasonCap: 1, cooldownWeeks: 60,
    gates: { requiresFlag: ['married'] },
    isMomentScreen: true,
    prompt: 'You’re having a child.',
    choices: [
      { label: 'Full-on parent mode', effects: { meters: { family: 12, morale: 8 }, readiness: -6, flags: ['dependent'], tally: { family_points: 1 }, reasonText: 'Sleepless and glowing. Some match-week sharpness goes to the night feeds.' } },
      { label: 'Lean on help, stay focused', effects: { meters: { family: 2, professionalism: 4 }, readiness: -2, flags: ['dependent'], reasonText: 'Career-first, by agreement. The guilt is quieter than the alarm clock.' } },
    ],
  },
];
