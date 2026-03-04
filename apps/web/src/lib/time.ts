const BERLIN_TIMEZONE = 'Europe/Berlin';

export function parseIsoToMs(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function isFutureOrNowSlot(value?: string | null, nowMs = Date.now()): boolean {
  const slotMs = parseIsoToMs(value);
  if (slotMs === null) {
    return false;
  }
  return slotMs >= nowMs;
}

export function formatBerlinDateTime(value?: string | null, locale: string = 'de-DE'): string {
  const slotMs = parseIsoToMs(value);
  if (slotMs === null) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: BERLIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(slotMs));
}

export function filterFutureSlots(slots: string[], nowMs = Date.now()): string[] {
  return slots.filter((slot) => isFutureOrNowSlot(slot, nowMs));
}

export function nearestFutureSlot(slots: Array<string | undefined | null>, nowMs = Date.now()): string | null {
  let best: string | null = null;
  let bestMs = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const slotMs = parseIsoToMs(slot);
    if (slotMs === null || slotMs < nowMs) {
      continue;
    }
    if (slotMs < bestMs) {
      bestMs = slotMs;
      best = slot ?? null;
    }
  }

  return best;
}

export function getBerlinNowIso(): string {
  // Stored as ISO UTC instant but intended for Berlin-context business logic.
  return new Date().toISOString();
}
