'use client';

interface QuestionCardProps {
  leftLabel: string;
  rightLabel: string;
  leftStatement: string;
  rightStatement: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function QuestionCard({ 
  leftLabel, 
  rightLabel, 
  leftStatement, 
  rightStatement, 
  value, 
  onChange, 
  disabled = false 
}: QuestionCardProps) {
  const handleChange = (newValue: number) => {
    if (disabled) return;
    onChange(newValue);
  };

  return (
    <div className={`w-full animate-fade-in-up ${disabled ? 'grayscale-[0.8]' : ''}`}>
      <div className={`${disabled ? 'glass opacity-50 bg-gray-100/50' : 'glass-premium'} rounded-3xl sm:rounded-[2.5rem] p-2 sm:p-3 md:p-4 lg:p-5`}>
        {/* 좌측 문장 */}
        <div className="mb-2 sm:mb-3">
          <p className={`text-[26px] sm:text-xl md:text-2xl lg:text-3xl font-bold text-center leading-relaxed tracking-tight px-2 sm:px-4 break-keep ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {leftStatement}
          </p>
        </div>

        {/* 7점 척도 - 세로 배치 */}
        <div className={`flex items-center justify-center max-w-full overflow-visible mb-2 sm:mb-3 ${disabled ? 'opacity-50' : ''}`}>
          <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 items-start justify-center w-full px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            {/* 왼쪽: 닷들 세로 배치 */}
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 items-center">
              {[1, 2, 3].map((num) => {
                const getColor = () => {
                  if (disabled) {
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-gray-100/30',
                      text: 'text-gray-400'
                    };
                  }
                  
                  // 선택된 값에 따라 색상 변화
                  if (value === null) {
                    return {
                      border: 'border-[#D7177B]',
                      bg: 'bg-white/80',
                      text: 'text-gray-700'
                    };
                  }
                  
                  // 1-3: 좌측 성향 (보라색 계열)
                  if (num <= 3) {
                    return {
                      border: value === num ? 'border-[#551D83]' : 'border-[#551D83]/50',
                      bg: value === num ? 'bg-[#551D83]' : 'bg-white/80',
                      text: value === num ? 'text-white' : 'text-gray-700'
                    };
                  }
                  // 4: 중간 (회색)
                  if (num === 4) {
                    return {
                      border: value === num ? 'border-gray-500' : 'border-gray-300',
                      bg: value === num ? 'bg-gray-500' : 'bg-white/80',
                      text: value === num ? 'text-white' : 'text-gray-700'
                    };
                  }
                  // 5-7: 우측 성향 (마젠타 계열)
                  return {
                    border: value === num ? 'border-[#D7177B]' : 'border-[#D7177B]/50',
                    bg: value === num ? 'bg-[#D7177B]' : 'bg-white/80',
                    text: value === num ? 'text-white' : 'text-gray-700'
                  };
                };

                const colors = getColor();
                const isSelected = value === num && !disabled;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange(num)}
                    disabled={disabled}
                    className={`
                      w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 
                      min-w-6 min-h-6 sm:min-w-6 sm:min-h-6 md:min-w-8 md:min-h-8 lg:min-w-9 lg:min-h-9
                      rounded-full border-2 ${colors.border} box-border
                      aspect-square transition-all duration-300 flex items-center justify-center
                      relative group touch-manipulation flex-shrink-0 p-0
                      ${colors.text}
                      ${
                        disabled
                          ? `glass ${colors.bg} cursor-not-allowed opacity-50`
                          : isSelected
                          ? `${colors.bg} ${colors.border} scale-110 shadow-xl cursor-pointer`
                          : `glass ${colors.bg} active:scale-105 sm:hover:scale-110 sm:hover:shadow-lg cursor-pointer`
                      }
                    `}
                    style={{ aspectRatio: '1 / 1' }}
                    aria-label={`${num}번 선택`}
                  >
                    <span className="relative z-10 text-[10px] sm:text-[10px] md:text-xs lg:text-sm font-bold leading-none">
                      {isSelected ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
              {/* 구분선 */}
              <div className="w-full border-t-2 border-gray-300 my-1 sm:my-2"></div>
              {[5, 6, 7].map((num) => {
                const getColor = () => {
                  if (disabled) {
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-gray-100/30',
                      text: 'text-gray-400'
                    };
                  }
                  
                  // 선택된 값에 따라 색상 변화
                  if (value === null) {
                    return {
                      border: 'border-[#D7177B]',
                      bg: 'bg-white/80',
                      text: 'text-gray-700'
                    };
                  }
                  
                  // 5-7: 우측 성향 (마젠타 계열)
                  return {
                    border: value === num ? 'border-[#D7177B]' : 'border-[#D7177B]/50',
                    bg: value === num ? 'bg-[#D7177B]' : 'bg-white/80',
                    text: value === num ? 'text-white' : 'text-gray-700'
                  };
                };

                const colors = getColor();
                const isSelected = value === num && !disabled;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange(num)}
                    disabled={disabled}
                    className={`
                      w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 
                      min-w-6 min-h-6 sm:min-w-6 sm:min-h-6 md:min-w-8 md:min-h-8 lg:min-w-9 lg:min-h-9
                      rounded-full border-2 ${colors.border} box-border
                      aspect-square transition-all duration-300 flex items-center justify-center
                      relative group touch-manipulation flex-shrink-0 p-0
                      ${colors.text}
                      ${
                        disabled
                          ? `glass ${colors.bg} cursor-not-allowed opacity-50`
                          : isSelected
                          ? `${colors.bg} ${colors.border} scale-110 shadow-xl cursor-pointer`
                          : `glass ${colors.bg} active:scale-105 sm:hover:scale-110 sm:hover:shadow-lg cursor-pointer`
                      }
                    `}
                    style={{ aspectRatio: '1 / 1' }}
                    aria-label={`${num}번 선택`}
                  >
                    <span className="relative z-10 text-[10px] sm:text-[10px] md:text-xs lg:text-sm font-bold leading-none">
                      {isSelected ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 오른쪽: 라벨들 세로 배치 */}
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 items-start justify-center">
              {[1, 2, 3].map((num) => {
                // 라벨 텍스트 결정
                const getLabel = () => {
                  if (num === 1) return { text: '매우 동의', showArrow: true, arrowTop: true };
                  if (num === 2) return { text: '동의' };
                  if (num === 3) return { text: '약간 동의' };
                  if (num === 5) return { text: '약간 동의' };
                  if (num === 6) return { text: '동의' };
                  if (num === 7) return { text: '매우 동의', showArrow: true, arrowBottom: true };
                  return null;
                };

                const label = getLabel();

                if (!label) {
                  return null;
                }

                return (
                  <div key={num} className="flex items-center gap-1 sm:gap-1.5 h-6 sm:h-6 md:h-8 lg:h-9">
                    <span className={`text-[14px] sm:text-xs md:text-sm text-gray-600 ${disabled ? 'text-gray-400' : ''}`}>
                      {label.text}
                    </span>
                    {label.showArrow && label.arrowTop && (
                      <span className="text-[14px] sm:text-sm text-gray-600">⬆︎</span>
                    )}
                    {label.showArrow && label.arrowBottom && (
                      <span className="text-[14px] sm:text-sm text-gray-600">⬇︎</span>
                    )}
                  </div>
                );
              })}
              {/* 구분선 */}
              <div className="w-full border-t-2 border-gray-300 my-1 sm:my-2"></div>
              {[5, 6, 7].map((num) => {
                // 라벨 텍스트 결정
                const getLabel = () => {
                  if (num === 5) return { text: '약간 동의' };
                  if (num === 6) return { text: '동의' };
                  if (num === 7) return { text: '매우 동의', showArrow: true, arrowBottom: true };
                  return null;
                };

                const label = getLabel();

                if (!label) {
                  return null;
                }

                return (
                  <div key={num} className="flex items-center gap-1 sm:gap-1.5 h-6 sm:h-6 md:h-8 lg:h-9">
                    <span className={`text-[14px] sm:text-xs md:text-sm text-gray-600 ${disabled ? 'text-gray-400' : ''}`}>
                      {label.text}
                    </span>
                    {label.showArrow && label.arrowBottom && (
                      <span className="text-[14px] sm:text-sm text-gray-600">⬇︎</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 문장 */}
        <div>
          <p className={`text-[26px] sm:text-xl md:text-2xl lg:text-3xl font-bold text-center leading-relaxed tracking-tight px-2 sm:px-4 break-keep ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {rightStatement}
          </p>
        </div>
      </div>
    </div>
  );
}
