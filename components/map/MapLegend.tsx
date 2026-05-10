import { SCHOOL_TYPE_GROUPS, TYPE_CONFIG } from '@/lib/schools/constants';

export default function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] hidden max-w-[calc(100vw-1.5rem)] rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-4 sm:block">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Legend</div>
      <div className="space-y-1">
        {SCHOOL_TYPE_GROUPS.slice(1).map((group) => {
          const typeConfig = TYPE_CONFIG[group.values[0]];
          const color = typeConfig?.color ?? '#2563eb';
          const label = typeConfig?.label ?? group.label;
          const years = typeConfig?.years ?? '';

          return (
            <div key={group.key} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-700">{label}</span>
              {years && <span className="text-xs text-slate-500">{years}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
