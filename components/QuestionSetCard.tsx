'use client';

interface QuestionSetCardProps {
  question1: {
    id: string;
    statement: string;
    dimension: string;
  };
  question2: {
    id: string;
    statement: string;
    dimension: string;
  };
  value1: number | null; // 왼쪽 문항 점수 (1-7)
  value2: number | null; // 오른쪽 문항 점수 (1-7)
  onChange: (value1: number, value2: number) => void; // 두 점수의 합이 7이 되도록
  disabled?: boolean;
}

export default function QuestionSetCard({
  question1,
  question2,
  value1,
  value2,
  onChange,
  disabled = false,
}: QuestionSetCardProps) {
  // 총 점수 (value1 + value2, 최대 7)
  const totalScore = (value1 || 0) + (value2 || 0);
  
  // 닷 클릭 핸들러: 닷의 위치에 따라 점수 배분
  // 왼쪽 끝 닷(1) = 왼쪽 문항 높은 점수, 오른쪽 끝 닷(6) = 오른쪽 문항 높은 점수
  const handleDotClick = (dotPosition: number) => {
    if (disabled) return;
    // dotPosition: 1(왼쪽 끝) ~ 6(오른쪽 끝)
    // 왼쪽 끝(1) → 왼쪽 6점, 오른쪽 1점
    // 오른쪽 끝(6) → 왼쪽 1점, 오른쪽 6점
    const leftScore = 7 - dotPosition; // 1→6, 2→5, 3→4, 4→3, 5→2, 6→1
    const rightScore = dotPosition;    // 1→1, 2→2, 3→3, 4→4, 5→5, 6→6
    onChange(leftScore, rightScore);
  };

  return (
    <div className={`w-full animate-fade-in-up ${disabled ? 'grayscale-[0.8]' : ''}`}>
      <div className={`${disabled ? 'glass opacity-50 bg-gray-100/50' : 'glass-premium'} rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6`}>
        {/* 모든 화면 크기에서 동일한 레이아웃: 위에 문항, 아래에 닷 */}
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
          {/* 첫 번째 행: 두 문항 가로 배치 */}
          <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-stretch">
            {/* 왼쪽 문항 */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="mb-2 sm:mb-3 md:mb-4">
                <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-relaxed text-center break-keep ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  {question1.statement}
                </p>
              </div>
              {/* 왼쪽 점수 표시 */}
              <div className="flex justify-center items-center">
                <span className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${disabled ? 'text-gray-400' : value1 && value1 > 3 ? 'text-[#D7177B]' : value1 && value1 < 3 ? 'text-[#551D83]' : 'text-gray-500'}`}>
                  {value1 || 0}
                </span>
              </div>
            </div>

            {/* 오른쪽 문항 */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="mb-2 sm:mb-3 md:mb-4">
                <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-relaxed text-center break-keep ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                  {question2.statement}
                </p>
              </div>
              {/* 오른쪽 점수 표시 */}
              <div className="flex justify-center items-center">
                <span className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${disabled ? 'text-gray-400' : value2 && value2 > 3 ? 'text-[#D7177B]' : value2 && value2 < 3 ? 'text-[#551D83]' : 'text-gray-500'}`}>
                  {value2 || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 두 번째 행: 닷 영역 (가로 배치) */}
          <div className={`flex flex-col items-center justify-center gap-2 sm:gap-3 ${disabled ? 'opacity-50' : ''}`}>
            {/* 닷 버튼들 - 가로 배치 */}
            <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
              {[1, 2, 3, 4, 5, 6].map((dotPosition) => {
                // dotPosition: 1(왼쪽 끝) ~ 6(오른쪽 끝)
                const leftScore = 7 - dotPosition;  // 1→6, 2→5, 3→4, 4→3, 5→2, 6→1
                const rightScore = dotPosition;     // 1→1, 2→2, 3→3, 4→4, 5→5, 6→6
                const isSelected = value1 === leftScore && value2 === rightScore && !disabled;
                
                const getColor = () => {
                  if (disabled) {
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-gray-100/30',
                    };
                  }
                  
                  if (isSelected) {
                    if (leftScore < rightScore) {
                      return {
                        border: 'border-[#551D83]',
                        bg: 'bg-[#551D83]',
                      };
                    } else if (leftScore > rightScore) {
                      return {
                        border: 'border-[#D7177B]',
                        bg: 'bg-[#D7177B]',
                      };
                    } else {
                      return {
                        border: 'border-gray-500',
                        bg: 'bg-gray-500',
                      };
                    }
                  } else {
                    return {
                      border: 'border-gray-300',
                      bg: 'bg-white/80',
                    };
                  }
                };

                const colors = getColor();

                return (
                  <button
                    key={dotPosition}
                    type="button"
                    onClick={() => handleDotClick(dotPosition)}
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
                        ? 'scale-125 shadow-xl cursor-pointer'
                        : 'hover:scale-110 active:scale-95 cursor-pointer hover:shadow-lg'
                      }
                    `}
                    style={{ aspectRatio: '1 / 1' }}
                    aria-label={`왼쪽 ${leftScore}점, 오른쪽 ${rightScore}점`}
                    title={`왼쪽: ${leftScore}점, 오른쪽: ${rightScore}점`}
                  >
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-400'}`} />
                  </button>
                );
              })}
            </div>
            {/* 총점 표시 */}
            <div className="mt-1 sm:mt-2 text-center">
              <span className={`text-xs sm:text-sm md:text-base font-semibold ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                {totalScore}/7
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

