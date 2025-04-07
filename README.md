## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.


# 진행 상황
- chapter 15의 https://nextjs.org/learn/dashboard-app/adding-authentication#updating-the-login-form 아래 login-form.tsx 부터
- chapter 12의 https://nextjs.org/learn/dashboard-app/mutating-data#1-create-a-new-route-and-form 부터 진행 해라

# Run server
- `pnpm run dev`


## ISSUE
### 챕터6의 디플로이 과정 중 빌드 오류 발생
- 오류 메시지: `Error: Cannot find module '/vercel/path0/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node`
-  해결 방법
    - 참조URL: https://github.com/vercel/next.js/discussions/76822
    - `pnpm remove bcrypt` 명령어 실행어로 패키지 제거 및 `pnpm add bcryptjs` 로 패키지 설치
    - `/app/seed/route.ts` 파일 최상단의 `import bcrypt from 'bcrypt';` 를 `import bcrypt from 'bcryptjs';` 로 변경