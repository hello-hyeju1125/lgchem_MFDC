'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

function TypingText({ text, className }: { text: string; className?: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 30); // 타이핑 속도

    return () => clearInterval(typingInterval);
  }, [text]);

  return (
    <span className={`${className} whitespace-pre-line`}>
      {displayedText}
    </span>
  );
}

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    // RFC 5322 표준 이메일 형식 검증 (백엔드 Zod .email() 검증과 유사)
    // @ 기호 포함 및 기본적인 이메일 형식 체크
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleStart = () => {
    if (!name.trim() || !email.trim() || !sessionCode.trim()) {
      setError('이름, 이메일, 세션 코드를 모두 입력해 주세요.');
      return;
    }

    // 이메일 유효성 검사 (@ 포함 여부)
    if (!validateEmail(email.trim())) {
      setShowEmailModal(true);
      return;
    }

    setError(null);

    // 참여자 정보 및 세션 코드 저장
    storage.saveParticipantInfo(name.trim(), email.trim());
    storage.saveSessionCode(sessionCode.trim());

    // 세션 코드를 포함하여 테스트 페이지로 이동 (백엔드 검증용)
    router.push(`/test?session=${encodeURIComponent(sessionCode.trim())}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Wave 배경 요소 - 그레이, 마젠타, 퍼플 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Wave 1 - Gray */}
        <svg 
          className="wave-animated absolute top-0 left-0 w-full h-full" 
          preserveAspectRatio="none" 
          viewBox="0 0 1200 800"
          style={{ 
            transform: 'translateY(10%)',
            opacity: 0.25
          }}
        >
          <path 
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z" 
            fill="rgba(196, 196, 196, 0.18)"
          />
        </svg>
        
        {/* Wave 2 - Magenta */}
        <svg 
          className="wave-animated-delay-1 absolute top-0 left-0 w-full h-full" 
          preserveAspectRatio="none" 
          viewBox="0 0 1200 800"
          style={{ 
            transform: 'translateY(20%)',
            opacity: 0.22
          }}
        >
          <path 
            d="M0,500 Q400,350 800,500 T1200,500 L1200,800 L0,800 Z" 
            fill="rgba(215, 23, 123, 0.16)"
          />
        </svg>
        
        {/* Wave 3 - Purple (반대 방향) */}
        <svg 
          className="wave-animated-delay-2 absolute bottom-0 left-0 w-full h-full" 
          preserveAspectRatio="none" 
          viewBox="0 0 1200 800"
          style={{ 
            transform: 'translateY(-15%) scaleY(-1)',
            opacity: 0.24
          }}
        >
          <path 
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z" 
            fill="rgba(85, 29, 131, 0.18)"
          />
        </svg>
      </div>
      
      <div className="w-full max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up px-4">
        <div className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-11 lg:p-[3.4rem] mb-8 sm:mb-12 animate-scale-in">
          {/* Hero Title */}
          <div className="mb-5 sm:mb-6">
            <h1 className="mt-0 mb-3 sm:mb-5 font-extrabold tracking-normal leading-[0.9] overflow-hidden">
              <span
                className="block bg-gradient-to-r from-brand-purple via-brand-magenta via-brand-deep-blue to-brand-purple bg-clip-text text-transparent animate-gradient text-[36px] lg:text-[64px] leading-[1.1] pt-[0.12em] pb-[0.08em]">
                리더십 유형 진단
              </span>
            </h1>
            
            {/* 핵심 정보 배지 - 모바일 전용 */}
            <div className="mt-4 flex flex-nowrap justify-center gap-2 sm:hidden">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] text-gray-700 whitespace-nowrap">4가지 기준</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] text-gray-700 whitespace-nowrap">32개 문항</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] text-gray-700 whitespace-nowrap">16가지 유형</span>
            </div>
            
            {/* Quote */}
            <p className="hidden lg:block text-sm sm:text-base md:text-lg text-gray-500 italic mb-3 sm:mb-5 leading-relaxed font-normal whitespace-pre-line">
              <TypingText 
                text={'"The first step to leadership is self-awareness."\n(리더십의 첫 단계는 자기 인식이다.) — John C. Maxwell'}
              />
            </p>
            
            {/* Sub Title */}
            <div className="mt-[1.1rem] sm:mt-[1.375rem] space-y-2 sm:space-y-3">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-normal">
                이 진단은 LG화학 리더들이 자신의 리더십 유형을 파악하고,<br className="hidden lg:inline" /> 사업과 사람을 리딩하는 방식을 이해하도록 설계되었습니다.<br className="hidden lg:inline" /> 
              </p>
            </div>
          </div>

          {/* 진단 특징 Bullet */}
          <div className="border-t border-gray-200/60 pt-6 sm:pt-8">
            <div className="space-y-[0.675rem] sm:space-y-4 text-left max-w-2xl mx-auto lg:ml-auto lg:mr-0 lg:pl-8">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-magenta flex items-center justify-center mt-[2px]">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-[1.5] sm:leading-[1.6] font-normal">
                    <span className="font-bold text-sm sm:text-base md:text-lg">4가지 리더십 기준</span>을 바탕으로 설계되었습니다.
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    동기부여 방식, 유연성, 리더십 방향성, 소통 방식을 통해
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    나의 리더십 패턴을 입체적으로 확인합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-magenta flex items-center justify-center mt-[2px]">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-[1.5] sm:leading-[1.6] font-normal">
                    <span className="font-bold text-sm sm:text-base md:text-lg">32개 문항</span>을 통해 <span className="font-bold text-sm sm:text-base md:text-lg">16가지 리더십 유형</span>을 도출합니다.
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    각 문항은 서로 반대되는 두 리더십 방식을 제시하며,
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    당신의 실제 행동에 더 가까운 쪽을 7점 척도로 선택합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-magenta flex items-center justify-center mt-[2px]">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-[1.5] sm:leading-[1.6] font-normal">
                    리더십은 상황에 따라 강점이 되기도, 리스크가 되기도 합니다.
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    이 결과는 단일 정답이 아닌,
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    <span className="font-bold text-sm sm:text-base md:text-lg">조직과 상황에 맞는 리더십 선택</span>을 돕기 위한 기준을 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 기본 정보 입력 영역 */}
        <div className="animate-fade-in mb-5 sm:mb-6" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 max-w-xl mx-auto text-left">
            <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
              진단을 진행하기 전에 아래 정보를 입력해 주세요.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1.5">
                  이름
                  <span className="text-brand-magenta ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-magenta/60 focus:border-brand-magenta/60 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1.5">
                  이메일 주소
                  <span className="text-brand-magenta ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="예: hong.gildong@lgchem.com"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-magenta/60 focus:border-brand-magenta/60 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1.5">
                  세션 코드
                  <span className="text-brand-magenta ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="운영자가 안내한 코드를 입력해 주세요."
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-magenta/60 focus:border-brand-magenta/60 transition-shadow tracking-widest"
                />
              </div>
            </div>
            {error && (
              <p className="mt-3 text-xs sm:text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            type="button"
            onClick={handleStart}
            className="inline-block rounded-full text-white font-bold text-base sm:text-lg md:text-xl w-full sm:w-auto px-10 sm:px-14 md:px-16 py-4 sm:py-5 md:py-6 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 active:translate-y-0"
            style={{ 
              boxShadow: '0 20px 25px -5px rgba(85, 29, 131, 0.4), 0 10px 10px -5px rgba(85, 29, 131, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(85, 29, 131, 0.5), 0 15px 15px -5px rgba(85, 29, 131, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(85, 29, 131, 0.4), 0 10px 10px -5px rgba(85, 29, 131, 0.3)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = '0 15px 20px -5px rgba(85, 29, 131, 0.35), 0 8px 8px -5px rgba(85, 29, 131, 0.25)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(85, 29, 131, 0.4), 0 10px 10px -5px rgba(85, 29, 131, 0.3)';
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-magenta" />
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              진단 시작하기
              <svg className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* 이메일 유효성 검사 팝업 모달 */}
      {showEmailModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowEmailModal(false)}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full animate-scale-in shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm sm:text-base text-gray-700 text-center">
              올바른 이메일 주소 형식으로 입력해주세요
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

