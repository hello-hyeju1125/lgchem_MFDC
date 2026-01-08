'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import questions from '@/data/questions.json';
import { storage, type Answers } from '@/lib/storage';
import ProgressBar from '@/components/ProgressBar';
import QuestionSetCard from '@/components/QuestionSetCard';

// 파트 정의: 16개 Set를 4개씩 4개 파트로 분할
const PARTS = [
  { start: 0, end: 3, label: '1-4번' },      // 파트 1: 1-4번
  { start: 4, end: 7, label: '5-8번' },      // 파트 2: 5-8번
  { start: 8, end: 11, label: '9-12번' },    // 파트 3: 9-12번
  { start: 12, end: 15, label: '13-16번' },  // 파트 4: 13-16번
];

// 세션 코드를 기반으로 시드 생성 (같은 세션 코드면 같은 순서)
function generateSeedFromSessionCode(sessionCode: string): number {
  let hash = 0;
  for (let i = 0; i < sessionCode.length; i++) {
    const char = sessionCode.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// 시드를 사용하여 배열을 섞기 (같은 시드면 같은 순서)
function shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let random = seed;
  
  // 간단한 PRNG (Pseudo-Random Number Generator)
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

function TestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPart, setCurrentPart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // 세션 코드 상태
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionValidating, setSessionValidating] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  
  // 팝업 상태
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([]);
  
  // 섞인 Set 배열 상태
  const [shuffledSets, setShuffledSets] = useState<typeof questions>([]);

  // 세션 코드 검증 함수
  const validateSessionCode = async (code: string): Promise<boolean> => {
    setSessionValidating(true);
    setSessionError(null);
    
    try {
      const response = await fetch(`/api/session/validate?session_code=${encodeURIComponent(code)}`);
      const result = await response.json();
      
      if (!result.success) {
        setSessionError('세션 검증 중 오류가 발생했습니다');
        setSessionValidating(false);
        return false;
      }
      
      if (!result.data.exists) {
        setSessionError('유효하지 않은 세션 코드입니다');
        setSessionValidating(false);
        return false;
      }
      
      // 세션 정보 저장
      setSessionCode(code);
      setSessionTitle(result.data.title || null);
      storage.saveSessionCode(code);
      setSessionValidating(false);
      return true;
    } catch (error) {
      setSessionError('세션 검증 중 네트워크 오류가 발생했습니다');
      setSessionValidating(false);
      return false;
    }
  };

  // 초기화: URL 파라미터 또는 저장된 세션 코드 확인
  useEffect(() => {
    // URL에서 session 파라미터 읽기
    const urlSessionCode = searchParams.get('session');
    
    if (urlSessionCode) {
      // URL에 세션 코드가 있으면 검증
      validateSessionCode(urlSessionCode);
    } else {
      // 저장된 세션 코드 확인
      const savedSessionCode = storage.loadSessionCode();
      if (savedSessionCode) {
        validateSessionCode(savedSessionCode);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // 세션 코드가 유효할 때만 진행 상태 복원
    if (!sessionCode) {
      return;
    }
    
    // 섞인 Set 순서 복원 또는 생성
    let shuffled: typeof questions;
    const savedOrder = storage.loadShuffledOrder(sessionCode);
    
    if (savedOrder && savedOrder.length > 0) {
      // 저장된 순서가 있으면 Set ID로 복원
      shuffled = savedOrder.map(setId => questions.find(s => s.setId === setId)!).filter(Boolean);
    } else {
      // 저장된 순서가 없으면 새로 섞기
      const seed = generateSeedFromSessionCode(sessionCode);
      shuffled = shuffleArrayWithSeed(questions, seed);
      // 섞인 순서 저장 (Set ID만 저장)
      storage.saveShuffledOrder(sessionCode, shuffled.map(s => s.setId));
    }
    
    setShuffledSets(shuffled);
    
    // localStorage에서 진행 상태 복원
    const savedAnswers = storage.loadAnswers();
    const savedIndex = storage.loadCurrentIndex();
    
    setAnswers(savedAnswers);
    
    // 저장된 인덱스로부터 현재 파트 계산
    const savedPart = PARTS.findIndex(part => 
      savedIndex >= part.start && savedIndex <= part.end
    );
    if (savedPart !== -1) {
      setCurrentPart(savedPart);
      setActiveIndex(savedIndex);
    } else {
      // 저장된 인덱스가 없거나 범위를 벗어난 경우 첫 파트로
      setCurrentPart(0);
      setActiveIndex(PARTS[0].start);
    }
  }, [sessionCode]);
  
  // 섞인 Set 배열이 준비되지 않았으면 모든 Set 사용
  const setsToUse = shuffledSets.length > 0 ? shuffledSets : questions;
  const totalSets = setsToUse.length;
  const currentPartInfo = PARTS[currentPart];
  const partSets = setsToUse.slice(currentPartInfo.start, currentPartInfo.end + 1);
  
  // 현재 파트 내에서 답변한 Set 수 계산 (두 문항 모두 답변된 Set만 카운트)
  const answeredInPart = partSets.filter(set => {
    const q1 = set.questions[0];
    const q2 = set.questions[1];
    return answers[q1.id] !== null && answers[q1.id] !== undefined &&
           answers[q2.id] !== null && answers[q2.id] !== undefined;
  }).length;
  
  // 전체 답변한 Set 수 계산
  const answeredCount = setsToUse.filter(set => {
    const q1 = set.questions[0];
    const q2 = set.questions[1];
    return answers[q1.id] !== null && answers[q1.id] !== undefined &&
           answers[q2.id] !== null && answers[q2.id] !== undefined;
  }).length;
  
  // progress는 answeredCount와 동일
  const progress = answeredCount;

  // 현재 Set의 답변 여부 확인
  const isSetAnswered = (setIndex: number) => {
    const set = setsToUse[setIndex];
    if (!set) return false;
    const q1 = set.questions[0];
    const q2 = set.questions[1];
    return answers[q1.id] !== null && answers[q1.id] !== undefined &&
           answers[q2.id] !== null && answers[q2.id] !== undefined;
  };

  // 현재 파트 내에서 다음 답변하지 않은 Set 찾기
  const getNextUnansweredInPart = () => {
    for (let i = currentPartInfo.start; i <= currentPartInfo.end; i++) {
      if (!isSetAnswered(i)) {
        return i;
      }
    }
    return null; // 파트 내 모든 Set 답변 완료
  };

  // Set 기반 답변 변경 핸들러 (두 점수의 합이 7이 되도록)
  const handleSetAnswerChange = (setId: string, value1: number, value2: number) => {
    const set = setsToUse.find(s => s.setId === setId);
    if (!set) return;
    
    const q1 = set.questions[0];
    const q2 = set.questions[1];
    
    const newAnswers = {
      ...answers,
      [q1.id]: value1,
      [q2.id]: value2,
    };
    setAnswers(newAnswers);
    storage.saveAnswers(newAnswers);
  };

  const handleNextPart = () => {
    // 현재 파트에서 답변하지 않은 Set 확인
    const unansweredInCurrentPart: number[] = [];
    for (let i = currentPartInfo.start; i <= currentPartInfo.end; i++) {
      if (!isSetAnswered(i)) {
        unansweredInCurrentPart.push(i + 1); // 사용자에게 보여줄 때는 1부터 시작
      }
    }
    
    // 답변하지 않은 Set가 있으면 팝업 표시
    if (unansweredInCurrentPart.length > 0) {
      setUnansweredQuestions(unansweredInCurrentPart);
      setShowIncompleteModal(true);
      return;
    }
    
    // 모든 Set가 답변되었으면 다음 파트로 이동
    if (currentPart < PARTS.length - 1) {
      const nextPart = currentPart + 1;
      const nextPartInfo = PARTS[nextPart];
      
      // 다음 파트의 첫 번째 답변하지 않은 Set로 이동
      let nextIndex = nextPartInfo.start;
      for (let i = nextPartInfo.start; i <= nextPartInfo.end; i++) {
        if (!isSetAnswered(i)) {
          nextIndex = i;
          break;
        }
      }
      
      setCurrentPart(nextPart);
      setActiveIndex(nextIndex);
      storage.saveCurrentIndex(nextIndex);
      
      // 스크롤을 맨 위로
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      // 모든 파트 완료 - 결과 페이지로 이동
      router.push('/result');
    }
  };

  const handlePreviousPart = () => {
    if (currentPart > 0) {
      const prevPart = currentPart - 1;
      const prevPartInfo = PARTS[prevPart];
      
      // 이전 파트의 첫 번째 Set로 이동
      let prevIndex = prevPartInfo.start;
      for (let i = prevPartInfo.start; i <= prevPartInfo.end; i++) {
        if (!isSetAnswered(i)) {
          prevIndex = i;
          break;
        }
      }
      
      setCurrentPart(prevPart);
      setActiveIndex(prevIndex);
      storage.saveCurrentIndex(prevIndex);
      
      // 스크롤을 맨 위로
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  // 세션 코드 검증 중이거나 (세션 코드가 있고 섞인 Set 배열이 준비되지 않은 경우) 로딩 화면 표시
  if (sessionValidating || (sessionCode && shuffledSets.length === 0)) {
    return (
      <main className="py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 relative overflow-y-auto flex items-center justify-center">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
        
        {/* 장식 요소 */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-brand-magenta/5 rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-brand-deep-blue/5 rounded-full blur-[100px] sm:blur-[120px]" />
        
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="glass-premium rounded-3xl p-8 shadow-xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-brand-purple to-brand-magenta bg-clip-text text-transparent text-center">
              리더십 진단 준비 중
            </h1>
            <p className="text-gray-600 text-center mb-6">
              세션 정보를 확인하고 있습니다. 잠시만 기다려 주세요.
            </p>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-light-gray/30 border-t-brand-purple mx-auto mb-4" />
              <p className="text-gray-600">세션 코드를 확인하는 중...</p>
              {sessionError && (
                <p className="mt-3 text-sm text-red-600">{sessionError}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 relative overflow-y-auto">
      {/* 배경 그라데이션 - 브랜드 색상 팔레트 활용 */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
      
      {/* 장식 요소 - 모바일에서 더 작게 */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-brand-magenta/5 rounded-full blur-[100px] sm:blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-brand-deep-blue/5 rounded-full blur-[100px] sm:blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-brand-purple/3 rounded-full blur-[120px] sm:blur-[140px]" />
      <div className="absolute top-1/3 right-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-brand-light-blue/4 rounded-full blur-[80px] sm:blur-[100px]" />
      
      <div className="w-full max-w-5xl mx-auto relative z-10 flex flex-col">
        {/* 세션 정보 표시 */}
        {sessionTitle && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">세션: <span className="font-semibold text-gray-800">{sessionTitle}</span></p>
          </div>
        )}
        {/* 안내 문구 */}
        <div className="mb-3 sm:mb-4 md:mb-5 animate-fade-in">
          <ProgressBar current={progress} total={totalSets} />
          <div className="mt-4 sm:mt-5 text-center">
            <div className="mt-1.5 sm:mt-2 text-center">
              <p className="text-[20px] sm:text-[24px] md:text-[28px] text-gray-600 font-bold px-2 break-keep leading-[1.2]">
                두 문항 중 어느 쪽에 더 동의하시나요?<br />
                <span className="text-base sm:text-lg md:text-xl font-normal">중간의 닷을 눌러 총 7점을 배분해주세요.</span>
              </p>
              {/* 범례 */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base text-gray-600 flex-wrap mt-3 sm:mt-4">
                <span>왼쪽 문항에 더 동의</span>
                <span className="text-gray-400">|</span>
                <span>균형</span>
                <span className="text-gray-400">|</span>
                <span>오른쪽 문항에 더 동의</span>
              </div>
            </div>
          </div>
        </div>

        {/* Set 카드 영역 - 현재 파트의 모든 Set 표시 */}
        <div className="w-full max-w-6xl mx-auto py-3 sm:py-4 space-y-4 sm:space-y-6">
          {partSets.map((set, index) => {
            const setIndex = currentPartInfo.start + index;
            const q1 = set.questions[0];
            const q2 = set.questions[1];
            return (
              <div
                key={set.setId}
                ref={(el) => {
                  questionRefs.current[setIndex] = el;
                }}
              >
                <QuestionSetCard
                  question1={q1}
                  question2={q2}
                  value1={answers[q1.id] || null}
                  value2={answers[q2.id] || null}
                  onChange={(value1, value2) => handleSetAnswerChange(set.setId, value1, value2)}
                  disabled={false}
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-row justify-between items-center mt-8 sm:mt-10 md:mt-12 gap-3 sm:gap-6 animate-fade-in">
          <button
            onClick={currentPart === 0 ? () => router.push('/') : handlePreviousPart}
            className="glass-premium text-gray-700 px-4 sm:px-10 md:px-12 h-[44px] sm:h-[52px] rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl flex-1 sm:flex-none sm:w-auto flex items-center justify-center"
            style={{ fontSize: '16px' }}
          >
            <span className="flex items-center justify-center whitespace-nowrap">
              {currentPart === 0 ? '← 메인으로' : '← 이전 파트'}
            </span>
          </button>
          
          {currentPart < PARTS.length - 1 && (
            <button
              onClick={handleNextPart}
              className="px-4 sm:px-10 md:px-12 h-[44px] sm:h-[52px] rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl text-white transition-all duration-300 bg-gradient-to-r from-brand-purple to-brand-magenta shadow-lg active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl flex-1 sm:flex-none sm:w-auto flex items-center justify-center"
              style={{ fontSize: '16px' }}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-3 whitespace-nowrap">
                다음 파트
                <svg className="w-4 h-4 sm:w-6 sm:h-6 transform sm:group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
          
          {currentPart === PARTS.length - 1 && (
            <button
              onClick={() => {
                // 모든 Set가 답변되었는지 확인
                const allAnswered = totalSets === answeredCount;
                if (allAnswered) {
                  router.push('/result');
                } else {
                  // 답변하지 않은 Set가 있으면 알림
                  alert('모든 문항에 답변해주세요.');
                }
              }}
              className="px-4 sm:px-10 md:px-12 h-[44px] sm:h-[52px] rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl text-white transition-all duration-300 bg-gradient-to-r from-brand-purple to-brand-magenta shadow-lg active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl flex-1 sm:flex-none sm:w-auto flex items-center justify-center"
              style={{ fontSize: '16px' }}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-3 whitespace-nowrap">
                결과 보기
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 미완료 문항 안내 팝업 */}
      {showIncompleteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIncompleteModal(false)}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full animate-scale-in shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
              진단 미완료
            </h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4 text-center">
              현재 파트에서 아직 답변하지 않은 문항이 있습니다.
            </p>
            <div className="mb-6">
              <p className="text-sm sm:text-base text-gray-600 mb-2 font-medium">
                미완료 문항:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-gray-700">
                  {unansweredQuestions.join(', ')}번 문항
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowIncompleteModal(false);
                // 첫 번째 미완료 문항으로 스크롤
                if (unansweredQuestions.length > 0) {
                  const firstUnansweredIndex = unansweredQuestions[0] - 1; // 0-based index
                  const questionRef = questionRefs.current[firstUnansweredIndex];
                  if (questionRef) {
                    questionRef.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }
                }
              }}
              className="w-full px-6 py-3 rounded-xl font-bold text-base sm:text-lg text-white bg-gradient-to-r from-brand-purple to-brand-magenta shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <main className="py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 relative overflow-y-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-light-gray/30 border-t-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </main>
    }>
      <TestPageContent />
    </Suspense>
  );
}

