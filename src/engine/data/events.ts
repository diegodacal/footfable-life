// The authored life-event library. Core set below; chain payoffs in
// eventsChains.ts, the cultural far-from-home layer in eventsCulture.ts.
// Pure data over the schema in types/core. Extended each milestone.
import type { LifeEventDef } from '../types/core';
import { CHAIN_EVENTS } from './eventsChains';
import { CULTURE_EVENTS } from './eventsCulture';

const CORE_EVENTS: LifeEventDef[] = [
  // ------------------------------------------------------------ youth / prologue
  {
    id: 'evt_early_night', title: 'Early Night', category: 'life:nightlife',
    stages: ['youth', 'break', 'prime'], weightBase: 1.4, characterBias: 'neutral',
    gates: { matchWithinDays: 2 }, cooldownWeeks: 3,
    prompt: 'The lads are heading out. There’s a match in two days.',
    choices: [
      { label: 'Skip it, get your rest', effects: { readiness: 5, meters: { professionalism: 3, morale: -3 }, tally: { pro_points: 1 }, flags: ['turned_down_temptation'], reasonText: 'Rested and sharp for the weekend; a little FOMO. Discipline is quietly banking toward something bigger.' } },
      { label: 'Go out with them', effects: { readiness: -10, meters: { morale: 6, lifestyle: 5, professionalism: -3 }, tally: { maverick_points: 1 }, flags: ['parties_hard'], reasonText: 'Fun tonight, heavy legs Saturday — and it starts a different story.' } },
    ],
  },
  {
    id: 'evt_school_or_football', title: 'Books or Boots', category: 'life:family',
    stages: ['youth'], weightBase: 1.0, characterBias: 'high',
    gates: { familyExpectation: 'high' }, seasonCap: 1,
    prompt: 'Your family wants you to finish school as a fallback. Training clashes with exams.',
    choices: [
      { label: 'Prioritize football', effects: { readiness: 2, meters: { family: -5 }, flags: ['all_in'], reasonText: 'Committed — but the family is uneasy about the gamble.' } },
      { label: 'Balance both', effects: { readiness: -3, meters: { family: 4, professionalism: 3 }, reasonText: 'Tired but grounded; they sleep easier.' } },
    ],
  },
  {
    id: 'evt_academy_bully', title: 'The Pecking Order', category: 'career:relationships',
    stages: ['youth'], weightBase: 1.0, characterBias: 'neutral', seasonCap: 1,
    prompt: 'A senior youth player is making your life hard.',
    choices: [
      { label: 'Stand up to him', effects: { standing: 4, meters: { reputation: 2, morale: 3 }, reasonText: 'It could have backfired — but the room noticed you didn’t fold.' } },
      { label: 'Keep your head down', effects: { meters: { professionalism: 2, morale: -3 }, reasonText: 'You survive it quietly. It costs a little self-respect.' } },
    ],
  },
  {
    id: 'evt_hometown_hero', title: 'Local Boy', category: 'life:reputation',
    stages: ['youth', 'break'], weightBase: 0.8, characterBias: 'high', seasonCap: 1,
    prompt: 'Your hometown paper wants to make you their rising star.',
    choices: [
      { label: 'Embrace it', effects: { meters: { reputation: 6, family: 5 }, flags: ['local_hero'], reasonText: 'Pride back home — and expectation you’ll now carry.' } },
      { label: 'Stay low-key', effects: { meters: { professionalism: 3 }, flags: ['low_profile'], reasonText: 'No hype, no fall. The quiet path.' } },
    ],
  },
  {
    id: 'evt_first_contract', title: 'First Professional Terms', category: 'career',
    stages: ['youth'], weightBase: 0, characterBias: 'neutral', isMomentScreen: true,
    prompt: 'The club offers your first professional deal — modest, but real. This is the day it becomes your job.',
    choices: [
      { label: 'Sign it', effects: { meters: { morale: 8, finances: 4 }, standing: 3, cash: 5, reasonText: 'Security and belonging. You’re a professional footballer now.' } },
      { label: 'Sign, and send the first cheque home', effects: { meters: { morale: 6, family: 8, finances: 2 }, tally: { family_points: 1 }, cash: 2, reasonText: 'They carried you this far. The gesture lands deep.' } },
    ],
  },

  // ------------------------------------------------------------ breakthrough
  {
    id: 'evt_model_party', title: 'The Model Party', category: 'life:nightlife',
    stages: ['break', 'prime'], weightBase: 0.9, characterBias: 'low',
    gates: { minMeter: { lifestyle: 40 }, matchWithinDays: 2 }, cooldownWeeks: 8, seasonCap: 2, interrupt: true,
    prompt: 'You’re on the list for a party packed with models tonight — but there’s a big match tomorrow.',
    choices: [
      { label: 'Go — you only live once', effects: { readiness: -18, meters: { morale: 6, lifestyle: 8, professionalism: -6 }, tally: { maverick_points: 1 }, flags: ['parties_hard'], reasonText: 'Late night before a fixture; readiness and professionalism take the hit.' } },
      { label: 'Decline, rest up', effects: { meters: { professionalism: 5, morale: -2 }, readiness: 3, tally: { pro_points: 1 }, flags: ['turned_down_temptation'], reasonText: 'The pro choice; a small morale dip for missing the fun.' } },
    ],
  },
  {
    id: 'evt_first_wages', title: 'Real Money', category: 'life:finance',
    stages: ['break'], weightBase: 1.2, characterBias: 'neutral', seasonCap: 1,
    gates: { minStatus: 'Backup' },
    prompt: 'Your first proper paycheque clears. It feels unreal.',
    choices: [
      { label: 'Bank most of it', effects: { meters: { finances: 8, professionalism: 4 }, tally: { wealth_points: 1 }, flags: ['saver'], cash: 10, reasonText: 'Future-you says thanks.' } },
      { label: 'Treat family & friends', effects: { meters: { finances: -4, family: 10, morale: 6 }, tally: { family_points: 1 }, cash: -8, reasonText: 'Generous and warm — money well burned.' } },
      { label: 'Blow it on a weekend', effects: { meters: { finances: -8, lifestyle: 10, morale: 5, professionalism: -4 }, tally: { maverick_points: 1 }, cash: -15, reasonText: 'A legendary weekend. Your accountant winces.' } },
    ],
  },
  {
    id: 'evt_media_debut', title: 'First Big Interview', category: 'life:media',
    stages: ['break'], weightBase: 0.9, characterBias: 'neutral', seasonCap: 1,
    gates: { minMeter: { reputation: 25 } },
    prompt: 'Live TV wants your first real sit-down.',
    choices: [
      { label: 'Play it humble', effects: { meters: { reputation: 6, professionalism: 4 }, reasonText: 'Fans warm to you. The camera likes honesty.' } },
      { label: 'Show swagger', effects: { meters: { reputation: 4, lifestyle: 3 }, flags: ['cocky'], tally: { maverick_points: 1 }, reasonText: 'Divisive, memorable — box office, if you back it up.' } },
      { label: 'Fumble it nervously', effects: { meters: { reputation: -3, morale: -4 }, reasonText: 'Rough, but forgivable. Everyone starts somewhere.' } },
    ],
  },
  {
    id: 'evt_love_interest', title: 'Something Real', category: 'life:family',
    stages: ['break', 'prime'], weightBase: 0.8, characterBias: 'neutral', seasonCap: 1, cooldownWeeks: 30,
    gates: { forbidsFlag: ['partner'] },
    prompt: 'You’ve met someone who isn’t about the fame.',
    choices: [
      { label: 'Commit', effects: { meters: { family: 10, morale: 8 }, flags: ['partner'], tally: { family_points: 1 }, reasonText: 'Stability. Someone in your corner who doesn’t care about your rating.' } },
      { label: 'Keep it casual', effects: { meters: { lifestyle: 4, family: -3 }, reasonText: 'Freedom, for now. The road stays open — and empty.' } },
    ],
  },
  {
    id: 'evt_locker_fight', title: 'Flashpoint', category: 'career:relationships',
    stages: ['youth', 'break', 'prime'], weightBase: 0.7, characterBias: 'neutral', cooldownWeeks: 15,
    prompt: 'A locker-room row explodes into shoving. It’s about to become a fight.',
    choices: [
      { label: 'Break it up', effects: { standing: 6, meters: { reputation: 5 }, tally: { leader_points: 1 }, flags: ['peacemaker'], reasonText: 'Leadership noticed — by the coach and the room.' } },
      { label: 'Throw a punch', effects: { standing: -10, meters: { reputation: -8, professionalism: -6 }, flags: ['hothead'], reasonText: 'The coach and the press turn on you.' } },
      { label: 'Stay out of it', effects: { meters: { morale: -2 }, reasonText: 'Neutral — but teammates notice you didn’t help.' } },
    ],
  },
  {
    id: 'evt_flash_car', title: 'The Dream Car', category: 'life:purchase',
    stages: ['break', 'prime'], weightBase: 0.7, characterBias: 'low',
    gates: { minMeter: { finances: 30 }, minStatus: 'Rotation' }, seasonCap: 1, cooldownWeeks: 20,
    prompt: 'A limited-run supercar is available now — most of a year’s wages.',
    choices: [
      { label: 'Buy it', effects: { meters: { finances: -15, lifestyle: 12, morale: 8, reputation: 3 }, cash: -400, flags: ['big_spender'], tally: { maverick_points: 1 }, reasonText: 'Lifestyle upkeep rises; savings gutted. It is a very nice car.' } },
      { label: 'Stay sensible', effects: { meters: { professionalism: 4, finances: 2, morale: -2 }, tally: { wealth_points: 1 }, reasonText: 'Discipline over flash.' } },
      { label: 'Lease a modest one', effects: { meters: { finances: -4, lifestyle: 4 }, cash: -60, reasonText: 'A middle path — wheels without the wound.' } },
    ],
  },
  {
    id: 'evt_night_out_invite', title: 'Out With the Lads', category: 'life:nightlife',
    stages: ['break', 'prime'], weightBase: 1.1, characterBias: 'neutral', cooldownWeeks: 4,
    scalesWith: ['lifestyle'],
    prompt: 'A quiet week. The group chat is planning a big one.',
    choices: [
      { label: 'Go big', effects: { meters: { morale: 6, lifestyle: 6, professionalism: -2, finances: -3 }, cash: -12, reasonText: 'Great night. The bond with the squad is real — so is the bill.' } },
      { label: 'Show face, leave early', effects: { meters: { morale: 3, lifestyle: 2 }, cash: -4, reasonText: 'Present but professional.' } },
      { label: 'Stay in', effects: { meters: { professionalism: 3, morale: -2 }, tally: { pro_points: 1 }, reasonText: 'Another quiet night in the bank.' } },
    ],
  },
  {
    id: 'evt_agent_hustler', title: 'The Hustler', category: 'career',
    stages: ['break'], weightBase: 0.6, characterBias: 'low', seasonCap: 1,
    prompt: 'A fast-talking "advisor" promises he can double your money and your profile.',
    choices: [
      { label: 'Hear him out — and sign nothing', effects: { meters: { professionalism: 2 }, reasonText: 'Educational. The handshake felt expensive.' } },
      { label: 'Give him a small cut to prove it', effects: { meters: { finances: -5 }, cash: -20, flags: ['bad_advisor'], reasonText: 'He proves something, alright. The money is gone.' } },
    ],
  },
  {
    id: 'evt_struggling_teammate', title: 'A Hand Up', category: 'career:relationships',
    stages: ['break', 'prime', 'vet'], weightBase: 0.8, characterBias: 'high', cooldownWeeks: 12,
    prompt: 'A younger teammate is drowning — form gone, confidence shot.',
    choices: [
      { label: 'Take time to help him', effects: { standing: 5, tally: { leader_points: 1 }, meters: { morale: 3 }, reasonText: 'Your own week is busier, but he turns a corner — and remembers.' } },
      { label: 'Focus on your own game', effects: { meters: { professionalism: 2 }, reasonText: 'Cold, but your numbers come first.' } },
    ],
  },
  {
    id: 'evt_hospital_visit', title: 'No Cameras', category: 'life:reputation',
    stages: ['break', 'prime', 'vet'], weightBase: 0.6, characterBias: 'high', cooldownWeeks: 25,
    prompt: 'You quietly visit a children’s ward. No press invited.',
    choices: [
      { label: 'Just be there', effects: { meters: { morale: 8, reputation: 4 }, flags: ['good_heart'], reasonText: 'It leaks anyway — and people love it more because you didn’t publicize it.' } },
      { label: 'Bring the press', effects: { meters: { reputation: 6 }, reasonText: 'Good — but it reads as PR.' } },
    ],
  },
  {
    id: 'evt_morale_slump', title: 'The Fog', category: 'life:morale',
    stages: ['youth', 'break', 'prime', 'vet'], weightBase: 0.9, characterBias: 'neutral',
    scalesInverse: ['morale'], gates: { maxMeter: { morale: 40 } }, cooldownWeeks: 10,
    prompt: 'It’s not one thing. The joy has drained out of the game lately.',
    choices: [
      { label: 'Talk to someone about it', effects: { meters: { morale: 8, family: 3 }, reasonText: 'Saying it out loud helps more than you expected.' } },
      { label: 'Train through it', effects: { meters: { professionalism: 3, morale: 2 }, readiness: -4, reasonText: 'Work as medicine. It half-works.' } },
      { label: 'A big night to forget it', effects: { meters: { morale: 5, lifestyle: 5, professionalism: -3 }, readiness: -8, flags: ['parties_hard'], reasonText: 'It works tonight. Tomorrow is another question.' } },
    ],
  },
  {
    id: 'evt_family_call', title: 'The Call Home', category: 'life:family',
    stages: ['youth', 'break', 'prime'], weightBase: 1.0, characterBias: 'neutral',
    scalesInverse: ['family'], cooldownWeeks: 8,
    prompt: 'Your mother’s voice on the phone: "We never hear from you anymore."',
    choices: [
      { label: 'Fly them in for a visit', effects: { meters: { family: 10, morale: 6, finances: -3 }, cash: -10, tally: { family_points: 1 }, reasonText: 'Worth every penny. Home comes to you.' } },
      { label: 'Promise to call more — and mean it', effects: { meters: { family: 5 }, reasonText: 'A small repair, honestly made.' } },
      { label: 'You’re busy. They know that.', effects: { meters: { family: -6, morale: -2 }, reasonText: 'They do know. It still hurts them.' } },
    ],
  },
  {
    id: 'evt_boot_deal_small', title: 'First Boot Deal', category: 'life:finance',
    stages: ['break'], weightBase: 0.8, characterBias: 'neutral', seasonCap: 1,
    gates: { minMeter: { reputation: 35 } },
    prompt: 'A sports brand offers a modest first endorsement — boots and a little money.',
    choices: [
      { label: 'Sign it', effects: { meters: { finances: 6, reputation: 3 }, cash: 25, flags: ['sponsored'], reasonText: 'Your first crest beyond the club’s. It’s real now.' } },
      { label: 'Wait for something bigger', effects: { meters: { reputation: 1 }, reasonText: 'Selective — protects your value, risks the moment passing.' } },
    ],
  },
  {
    id: 'evt_gambling_creep', title: 'One More Bet', category: 'life:lifestyle',
    stages: ['break', 'prime'], weightBase: 0.5, characterBias: 'low',
    gates: { minMeter: { lifestyle: 45 } }, cooldownWeeks: 20,
    prompt: 'The card nights are getting bigger. It’s a lot of money now.',
    choices: [
      { label: 'Rein it in', effects: { meters: { professionalism: 5 }, flags: ['beat_habit'], tally: { pro_points: 1 }, reasonText: 'Pulled back in time.' } },
      { label: 'Keep chasing', effects: { meters: { finances: -8, morale: -3 }, cash: -50, flags: ['gambling_problem'], reasonText: 'A cautionary spiral begins — this compounds.' } },
    ],
  },
  {
    id: 'evt_derby_taunt', title: 'Bait', category: 'life:media',
    stages: ['break', 'prime'], weightBase: 0.7, characterBias: 'neutral',
    gates: { matchWithinDays: 3 }, cooldownWeeks: 10,
    prompt: 'A rival’s player mocks your club in an interview. Reporters want your reaction.',
    choices: [
      { label: 'Answer on the pitch', effects: { meters: { professionalism: 3, reputation: 2 }, tally: { pro_points: 1 }, reasonText: 'The classiest reply is a performance.' } },
      { label: 'Fire back', effects: { meters: { reputation: 4, lifestyle: 2 }, flags: ['cocky'], tally: { maverick_points: 1 }, reasonText: 'The headline writes itself. The fixture just got hotter.' } },
    ],
  },
  {
    id: 'evt_charity_ask', title: 'The Foundation', category: 'life:reputation',
    stages: ['break', 'prime', 'vet'], weightBase: 0.7, characterBias: 'high', cooldownWeeks: 16,
    gates: { minMeter: { reputation: 30 } },
    prompt: 'A local charity asks you to front their campaign.',
    choices: [
      { label: 'Give them a day', effects: { meters: { reputation: 6, morale: 4 }, flags: ['good_heart'], reasonText: 'A day well spent; the community remembers.' } },
      { label: 'Send money instead', effects: { meters: { reputation: 2, finances: -2 }, cash: -15, reasonText: 'Generous, at arm’s length.' } },
      { label: 'Pass this time', effects: { meters: {}, reasonText: 'Your week stays yours.' } },
    ],
  },
  {
    id: 'evt_crypto_pitch', title: 'The Sure Thing', category: 'life:finance',
    stages: ['prime', 'break'], weightBase: 0.5, characterBias: 'low',
    gates: { minMeter: { finances: 40 } }, seasonCap: 1, cooldownWeeks: 30,
    prompt: 'A "friend" pitches a can’t-miss investment.',
    choices: [
      { label: 'Go in big', effects: { meters: { finances: -12 }, cash: -200, flags: ['bad_investment'], reasonText: 'It missed. This arms future money trouble.' } },
      { label: 'Small stake only', effects: { meters: { finances: -3 }, cash: -30, reasonText: 'Limited downside; lesson purchased at a fair price.' } },
      { label: 'Pass', effects: { meters: { professionalism: 3 }, tally: { wealth_points: 1 }, reasonText: 'Disciplined. If it were sure, he wouldn’t need you.' } },
    ],
  },
  {
    id: 'evt_teammate_dive', title: 'The Dark Arts', category: 'career:relationships',
    stages: ['break', 'prime'], weightBase: 0.5, characterBias: 'neutral', cooldownWeeks: 20,
    prompt: 'A senior teammate wants you to go down easily next match to win a penalty.',
    choices: [
      { label: 'Refuse on principle', effects: { standing: -2, meters: { professionalism: 3 }, tally: { pro_points: 1 }, reasonText: 'Clean, slightly awkward in the dressing room.' } },
      { label: 'Do it if the chance comes', effects: { standing: 3, meters: { reputation: -3 }, flags: ['gamesmanship'], reasonText: 'Pragmatic. Football’s grey market.' } },
    ],
  },
  {
    id: 'evt_fan_moment', title: 'Small Thing, Big Story', category: 'life:reputation',
    stages: ['youth', 'break', 'prime'], weightBase: 0.5, characterBias: 'high', cooldownWeeks: 25,
    prompt: 'You return a fan’s dropped wallet, cash untouched. Someone filmed it.',
    choices: [
      { label: 'Think nothing of it', effects: { meters: { reputation: 8, morale: 4 }, flags: ['good_heart'], reasonText: 'A feel-good clip goes around the world.' } },
    ],
  },
  {
    id: 'evt_rival_form', title: 'Breathing Down Your Neck', category: 'career',
    stages: ['break', 'prime'], weightBase: 0.9, characterBias: 'neutral', cooldownWeeks: 8,
    gates: { minStatus: 'Rotation' },
    prompt: 'Your positional rival has hit form. The coach has noticed. Training this week has an edge to it.',
    choices: [
      { label: 'Rise to it — extra sessions', effects: { readiness: -6, meters: { professionalism: 4 }, standing: 3, reasonText: 'You answer competition with work. The staff clock it.' } },
      { label: 'Trust your level', effects: { meters: { morale: 2 }, reasonText: 'Calm is also an answer.' } },
    ],
  },
  {
    id: 'evt_sleepless_city', title: 'The City Never Sleeps', category: 'life:lifestyle',
    stages: ['break', 'prime'], weightBase: 0.8, characterBias: 'low',
    scalesWith: ['lifestyle'], gates: { minMeter: { lifestyle: 50 } }, cooldownWeeks: 8,
    prompt: 'You’re becoming a fixture of the city’s night scene. Doors open everywhere.',
    choices: [
      { label: 'Enjoy being young and famous', effects: { meters: { lifestyle: 6, morale: 4, professionalism: -3 }, readiness: -6, tally: { maverick_points: 1 }, reasonText: 'The city loves you back. Your hamstrings abstain.' } },
      { label: 'Step back from the scene', effects: { meters: { lifestyle: -6, professionalism: 4 }, tally: { pro_points: 1 }, reasonText: 'The scene will forget you. The scouts won’t.' } },
    ],
  },
  {
    id: 'evt_celebration_first_goal', title: 'Mark the Moment', category: 'life:celebration',
    stages: ['youth', 'break'], weightBase: 0, characterBias: 'neutral',
    prompt: 'Your first senior goal. The phone won’t stop. How do you celebrate?',
    choices: [
      { label: 'Big night out (€€)', effects: { meters: { morale: 8, lifestyle: 6 }, cash: -15, tally: { maverick_points: 1 }, reasonText: 'A night the group chat will never delete.' } },
      { label: 'Quiet dinner with family (€)', effects: { meters: { morale: 6, family: 8 }, cash: -4, tally: { family_points: 1 }, reasonText: 'The people from before the fame, at the table for the first of many.' } },
      { label: 'Frame the shirt, early night', effects: { meters: { professionalism: 4, morale: 3 }, tally: { pro_points: 1 }, reasonText: 'The moment banked, the routine intact.' } },
    ],
  },
  {
    id: 'evt_press_after_bad_run', title: 'The Vultures', category: 'life:media',
    stages: ['break', 'prime'], weightBase: 0.8, characterBias: 'neutral',
    scalesInverse: ['morale'], gates: { maxMeter: { morale: 45 }, minStatus: 'Rotation' }, cooldownWeeks: 12,
    prompt: 'Three poor games, and now a pundit says you’re "not up to it." Microphones wait outside training.',
    choices: [
      { label: 'Front up honestly', effects: { meters: { reputation: 5, professionalism: 3 }, reasonText: 'Owning a dip earns more respect than hiding from it.' } },
      { label: 'Say nothing, work', effects: { meters: { professionalism: 4, reputation: -2 }, tally: { pro_points: 1 }, reasonText: 'Silence reads cold — but the work is real.' } },
      { label: 'Snap at them', effects: { meters: { reputation: -6, morale: -2 }, flags: ['hothead'], reasonText: 'The clip loops all week.' } },
    ],
  },
  {
    id: 'evt_train_ground_prank', title: 'Initiation', category: 'career:relationships',
    stages: ['youth', 'break'], weightBase: 0.9, characterBias: 'neutral', seasonCap: 1,
    prompt: 'The squad’s initiation ritual: sing in front of everyone at lunch.',
    choices: [
      { label: 'Give it everything', effects: { meters: { morale: 6 }, standing: 4, reasonText: 'Terrible singing, perfect delivery. The room is yours.' } },
      { label: 'Mumble through it', effects: { meters: { morale: -2 }, reasonText: 'Survived. Barely.' } },
    ],
  },
  {
    id: 'evt_retirement_call', title: 'The Question', category: 'career',
    stages: ['vet', 'twilight'], weightBase: 0, characterBias: 'neutral', isMomentScreen: true,
    prompt: 'Another season done. The legs answer a little slower every year. Every player faces this moment — how do you want this story to end?',
    choices: [
      { label: 'Retire — end it on your terms', effects: { reasonText: 'The rarest thing in football: an ending you chose yourself.' } },
      { label: 'One more year', effects: { meters: { morale: 5 }, reasonText: 'The fire still burns. The game gets one more season of you.' } },
    ],
  },
  {
    id: 'evt_recovery_guru', title: 'The Recovery Guru', category: 'career:health',
    stages: ['break', 'prime', 'vet'], weightBase: 0.6, characterBias: 'high', cooldownWeeks: 20,
    gates: { minMeter: { professionalism: 55 } },
    prompt: 'A renowned recovery specialist offers to overhaul your routine — sleep, diet, cold work.',
    choices: [
      { label: 'Commit to the program', effects: { readiness: 8, meters: { professionalism: 5, lifestyle: -4 }, cash: -25, tally: { pro_points: 1 }, reasonText: 'Boring, expensive, effective — the professional’s trade.' } },
      { label: 'Take the free tips only', effects: { readiness: 3, reasonText: 'Half the value, none of the cost.' } },
    ],
  },
];

export const EVENTS: LifeEventDef[] = [...CORE_EVENTS, ...CHAIN_EVENTS, ...CULTURE_EVENTS];

export const EVENT_BY_ID: Record<string, LifeEventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
