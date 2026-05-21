type EthnicityDistributionProps = {
  items: {
    key: string;
    label: string;
    value: number;
    percentage: number;
  }[];
};

export default function EthnicityDistribution({ items }: EthnicityDistributionProps) {
  if (!items.length) {
    return <p className="text-sm text-slate-600">Ethnicity breakdown is not available for this school.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
            <span>{item.label}</span>
            <span>{`${item.value.toLocaleString('en-NZ')} students (${item.percentage.toFixed(1)}%)`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
