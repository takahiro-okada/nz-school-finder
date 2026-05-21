'use client';

import type { EthnicityField, SchoolRecord } from '@/lib/schools/types';
import { TYPE_CONFIG } from '@/lib/schools/constants';
import { buildSchoolLink, displayValue, formatValue } from '@/lib/schools/utils';
import EthnicityBar from './EthnicityBar';

type SchoolDetailsPanelProps = {
  selected: SchoolRecord | null;
  boundaryFound: boolean | null;
  ethnicityFields: EthnicityField[];
  labels: {
    totalLocations: string;
    clickPrompt: string;
    decile: string;
    totalStudents: string;
    nationality: string;
    total: (count: string) => string;
    viewSite: string;
    viewYearData: string;
  };
};

export default function SchoolDetailsPanel({
  selected,
  boundaryFound,
  ethnicityFields,
  labels,
}: SchoolDetailsPanelProps) {
  return (
    <aside className={`w-full overflow-y-auto border-t border-slate-200 bg-white lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0 ${
      selected ? 'max-h-[34dvh]' : 'max-h-20'
    }`}>
      <div className="p-3 sm:p-6">
        <div className="mb-3 sm:mb-6">
          <span className="text-sm text-slate-500">{labels.totalLocations}</span>
        </div>

        {selected ? (
          <SchoolSummary selected={selected} boundaryFound={boundaryFound} />
        ) : (
          <div className="flex min-h-32 items-center justify-center lg:h-[calc(100dvh-200px)]">
            <p className="text-center text-slate-400">{labels.clickPrompt}</p>
          </div>
        )}

        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label={labels.decile} value={displayValue(selected.EQi_Index)} />
              <MetricCard label={labels.totalStudents} value={displayValue(selected.Total)} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{labels.nationality}</p>
                <p className="text-sm text-slate-500">{labels.total(displayValue(selected.Total))}</p>
              </div>

              <div className="space-y-3">
                {(() => {
                  const totalPopulation =
                    formatValue(selected.Total) ||
                    ethnicityFields.reduce((sum, field) => sum + formatValue(selected[field.key]), 0) ||
                    1;

                  return ethnicityFields.map((field) => {
                    const value = formatValue(selected[field.key]);
                    const percentage = totalPopulation ? (value / totalPopulation) * 100 : 0;
                    return <EthnicityBar key={field.key} label={field.label} value={value} percentage={percentage} />;
                  });
                })()}
              </div>
            </div>

            <SchoolLinks selected={selected} viewSite={labels.viewSite} viewYearData={labels.viewYearData} />
          </div>
        )}
      </div>
    </aside>
  );
}

function SchoolSummary({
  selected,
  boundaryFound,
}: {
  selected: SchoolRecord;
  boundaryFound: boolean | null;
}) {
  const typeConfig = TYPE_CONFIG[String(selected.Org_Type ?? '')];
  const typeLabel = typeConfig
    ? `${typeConfig.label}${typeConfig.years ? ` (${typeConfig.years})` : ''}`
    : displayValue(selected.Org_Type);

  return (
    <div className="mb-5 sm:mb-6">
      <h2 className="mb-2 text-xl font-bold text-slate-950">{displayValue(selected.Org_Name)}</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
        <span className="text-sm text-slate-500">
          {`${typeLabel} · ${displayValue(selected.Authority)} · ${displayValue(selected.Add1_City)}`}
        </span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
          boundaryFound === true
            ? 'border border-sky-200 bg-sky-100 text-sky-800'
            : boundaryFound === false
            ? 'border border-rose-200 bg-rose-100 text-rose-800'
            : 'border border-slate-200 bg-slate-100 text-slate-700'
        }`}>
          {boundaryFound === true ? '学区あり' : boundaryFound === false ? '学区データなし' : '学区確認中'}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SchoolLinks({
  selected,
  viewSite,
  viewYearData,
}: {
  selected: SchoolRecord;
  viewSite: string;
  viewYearData: string;
}) {
  const schoolLink = buildSchoolLink(selected);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <a
        href={String(selected.URL ?? '#')}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        {viewSite}
      </a>
      {schoolLink ? (
        <a
          href={schoolLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          {viewYearData}
        </a>
      ) : null}
    </div>
  );
}
