# LG Chem MFDC 리더십 유형 진단

Next.js (App Router) + TypeScript + TailwindCSS + Supabase로 구현된 리더십 유형 진단 웹 애플리케이션입니다.

## 기능

- 4개 축, 총 32문항의 리더십 진단
- MBTI 스타일의 1-7점 리커트 척도 응답 방식
- 진행 상태 자동 저장 (localStorage)
- 16가지 리더십 유형 결과 제공
- **백엔드 지원**: Supabase를 통한 데이터 저장 및 집계
- **관리자 대시보드**: 세션별 집계 데이터 조회 (유형 분포, 축 통계)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 프로젝트 구조

```
lgchem_MFDC/
├── app/
│   ├── page.tsx                    # 메인 페이지
│   ├── test/
│   │   └── page.tsx                # 진단 페이지
│   ├── result/
│   │   └── [code]/
│   │       └── page.tsx            # 결과 페이지
│   ├── api/
│   │   ├── submit/
│   │   │   └── route.ts            # 제출 API
│   │   └── admin/
│   │       └── aggregates/
│   │           └── route.ts        # 관리자 집계 API
│   ├── layout.tsx                  # 루트 레이아웃
│   └── globals.css                 # 전역 스타일
├── components/
│   ├── ProgressBar.tsx             # 진행률 표시 컴포넌트
│   └── QuestionCard.tsx            # 문항 카드 컴포넌트
├── lib/
│   ├── storage.ts                  # localStorage 관리
│   ├── scoring.ts                  # 점수 계산 로직
│   └── supabaseAdmin.ts            # Supabase 클라이언트 설정
├── data/
│   ├── questions.json              # 문항 데이터
│   └── leadershipTypes.json        # 리더십 유형 데이터
├── supabase/
│   └── schema.sql                  # 데이터베이스 스키마
├── scripts/
│   └── test-scoring.ts             # 점수 계산 테스트 스크립트
└── BACKEND_SETUP.md                # 백엔드 설정 가이드
```

## 리더십 유형

### 4개 축

1. **동기부여 (Motivation)**: Intrinsic (I) vs Extrinsic (E)
2. **유연성 (Flexibility)**: Change (C) vs System (S)
3. **리더십 방향성 (Direction)**: Results (R) vs People (P)
4. **소통 방식 (Communication)**: Direct (D) vs eNgage (N)

### 결과 코드 형식

[I/E][C/S][R/P][D/N] - 총 16가지 유형

예: ICRD, ESPN 등

**동점 처리:**
- 한 축에서 양쪽 극성의 점수가 동일한 경우 'X'로 표시 (예: IXRD, ECXD)
- 동점 축이 있으면 유형 코드에 'X'가 포함됨

## 백엔드 설정

백엔드 기능을 사용하려면 Supabase 설정이 필요합니다.

1. **환경 변수 설정**
   - `.env.local` 파일을 생성하고 `.env.example`의 형식을 참고하여 설정
   - Supabase 프로젝트의 URL과 키를 입력

2. **데이터베이스 설정**
   - `BACKEND_SETUP.md` 파일의 가이드를 따라 데이터베이스 스키마를 생성

3. **API 사용**
   - 제출 API: `POST /api/submit` (진단 결과 제출)
   - 관리자 집계 API: `GET /api/admin/aggregates` (세션별 집계 데이터 조회)

자세한 내용은 [`BACKEND_SETUP.md`](./BACKEND_SETUP.md)를 참고하세요.

