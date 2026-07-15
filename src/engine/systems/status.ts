// The status ladder: Youth → Backup → Rotation → Regular → Star.
// Movement from minutes share (rolling window) + ability vs rivals.
import type { CareerState, Reason, StatusRung } from '../types/core';
import { STATUS } from '../data/constants';
import { yourSelectionScore } from './selection';
import { reason, up, down } from './reason';

export const STATUS_ORDER: StatusRung[] = ['Youth', 'Backup', 'Rotation', 'Regular', 'Star'];

export function statusAtLeast(s: StatusRung, min: StatusRung): boolean {
  return STATUS_ORDER.indexOf(s) >= STATUS_ORDER.indexOf(min);
}

export function minutesShare(state: CareerState): number {
  const log = state.you.minutesLog.slice(-STATUS.windowWeeks);
  if (log.length === 0) return 0;
  return log.reduce((a, b) => a + b, 0) / (log.length * 90);
}

export function updateStatus(state: CareerState): { from: StatusRung; to: StatusRung; reason: Reason } | null {
  const { you } = state;
  if (you.status === 'Youth') return null; // promotion out of Youth is the call-up moment
  const share = minutesShare(state);
  const score = yourSelectionScore(state);
  const idx = STATUS_ORDER.indexOf(you.status);

  const thresholds: Partial<Record<StatusRung, number>> = {
    Backup: STATUS.backupToRotation,
    Rotation: STATUS.rotationToRegular,
    Regular: STATUS.regularToStar,
  };
  const upThreshold = thresholds[you.status];

  if (upThreshold !== undefined && share > upThreshold && you.minutesLog.length >= 4) {
    const to = STATUS_ORDER[idx + 1];
    const from = you.status;
    you.status = to;
    return {
      from, to,
      reason: reason(`Promoted to ${to} — you're earning it on the pitch.`, [
        up(`playing ${Math.round(share * 100)}% of available minutes`, 2),
        up('the coach trusts your level', 1),
      ]),
    };
  }

  // demotion: minutes dried up well below the rung you hold
  const holdThreshold = idx >= 2 ? (thresholds[STATUS_ORDER[idx - 1]] ?? 0.2) * STATUS.demotionSlack : null;
  if (holdThreshold !== null && you.minutesLog.length >= STATUS.windowWeeks && share < holdThreshold) {
    const to = STATUS_ORDER[idx - 1];
    const from = you.status;
    you.status = to;
    return {
      from, to,
      reason: reason(`Slipped to ${to} — the minutes have dried up.`, [
        down(`only ${Math.round(share * 100)}% of minutes lately`, 2),
        score < 60 ? down('rivals are outperforming you', 1) : down('rotation and selection calls went against you', 1),
      ]),
    };
  }
  return null;
}
