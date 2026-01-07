'use client';

interface QuestionCardProps {
  statement: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function QuestionCard({ 
  statement, 
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
      <div className={`${disabled ? 'glass opacity-50 bg-gray-100/50' : 'glass-premium'} rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10`}>
        {/* 문항 문장 */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <p className={`text-[24px] sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed tracking-tight text-center break-keep ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {statement}
          </p>
        </div>

        {/* 7점 리커트 척도 선택 영역 - 닷 형태 */}
        <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* 7개 닷 버튼들 */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-4 md:gap-6 lg:gap-8 w-full px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = value === num && !disabled;
                
                // 선택된 값에 따라 색상 변화
                const getColor = () => {
                  if (disabled) {
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-gray-100/30',
                      text: 'text-gray-400'
                    };
                  }
                  
                  if (isSelected) {
                    // 선택된 경우: 그라데이션 색상
                    if (num <= 3) {
                      return {
                        border: 'border-[#551D83]',
                        bg: 'bg-[#551D83]',
                        text: 'text-white'
                      };
                    } else if (num === 4) {
                      return {
                        border: 'border-gray-500',
                        bg: 'bg-gray-500',
                        text: 'text-white'
                      };
                    } else {
                      return {
                        border: 'border-[#D7177B]',
                        bg: 'bg-[#D7177B]',
                        text: 'text-white'
                      };
                    }
                  } else {
                    // 선택되지 않은 경우
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-white/80',
                      text: 'text-gray-700'
                    };
                  }
                };

                const colors = getColor();

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange(num)}
                    disabled={disabled}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                      min-w-10 min-h-10 sm:min-w-12 sm:min-h-12 md:min-w-14 md:min-h-14 lg:min-w-16 lg:min-h-16
                      rounded-full border-2 ${colors.border} ${colors.bg}
                      transition-all duration-300 flex items-center justify-center
                      relative group touch-manipulation flex-shrink-0
                      ${disabled 
                        ? 'cursor-not-allowed opacity-50' 
                        : isSelected
                        ? 'scale-110 shadow-xl cursor-pointer'
                        : 'hover:scale-105 active:scale-95 cursor-pointer hover:shadow-lg'
                      }
                    `}
                    style={{ aspectRatio: '1 / 1' }}
                    aria-label={`${num}점 선택`}
                  >
                    <span className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${colors.text}`}>
                      {num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
