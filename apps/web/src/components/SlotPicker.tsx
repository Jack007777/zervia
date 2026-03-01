'use client';

type Props = {
  slots: string[];
  selected?: string;
  onSelect: (slot: string) => void;
};

export function SlotPicker({ slots, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const timeLabel = slot.slice(11, 16);
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
