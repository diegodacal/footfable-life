// Cross-nation transfers: incoming offers (windows only), the AI market that
// keeps 288 rosters moving, and your accept/reject with real consequences.
// ENGINE INVARIANT: a transfer changes clubId only — nationality never moves.
import type { CareerState, Club, NpcPlayer, StatusRung } from '../types/core';
import { ECONOMY, SQUAD } from '../data/constants';
import { NATION_BY_ID } from '../data/nations';
import { weightedAbility } from '../data/positions';
import { childSeed, clamp, mulberry32, pick, rint, type Rng } from '../rng';
import { clubById } from './league';
import { reason, up, flat } from './reason';

// ---------------------------------------------------------------------------
// Incoming offers
// ---------------------------------------------------------------------------

export function maybeGenerateOffer(state: CareerState): void {
  if (state.phase !== 'senior') return;
  const inWindow = state.calendar.windowWeeks.includes(state.week);
  // expire stale offers
  state.offers = state.offers.filter((o) => o.expiresWeek >= state.absoluteWeek);
  if (!inWindow) { if (!state.calendar.windowWeeks.some((w) => w > state.week)) state.offers = []; return; }
  if (state.offers.length >= 2) return;

  const rng = mulberry32(childSeed(state.seed, `offer:${state.absoluteWeek}`));
  const { you } = state;
  const requested = 'transfer_requested' in state.flags;
  const avg = you.season.ratingCount > 0 ? you.season.ratingSum / you.season.ratingCount : 6;
  let p = 0.10
    + (you.meters.reputation / 100) * 0.25
    + Math.max(0, avg - 6.5) * 0.2
    + (you.status === 'Star' ? 0.15 : you.status === 'Regular' ? 0.1 : 0)
    + (requested ? 0.3 : 0);
  if (rng() > clamp(p, 0.05, 0.75)) return;

  const myClub = clubById(state.world, state.clubId);
  const yourLevel = weightedAbility(you.attributes, you.position);
  // suitor pool: clubs within a band around your level+rep; abroad opens with reputation
  const abroadOk = you.meters.reputation >= 35 || requested;
  const candidates = state.world.clubs.filter((c) => {
    if (c.id === state.clubId) return false;
    if (!abroadOk && c.nationId !== you.nationId) return false;
    const fit = c.strength - (yourLevel * 0.6 + you.meters.reputation * 0.25);
    return fit > -18 && fit < 14;
  });
  if (candidates.length === 0) return;
  const club = pick(rng, candidates);
  const rolePromise = promiseRole(state, club, rng);
  const wageMult = 0.9 + rng() * 0.5 + (club.strength - myClub.strength) * 0.01;
  const windowEnd = state.calendar.windowWeeks[state.calendar.windowWeeks.length - 1];
  const nation = NATION_BY_ID[club.nationId];
  state.offers.push({
    id: `offer_${state.absoluteWeek}_${club.id}`,
    clubId: club.id,
    rolePromise,
    wageMult: Math.round(wageMult * 100) / 100,
    expiresWeek: state.absoluteWeek + (windowEnd - state.week) + 1,
    reason: reason(`${club.name} (${nation.name}, Div ${club.division}) want you.`, [
      up(you.meters.reputation >= 50 ? 'your reputation travels' : 'scouts filed strong reports', 2),
      avg > 6.8 ? up(`averaging ${avg.toFixed(1)} this season`, 1) : flat('they back their own judgement'),
      requested ? up('word is out that you want a move', 1) : flat(`they see you as a ${rolePromise}`),
    ]),
  });
}

function promiseRole(state: CareerState, club: Club, rng: Rng): StatusRung {
  const yourScore = weightedAbility(state.you.attributes, state.you.position);
  const rivals = state.world.players.filter((p) => p.clubId === club.id && p.squad === 'senior' && p.position === state.you.position);
  const better = rivals.filter((r) => r.ability > yourScore + 3).length;
  const slots = SQUAD.slots[state.you.position];
  if (better < slots) return rng() < 0.4 ? 'Star' : 'Regular';
  if (better < slots + 1) return 'Rotation';
  return 'Backup';
}

// ---------------------------------------------------------------------------
// Accept / reject / request — the player's levers
// ---------------------------------------------------------------------------

export function acceptOffer(state: CareerState, offerId: string): void {
  const offer = state.offers.find((o) => o.id === offerId);
  if (!offer) return;
  const from = clubById(state.world, state.clubId);
  const to = clubById(state.world, offer.clubId);
  const abroad = to.nationId !== state.you.profile.origin;
  const wasAbroad = from.nationId !== state.you.profile.origin;

  // the move: clubId changes; nationality NEVER does (engine invariant)
  const oldClubId = state.clubId;
  state.clubId = offer.clubId;
  state.seasonsAtClub = 0;
  state.you.standing = 45;                      // a new coach, a clean slate
  state.you.weeklyWage = Math.round(ECONOMY.wageByStatus[state.you.status]
    * (1 + ECONOMY.clubStrengthWageSlope * (to.strength - 60)) * offer.wageMult * 10) / 10;
  state.you.minutesLog = [];
  state.offers = [];
  delete state.flags['transfer_requested'];
  if (to.strength > from.strength + 4) state.flags['moved_up'] = state.absoluteWeek;

  // keep rosters legal: their weakest in your position moves the other way
  const displaced = state.world.players
    .filter((p) => p.clubId === offer.clubId && p.squad === 'senior' && p.position === state.you.position)
    .sort((a, b) => a.ability - b.ability)[0];
  if (displaced) displaced.clubId = oldClubId;

  state.milestones.push({
    id: `ms_transfer_${state.absoluteWeek}`, week: state.week, season: state.season,
    title: abroad && !wasAbroad ? `The big move abroad — ${to.name}` : `Transferred to ${to.name}`,
    detail: `${NATION_BY_ID[to.nationId].name}, Division ${to.division}. They see you as a ${offer.rolePromise}.`,
    kind: 'transfer',
  });
  state.news.unshift({ season: state.season, week: state.week, text: `${state.you.name} joins ${to.name} (${NATION_BY_ID[to.nationId].name}).` });
  if (abroad && !wasAbroad) {
    // arriving in a foreign league arms the far-from-home life layer via gates
    state.flags['recent_move_abroad'] = state.absoluteWeek;
  }
}

export function rejectOffer(state: CareerState, offerId: string): void {
  const offer = state.offers.find((o) => o.id === offerId);
  if (!offer) return;
  const to = clubById(state.world, offer.clubId);
  const from = clubById(state.world, state.clubId);
  state.offers = state.offers.filter((o) => o.id !== offerId);
  if (to.strength > from.strength + 4) {
    // turning down a bigger club is loyalty, banked
    state.tallies.loyalty_points = (state.tallies.loyalty_points ?? 0) + 1;
    state.flags['stayed_loyal'] = state.absoluteWeek;
  }
}

export function requestTransfer(state: CareerState): void {
  if (state.phase !== 'senior' || 'transfer_requested' in state.flags) return;
  state.flags['transfer_requested'] = state.absoluteWeek;
  state.you.standing = clamp(state.you.standing - 8, 0, 100);
  state.news.unshift({ season: state.season, week: state.week, text: `${state.you.name} has told the club he wants to move on.` });
}

// ---------------------------------------------------------------------------
// The AI market — the other 6,000 players move too
// ---------------------------------------------------------------------------

export function runAiTransferWindow(state: CareerState, label: string): void {
  const rng = mulberry32(childSeed(state.seed, `aimarket:${label}`));
  const moves = 30 + rint(rng, 0, 15);
  const clubs = state.world.clubs;
  for (let i = 0; i < moves; i++) {
    // a buyer, weighted by budget tier
    const buyer = pick(rng, clubs.filter((c) => c.budgetTier >= 3));
    const positions = ['ST', 'CM', 'CB'] as const;
    const pos = pick(rng, positions);
    // target: the best player at a weaker club (anywhere in the world)
    const sellers = clubs.filter((c) => c.id !== buyer.id && c.strength < buyer.strength - 3);
    if (sellers.length === 0) continue;
    const seller = pick(rng, sellers);
    const target = state.world.players
      .filter((p) => p.clubId === seller.id && p.squad === 'senior' && p.position === pos && p.age <= 29 && p.clubId !== state.clubId)
      .sort((a, b) => b.ability - a.ability)[0];
    if (!target) continue;
    const makeweight = state.world.players
      .filter((p) => p.clubId === buyer.id && p.squad === 'senior' && p.position === pos)
      .sort((a, b) => a.ability - b.ability)[0];
    // the swap keeps both rosters legal; nationality untouched on both sides
    target.clubId = buyer.id;
    if (makeweight) makeweight.clubId = seller.id;
    if (i < 6) {
      state.news.unshift({
        season: state.season, week: state.week,
        text: `${target.name} (${NATION_BY_ID[target.nationId].name.slice(0, 3).toUpperCase()}) moves to ${buyer.name}.`,
      });
    }
  }
  if (state.news.length > 24) state.news.length = 24;
}

/** Is the player currently playing outside their origin nation? */
export function playingAbroad(state: CareerState): boolean {
  return clubById(state.world, state.clubId).nationId !== state.you.profile.origin;
}

/** Does the current club's climate clash with the player's origin climate? */
export function climateClash(state: CareerState): boolean {
  const clubNation = NATION_BY_ID[clubById(state.world, state.clubId).nationId];
  return clubNation.climate !== state.you.profile.climateOrigin;
}

export function nextWindowWeek(state: CareerState): number | null {
  for (const w of state.calendar.windowWeeks) if (w >= state.week) return w;
  return null;
}

export function playerOfClub(state: CareerState, clubId: string): NpcPlayer[] {
  return state.world.players.filter((p) => p.clubId === clubId && p.squad === 'senior');
}
