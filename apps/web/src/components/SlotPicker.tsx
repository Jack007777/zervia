'use client';

type Props = {
  slots: string[];
  selected?: string;
  onSelect: (slot: string) => void;
};

function toBerlinTimeLabel(slot: string) {
  const parsed = Date.parse(slot);
  if (!Number.isFinite(parsed)) {
    return slot.slice(11, 16);
  }
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed));
}

export function SlotPicker({ slots, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const timeLabel = toBerlinTimeLabel(slot);
        const active = selected === slot;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-xl border px-3 py-2 text-sm ${
              active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white'
            }`}
          >
            {timeLabel}
          </button>
        );
      })}
    </div>
  );
}
