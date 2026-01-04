'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { calculateScores } from '@/lib/scoring';

export default function ResultPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'calculating' | 'submitting' | 'error'>('calculating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const submitAndNavigate = async () => {
      try {
        // 1. 답변 로드
        const answers = storage.loadAnswers();
        
        if (Object.keys(answers).length === 0) {
          // 답변이 없으면 메인으로 리다이렉트
          router.push('/');
          return;
        }

        // 2. 세션 코드 확인
        const sessionCode = storage.loadSessionCode();
        if (!sessionCode) {
          setStatus('error');
          setErrorMessage('세션 코드가 없습니다. 진단을 다시 시작해주세요.');
          return;
        }

        // 3. 점수 계산
        const calculatedResult = calculateScores(answers);

        // 4. DB에 제출
        setStatus('submitting');
        const clientHash = storage.getOrCreateClientHash();
        
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionCode,
            answers,
            clientHash,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          // 제출 실패 시 에러 표시 (재시도 버튼 포함)
          setStatus('error');
          setErrorMessage(result.error || '제출에 실패했습니다. 네트워크 연결을 확인해주세요.');
          return;
        }

        // 5. 성공 시 결과 페이지로 이동
        router.push(`/result/${calculatedResult.code.toLowerCase()}`);
      } catch (error) {
        console.error('제출 중 오류:', error);
        setStatus('error');
        setErrorMessage('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      }
    };

    submitAndNavigate();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
      <div className="text-center glass-premium rounded-[2.5rem] p-16 relative z-10 animate-scale-in max-w-md mx-4">
        {status === 'error' ? (
          <>
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold text-lg sm:text-xl mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                // 페이지 리로드하여 다시 제출 시도
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              재시도
            </button>
            <button
              onClick={() => router.push('/')}
              className="mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-light-gray/30 border-t-brand-purple mx-auto mb-6" style={{ borderTopColor: '#551D83' }} />
            <p className="text-gray-700 font-semibold text-lg sm:text-xl">
              {status === 'calculating' ? '결과를 계산하는 중...' : '결과를 저장하는 중...'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

