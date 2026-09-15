type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total === 0 ? 0 : (current / total) * 100;

  return (
    <div className="progressSection">
      <div className="progressHeader">
        <span>
          {current} / {total} learned
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="progressTrack" aria-label="Learning progress">
        <div className="progressFill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
