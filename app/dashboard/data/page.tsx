'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import leadershipTypes from '@/data/leadershipTypes.json';
import Image from 'next/image';

interface TypeDistribution {
  type: string;
  count: number;
  ratio: number;
  [key: string]: string | number;
}

interface AxisStat {
  axis: string;
  poleDistribution: {
    [key: string]: number;
  };
  meanScore: number;
  stddevScore: number;
}

interface AggregatesData {
  sessionCode?: string;
  sessionTitle?: string;
  sessionStartsAt?: string;
  totalResponses: number;
  typeDistribution: TypeDistribution[];
  axisStats: AxisStat[];
  insights?: {
    highVarianceAxes: Array<{ axis: string; stddev: number }>;
    skewedAxes: Array<{ axis: string; dominantPole: string; poleRatio: number }>;
  };
}

interface Participant {
  name: string | null;
  email: string | null;
  score?: number;
}

interface ParticipantsByType {
  type: string;
  participants: Participant[];
  count: number;
}

interface ParticipantsByAxis {
  axis: string;
  poles: Array<{
    pole: string;
    participants: Participant[];
    count: number;
  }>;
}

const AXIS_LABELS: Record<string, { name: string; nameEn: string; poles: Record<string, { ko: string; en: string }> }> = {
  motivation: {
    name: '동기부여',
    nameEn: 'Motivation',
    poles: {
      intrinsic: { ko: '내재적', en: 'Intrinsic' },
      extrinsic: { ko: '외재적', en: 'Extrinsic' },
      balanced: { ko: '균형', en: 'Balanced' },
    },
  },
  flexibility: {
    name: '유연성',
    nameEn: 'Flexibility',
    poles: {
      change: { ko: '변화', en: 'Change' },
      system: { ko: '관리', en: 'System' },
      balanced: { ko: '균형', en: 'Balanced' },
    },
  },
  direction: {
    name: '리더십 방향성',
    nameEn: 'Direction',
    poles: {
      work: { ko: '일', en: 'Work' },
      people: { ko: '사람', en: 'People' },
      balanced: { ko: '균형', en: 'Balanced' },
    },
  },
  communication: {
    name: '의사소통',
    nameEn: 'Communication',
    poles: {
      direct: { ko: '지시', en: 'Direct' },
      engage: { ko: '참여', en: 'Engage' },
      balanced: { ko: '균형', en: 'Balanced' },
    },
  },
};

export default function DashboardDataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCodeParam = searchParams.get('session_code');

  const [sessionCode, setSessionCode] = useState(sessionCodeParam || '');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AggregatesData | null>(null);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [participantsByType, setParticipantsByType] = useState<ParticipantsByType[]>([]);
  const [participantsByAxis, setParticipantsByAxis] = useState<ParticipantsByAxis[]>([]);

  // URL 파라미터에서 세션 코드 가져오기 및 sessionStorage에서 관리자 키 가져오기
  useEffect(() => {
    if (sessionCodeParam) {
      setSessionCode(sessionCodeParam);
    }
    // sessionStorage에서 관리자 키 불러오기
    if (typeof window !== 'undefined') {
      const savedAdminKey = sessionStorage.getItem('admin_key');
      if (savedAdminKey) {
        setAdminKey(savedAdminKey);
      }
    }
  }, [sessionCodeParam]);

  // 집계 데이터 조회
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!sessionCode || !adminKey) {
      setError('세션 코드와 관리자 키를 모두 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const params = new URLSearchParams({
        session_code: sessionCode,
        admin_key: adminKey,
      });

      const response = await fetch(`/api/admin/aggregates?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || '데이터를 불러오는데 실패했습니다');
        return;
      }

      setData(result.data);
      setHasAutoLoaded(true);

      // 참여자 목록도 함께 조회
      await Promise.all([loadParticipants(), loadParticipantsByAxis()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 참여자 목록 조회 (리더십 유형별)
  const loadParticipants = async () => {
    if (!sessionCode || !adminKey) {
      return;
    }

    try {
      const params = new URLSearchParams({
        session_code: sessionCode,
        admin_key: adminKey,
      });

      const response = await fetch(`/api/admin/participants?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setParticipantsByType(result.data || []);
      }
    } catch (err) {
      console.error('참여자 목록 조회 실패:', err);
    }
  };

  // 참여자 목록 조회 (축별/극성별)
  const loadParticipantsByAxis = async () => {
    if (!sessionCode || !adminKey) {
      return;
    }

    try {
      const params = new URLSearchParams({
        session_code: sessionCode,
        admin_key: adminKey,
      });

      const response = await fetch(`/api/admin/participants-by-axis?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setParticipantsByAxis(result.data || []);
      }
    } catch (err) {
      console.error('축별 참여자 목록 조회 실패:', err);
    }
  };

  // 관리자 키와 세션 코드가 모두 있으면 자동으로 데이터 조회 (한 번만)
  useEffect(() => {
    if (adminKey && sessionCode && !hasAutoLoaded && !loading && !data) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, sessionCode]);

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-purple via-brand-magenta to-brand-purple bg-clip-text text-transparent">
            데이터 조회
          </h1>
          <p className="text-gray-600 text-lg">세션별 리더십 진단 집계 데이터 조회</p>
        </div>

        {/* 대시보드로 돌아가기 버튼 (항상 표시) */}
        <div className="mb-4 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-brand-purple hover:text-brand-magenta font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드로 돌아가기
          </button>
        </div>

        {/* 입력 폼 (데이터가 없을 때만 표시) */}
        {!data && (
          <div className="glass-premium rounded-3xl p-6 sm:p-8 mb-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminKey" className="block text-sm font-semibold text-gray-700 mb-2">
                  관리자 키
                </label>
                <input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="관리자 키를 입력하세요"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="sessionCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  세션 코드
                </label>
                <input
                  id="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="예: LGCH-20260110-AM"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !sessionCode || !adminKey}
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '조회 중...' : '데이터 조회'}
              </button>
            </form>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="glass-premium rounded-3xl p-6 mb-8 max-w-2xl mx-auto bg-red-50/80 border border-red-200">
            <p className="text-red-600 font-semibold">오류: {error}</p>
          </div>
        )}

        {/* 데이터 표시 */}
        {data && (
          <div className="space-y-8">
            {/* 요약 카드 */}
            <div className="glass-premium rounded-3xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">세션 요약</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-brand-purple/10 to-brand-magenta/10 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">총 응답 수</p>
                  <p className="text-3xl font-bold text-brand-purple">{data.totalResponses}</p>
                </div>
                <div className="bg-gradient-to-br from-brand-light-blue/10 to-brand-purple/10 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">유형 종류</p>
                  <p className="text-3xl font-bold text-brand-purple">{data.typeDistribution?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-brand-magenta/10 to-brand-light-blue/10 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">데이터 축</p>
                  <p className="text-3xl font-bold text-brand-purple">4</p>
                </div>
              </div>
              {data.sessionTitle && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">세션명: <span className="font-semibold text-gray-800">{data.sessionTitle}</span></p>
                  {data.sessionStartsAt && (
                    <p className="text-sm text-gray-600 mt-1">시작일시: <span className="font-semibold text-gray-800">{new Date(data.sessionStartsAt).toLocaleString('ko-KR')}</span></p>
                  )}
                </div>
              )}
            </div>

            {/* 유형 분포 */}
            {data.typeDistribution && data.typeDistribution.length > 0 && (
              <div className="glass-premium rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">리더십 유형 분포</h2>
                <div className="w-full" style={{ height: '500px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.typeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ type, count }) => {
                          const total = data.totalResponses || 0;
                          const percentage = ((count / total) * 100).toFixed(1);
                          return `${type}\n${percentage}%`;
                        }}
                        labelLine={false}
                      >
                        {data.typeDistribution.map((entry, index) => {
                          const colors = [
                            '#9333ea', // brand-purple
                            '#ec4899', // brand-magenta
                            '#3b82f6', // brand-light-blue
                            '#8b5cf6', // purple variant
                            '#f59e0b', // amber
                            '#10b981', // emerald
                            '#ef4444', // red
                            '#06b6d4', // cyan
                            '#f97316', // orange
                            '#6366f1', // indigo
                            '#14b8a6', // teal
                            '#a855f7', // violet
                            '#eab308', // yellow
                            '#22c55e', // green
                            '#3b82f6', // blue
                            '#f43f5e', // rose
                          ];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload[0]) return null;
                          
                          const itemData = payload[0].payload;
                          const typeCode = itemData.type;
                          const typeInfo = (leadershipTypes as any)[typeCode];
                          const representativePerson = typeInfo?.representativePerson || typeCode;
                          const total = data.totalResponses || 0;
                          const percentage = ((itemData.count / total) * 100).toFixed(1);
                          
                          return (
                            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
                              <div className="flex items-center gap-6 mb-4">
                                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-brand-purple/20">
                                  <Image
                                    src={`/images/portraits/${typeCode}.png`}
                                    alt={representativePerson}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-2xl">{representativePerson}</p>
                                  <p className="text-base text-gray-600 mt-1">{typeCode}</p>
                                </div>
                              </div>
                              <div className="pt-4 border-t-2 border-gray-200">
                                <p className="text-center text-gray-600">
                                  <span className="font-semibold text-brand-purple text-2xl">{itemData.count}명</span>
                                  <span className="ml-2 text-xl">({percentage}%)</span>
                                </p>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        formatter={(value, entry: any) => {
                          const typeCode = entry.payload.type;
                          const typeInfo = (leadershipTypes as any)[typeCode];
                          const representativePerson = typeInfo?.representativePerson || typeCode;
                          return `${representativePerson} (${typeCode})`;
                        }}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 응답자 목록 표 */}
            {participantsByType.length > 0 && (
              <div className="glass-premium rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">리더십 유형별 응답자 목록</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {participantsByType.map((item) => {
                    const typeInfo = (leadershipTypes as any)[item.type];
                    const representativePerson = typeInfo?.representativePerson || item.type;
                    return (
                      <div
                        key={item.type}
                        className="bg-white/60 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <div className="font-bold text-lg text-gray-800">{item.type}</div>
                          <div className="text-sm text-gray-600 mt-1">{representativePerson}</div>
                        </div>
                        <div className="text-sm text-gray-700">
                          {item.participants.length > 0 ? (
                            <ul className="space-y-2">
                              {item.participants.map((participant, idx) => (
                                <li key={idx} className="flex flex-col">
                                  {participant.name && (
                                    <span className="font-medium text-gray-800">{participant.name}</span>
                                  )}
                                  {participant.email && (
                                    <span className="text-xs text-gray-600 break-all">{participant.email}</span>
                                  )}
                                  {!participant.name && !participant.email && (
                                    <span className="text-gray-400 italic text-xs">정보 없음</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic text-xs">응답자 없음</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 기준 별 점수 */}
            {participantsByAxis.length > 0 && (
              <div className="glass-premium rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-8 text-gray-800">기준 별 점수</h2>
                <div className="space-y-6">
                  {participantsByAxis.map((axisData, axisIndex) => {
                    const axisLabel = AXIS_LABELS[axisData.axis] || { name: axisData.axis, nameEn: axisData.axis, poles: {} };
                    // 각 축의 두 극성을 순서대로 정렬 (balanced 제외)
                    const sortedPoles = axisData.poles.sort((a, b) => {
                      // 각 축의 극성 순서 정의
                      const poleOrder: Record<string, string[]> = {
                        motivation: ['intrinsic', 'extrinsic'],
                        flexibility: ['change', 'system'],
                        direction: ['work', 'people'],
                        communication: ['direct', 'engage'],
                      };
                      const order = poleOrder[axisData.axis] || [];
                      const indexA = order.indexOf(a.pole);
                      const indexB = order.indexOf(b.pole);
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    });
                    
                    // 두 극성 가져오기 (없으면 빈 배열로)
                    const pole1 = sortedPoles[0] || { pole: '', participants: [], count: 0 };
                    const pole2 = sortedPoles[1] || { pole: '', participants: [], count: 0 };
                    const pole1Label = axisLabel.poles[pole1.pole] || { ko: pole1.pole, en: pole1.pole };
                    const pole2Label = axisLabel.poles[pole2.pole] || { ko: pole2.pole, en: pole2.pole };
                    
                    // 각 기준별 색상 정의
                    const axisColors: Record<string, { bg: string; border: string; pole1: string; pole2: string }> = {
                      motivation: {
                        bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
                        border: 'border-purple-200',
                        pole1: 'bg-purple-100 border-purple-300',
                        pole2: 'bg-pink-100 border-pink-300',
                      },
                      flexibility: {
                        bg: 'bg-gradient-to-br from-blue-50 to-teal-50',
                        border: 'border-blue-200',
                        pole1: 'bg-blue-100 border-blue-300',
                        pole2: 'bg-teal-100 border-teal-300',
                      },
                      direction: {
                        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
                        border: 'border-orange-200',
                        pole1: 'bg-orange-100 border-orange-300',
                        pole2: 'bg-amber-100 border-amber-300',
                      },
                      communication: {
                        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        pole1: 'bg-green-100 border-green-300',
                        pole2: 'bg-emerald-100 border-emerald-300',
                      },
                    };
                    
                    const colors = axisColors[axisData.axis] || {
                      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                      border: 'border-gray-200',
                      pole1: 'bg-gray-100 border-gray-300',
                      pole2: 'bg-gray-100 border-gray-300',
                    };
                    
                    return (
                      <div
                        key={axisData.axis}
                        className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
                      >
                        <div className="mb-6">
                          <h3 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
                            {axisLabel.name}
                          </h3>
                          <p className="text-sm text-gray-600 text-center font-medium">
                            {axisLabel.nameEn}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* 왼쪽 극성 */}
                          <div className={`${colors.pole1} border-2 rounded-xl p-5`}>
                            <div className="mb-4 text-center">
                              <div className="text-lg font-bold text-gray-800 mb-1">
                                {pole1Label.ko}
                              </div>
                              <div className="text-xs text-gray-600 mb-2 font-medium">
                                {pole1Label.en}
                              </div>
                              <div className="inline-block bg-white/80 px-4 py-1.5 rounded-full shadow-sm">
                                <span className="text-2xl font-extrabold text-gray-800">{pole1.count}</span>
                                <span className="text-sm text-gray-600 ml-1">명</span>
                              </div>
                            </div>
                            {pole1.participants.length > 0 ? (
                              <div className="bg-white/60 rounded-lg p-3 min-h-[100px]">
                                <div className="text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1.5 leading-relaxed">
                                  {pole1.participants.map((participant, idx) => (
                                    <span key={idx} className="inline-block">
                                      {participant.name ? (
                                        <span className="font-medium">
                                          {participant.name}
                                          {participant.score !== undefined && (
                                            <span className="text-gray-500 font-normal">({participant.score.toFixed(1)})</span>
                                          )}
                                        </span>
                                      ) : participant.email ? (
                                        <span>
                                          {participant.email}
                                          {participant.score !== undefined && (
                                            <span className="text-gray-500">({participant.score.toFixed(1)})</span>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">정보 없음</span>
                                      )}
                                      {idx < pole1.participants.length - 1 && <span className="text-gray-400">, </span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white/60 rounded-lg p-3 min-h-[100px] flex items-center justify-center">
                                <div className="text-gray-400 italic text-sm">응답자 없음</div>
                              </div>
                            )}
                          </div>
                          
                          {/* 오른쪽 극성 */}
                          <div className={`${colors.pole2} border-2 rounded-xl p-5`}>
                            <div className="mb-4 text-center">
                              <div className="text-lg font-bold text-gray-800 mb-1">
                                {pole2Label.ko}
                              </div>
                              <div className="text-xs text-gray-600 mb-2 font-medium">
                                {pole2Label.en}
                              </div>
                              <div className="inline-block bg-white/80 px-4 py-1.5 rounded-full shadow-sm">
                                <span className="text-2xl font-extrabold text-gray-800">{pole2.count}</span>
                                <span className="text-sm text-gray-600 ml-1">명</span>
                              </div>
                            </div>
                            {pole2.participants.length > 0 ? (
                              <div className="bg-white/60 rounded-lg p-3 min-h-[100px]">
                                <div className="text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1.5 leading-relaxed">
                                  {pole2.participants.map((participant, idx) => (
                                    <span key={idx} className="inline-block">
                                      {participant.name ? (
                                        <span className="font-medium">
                                          {participant.name}
                                          {participant.score !== undefined && (
                                            <span className="text-gray-500 font-normal">({participant.score.toFixed(1)})</span>
                                          )}
                                        </span>
                                      ) : participant.email ? (
                                        <span>
                                          {participant.email}
                                          {participant.score !== undefined && (
                                            <span className="text-gray-500">({participant.score.toFixed(1)})</span>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">정보 없음</span>
                                      )}
                                      {idx < pole2.participants.length - 1 && <span className="text-gray-400">, </span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white/60 rounded-lg p-3 min-h-[100px] flex items-center justify-center">
                                <div className="text-gray-400 italic text-sm">응답자 없음</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

