'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { calculateScores, type Result } from '@/lib/scoring';
import leadershipTypes from '@/data/leadershipTypes.json';

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  Intrinsic: '내재적 동기 기반',
  Extrinsic: '외재적 동기 기반',
  Change: '변화 지향',
  System: '관리 지향',
  Work: '일 중심',
  People: '사람 중심',
  Direct: '지시형 소통',
  eNgage: '참여형 소통',
};

interface DevelopmentPoint {
  point: string;
  case: string;
}

interface LeadershipType {
  representativePerson: string;
  company: string;
  coreSummary: string;
  whyThisType: string;
  strengths: string | string[];
  risks: string | string[];
  developmentPoints: DevelopmentPoint[];
  quotes: string[];
  hashtags: string[];
}

// 문자열에서 불릿 포인트 항목들을 추출하는 함수
function extractBulletPoints(text: string | string[]): string[] {
  // 이미 배열이면 그대로 반환
  if (Array.isArray(text)) {
    return text;
  }
  
  // 문자열인 경우 불릿 포인트 항목들만 추출
  const lines = text.split('\n');
  const bulletPoints: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      // '- ' 제거하고 항목 추가
      bulletPoints.push(trimmed.substring(2));
    }
  }
  
  return bulletPoints;
}

// 마크다운 스타일 텍스트를 HTML로 변환하는 함수
function formatText(text: string | string[]): string {
  // 배열인 경우 각 항목을 포맷팅해서 합치기
  if (Array.isArray(text)) {
    return text.map(item => formatText(item)).join('');
  }
  
  // **텍스트** -> <strong>텍스트</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-800">$1</strong>');
  // 줄바꿈 처리
  // 먼저 문단 구분 (두 개의 줄바꿈)을 처리
  formatted = formatted.split('\n\n').map(paragraph => {
    // 각 문단 내에서 리스트 항목 처리 (- 로 시작하는 줄)
    const lines = paragraph.split('\n');
    let inList = false;
    let result = '';
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- ')) {
        if (!inList) {
          result += '<ul class="custom-bullet-list space-y-2 my-4">';
          inList = true;
        }
        result += `<li>${trimmedLine.substring(2)}</li>`;
      } else {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        if (trimmedLine) {
          result += `<p class="mb-4">${trimmedLine}</p>`;
        }
      }
    });
    
    if (inList) {
      result += '</ul>';
    }
    
    return result || paragraph;
  }).join('');
  
  // 남은 단일 줄바꿈을 <br />로 변환
  formatted = formatted.replace(/\n/g, '<br />');
  return formatted;
}

export default function ResultCodePage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let codeUpper = code?.toUpperCase() || '';
    
    // URL의 코드에서 Direction 축(3번째 문자)의 R을 W로 변환 (하위 호환성)
    if (codeUpper && codeUpper.length === 4 && codeUpper[2] === 'R') {
      codeUpper = codeUpper.substring(0, 2) + 'W' + codeUpper.substring(3);
      // 변환된 코드로 URL 업데이트 (리다이렉트)
      router.push(`/result/${codeUpper.toLowerCase()}`);
      return;
    }
    
    // localStorage에서 답변 로드 시도
    const answers = storage.loadAnswers();
    
    // 답변이 있는 경우: 정확한 점수로 계산
    if (Object.keys(answers).length > 0) {
      const calculatedResult = calculateScores(answers);
      
      // URL의 code와 계산된 결과가 일치하는지 확인
      if (codeUpper && codeUpper !== calculatedResult.code) {
        // 일치하지 않으면 올바른 URL로 리다이렉트
        router.push(`/result/${calculatedResult.code.toLowerCase()}`);
        return;
      }
      
      setResult(calculatedResult);
      setIsLoading(false);
      return;
    }
    
    // 답변이 없는 경우: URL의 code로 기본 결과 생성
    if (codeUpper && codeUpper.length === 4) {
      // 유효한 리더십 유형 코드인지 확인
      const leadershipType = (leadershipTypes as Record<string, LeadershipType>)[codeUpper];
      
      if (!leadershipType) {
        // 유효하지 않은 코드면 메인으로 리다이렉트
        router.push('/');
        return;
      }
      
      // 기본 점수로 결과 생성 (각 축별로 50:50 또는 약간의 우세)
      // 코드를 기반으로 어떤 축이 우세한지 파악
      const axisConfig = {
        Motivation: { dimension1: 'Intrinsic', dimension2: 'Extrinsic', code1: 'I', code2: 'E' },
        Flexibility: { dimension1: 'Change', dimension2: 'System', code1: 'C', code2: 'S' },
        Direction: { dimension1: 'Work', dimension2: 'People', code1: 'W', code2: 'P' },
        Communication: { dimension1: 'Direct', dimension2: 'eNgage', code1: 'D', code2: 'N' },
      };
      
      const axes = ['Motivation', 'Flexibility', 'Direction', 'Communication'] as const;
      const scores: Result['scores'] = axes.map((axis, index) => {
        const config = axisConfig[axis];
        const codeChar = codeUpper[index];
        const isDimension1 = codeChar === config.code1;
        
        // 우세한 쪽에 약간 더 높은 점수 (60:40 정도)
        const score1 = isDimension1 ? 4.2 : 3.8;
        const score2 = isDimension1 ? 3.8 : 4.2;
        
        return {
          axis,
          dimension1: config.dimension1,
          dimension2: config.dimension2,
          score1: Math.round(score1 * 10) / 10,
          score2: Math.round(score2 * 10) / 10,
          dominant: isDimension1 ? config.dimension1 : config.dimension2,
        };
      });
      
      setResult({
        code: codeUpper,
        scores,
      });
      setIsLoading(false);
      return;
    }
    
    // code가 없거나 유효하지 않으면 메인으로 리다이렉트
    router.push('/');
  }, [code, router]);

  const handleRestart = () => {
    storage.clearAll();
    router.push('/');
  };

  const handleCopyUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      // 복사 성공 알림 (선택적: 토스트 메시지 등을 추가할 수 있음)
      alert('URL이 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('URL 복사 실패:', err);
      alert('URL 복사에 실패했습니다.');
    }
  };

  if (isLoading || !result) {
    return (
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
        <div className="text-center glass-premium rounded-[2.5rem] p-16 relative z-10 animate-scale-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-light-gray/30 border-t-brand-purple mx-auto mb-6" style={{ borderTopColor: '#551D83' }} />
          <p className="text-gray-700 font-semibold text-lg sm:text-xl">결과를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 코드에서 Direction 축(3번째 문자)의 R을 W로 변환 (안전장치)
  let leadershipTypeCode = result.code.toUpperCase();
  if (leadershipTypeCode.length === 4 && leadershipTypeCode[2] === 'R') {
    leadershipTypeCode = leadershipTypeCode.substring(0, 2) + 'W' + leadershipTypeCode.substring(3);
  }
  const leadershipType = (leadershipTypes as Record<string, LeadershipType>)[leadershipTypeCode] || null;
  
  // 디버깅용 (개발 환경에서만)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Result code:', result.code);
    console.log('Leadership type code:', leadershipTypeCode);
    console.log('Leadership type found:', !!leadershipType);
    console.log('Available keys:', Object.keys(leadershipTypes));
  }

  return (
    <main className="min-h-screen py-6 sm:py-8 md:py-12 lg:py-16 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* 배경 그라데이션 - 브랜드 색상 팔레트 활용 */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />
      
      {/* 장식 요소 - 모바일에서 더 작게 */}
      <div className="absolute top-20 left-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-brand-magenta/6 rounded-full blur-[100px] sm:blur-[120px]" />
      <div className="absolute bottom-20 right-10 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] bg-brand-deep-blue/6 rounded-full blur-[100px] sm:blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] sm:w-[700px] sm:h-[700px] bg-brand-purple/4 rounded-full blur-[130px] sm:blur-[150px]" />
      <div className="absolute top-1/4 right-1/4 w-56 h-56 sm:w-80 sm:h-80 bg-brand-light-blue/5 rounded-full blur-[90px] sm:blur-[110px]" />
      
      <div className="w-full max-w-6xl mx-auto relative z-10 space-y-8 sm:space-y-12 md:space-y-16">
        {/* 헤더 섹션 */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in-up">
          <div className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 lg:p-16 mb-6 sm:mb-8 md:mb-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-700 tracking-tight mb-6 sm:mb-8">
              당신의 리더십 유형은<br className="sm:hidden" /> 다음과 같습니다.
            </h1>
            {leadershipType && (
              <div className="mt-2 sm:mt-8 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-6 sm:gap-8 lg:gap-12">
                {/* 좌측: 인물 사진 */}
                <div className="flex-shrink-0 flex flex-col items-center w-72 sm:w-72 md:w-80 mx-auto sm:mx-0 gap-2 sm:gap-0">
                  {/* 모바일에서 코드 박스를 이미지 컨테이너 상단에 배치 */}
                  <div className="sm:hidden flex justify-center -mt-2 mb-3">
                    <div className="inline-flex items-center justify-center w-[88px] h-[56px] rounded-2xl shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-purple via-brand-magenta via-brand-deep-blue to-brand-magenta opacity-95 animate-gradient" />
                      <span className="relative z-10 text-[30px] font-extrabold leading-none text-white tracking-[0.02em]">
                        {leadershipTypeCode}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-72 h-72 sm:w-72 sm:h-72 md:w-80 md:h-80">
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand-purple via-brand-magenta via-brand-deep-blue to-brand-magenta p-1 sm:p-1.5 md:p-2 animate-gradient" style={{ animationDuration: '3s' }} />
                    <img 
                      src={`/images/portraits/${leadershipTypeCode}.png`}
                      alt={leadershipType.representativePerson}
                      className="relative w-full h-full rounded-2xl sm:rounded-3xl object-cover shadow-2xl z-10"
                    />
                  </div>
                </div>
                {/* 우측: 이름, 기업명, 어록, 해시태그 */}
                <div className="flex-1 flex flex-col items-center sm:items-start space-y-4 sm:space-y-6 w-full sm:w-auto">
                  <div className="flex flex-col items-center sm:items-start w-full">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mb-[1.5px] sm:mb-4">
                      <p className="text-[39px] sm:text-4xl md:text-5xl lg:text-6xl text-gray-800 font-extrabold tracking-tight bg-gradient-to-r from-brand-purple to-brand-magenta bg-clip-text text-transparent">
                        {leadershipType.representativePerson}
                      </p>
                      {/* 데스크톱에서만 코드 박스 표시 */}
                      <div className="hidden sm:inline-block glass-strong rounded-md sm:rounded-lg text-white text-xl md:text-2xl lg:text-3xl font-extrabold px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 md:py-2 shadow-2xl relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple via-brand-magenta via-brand-deep-blue to-brand-magenta opacity-95 animate-gradient" />
                        <span className="relative z-10">{leadershipTypeCode}</span>
                      </div>
                    </div>
                    <p className="text-[23.4px] sm:text-xl md:text-2xl lg:text-3xl text-gray-700 font-bold text-center sm:text-left">
                      {leadershipType.company}
                    </p>
                  </div>
                  {/* 어록 */}
                  {leadershipType.quotes.length > 0 && (
                    <div className="animate-fade-in-up w-full flex flex-col items-center sm:items-start" style={{ animationDelay: '0.25s' }}>
                      <div className="space-y-3 sm:space-y-4 w-full">
                        {leadershipType.quotes.map((quote, index) => (
                          <div key={index} className="relative pl-3 sm:pl-4 md:pl-6 border-l-4 border-gradient-to-b from-brand-purple to-brand-magenta bg-gradient-to-r from-brand-purple/5 to-transparent py-2 px-3 sm:py-2.5 sm:px-3 md:py-4 md:px-5 rounded-r-2xl mx-auto sm:mx-0 max-w-full sm:max-w-none">
                            <p className="text-[14.4px] sm:text-sm md:text-base text-gray-700 leading-relaxed italic text-center sm:text-left">
                              {quote}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 해시태그 */}
                  {leadershipType.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                      {leadershipType.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-full bg-gray-400 text-white font-semibold text-[14.4px] sm:text-sm md:text-base shadow-lg"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리더십 핵심 요약 */}
        {leadershipType && (
          <section className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-700 mb-4 sm:mb-6 tracking-tight flex items-center gap-3">
              <span className="w-1 h-8 sm:h-10 bg-gradient-to-b from-brand-purple to-brand-magenta rounded-full"></span>
              리더십 핵심 요약
            </h2>
            <div 
              className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(leadershipType.coreSummary) }}
            />
          </section>
        )}

        {/* 4가지 축 점수 상세 표시 */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {result.scores.map((axisScore, index) => {
              // 축별 색상 (각 축마다 고유한 색상)
              const axisColors: Record<string, { 
                mainColor: string; 
                lightColor: string; 
                darkColor: string;
              }> = {
                'Motivation': { 
                  mainColor: '#9333ea', // 퍼플
                  lightColor: '#a855f7', // 밝은 퍼플
                  darkColor: '#7e22ce' // 어두운 퍼플
                },
                'Flexibility': { 
                  mainColor: '#22c55e', // 그린
                  lightColor: '#4ade80', // 밝은 그린
                  darkColor: '#16a34a' // 어두운 그린
                },
                'Direction': { 
                  mainColor: '#ec4899', // 마젠타
                  lightColor: '#f472b6', // 밝은 마젠타
                  darkColor: '#db2777' // 어두운 마젠타
                },
                'Communication': { 
                  mainColor: '#3b82f6', // 블루
                  lightColor: '#60a5fa', // 밝은 블루
                  darkColor: '#2563eb' // 어두운 블루
                },
              };
              const colorScheme = axisColors[axisScore.axis] || axisColors['Motivation'];
              
              // 축별 제목
              const axisTitles: Record<string, string> = {
                'Motivation': '동기부여 방식',
                'Flexibility': '유연성',
                'Direction': '리더십 방향성',
                'Communication': '소통 방식',
              };
              
              // 퍼센트 계산
              const totalScore = axisScore.score1 + axisScore.score2;
              const percent1 = Math.round((axisScore.score1 / totalScore) * 100);
              const percent2 = Math.round((axisScore.score2 / totalScore) * 100);
              
              return (
                <div
                  key={axisScore.axis}
                  className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 sm:hover:scale-[1.02] transition-all duration-300"
                >
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-700 mb-6 sm:mb-8 tracking-tight text-center">
                    {axisTitles[axisScore.axis]}
                  </h3>

                  <div className="space-y-6 sm:space-y-8">
                    {/* 양쪽 라벨 */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-gray-700 text-base sm:text-lg md:text-xl tracking-tight">
                          {axisScore.dimension1}
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 mt-1">
                          {DIMENSION_DESCRIPTIONS[axisScore.dimension1]}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-700 text-base sm:text-lg md:text-xl tracking-tight">
                          {axisScore.dimension2}
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 mt-1">
                          {DIMENSION_DESCRIPTIONS[axisScore.dimension2]}
                        </span>
                      </div>
                    </div>

                    {/* 퍼센트 표시 */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col items-start">
                        <span 
                          className="font-bold text-lg sm:text-xl md:text-2xl"
                          style={{ 
                            color: colorScheme.mainColor
                          }}
                        >
                          {percent1}%
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span 
                          className="font-bold text-lg sm:text-xl md:text-2xl"
                          style={{ 
                            color: colorScheme.mainColor
                          }}
                        >
                          {percent2}%
                        </span>
                      </div>
                    </div>

                    {/* 슬라이더 바 */}
                    <div className="relative w-full">
                      <div className="relative flex items-center w-full h-10 sm:h-12 md:h-14 bg-gray-200/30 rounded-full overflow-hidden">
                        {/* 왼쪽 영역 - 단색 */}
                        <div 
                          className="relative h-full transition-all duration-700 rounded-l-full z-10"
                          style={{ 
                            width: `${percent1}%`,
                            backgroundColor: colorScheme.lightColor,
                          }}
                        >
                          {/* 위쪽 하이라이트 */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-l-full" />
                        </div>
                        
                        {/* 오른쪽 영역 - 단색 */}
                        <div 
                          className="relative h-full transition-all duration-700 rounded-r-full ml-auto z-10"
                          style={{ 
                            width: `${percent2}%`,
                            backgroundColor: colorScheme.darkColor,
                          }}
                        >
                          {/* 위쪽 하이라이트 */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-r-full" />
                        </div>
                        
                        {/* 경계 세로 선 */}
                        {percent1 > 0 && percent2 > 0 && (
                          <div 
                            className="absolute top-0 bottom-0 pointer-events-none z-30"
                            style={{
                              left: `${percent1}%`,
                              width: '2px',
                              backgroundColor: colorScheme.mainColor,
                              boxShadow: `0 0 4px ${colorScheme.mainColor}cc`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 왜 이 유형인가 */}
        {leadershipType && (
          <section className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-700 mb-4 sm:mb-6 tracking-tight flex items-center gap-3">
              <span className="w-1 h-8 sm:h-10 bg-gradient-to-b from-brand-magenta to-brand-purple rounded-full"></span>
              {leadershipType.representativePerson}과 유사한 리더십을 발휘하고 있는 당신은...
            </h2>
            <div 
              className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(leadershipType.whyThisType) }}
            />
          </section>
        )}

        {/* 강점과 리스크 */}
        {leadershipType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {/* 강점 */}
            <section className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-700 mb-4 sm:mb-6 tracking-tight flex items-center gap-3">
                <span className="w-1 h-8 sm:h-10 bg-gradient-to-b from-brand-light-blue to-brand-deep-blue rounded-full"></span>
                강점
              </h2>
              <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatText(leadershipType.strengths) }}
                />
              </div>
            </section>

            {/* 리스크 */}
            <section className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-700 mb-4 sm:mb-6 tracking-tight flex items-center gap-3">
                <span className="w-1 h-8 sm:h-10 bg-gradient-to-b from-brand-deep-blue to-brand-magenta rounded-full"></span>
                리스크
              </h2>
              <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatText(leadershipType.risks) }}
                />
              </div>
            </section>
          </div>
        )}

        {/* 개발 및 보완 포인트 */}
        {leadershipType && (
          <section className="glass-premium rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-700 mb-4 sm:mb-6 tracking-tight flex items-center gap-3">
              <span className="w-1 h-8 sm:h-10 bg-gradient-to-b from-brand-purple to-brand-light-blue rounded-full"></span>
              개발 및 보완 포인트
            </h2>
            <ul className="space-y-6 sm:space-y-8">
              {leadershipType.developmentPoints.map((item, index) => (
                <li key={index} className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-purple flex items-center justify-center text-white font-bold text-sm sm:text-base mt-0.5">
                      →
                    </span>
                    <div className="flex-1">
                      <div 
                        className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-3 sm:mb-4"
                        dangerouslySetInnerHTML={{ __html: formatText(item.point) }}
                      />
                      <div className="pl-3 sm:pl-4 border-l-4 border-brand-purple/30 bg-brand-purple/5 rounded-r-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {item.case}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}


        {/* 다시 진단하기 및 URL 복사 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in pt-8" style={{ animationDelay: '1.1s' }}>
          <button
            onClick={handleRestart}
            className="rounded-2xl sm:rounded-3xl bg-gray-600 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl w-full sm:w-auto px-6 sm:px-8 md:px-11 py-3.5 sm:py-4 md:py-5 shadow-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl sm:hover:bg-gray-700"
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              다시 진단하기
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform sm:group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
          </button>
          <button
            onClick={handleCopyUrl}
            className="rounded-2xl sm:rounded-3xl bg-brand-purple text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl w-full sm:w-auto px-6 sm:px-8 md:px-11 py-3.5 sm:py-4 md:py-5 shadow-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-105 sm:hover:shadow-xl sm:hover:bg-purple-800"
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              URL 복사하기
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

