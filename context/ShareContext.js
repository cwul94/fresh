"use client"

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { IoEyeSharp, IoEyeOffSharp } from "react-icons/io5";
import { signOut, useSession } from "next-auth/react";

// Create the context
export const ShareContext = createContext();

// Create the provider component
export function MyProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);
  const [mainCategoryNum, setMainCategoryNum] = useState(null);
  const [listCategoryNum, setListCategoryNum] = useState(null);
  const [infoCategoryNum, setInfoCategoryNum] = useState(null);
  const [comunityCategoryNum, setComunityCategoryNum] = useState(null);
  const [previousPath, setPreviousPath] = useState("");
  const [isRedirectedToJoin, setIsRedirectedToJoin] = useState(false);
  const [isCnction, setIsCnction] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  const toggleVisibility = () => {
    setVisibility(!visibility);
  }
  
  const router = useRouter();
  const pathname = usePathname();

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  const { data:session, status } = useSession();

  // useEffect(() => {
  //   // 페이지가 변경될 때마다 현재 경로를 이전 경로로 업데이트합니다.
  //   const handleRouteChange = (url) => {
  //     setPreviousPath(url); // 이전 경로 저장
  //     console.log('이전경로저장 : ' + url);
  //   };

  //   // 현재 경로가 변경될 때마다 handleRouteChange 호출
  //   handleRouteChange(pathname);

  //   if ( status === 'authenticated' && previousPath === '/join' ) {
  //     console.log('회원가입 중 이탈.. 로그아웃');
  //     signOut({ callbackUrl: '/'}); // 로그아웃 처리
  //   }
  // }, [pathname]);

  // useEffect(() => {
  //   if (status === "authenticated") {
  //     const currentPath = window.location.pathname;

  //     // 소셜 로그인 후 가입 페이지에 도달했는지를 추적
  //     if (currentPath === "/join") {
  //       console.log('회원가입페이지 요청 완료');
  //       setIsRedirectedToJoin(true);
  //     } else {
  //       // 가입 페이지를 벗어나면 로그아웃
  //       if (isRedirectedToJoin) {
  //         console.log('회원가입 중 이탈.. 로그아웃')
  //         signOut({ callbackUrl: '/'});
  //       }
  //     }
  //   }
  // }, [status, router.asPath]);

  // useEffect(() => {
  //   // 초기 로드 시 쿠키에서 사용자 정보 및 장바구니 정보 가져오기
  //   const savedUserInfo = Cookies.get('userInfo');
  //   if (savedUserInfo) {
  //     setUserInfo(JSON.parse(savedUserInfo));
  //   }
  // }, []);

  useEffect(() => {
    // Check if authenticated and user was redirected to /join
    if (status === 'authenticated' && pathname === '/join') {
      setIsRedirectedToJoin(true);
      console.log('회원가입 페이지로 리다이렉트 완료');
    }

    // If the user was redirected to /join and leaves without completing registration
    if (status === 'authenticated' && !isCnction && isRedirectedToJoin && pathname !== '/join') {
      if ( pathname === '/' ) {
        console.log('회원가입을 완료하지 않고 이탈, 로그아웃 처리');
        signOut({ redirect: false }) // redirect: false로 설정하여 명시적 리다이렉트를 방지
          .then(() => {
            router.push('/'); // 강제로 홈으로 리다이렉트
          });
      }
    }

  }, [pathname]);

  useEffect( () => {
    // 세션 로딩 중에는 리다이렉트하지 않음
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      // const infoCookie = Cookies.get('userInfo');
      const infoStorage = localStorage.getItem('userInfo');
      if(infoStorage) {
        setUserInfo(null);
        updateUserInDB(userInfo,router);
      }
      return;
    }
    
    // 세션이 없거나 userData가 없으면 리다이렉트
    if (status === 'authenticated' && !session?.userData) {
      // console.log(session);
      router.push('/join');
      return;
    }
      
    const infoStorage = localStorage.getItem('userInfo');

    // 쿠키에서 정보 가져오기: JSON 파싱이 필요함
    if (status === 'authenticated' && session?.userData && infoStorage) {
      console.log('이미 로그인됨');
      const infoStorage = JSON.parse(localStorage.getItem('userInfo'));
      if (infoStorage) {
        console.log('쿠키에서 사용자 정보 로드');
        setUserInfo({
          userInfo: session?.userData.userInfo,
          cart: infoStorage?.cart,
          jjim: infoStorage?.jjim,
          order: session?.userData.order,
        })

        const addressStorage = localStorage.getItem('address');
        const detailsStorage = localStorage.getItem('address_details');
        if ( addressStorage ) {
          setUserInfo( prevInfo => ({
            ...prevInfo,
            userInfo: {
              ...prevInfo.userInfo,
              address: addressStorage,
              address_detail: detailsStorage,
            }
          }))
        }
      }
      return;
    }

    function omit(obj, ...keys) {
      const result = { ...obj }
      keys.forEach(key => delete result[key])
      return result
    }

    const filteredInfo = omit(session?.userData, 'order', 'userInfo');
    
    const parsedUserData = JSON.stringify(filteredInfo);
    // Cookies.set('userInfo', parsedUserData);  // 쿠키에 사용자 정보 저장
    localStorage.setItem('userInfo', parsedUserData);
    setUserInfo(session?.userData); // 상태에 사용자 정보 저장

    // 중복된 이메일로 로그인 시도시 연동 절차
    if (status === 'authenticated' && session?.userData?.dupStatus ) {
      setIsModal(!isModal);
      setUserInfo(null);
      localStorage.removeItem('userInfo');
      setMessage('동일한 이메일이 사용되고 있습니다. \n계정을 연동하시겠습니까?');
    }

  }, [status]);
  
  useEffect(() => {
    // userInfo 상태가 업데이트될 때마다 쿠키에 저장
    const infoStorage = localStorage.getItem('userInfo');
    if (userInfo) {
      function omit(obj, ...keys) {
        const result = { ...obj }
        keys.forEach(key => delete result[key])
        return result
      }

      const filteredInfo = omit(userInfo, 'order', 'userInfo');
      localStorage.setItem('userInfo', JSON.stringify(filteredInfo));
      console.log('로컬스토리지 등록함~');
    }
  }, [userInfo]);
  
  useEffect(() => {
    setListCategoryNum(0);
    setComunityCategoryNum(0);
    setInfoCategoryNum(0);

  }, [mainCategoryNum])

  const handleModalConfirm = () => {
    setIsConfirm(!isConfirm);
    setMessage('연동 계정 : ' + session?.user?.email);
    setEmail(session?.user?.email);
  };

  const handleModalCancel = () => {
      setIsModal(!isModal);
      setIsConfirm(!isConfirm);
      setMessage('');
      signOut({ redirect:false }).then(()=>{
        localStorage.removeItem('userInfo');
        localStorage.removeItem('address');
        localStorage.removeItem('address_details');
        router.push('/');
      })
  };

  const keyPressHandler = (event) => {
      if (event.key === "Enter") {
          event.preventDefault(); // 기본 동작 방지
          loginHandler();
      } else if (event.key === "Escape") {
          event.preventDefault(); // 기본 동작 방지
          handleModalCancel(); // "아니오" 버튼 동작
      }
  };

  const loginHandler = async () => {

    const response = await fetch('/api/login',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
      },
      body: JSON.stringify({
        email,password
      })
    });

    const data = await response.json();

    if( response.ok ) {
      setIsModal(false);
      setIsConfirm(false);
      alert('계정연동에 성공했습니다! \n다시 로그인해 주세요.');
      updateUserConnectInDB(session,router);
    } else {
      alert(data.message);
    }
  }

  return (
    <ShareContext.Provider value={{
      userInfo,
      setUserInfo,
      mainCategoryNum,
      setMainCategoryNum,
      listCategoryNum,
      setListCategoryNum,
      infoCategoryNum,
      setInfoCategoryNum,
      comunityCategoryNum,
      setComunityCategoryNum,
      previousPath,
      setPreviousPath,
      isCnction,
      setIsCnction,
      router,
      pathname,
      session,
      status,
      localDateTime,
    }}>
      {children}
      {isModal && (
        <div className='modal show' onKeyPress={keyPressHandler} tabIndex={-1}>
          <div className={`modal-content ${isConfirm ? 'login' : ''}`}>
            { !isConfirm && 
              <>
                <h4>{message}</h4>
                <div>
                  <button onClick={handleModalConfirm}>예</button>
                  <button onClick={handleModalCancel}>아니오</button>
                </div>
              </>
            }
            { isConfirm &&
              <>
                <h4>{message}</h4>
                <div className="login-box">
                  <div>
                    <input 
                      type="email" 
                      id="id" 
                      onKeyPress={keyPressHandler}
                      defaultValue={email}
                    />
                    <div>
                      <input 
                        type={visibility ? 'text' : 'password'} 
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={keyPressHandler}
                        placeholder="비밀번호를 입력하세요"
                      />
                      <button onClick={toggleVisibility} 
                              tabIndex="-1"
                              aria-label="Toggle password visibility">
                        {visibility ? <IoEyeOffSharp/> : <IoEyeSharp/>}
                      </button>
                    </div>
                  </div>
                  <button onClick={loginHandler}>로그인</button>
                </div>
                <button onClick={handleModalCancel}>취소</button>
              </>
            }
          </div>
        </div>
      )}    
    </ShareContext.Provider>
  );
}

// Custom hook for using the context
export function useShareContext() {
  return useContext(ShareContext);
}

async function updateUserInDB(userInfo,router) {
  try {
    const response = await fetch('/api/update-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userInfo?.userInfo?.username,
        email: userInfo?.userInfo?.email,
        address: userInfo?.userInfo?.address,
        details: userInfo?.userInfo?.address_detail,
        cart: userInfo?.cart,
        interest: userInfo?.jjim,
        order: userInfo?.order,
      }),
    });

    if (response.ok) {
      console.log('User information successfully updated in the database');
      signOut({ redirect:false }).then(()=>{
        localStorage.removeItem('userInfo');
        localStorage.removeItem('address');
        localStorage.removeItem('address_details');
        router.push('/');
      })
    } else {
      console.error('Failed to update user information in the database');
    }
  } catch (error) {
    console.error('Error during API request:', error);
  }
}

async function updateUserConnectInDB(session,router) {
  try {
    const response = await fetch('/api/update-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session?.userData?.userInfo?.email,
        connectform: session?.provider,
        loginformId: session?.user?.id,
      }),
    });

    if (response.ok) {
      console.log('User information successfully updated in the database');
      signOut({ redirect:false }).then(()=>{
        localStorage.removeItem('userInfo');
        localStorage.removeItem('address');
        localStorage.removeItem('address_details');
        router.push('/');
      })
    } else {
      console.error('Failed to update user information in the database');
    }
  } catch (error) {
    console.error('Error during API request:', error);
  }
}
