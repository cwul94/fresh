"use server"

import { getDatabaseConnection } from "@/lib/db";
import { addAccessSecretToEnv, addRefreshSecretToEnv } from "@/lib/generateSecret";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import bcrypt, { compareSync } from "bcrypt";
import client from "@/lib/redisClient";
import jwt from "jsonwebtoken";

export const authOptions = {
  debug: true,
  // Configure one or more authentication providers
  providers: [
    // Google provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline", // 여기에서 offline_access가 아닌 access_type 사용
        },
      },
    }),

    // Naver provider
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
    }),

    // Kakao provider
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('authorize 진입!');
      
        if(credentials.password) {
          console.log('패스워드있음');
          const db = await getDatabaseConnection();
          //console.log(db);
          const [rows] = await db.query('SELECT user_id FROM users WHERE email = ?', [credentials.email]);
          //console.log(rows);
          if ( rows.length === 0 ) {
            throw new Error('존재하지않는 계정입니다.')
          }
          
          const [userRows] = await db.query('SELECT email,password,username,address,address_detail,profile_img FROM users WHERE email = ?', [credentials.email]);
          const user = userRows[0];

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          db.release();
          console.log('왜안댐');
          
          if ( !isMatch ) {
            throw new Error('비밀번호를 확인해주세요.')
          }
          
          console.log('Valid User!');

          delete user.password;
          
          return user; // 사용자가 확인되면 반환
        } else {
          throw new Error('비밀번호를 입력해주세요.');
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signIn',
    error: '/auth/error', // 로그인 에러 페이지 경로 설정
  },
  session: {
    strategy: "jwt", // 세션 전략은 JWT로 설정
    maxAge: 3 * 60 * 60, // 기본적으로 세션은 7일간 유지
  },
  // jwt: {
  //   secret: process.env.NEXTAUTH_SECRET, // JWT 비밀 키
  //   encryption: true, // 암호화 활성화
  // },
  // cookies: {
  //   sessionToken: {
  //     name: `next-auth.session-token`,
  //     options: {
  //       httpOnly: true, // JavaScript에서 접근 불가
  //       // secure: process.env.NODE_ENV === "production", // 프로덕션 환경에서만 secure 설정
  //       sameSite: "lax", // CSRF 공격 방지
  //       path: '/', // 쿠키의 경로
  //     },
  //   },
  // },
  callbacks: {
    async signOut(message) {
      console.log("로그아웃 시 처리할 로직");
      // 예를 들어, 세션 종료 후 백엔드에 로그아웃 요청을 보낼 수 있음
      await client.del("profile_img");
      return true;  // 기본 동작을 유지하려면 true를 반환
    },
    async session({ session, token }) {
      // 세션에 token에서 추가된 provider 및 사용자 데이터 설정
      console.log('Session Util Token : ' + token );
      if (token) {
        const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
    
        if (token?.exp && token.exp < currentTime) {
          // 세션 만료 시 세션을 null로 설정
          console.log('세션만료~');
          session = null;
        } else {
          // 세션이 유효할 경우 provider와 userData 설정
          session.provider = token.provider;
          session.userData = token.userData;
          // session.access_token = token.access_token;
          session.user.id = token.id;
        }
      }
      return session;
    },
    async jwt({ token, account, user }) {

      const currentTime = Math.floor(Date.now() / 1000);

      console.log('jwt area : ' + account);
      // 사용자가 로그인할 때 provider 정보를 token에 추가
      if (account) {
        console.log(token);
        console.log(account);
        console.log(user);
        token.provider = account.provider;
        token.access_token = account.access_token;
        token.id = account.providerAccountId;

        if (account.expires_at) {
          token.exp = currentTime + account.expires_at;
        }
        
        const db = await getDatabaseConnection();
        
        console.log("Account Vaild : " + account.providerAccountId);
        
        let userRows;
        [userRows] = await db.query('SELECT user_id FROM users WHERE email = ?', [token.email]);
        if ( account.provider === 'naver' ) {
          [userRows] = await db.query('SELECT user_id FROM users WHERE loginform_id = ?', [account.providerAccountId]);
        } 
        // else {
        //   [userRows] = await db.query('SELECT user_id FROM users WHERE loginform_id = ?', [account.providerAccountId]);
        // }

        const userId = userRows[0]?.user_id;
        // 회원이 존재하지 않으면 token에 userData를 설정하지 않음 (null 처리)
        if (userRows.length === 0) {

          const refresh = account.refresh_token;

          (async () => {
            try {
                await client.connect();
                console.log('Redis 연결 성공');
            } catch (err) {
                console.error('Redis 초기 연결 실패:', err);
            }
          })();

          await client.set('refresh_token', refresh);
          if (user.image) {
            await client.set('profile_img', user.image);
          }
          const keys = await client.keys('*');
          console.log('Stored Keys:', keys);

          db.release();
          await client.disconnect();
          console.log('Data Invalid');
          token.userData = null;
          return token;
        }

        // if (account.provider === 'credentials') {

        //   const checkRefreshTokenValidity = async (refreshToken) => {
        //     try {
        //       // 토큰 해독
        //       const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
          
        //       if (!decoded || !decoded.exp) {
        //         throw new Error('유효하지 않은 refresh_token입니다.');
        //       }
          
        //       // 토큰 만료 여부 확인
        //       if (decoded.exp < currentTime) {
        //         console.log('refresh_token이 만료되었습니다.');
        //         addRefreshSecretToEnv();
        //         function generateRefreshToken(userId) {
        //           const refreshToken = jwt.sign(
        //             { id: userId },
        //             process.env.REFRESH_TOKEN_SECRET,
        //             { expiresIn: '7d' } // refresh 토큰 7일 유효
        //           );
        //           return refreshToken;
        //         }
        //         const refresh = generateRefreshToken(token.email);
        //         await db.query('UPDATE users SET refresh_token = ? WHERE user_id = ?', [refresh, userId]);

        //       } else {
        //         console.log('refresh_token이 아직 유효합니다.');
        //         return true;
        //       }
        //     } catch (error) {
        //       if (error.name === 'TokenExpiredError') {
        //         // 토큰 만료 처리 로직
        //         console.log('Token expired');
        //       } else {
        //         console.log('Token decode error: ', error.message);
        //       }
        //       return false;
        //     }
        //   };
          
        //   // refresh_token이 유효한지 확인
        //   checkRefreshTokenValidity(user?.refresh_token);
        // } else {
        //   await db.query('UPDATE users SET refresh_token = ? WHERE user_id = ?', [account.refresh_token, userId]);
        // }

        // 회원 정보가 존재하면 여러 테이블에서 데이터 조회 후 token에 추가
        const [rows] = await db.query('SELECT email,username,address,address_detail,profile_img FROM users WHERE user_id = ?', [userId]);
        const [cartRows] = await db.query('SELECT * FROM cart where user_id = ?', [userId]);
        const [jjimRows] = await db.query('SELECT * FROM interest where user_id = ?', [userId]);
        const [orderRows] = await db.query('SELECT * FROM orders where user_id = ?', [userId]);

        db.release();

        if (rows.length > 0) {
          let userData = {userInfo: rows[0], cart: cartRows, jjim: jjimRows, order: orderRows};
          if ( account.provider !== 'credentials' && rows[0].password && !rows[0].loginform_id) {
            userData = {userInfo: rows[0], cart: cartRows, jjim: jjimRows, order: orderRows, dupStatus: true};
          }
          token.userData = userData; // 토큰에 사용자 데이터 추가
          console.log('Data Valid : ' + token.userData);
        }
      }

      if (token.exp && token.exp < currentTime) {
        if (token.provider === 'google') {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: account.refresh_token,
              grant_type: "refresh_token",
            }),
          });

          const refreshedTokens = await response.json();
          console.log(refreshedTokens);
          if (!response.ok) throw refreshedTokens;

          token.access_token = refreshedTokens.access_token;
          token.exp = currentTime + refreshedTokens.expires_at;
        } else if (token.provider === 'naver') {
          const response = await fetch("https://nid.naver.com/oauth2.0/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.NAVER_CLIENT_ID,
              client_secret: process.env.NAVER_CLIENT_SECRET,
              refresh_token: account.refresh_token,
              grant_type: "refresh_token",
            }),
          });

          const refreshedTokens = await response.json();
          if (!response.ok) throw refreshedTokens;

          token.access_token = refreshedTokens.access_token;
          token.exp = currentTime + refreshedTokens.expires_at;
        } else if (token.provider === 'kakao') {
          const response = await fetch("https://kauth.kakao.com/oauth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.KAKAO_CLIENT_ID,
              client_secret: process.env.KAKAO_CLIENT_SECRET,
              refresh_token: account.refresh_token,
              grant_type: "refresh_token",
            }),
          });

          const refreshedTokens = await response.json();
          if (!response.ok) throw refreshedTokens;

          token.access_token = refreshedTokens.access_token;
          token.exp = currentTime + refreshedTokens.expires_at;
        } else if (token.provider === 'credentials') {
          addAccessSecretToEnv();
          token.access_token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
