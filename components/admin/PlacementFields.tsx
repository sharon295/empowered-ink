"use client";

import { monthLabel, shiftMonth } from "@/lib/month";

export type PlacementValue = { placement: "featured" | "new_on_shelf" | null; placementMonth: string | null };

export const PLACEMENT_LABELS = {
  featured: "Featured This Month",
  new_on_shelf: "New on the Shelf",
} as const;

// Months offered in the picker: a few past (to correct mistakes or test)
// through a year ahead.
export function monthOptions(current: string, selected?: string | null): string[] {
  const months = Array.from({ length: 16 }, (_, i) => shiftMonth(current, i - 3));
  if (selected && !months.includes(selected)) months.push(selected);
  return months.sort();
}

export default function PlacementFields({
  value,
  onChange,
  currentMonth,
  idPrefix,
  compact = false,
}: {
  value: PlacementValue;
  onChange: (next: PlacementValue) => void;
  currentMonth: string;
  idPrefix: string;
  compact?: boolean;
}) {
  const selectClass = "border border-hairline bg-white px-2.5 py-2 text-[13.5px] text-ink";
  return (
    <div className={`flex flex-wrap items-end gap-3 ${compact ? "" : "mb-2"}`}>
      <div>
        <label htmlFor={`${idPrefix}-placement`} className="label mb-1 block text-[14px] text-soft">
          Show in
        </label>
        <select
          id={`${idPrefix}-placement`}
          value={value.placement ?? ""}
          onChange={(e) => {
            const placement = (e.target.value || null) as PlacementValue["placement"];
            onChange({ placement, placementMonth: placement ? value.placementMonth ?? currentMonth : null });
          }}
          className={selectClass}
        >
          <option value="featured">{PLACEMENT_LABELS.featured}</option>
          <option value="new_on_shelf">{PLACEMENT_LABELS.new_on_shelf}</option>
          <option value="">A–Z list only</option>
        </select>
      </div>
      {value.placement && (
        <div>
          <label htmlFor={`${idPrefix}-month`} className="label mb-1 block text-[14px] text-soft">
            For the month of
          </label>
          <select
            id={`${idPrefix}-month`}
            value={value.placementMonth ?? currentMonth}
            onChange={(e) => onChange({ ...value, placementMonth: e.target.value })}
            className={selectClass}
          >
            {monthOptions(currentMonth, value.placementMonth).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
                {m === currentMonth ? " (this month)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function placementSummary(
  placement: PlacementValue["placement"],
  month: string | null,
  currentMonth: string
): string {
  if (!placement || !month) return "Shows in the A–Z list.";
  const label = PLACEMENT_LABELS[placement];
  if (month < currentMonth) return `Was in ${label} for ${monthLabel(month)}; now in the A–Z list.`;
  if (month > currentMonth)
    return `Hidden until ${monthLabel(month)} starts, then in ${label} for that month, then the A–Z list.`;
  return `In ${label} through the end of ${monthLabel(month)}, then the A–Z list.`;
}
