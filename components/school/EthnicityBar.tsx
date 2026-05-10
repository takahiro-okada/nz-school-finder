type EthnicityBarProps = {
  label: string;
  value: number;
  percentage: number;
};

export default function EthnicityBar({ label, value, percentage }: EthnicityBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span>{`${value}人 (${percentage.toFixed(1)}%)`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
