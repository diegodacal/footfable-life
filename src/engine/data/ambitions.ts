// The Ambitions catalog — the player-authored goals framework (M1 set).
// Ambitions grant STORY, never power (DESIGN_DECISIONS.md §3.3).
import type { AmbitionDef } from '../types/core';

export const AMBITIONS: AmbitionDef[] = [
  {
    id: 'amb_break_in', title: 'Break into the first team',
    flavor: 'Youth football is a waiting room. Get out of it.',
    horizon: 'season', metric: { kind: 'status_reach', target: 'Backup' },
    gates: { maxStatus: 'Youth' },
  },
  {
    id: 'amb_rotation', title: 'Become part of the rotation',
    flavor: 'Not a tourist in the squad — a name the coach writes without thinking.',
    horizon: 'season', metric: { kind: 'status_reach', target: 'Rotation' },
    gates: { maxStatus: 'Backup' },
  },
  {
    id: 'amb_regular', title: 'Make the shirt yours',
    flavor: 'Own the position. Make dropping you unthinkable.',
    horizon: 'season', metric: { kind: 'status_reach', target: 'Regular' },
    gates: { maxStatus: 'Rotation' },
  },
  {
    id: 'amb_star', title: 'Become the star of this team',
    flavor: 'The name on the back sells shirts. Make it yours.',
    horizon: 'career', metric: { kind: 'status_reach', target: 'Star' },
    gates: { maxStatus: 'Regular' },
  },
  {
    id: 'amb_goals_5', title: 'Five goals this season',
    flavor: 'A striker is judged by one column. Start filling it.',
    horizon: 'season', metric: { kind: 'goals_season', target: 5 },
  },
  {
    id: 'amb_goals_12', title: 'Twelve goals this season',
    flavor: 'Not a contributor — a threat. Every defender should know your run.',
    horizon: 'season', metric: { kind: 'goals_season', target: 12 },
    gates: { minStatus: 'Rotation' },
  },
  {
    id: 'amb_rating_70', title: 'Average a 7.0 season',
    flavor: 'Consistency is the rarest skill. Never be the weak link.',
    horizon: 'season', metric: { kind: 'rating_season', target: 7.0 },
    gates: { minStatus: 'Rotation' },
  },
  {
    id: 'amb_starts_15', title: 'Start 15 matches',
    flavor: 'Substitutes get moments. Starters get careers.',
    horizon: 'season', metric: { kind: 'starts_season', target: 15 },
    gates: { minStatus: 'Backup' },
  },
  {
    id: 'amb_save_100', title: 'Put away a real nest egg',
    flavor: 'Careers are short. The money should outlive the legs.',
    horizon: 'season', metric: { kind: 'save_cash', target: 100 },
  },
  {
    id: 'amb_reputation_50', title: 'Make a name beyond the club',
    flavor: 'Play so they talk about you in cities you’ve never visited.',
    horizon: 'season', metric: { kind: 'meter_reach', meter: 'reputation', target: 50 },
  },
  {
    id: 'amb_win_league', title: 'Win the league',
    flavor: 'A medal is the only argument nobody can answer.',
    horizon: 'season', metric: { kind: 'win_league' },
    gates: { minStatus: 'Rotation' },
  },
  {
    id: 'amb_family_first', title: 'Keep the family close',
    flavor: 'Fame eats people who forget where they came from. Don’t be one.',
    horizon: 'season', metric: { kind: 'meter_reach', meter: 'family', target: 75 },
  },
  {
    id: 'amb_model_pro', title: 'Be the standard-setter',
    flavor: 'Let the staff point at you when they explain what professional means.',
    horizon: 'season', metric: { kind: 'meter_reach', meter: 'professionalism', target: 75 },
  },
];

export const AMBITION_BY_ID: Record<string, AmbitionDef> = Object.fromEntries(
  AMBITIONS.map((a) => [a.id, a]),
);
