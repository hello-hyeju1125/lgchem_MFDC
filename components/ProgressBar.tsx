interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-5">
        <span className="text-base sm:text-lg md:text-xl font-bold text-gray-700 tracking-tight">
          진행률
        </span>
        <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-magenta bg-clip-text text-transparent">
          {current} / {total}
        </span>
      </div>
      <div className="w-full bg-brand-light-gray/30 rounded-full h-3 sm:h-4 overflow-hidden backdrop-blur-sm shadow-inner">
        <div
          className="h-3 sm:h-4 rounded-full bg-gradient-to-r from-brand-purple to-brand-magenta transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

