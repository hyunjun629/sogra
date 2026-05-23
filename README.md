# 🛡️ 대충실드 QR
### Daejeon, Chungcheong-do QR

> 대전·충청 소상공인을 위한 **HMAC 서명 기반 공식 인증 QR 플랫폼**  
> 상품 등록 → QR 자동 발급 → 고객 진위 확인 → 실시간 보안 관제

---

## 핵심 차별점

- 🔐 **HMAC SHA-256 QR 인증** — 상품마다 고유 서명, 토큰 위조 불가
- 🔍 **3단계 QR 검증** — 정상 ✅ / 주의 ⚠️ / 위험 🚨, 위험 시 상품 정보 일절 미노출
- 📊 **실시간 보안 관제** — SQLi · XSS · BruteForce · IDOR · 위조QR 5종 탐지, 3초 폴링
- 🎯 **원클릭 시연 모드** — 버튼 하나로 5종 공격 자동 재생 + 실시간 로그 확인

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS · React Router v6 |
| 차트 | Recharts |
| QR | qrcode.react |
| Backend | Node.js 18+ · Express |
| DB | better-sqlite3 |
| 인증 | bcrypt · JWT HS256 |
| 보안 | HMAC SHA-256 · express-rate-limit · helmet · sanitize-html |

---

## 폴더 구조

```
sogra/
├── package.json          ← concurrently 루트 실행
├── .env.example
├── backend/
│   ├── server.js
│   ├── db.js             ← SQLite 스키마 자동 초기화
│   ├── seed.js           ← 첫 실행 시 시드 데이터 자동 삽입
│   ├── routes/
│   │   ├── auth.js       ← 로그인/회원가입, SQLi·BruteForce 방어
│   │   ├── products.js   ← 상품 CRUD, HMAC QR 생성, XSS·IDOR 방어
│   │   ├── reports.js    ← 신고, 3건 누적 시 자동 비활성화
│   │   └── admin.js      ← 관제 API, 시연 엔드포인트, 데모 리셋
│   ├── middleware/
│   │   ├── auth.js       ← JWT 검증, 역할 분리
│   │   └── security.js   ← SQLi 패턴 탐지, Rate Limit
│   └── utils/
│       ├── qr.js         ← HMAC 토큰 생성/검증
│       ├── promo.js      ← AI 홍보 문구 mock
│       └── logger.js     ← 보안 로그 기록
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api.js        ← 전체 API 호출 집중 관리
        ├── auth.js       ← JWT 로컬스토리지 관리
        ├── pages/        ← 9개 페이지
        └── components/   ← Navbar, LogTable, AttackButton, MapKorea
```

---

## 설치 및 실행

```bash
# 1. 의존성 설치
npm install
cd frontend && npm install && cd ..

# 2. 실행 (백엔드 3001 + 프론트엔드 5173 동시)
npm run dev

# 3. 접속
open http://localhost:5173
```

> DB(`backend/localshield.db`)는 첫 실행 시 자동 생성됩니다. 수동 마이그레이션 불필요.

---

## 데모 계정

| 역할 | 이메일 | 비밀번호 | 비고 |
|---|---|---|---|
| 관리자 | admin@localshield.com | 1234 | 전체 관제 대시보드 |
| 상인 (승인) | merchant@localshield.com | 1234 | 상품 5개 등록됨 |
| 상인 (대기) | pending@localshield.com | 1234 | 주의 화면 시연용 |

---

## 5분 발표 시나리오

### 1단계 — 랜딩 (30초)
`/` 접속 → 히어로 문구, 통계, 대전·충청 지역 지도 확인

### 2단계 — 상인 역할 (60초)
1. `merchant@localshield.com` 로그인
2. 상점 대시보드 `/merchant` → 등록 상품 확인
3. 상품 카드 → **📱 QR 보기** → QR 코드 + 링크 확인

### 3단계 — 고객 역할, QR 3단계 검증 (60초)

| 화면 | 방법 |
|---|---|
| ✅ 정상 | 상점 대시보드 QR 링크 클릭 |
| ⚠️ 주의 | pending 계정 상품 QR 접속 |
| 🚨 위험 | `http://localhost:5173/product/1?token=FAKE_TOKEN_12345` |

### 4단계 — 관리자 보안 관제 (90초)
1. `admin@localshield.com` 로그인 → `/admin`
2. 통계 카드, 공격 유형별 차트 확인
3. **보안 시연 탭** → **▶ 전체 시연 시작** 클릭
4. 5종 공격 2.5초 간격 자동 실행 → 실시간 로그 확인
5. 완료 토스트 확인

### 5단계 — 마무리 (30초)
`/demo/attacker` → 공격자 시점에서 각 공격 패턴 + 차단 결과 설명

---

## 보안 시연 방법

### 자동 (권장)
관리자 로그인 → `/admin` → **보안 시연 탭** → **▶ 전체 시연 시작**

### 수동

| 공격 | 방법 |
|---|---|
| 🗡️ SQL Injection | 로그인 이메일에 `admin' OR '1'='1 --` 입력 |
| 🔨 BruteForce | 로그인 실패 5회 반복 |
| 💀 XSS | 상품 설명에 `<script>alert('XSS')</script>` 입력 후 등록 |
| 🚪 IDOR | pending 토큰으로 merchant 상품 PUT 요청 |
| 🎭 위조 QR | `http://localhost:5173/product/1?token=FAKE_TOKEN_12345` 접속 |

### 발표 전 리셋
관리자 대시보드 우상단 **🔄 데모 리셋** → 시드 상태로 복원

---

## 보안 설계 요점

| 위협 | 방어 | 탐지 |
|---|---|---|
| SQL Injection | 입력값 패턴 검사 후 쿼리 차단 | `SQLI_ATTEMPT` HIGH |
| BruteForce | 5회 실패 시 60초 계정 잠금 | `BRUTE_FORCE_LOCK` HIGH |
| XSS | sanitize-html로 태그 제거 후 저장 | `XSS_ATTEMPT` CRITICAL |
| IDOR | owner_id 서버 검증, 불일치 시 403 | `IDOR_ATTEMPT` MEDIUM |
| 위조 QR | HMAC 토큰 불일치 시 정보 미노출 | `FAKE_QR_ACCESS` CRITICAL |

> **알려진 한계:** JWT를 localStorage에 저장 중. 프로덕션에서는 HttpOnly 쿠키로 전환해 XSS 토큰 탈취까지 방어할 예정.

---

## 라이선스

MIT © 2025 대충실드 QR Team
