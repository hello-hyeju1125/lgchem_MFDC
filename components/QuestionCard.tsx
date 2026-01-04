'use client';

interface QuestionCardProps {
  statement: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function QuestionCard({ statement, value, onChange, disabled = false }: QuestionCardProps) {
  const handleChange = (newValue: number) => {
    if (disabled) return;
    onChange(newValue);
  };

  return (
    <div className={`w-full animate-fade-in-up ${disabled ? 'grayscale-[0.8]' : ''}`}>
      <div className={`${disabled ? 'glass opacity-50 bg-gray-100/50' : 'glass-premium'} rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16`}>
        <p className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-center leading-[1.5] tracking-tight mb-6 sm:mb-8 md:mb-10 lg:mb-12 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {statement}
        </p>

        <div className={`flex items-center justify-center max-w-full overflow-visible ${disabled ? 'opacity-50' : ''}`}>
          <div className="flex gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 items-center justify-center w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              // 각 숫자에 따른 색상 결정 - 모두 동일한 마젠타 색상
              const getColor = () => {
                if (disabled) {
                  return {
                    border: 'border-gray-300',
                    bg: 'bg-gray-100/30',
                    text: 'text-gray-400'
                  };
                }
                
                // 1-7번 모두 동일한 마젠타 색상
                return {
                  border: 'border-[#D7177B]',
                  bg: 'bg-[#D7177B]',
                  text: 'text-white'
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
                    w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-[4.5rem] xl:h-[4.5rem] rounded-full border sm:border-2 ${colors.border}
                    transition-all duration-300 flex items-center justify-center font-bold 
                    text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                    relative group touch-manipulation flex-shrink-0 min-w-0
                    ${
                      disabled
                        ? `glass ${colors.bg} ${colors.text} cursor-not-allowed opacity-50`
                        : isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text} scale-110 shadow-xl cursor-pointer`
                        : `glass bg-white/80 text-gray-700 active:scale-105 sm:hover:scale-110 sm:hover:shadow-lg cursor-pointer`
                    }
                  `}
                >
                  <span className="relative z-10">{num}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

