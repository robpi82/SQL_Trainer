export function ProgressBar({ percent, label, small }: { percent: number; label: string; small?: boolean }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={small ? 'progress small' : 'progress'}>
      <div className="progress-track" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="progress-fill" style={{ width: `${p}%` }} />
      </div>
      <span className="progress-num">{p} %</span>
    </div>
  );
}
