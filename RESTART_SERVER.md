# 서버 재시작 가이드

## 문제
포트가 모두 사용 중이어서 서버를 시작할 수 없습니다.

## 해결 방법

### 방법 1: 자동 정리 스크립트 사용 (권장)

터미널에서 실행:
```bash
bash clean-start.sh
```

그 다음:
```bash
npm run dev
```

### 방법 2: 수동 정리

터미널에서 실행:
```bash
# 모든 Next.js 프로세스 종료
pkill -9 -f "next dev"

# 잠시 대기
sleep 2

# 서버 시작
npm run dev
```

### 방법 3: Activity Monitor 사용 (macOS)

1. Activity Monitor 앱 실행
2. 검색창에 "node" 입력
3. "next dev" 관련 프로세스 선택
4. 강제 종료 (Force Quit)

## 서버 시작 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

**중요:** 실행되는 포트 번호를 확인하세요!

## 테스트

서버가 시작된 후 (포트 번호 확인 후):

```bash
bash scripts/test-simple.sh 3000
```

(포트 번호는 실제 실행 포트로 변경)

