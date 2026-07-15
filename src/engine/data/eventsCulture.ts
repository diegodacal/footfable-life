// The far-from-home / cultural layer (EVENT_LIBRARY_EXPANSION §6–7).
// Even-handedness rule: events key on the INDIVIDUAL (origin, faith flag,
// climate, family expectation, current location) — never on a stereotype.
// Faith is treated with respect and agency; institutions portrayed neutrally.
import type { LifeEventDef } from '../types/core';

export const CULTURE_EVENTS: LifeEventDef[] = [
  // ------------------------------------------------ universal far-from-home
  {
    id: 'evt_homesick', title: 'A Long Way From Home', category: 'life:morale',
    stages: ['break', 'prime'], weightBase: 1.3, characterBias: 'neutral', cooldownWeeks: 16,
    gates: { abroad: true },
    prompt: 'Different league, different language, different sky. It’s wearing on you.',
    choices: [
      { label: 'Fly family over', effects: { meters: { family: 10, morale: 10, finances: -4 }, cash: -25, tally: { family_points: 1 }, reasonText: 'Worth every penny. Home comes to you.' } },
      { label: 'Immerse in the local culture', effects: { meters: { morale: 6, reputation: 4 }, flags: ['settled_abroad'], reasonText: 'You adapt. The city starts to feel like yours.' } },
      { label: 'Push through alone', effects: { meters: { morale: -6, professionalism: 2 }, reasonText: 'Tough it out. It costs more than you admit.' } },
    ],
  },
  {
    id: 'evt_language', title: 'Lost in Translation', category: 'career:relationships',
    stages: ['break', 'prime'], weightBase: 1.2, characterBias: 'neutral', seasonCap: 1,
    gates: { abroad: true, forbidsFlag: ['integrated'] },
    prompt: 'You’re isolated in the dressing room by the language gap.',
    choices: [
      { label: 'Take lessons seriously', effects: { standing: 6, meters: { reputation: 4 }, flags: ['integrated'], tally: { pro_points: 1 }, reasonText: 'Doors open. The room hears you trying, and that matters more than grammar.' } },
      { label: 'Rely on a translator', effects: { standing: -3, reasonText: 'You stay on the outside of every joke.' } },
    ],
  },
  {
    id: 'evt_send_money_home', title: 'Family Duty', category: 'life:family',
    stages: ['break', 'prime'], weightBase: 1.1, characterBias: 'high', cooldownWeeks: 25,
    gates: { familyExpectation: 'high' },
    prompt: 'Back home, relatives are counting on you now. The list of names keeps growing.',
    choices: [
      { label: 'Support them generously', effects: { meters: { family: 12, finances: -6 }, cash: -40, tally: { family_points: 1 }, reasonText: 'Honoring where you’re from. It’s who you are.' } },
      { label: 'Set firm boundaries', effects: { meters: { finances: 4, family: -6, morale: -3 }, tally: { wealth_points: 1 }, reasonText: 'Sustainable — but it stings on both ends of the phone.' } },
    ],
  },
  {
    id: 'evt_local_hero_pressure', title: 'The Whole Town Watches', category: 'life:reputation',
    stages: ['break', 'prime'], weightBase: 0.9, characterBias: 'high', seasonCap: 1,
    gates: { familyExpectation: 'high', minMeter: { reputation: 35 } },
    prompt: 'Back home you’re proof it can be done. The weight of that is heavy.',
    choices: [
      { label: 'Carry it with pride', effects: { meters: { morale: 5, reputation: 8 }, flags: ['local_hero'], reasonText: 'Inspiring, exhausting. Kids wear your name now.' } },
      { label: 'Distance yourself to cope', effects: { meters: { morale: 2, reputation: -4, family: -4 }, reasonText: 'Self-protection reads as coldness from far away.' } },
    ],
  },
  // ------------------------------------------------------------- faith
  {
    id: 'evt_ramadan', title: 'Ramadan', category: 'life:faith',
    stages: ['youth', 'break', 'prime', 'vet'], weightBase: 1.6, characterBias: 'neutral', seasonCap: 1, cooldownWeeks: 40,
    gates: { faith: 'muslim', observant: true },
    prompt: 'Ramadan begins. You’ll be fasting from dawn to sunset — including on match days. How do you approach the month?',
    choices: [
      { label: 'Observe fully; work with the club nutritionist on timing', effects: { readiness: -6, meters: { morale: 10, family: 8, reputation: 4 }, flags: ['observed_ramadan'], reasonText: 'Daytime fasting costs some match-week freshness; faith, family and community standing rise. The club accommodates meal timing and breaking fast.' } },
      { label: 'Observe, using the traveler’s allowance for key fixtures', effects: { readiness: -2, meters: { morale: 4, family: 2 }, reasonText: 'A recognized accommodation — lighter physical cost, a private trade-off you feel personally.' } },
    ],
  },
  {
    id: 'evt_eid', title: 'Eid', category: 'life:faith',
    stages: ['youth', 'break', 'prime', 'vet'], weightBase: 1.0, characterBias: 'high', seasonCap: 1, cooldownWeeks: 30,
    gates: { faith: 'muslim', observant: true },
    prompt: 'Eid brings family and community together, wherever in the world you are.',
    choices: [
      { label: 'Celebrate fully', effects: { meters: { family: 8, morale: 8 }, reasonText: 'Joy and belonging. The game can wait a day.' } },
    ],
  },
  {
    id: 'evt_faith_milestone', title: 'A Quiet Faith', category: 'life:faith',
    stages: ['prime', 'vet'], weightBase: 0.8, characterBias: 'high', seasonCap: 1, cooldownWeeks: 40,
    gates: { faithNot: 'none', maxMeter: { morale: 50 } },
    prompt: 'Your faith is steadying you through a hard patch — church, mosque or temple, the quiet is the same.',
    choices: [
      { label: 'Lean into it', effects: { meters: { morale: 10, professionalism: 4 }, flags: ['grounded_faith'], reasonText: 'An anchor that doesn’t depend on results.' } },
      { label: 'Keep it private', effects: { meters: { morale: 4 }, reasonText: 'Yours alone. That’s enough.' } },
    ],
  },
  // ------------------------------------------------------------- climate
  {
    id: 'evt_heat_struggle', title: 'The Summer Wall', category: 'career:health',
    stages: ['break', 'prime', 'vet'], weightBase: 1.0, characterBias: 'neutral', seasonCap: 1,
    gates: { climateClash: true, abroad: true, forbidsFlag: ['climate_adapted'] },
    prompt: 'This league’s weather is nothing like home, and your body knows it.',
    choices: [
      { label: 'Commit to an acclimatization block', effects: { readiness: -4, meters: { professionalism: 4 }, flags: ['climate_adapted'], tally: { pro_points: 1 }, reasonText: 'Invest now, thrive later — the conditions stop being an opponent.' } },
      { label: 'Tough it out', effects: { readiness: -8, meters: { morale: -3 }, reasonText: 'You suffer through the extremes, and it shows in the numbers.' } },
    ],
  },
  {
    id: 'evt_climate_edge', title: 'In Your Element', category: 'career',
    stages: ['break', 'prime'], weightBase: 0.8, characterBias: 'high', seasonCap: 1,
    gates: { abroad: true, climateClash: false },
    prompt: 'While the imports wilt in this weather, you’re barely breaking sweat. These are your conditions.',
    choices: [
      { label: 'Exploit it', effects: { readiness: 5, standing: 5, meters: { morale: 6 }, reasonText: 'Your climate, your edge — the coach notices who finishes strong.' } },
    ],
  },
  // ------------------------------------------ cultural texture (individual)
  {
    id: 'evt_carnival', title: 'Carnival Season', category: 'life:lifestyle',
    stages: ['youth', 'break', 'prime'], weightBase: 1.0, characterBias: 'neutral', seasonCap: 1, cooldownWeeks: 40,
    gates: { origin: 'brazil' },
    prompt: 'Carnival is everywhere — the music finds you even in the gym. The temptation to lose a week to it is real.',
    choices: [
      { label: 'Join the celebration', effects: { meters: { morale: 10, lifestyle: 8, professionalism: -5 }, readiness: -6, reasonText: 'Joy, at a cost. Some things are worth being Brazilian for.' } },
      { label: 'Enjoy it in moderation', effects: { meters: { morale: 5, professionalism: 1 }, reasonText: 'A taste of home, eyes still on Saturday.' } },
      { label: 'Stay disciplined', effects: { meters: { professionalism: 5, morale: -3 }, tally: { pro_points: 1 }, reasonText: 'The prize is bigger than the party. This year.' } },
    ],
  },
  {
    id: 'evt_derby_abroad', title: 'Their Biggest Game', category: 'career',
    stages: ['break', 'prime'], weightBase: 0.9, characterBias: 'neutral', seasonCap: 1,
    gates: { abroad: true, matchWithinDays: 3 },
    prompt: 'Locals keep stopping you in the street: this week’s fixture is THE one here. You didn’t grow up with this rivalry — but you’re in it now.',
    choices: [
      { label: 'Learn what it means to them', effects: { standing: 4, meters: { reputation: 5 }, flags: ['adopted_son'], reasonText: 'You play their derby like you were born to it. They’ll remember.' } },
      { label: 'It’s three points like any other', effects: { meters: { professionalism: 2, reputation: -2 }, reasonText: 'Professional — but the fans hear the shrug.' } },
    ],
  },
  {
    id: 'evt_national_pride_day', title: 'Colors of Home', category: 'life:reputation',
    stages: ['break', 'prime', 'vet'], weightBase: 0.7, characterBias: 'high', seasonCap: 1, cooldownWeeks: 40,
    gates: { abroad: true },
    prompt: 'Your country’s national day. The local expat community has asked you to join their celebration.',
    choices: [
      { label: 'Show up, flag on your shoulders', effects: { meters: { morale: 6, family: 4, reputation: 5 }, reasonText: 'For every kid there, you ARE home. It refills something.' } },
      { label: 'Send a video message', effects: { meters: { reputation: 2 }, reasonText: 'Appreciated, from a distance.' } },
    ],
  },
];
