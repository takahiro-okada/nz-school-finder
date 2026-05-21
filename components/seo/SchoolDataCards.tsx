import type { SchoolRecord } from '@/lib/schools/types';
import { displayValue, formatValue } from '@/lib/schools/utils';

type SchoolDataCardsProps = {
  school: SchoolRecord;
};

export default function SchoolDataCards({ school }: SchoolDataCardsProps) {
  const cards = [
    { label: 'School type', value: displayValue(school.Org_Type) },
    { label: 'Authority', value: displayValue(school.Authority) },
    { label: 'City', value: displayValue(school.Add1_City) },
    { label: 'Students', value: formatValue(school.Total).toLocaleString('en-NZ') },
    { label: 'EQI index', value: displayValue(school.EQi_Index) },
    { label: 'Status', value: displayValue(school.Status) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">{card.label}</div>
          <div className="mt-2 text-lg font-semibold text-slate-950">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
