'use client';

import { useState } from 'react';
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

const AXIS_LABELS: Record<string, { name: string; poles: Record<string, string> }> = {
  motivation: {
    name: '동기',
    poles: {
      intrinsic: '내재적',
      extrinsic: '외재적',
      balanced: '균형',
    },
  },
  flexibility: {
    name: '유연성',
    poles: {
      change: '변화',
      system: '관리',
      balanced: '균형',
    },
  },
  direction: {
    name: '방향성',
    poles: {
      results: '성과',
      people: '관계',
      balanced: '균형',
    },
  },
  communication: {
    name: '소통',
    poles: {
      direct: '지시',
      engage: '참여',
      balanced: '균형',
    },
  },
};

interface Session {
  session_code: string;
  title: string | null;
  starts_at: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AggregatesData | null>(null);
  
  // 세션 관리 상태
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionStartsAt, setNewSessionStartsAt] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // 세션 목록 불러오기
  const loadSessions = async () => {
    if (!adminKey) {
      setError('먼저 관리자 키를 입력해주세요');
      return;
    }

    setLoadingSessions(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sessions?admin_key=${encodeURIComponent(adminKey)}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || '세션 목록을 불러오는데 실패했습니다');
        return;
      }

      setSessions(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoadingSessions(false);
    }
  };

  // 새 세션 생성
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey) {
      setError('관리자 키를 입력해주세요');
      return;
    }

    setCreatingSession(true);
    setError(null);

    try {
      const body: { title: string; starts_at?: string } = {
        title: newSessionTitle,
      };

      if (newSessionStartsAt) {
        // datetime-local 형식 (YYYY-MM-DDTHH:mm)은 브라우저의 로컬 시간대를 사용
        // 한국에서 접속한 경우 자동으로 한국 시간으로 처리됨
        // ISO 8601 형식으로 변환 (UTC 기준으로 변환됨)
        // datetime-local 값을 그대로 Date 객체로 파싱하면 로컬 시간대로 해석됨
        const localDateTime = new Date(newSessionStartsAt);
        body.starts_at = localDateTime.toISOString();
      }

      const response = await fetch(`/api/admin/sessions?admin_key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '세션 생성에 실패했습니다');
        return;
      }

      // 세션 목록 새로고침
      await loadSessions();
      
      // 생성된 세션 선택
      setSessionCode(result.data.session_code);
      
      // 폼 초기화
      setNewSessionTitle('');
      setNewSessionStartsAt('');
      setShowCreateSession(false);

      // 생성된 세션의 참여 링크 표시
      alert(`세션이 생성되었습니다!\n\n세션 코드: ${result.data.session_code}\n참여 링크: ${result.data.participationLink}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setCreatingSession(false);
    }
  };

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
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 세션 선택 시 자동 조회
  const handleSessionSelect = (code: string) => {
    setSessionCode(code);
    if (adminKey) {
      // 약간의 지연 후 자동 조회 (상태 업데이트 완료 후)
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light-blue/10 via-white via-brand-light-gray/5 to-brand-purple/6" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-purple via-brand-magenta to-brand-purple bg-clip-text text-transparent">
            관리자 대시보드
          </h1>
          <p className="text-gray-600 text-lg">세션별 리더십 진단 집계 데이터 조회</p>
        </div>

        {/* 입력 폼 */}
        <div className="glass-premium rounded-3xl p-6 sm:p-8 mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="adminKey" className="block text-sm font-semibold text-gray-700 mb-2">
                관리자 키
              </label>
              <div className="flex gap-2">
                <input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="관리자 키를 입력하세요"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                />
                <button
                  type="button"
                  onClick={loadSessions}
                  disabled={loadingSessions || !adminKey}
                  className="px-6 py-3 bg-brand-light-blue text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loadingSessions ? '로딩...' : '세션 목록'}
                </button>
              </div>
            </div>

            {sessions.length > 0 && (
              <div>
                <label htmlFor="sessionSelect" className="block text-sm font-semibold text-gray-700 mb-2">
                  세션 선택
                </label>
                <select
                  id="sessionSelect"
                  value={sessionCode}
                  onChange={(e) => handleSessionSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                >
                  <option value="">세션을 선택하세요</option>
                  {sessions.map((session) => (
                    <option key={session.session_code} value={session.session_code}>
                      {session.title || session.session_code} 
                      {session.starts_at && ` - ${new Date(session.starts_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="sessionCode" className="block text-sm font-semibold text-gray-700 mb-2">
                세션 코드 (직접 입력)
              </label>
              <input
                id="sessionCode"
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder="예: LGCH-20260110-AM"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !sessionCode || !adminKey}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? '조회 중...' : '데이터 조회'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateSession(!showCreateSession)}
                className="px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {showCreateSession ? '취소' : '세션 생성'}
              </button>
            </div>
          </form>

          {/* 세션 생성 폼 */}
          {showCreateSession && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold mb-4 text-gray-800">새 세션 생성</h3>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label htmlFor="newSessionTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                    세션명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="newSessionTitle"
                    type="text"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="예: LG화학 OO과정 1/10 오전"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                  />
                </div>
                <div>
                  <label htmlFor="newSessionStartsAt" className="block text-sm font-semibold text-gray-700 mb-2">
                    시작일시 (선택사항, 한국 시간 기준)
                  </label>
                  <input
                    id="newSessionStartsAt"
                    type="datetime-local"
                    value={newSessionStartsAt}
                    onChange={(e) => setNewSessionStartsAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple bg-white/80 text-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500">미입력 시 현재 시간 기준으로 자동 설정됩니다</p>
                </div>
                <button
                  type="submit"
                  disabled={creatingSession || !newSessionTitle || !adminKey}
                  className="w-full py-3 px-6 bg-gradient-to-r from-brand-purple to-brand-magenta text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {creatingSession ? '생성 중...' : '세션 생성'}
                </button>
              </form>
            </div>
          )}
        </div>

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

            {/* 4축 통계 */}
            {data.axisStats && data.axisStats.length > 0 && (
              <div className="glass-premium rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">4축 통계</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.axisStats.map((stat) => {
                    const axisLabel = AXIS_LABELS[stat.axis] || { name: stat.axis, poles: {} };
                    return (
                      <div key={stat.axis} className="bg-white/60 rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">{axisLabel.name}</h3>
                        
                        {/* 평균 및 표준편차 */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">평균 점수</p>
                            <p className="text-2xl font-bold text-brand-purple">{stat.meanScore.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">표준편차</p>
                            <p className="text-2xl font-bold text-brand-magenta">{stat.stddevScore.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* 극성 분포 */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700 mb-2">극성 분포</p>
                          {Object.entries(stat.poleDistribution).map(([pole, ratio]) => (
                            <div key={pole} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {axisLabel.poles[pole] || pole}
                              </span>
                              <div className="flex items-center gap-2 flex-1 mx-4">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-brand-light-blue to-brand-purple"
                                    style={{ width: `${ratio * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-800 w-16 text-right">
                                  {(ratio * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 인사이트 */}
            {data.insights && (
              <div className="glass-premium rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">디브리핑 인사이트</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 편차가 큰 축 */}
                  {data.insights.highVarianceAxes && data.insights.highVarianceAxes.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-6">
                      <h3 className="text-lg font-bold mb-4 text-gray-800">편차가 큰 축 (TOP 2)</h3>
                      <ul className="space-y-2">
                        {data.insights.highVarianceAxes.map((item) => {
                          const axisLabel = AXIS_LABELS[item.axis] || { name: item.axis };
                          return (
                            <li key={item.axis} className="flex justify-between items-center">
                              <span className="text-gray-700">{axisLabel.name}</span>
                              <span className="font-semibold text-brand-purple">{item.stddev.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* 한쪽으로 치우친 축 */}
                  {data.insights.skewedAxes && data.insights.skewedAxes.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-6">
                      <h3 className="text-lg font-bold mb-4 text-gray-800">한쪽으로 치우친 축 (TOP 2)</h3>
                      <ul className="space-y-2">
                        {data.insights.skewedAxes.map((item) => {
                          const axisLabel = AXIS_LABELS[item.axis] || { name: item.axis, poles: {} };
                          return (
                            <li key={item.axis} className="flex justify-between items-center">
                              <span className="text-gray-700">
                                {axisLabel.name} ({axisLabel.poles[item.dominantPole] || item.dominantPole})
                              </span>
                              <span className="font-semibold text-brand-magenta">{(item.poleRatio * 100).toFixed(1)}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

