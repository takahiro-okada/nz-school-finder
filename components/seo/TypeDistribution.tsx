type TypeDistributionProps = {
  items: {
    label: string;
    count: number;
  }[];
  total: number;
};

export default function TypeDistribution({ items, total }: TypeDistributionProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;

        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
              <span>{item.label}</span>
              <span>{`${item.count} ${item.count === 1 ? 'school' : 'schools'}`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
