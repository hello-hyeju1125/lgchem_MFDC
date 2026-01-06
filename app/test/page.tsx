'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import questions from '@/data/questions.json';
import { storage, type Answers } from '@/lib/storage';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';

// 파트 정의: 각 파트는 8개 문항
const PARTS = [
  { start: 0, end: 7, label: '1-8번' },    // 파트 1: 1-8번
  { start: 8, end: 15, label: '9-16번' },   // 파트 2: 9-16번
  { start: 16, end: 23, label: '17-24번' }, // 파트 3: 17-24번
  { start: 24, end: 31, label: '25-32번' }, // 파트 4: 25-32번
];

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
  
  const totalQuestions = questions.length;
  const currentPartInfo = PARTS[currentPart];
  const partQuestions = questions.slice(currentPartInfo.start, currentPartInfo.end + 1);
  
  // 현재 파트 내에서 답변한 문항 수 계산
  const answeredInPart = partQuestions.filter(q => 
    answers[q.id] !== null && answers[q.id] !== undefined
  ).length;
  
  // 전체 답변한 문항 수 계산
  // answers 객체에 저장된 모든 답변을 세며, null/undefined가 아닌 값을 카운트
  const answeredCount = Object.keys(answers).filter(
    (id) => answers[id] !== null && answers[id] !== undefined
  ).length;
  
  // progress는 answeredCount와 동일 (답이 선택되면 자동으로 answers에 저장되고 포함됨)
  const progress = answeredCount;

  // 현재 활성화된 문항의 답변 여부 확인
  const isQuestionAnswered = (index: number) => {
    const question = questions[index];
    return question && answers[question.id] !== null && answers[question.id] !== undefined;
  };

  // 현재 파트 내에서 다음 답변하지 않은 문항 찾기
  const getNextUnansweredInPart = () => {
    for (let i = currentPartInfo.start; i <= currentPartInfo.end; i++) {
      if (!isQuestionAnswered(i)) {
        return i;
      }
    }
    return null; // 파트 내 모든 문항 답변 완료
  };

  const handleAnswerChange = (questionId: string, value: number) => {
    const newAnswers = {
      ...answers,
      [questionId]: value,
    };
    setAnswers(newAnswers);
    storage.saveAnswers(newAnswers);

    // 현재 답변한 문항의 인덱스 찾기
    const currentQuestionIndex = questions.findIndex(q => q.id === questionId);
    const nextIndex = currentQuestionIndex + 1;
    
    // 다음 문항이 있는지 확인
    if (nextIndex < totalQuestions) {
      // 다음 문항으로 이동
      setTimeout(() => {
        setActiveIndex(nextIndex);
        storage.saveCurrentIndex(nextIndex);
        
        // 다음 문항이 다른 파트에 있으면 파트 변경
        const nextPart = PARTS.findIndex(part => 
          nextIndex >= part.start && nextIndex <= part.end
        );
        if (nextPart !== -1 && nextPart !== currentPart) {
          setCurrentPart(nextPart);
        }
        
        // 스크롤을 맨 위로
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    } else {
      // 모든 문항 완료 - 결과 페이지로 이동
      setTimeout(() => {
        router.push('/result');
      }, 300);
    }
  };

  const handleNextPart = () => {
    if (currentPart < PARTS.length - 1) {
      const nextPart = currentPart + 1;
      const nextPartInfo = PARTS[nextPart];
      const nextUnanswered = getNextUnansweredInPart();
      
      // 다음 파트의 첫 번째 답변하지 않은 문항으로 이동
      let nextIndex = nextPartInfo.start;
      for (let i = nextPartInfo.start; i <= nextPartInfo.end; i++) {
        if (!isQuestionAnswered(i)) {
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
      
      // 이전 파트의 첫 번째 문항으로 이동
      let prevIndex = prevPartInfo.start;
      for (let i = prevPartInfo.start; i <= prevPartInfo.end; i++) {
        if (!isQuestionAnswered(i)) {
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

  // 현재 활성 문항만 표시
  const currentQuestion = questions[activeIndex];
  const isLastQuestion = activeIndex === totalQuestions - 1;
  const isFirstQuestion = activeIndex === 0;

  // 이전 문항으로 이동
  const handlePreviousQuestion = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      setActiveIndex(prevIndex);
      storage.saveCurrentIndex(prevIndex);
      
      // 이전 문항이 다른 파트에 있으면 파트 변경
      const prevPart = PARTS.findIndex(part => 
        prevIndex >= part.start && prevIndex <= part.end
      );
      if (prevPart !== -1 && prevPart !== currentPart) {
        setCurrentPart(prevPart);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 다음 문항으로 이동
  const handleNextQuestion = () => {
    if (activeIndex < totalQuestions - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      storage.saveCurrentIndex(nextIndex);
      
      // 다음 문항이 다른 파트에 있으면 파트 변경
      const nextPart = PARTS.findIndex(part => 
        nextIndex >= part.start && nextIndex <= part.end
      );
      if (nextPart !== -1 && nextPart !== currentPart) {
        setCurrentPart(nextPart);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 모든 문항 완료 - 결과 페이지로 이동
      router.push('/result');
    }
  };

  // 세션 코드 검증 중인 경우 로딩 화면 표시
  if (sessionValidating) {
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
          <ProgressBar current={progress} total={totalQuestions} />
          <div className="mt-2 sm:mt-2 text-center">
            <div className="mt-1.5 sm:mt-2 text-center">
              <p className="text-[15.6px] sm:text-[18.2px] md:text-[20.8px] text-gray-600 font-medium px-4 break-keep">
                아래 두 문장 중, 당신의 실제 리더십 행동에 더 가까운 쪽을 선택해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 문항 카드 영역 */}
        <div className="w-full max-w-4xl mx-auto py-3 sm:py-4">
          {currentQuestion && (
            <QuestionCard
              leftLabel={currentQuestion.left_label}
              rightLabel={currentQuestion.right_label}
              leftStatement={currentQuestion.left_statement}
              rightStatement={currentQuestion.right_statement}
              value={answers[currentQuestion.id] || null}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              disabled={false}
            />
          )}
        </div>

        <div className="flex flex-row justify-between items-center mt-8 sm:mt-10 md:mt-12 gap-3 sm:gap-6 animate-fade-in">
          <button
            onClick={isFirstQuestion ? () => router.push('/') : handlePreviousQuestion}
            className="glass-premium text-gray-700 px-4 sm:px-10 md:px-12 h-[44px] sm:h-[52px] rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl flex-1 sm:flex-none sm:w-auto flex items-center justify-center"
            style={{ fontSize: '16px' }}
          >
            <span className="flex items-center justify-center whitespace-nowrap">
              {isFirstQuestion ? '← 메인으로' : '← 이전 문항'}
            </span>
          </button>
          
          {!isLastQuestion && (
            <button
              onClick={handleNextQuestion}
              className="px-4 sm:px-10 md:px-12 h-[44px] sm:h-[52px] rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg md:text-xl text-white transition-all duration-300 bg-gradient-to-r from-brand-purple to-brand-magenta shadow-lg active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl flex-1 sm:flex-none sm:w-auto flex items-center justify-center"
              style={{ fontSize: '16px' }}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-3 whitespace-nowrap">
                다음 문항
                <svg className="w-4 h-4 sm:w-6 sm:h-6 transform sm:group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
          
          {isLastQuestion && (
            <button
              onClick={() => router.push('/result')}
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

