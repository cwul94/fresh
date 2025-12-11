"use client";

import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { MyProvider, useShareContext } from "@/context/ShareContext";
import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { IoMdArrowDropdownCircle } from "react-icons/io";
import { RxExit } from "react-icons/rx";
import { SessionProvider, signOut } from "next-auth/react";

export default function RootLayout({ children }) {
  
  const afterModalRef = useRef(null);
  const yesButtonRef = useRef(null);
  const [ isModal, setIsModal] = useState(false);
  const [ isModalVisible, setIsModalVisible ] = useState(false);
  const [ isVisible, setIsVisible ] = useState(false);
  const [ message, setMessage] = useState("");

  useEffect(() => {
    if(isModal) {
      yesButtonRef.current?.focus();
      document.addEventListener("mousedown", handleClickModalOutside);
    } else {
      document.removeEventListener("mousedown", handleClickModalOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickModalOutside);
    }
  }, [isModal])

  const handleClickModalOutside = (event) => {
    if (
      afterModalRef.current &&
      !afterModalRef.current.contains(event.target)
    ) {
      setIsModal(false);
    }
  };

  const keyPressHandler = (event) => {
    if (event.key === "Enter") {
      setIsModal(false);
    } 
  };

  function scrollToTop(duration) {
    const start = window.scrollY;
    const startTime = performance.now();
  
    function animateScroll(currentTime) {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
  
      window.scrollTo(0, start * (1 - progress));
  
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    }
  
    requestAnimationFrame(animateScroll);
  }

  const pageUpHandler = () => {
    window.scrollTo({top:0,behavior:'instant'})
  };

  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <MyProvider>
            <div>
              <Navbar setIsModal={setIsModal} setIsModalVisible={setIsModalVisible} setMessage={setMessage} setIsVisible={setIsVisible}/>
              {children}
              {isModalVisible && (
                <div className={`modal ${ isModal ? 'show' : '' }`} onKeyPress={keyPressHandler}>
                    <div className="modal-content" ref={afterModalRef}>
                        <h4>{message}</h4>
                        <button ref={yesButtonRef} onClick={()=>setIsModal(false)}>확인</button>
                    </div>
                </div>
              )}
              {isVisible && (
                <button id="pageUp-btn" className="show" onClick={pageUpHandler}>
                  TOP
                </button>
              )}
            </div>
          </MyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

function Navbar({ setIsModal, setIsModalVisible, setMessage, setIsVisible }) {
  const { userInfo, setUserInfo, mainCategoryNum, setMainCategoryNum, session, status, router } = useShareContext();
  const [showHeader, setShowHeader] = useState(true);

  let lastScrollY = 0;

  // Throttle function to limit the rate of function calls
  const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function () {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  };

  useEffect(() => {
    const handleScroll = throttle(() => {
      const currentScrollY = window.pageYOffset;
      
      // 스크롤을 내릴 때 숨기고, 올릴 때 보이도록 설정
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY-120) {
        setShowHeader(true);
      } else if (currentScrollY < 70) {
        setShowHeader(true);
      }
      
      // 스크롤 위치에 따라 TOP 버튼 표시 여부 결정
      if (currentScrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      lastScrollY = currentScrollY;
    }, 100); // 100ms마다 실행

    window.addEventListener("scroll", handleScroll);

    // URL 변경 감지 및 처리
    const handleRouteChange = () => {

      const currentPath = window.location.pathname;

      if (currentPath === "/") setMainCategoryNum(0);
      else if (currentPath === "/list") setMainCategoryNum(1);
      else if (currentPath === "/cart") setMainCategoryNum(2);
      else if (currentPath === "/jjim") setMainCategoryNum(3);
      else if (currentPath === "/info") setMainCategoryNum(4);
      else if (currentPath === "/comunity") setMainCategoryNum(5);
      else if (currentPath === "/join") setMainCategoryNum(6);
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);

    return () => { 
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [router]);

  const logoutHandler = () => {
    setMainCategoryNum(0);
    setUserInfo(null);
    updateUserInDB(userInfo,router);
  };

  return (
    <>
      <div
        className={`navbar ${showHeader ? "fixed" : "relative"}`}
        style={{
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out',
          position: 'fixed',
        }}
      >
        <Link href="/" onClick={() => setMainCategoryNum(0)} style={{ border: 0, marginRight: 10 }}>
          <Image
            className="logo-img"
            src="/images/Preview.png"
            alt="logo"
            width={100}
            height={50}
            priority
          />
        </Link>
        <Link href="/list" onClick={() => setMainCategoryNum(1)} style={mainCategoryNum == 1 ? { color: "cornflowerblue" } : { color: "black" }}>
          쇼핑
        </Link>
        { status == 'authenticated' && userInfo !== null && (
          <>
            <Link href="/cart" onClick={() => setMainCategoryNum(2)} style={mainCategoryNum == 2 ? { color: "cornflowerblue" } : { color: "black" }}>
              장바구니{userInfo?.cart?.length > 0 ? ` (${userInfo?.cart.length})` : ""}
            </Link>
            <Link href="/jjim" onClick={() => setMainCategoryNum(3)} style={mainCategoryNum == 3 ? { color: "cornflowerblue" } : { color: "black" }}>
              찜 목록{userInfo?.jjim?.length > 0 ? ` (${userInfo?.jjim.length})` : ""}
            </Link>
            <Link href="/info" onClick={() => setMainCategoryNum(4)} style={mainCategoryNum == 4 ? { color: "cornflowerblue" } : { color: "black" }}>
              내 정보
            </Link>
          </>
        )}
        {/* <Link href="/comunity" onClick={() => setMainCategoryNum(5)} style={mainCategoryNum == 5 ? { color: "cornflowerblue" } : { color: "black" }}>
          커뮤니티
        </Link> */}
        <div>
          { status == 'authenticated' && (
            <>
              <AddressSearch setIsModal={setIsModal} setIsModalVisible={setIsModalVisible} setMessage={setMessage}/>
            </>
          )}
          { userInfo && (
            <RxExit onClick={logoutHandler} color="black" size={30} style={{ cursor: 'pointer'}}/>
            // <button onClick={logoutHandler}>로그아웃</button>
          )}
        </div>
        
      </div>
      <div className="footer">

      </div>
    </>
  );
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
      signOut({ redirect: false })
      .then(() => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('address');
        localStorage.removeItem('address_details');
        router.push('/'); // 홈으로 강제로 리다이렉트
      });
      console.log('User information successfully updated in the database');
    } else {
      console.error('Failed to update user information in the database');
    }
  } catch (error) {
    console.error('Error during API request:', error);
  }

  return;
}


function AddressSearch({ setIsModal, setIsModalVisible, setMessage }) {
  const { userInfo, setUserInfo, session, status } = useShareContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [address, setAddress] = useState(session?.userData?.address);
  const [details, setDetails] = useState(session?.userData?.address_detail);
  const modalRef = useRef(null);
  const containerRef = useRef(null);

  // Kakao 스크립트 로딩 상태를 추적
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAddressSearch = (event) => {
    event.preventDefault();
    setIsOpen(!isOpen);
    console.log('맵로드');
    
    if ( !isOpen ) {
      setTimeout(() => {
        new window.daum.Postcode({
          oncomplete: function (data) {
            setIsSelected(true);
            setAddress(data.address);
            console.log(address,data.address);
  
            // 지도 스크립트가 이미 로드된 경우 재사용
            if (!scriptLoaded) {
              loadKakaoMapScript(() => {
                initializeMap(data.address);
                console.log('이미 로드');
              });
            } else {
              initializeMap(data.address);
              console.log('지도 로드');
            }
          },
          width: "100%",
          height: "100%",
        }).embed(document.getElementById("addressLayer"));
      }, 0);
    }
  };

  // Kakao 지도 스크립트를 로드하는 함수
  const loadKakaoMapScript = (callback) => {
    console.log('맵로드1');
    if (!scriptLoaded) {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY}&libraries=services&autoload=false`;
      console.log(script.src);
      script.async = true;

      script.onload = () => {
        setScriptLoaded(true);
        callback();
      };

      document.head.appendChild(script);
    } else {
      callback();
    }
  };

  // 지도를 초기화하는 함수
  const initializeMap = (address) => {
    console.log('맵로드2');
    console.log(window.kakao.maps);
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          console.log(status);
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 지도 및 마커 초기화 또는 업데이트
          const mapContainer = document.getElementById("mapContainer");
          const mapOptions = {
            center: coords,
            level: 3,
          };

          const newMap = new window.kakao.maps.Map(mapContainer, mapOptions);
          new window.kakao.maps.Marker({
            position: coords,
            map: newMap,
          });
        }
      });
    });
  };

  const handleClickOutside = (event) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target) &&
      !containerRef.current.contains(event.target)
    ) {
      setIsOpen(false);
      setIsSelected(false);
      console.log('작업중지');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const response = await fetch("/api/save-address", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email: userInfo?.userInfo?.email, address, details }),
    // });

    // const data = await response.json();

    // if (response.ok) {
    //   setUserInfo((prevInfo) => ({
    //     ...prevInfo,
    //     userInfo: {
    //       ...prevInfo.userInfo,
    //       address,
    //       address_detail: details,
    //     }
    //   }));
    //   setMessage(data.message);
    // } else {
    //   setMessage(data.error);
    // }

    setUserInfo((prevInfo) => ({
      ...prevInfo,
      userInfo: {
        ...prevInfo.userInfo,
        address,
        address_detail: details,
      }
    }));
    localStorage.setItem('address', address);
    localStorage.setItem('address_details', details);
    setMessage('배송지가 변경되었습니다');
    setIsOpen(false);
    setIsSelected(false);
    setIsModal(true);
    setIsModalVisible(true);
    setTimeout(() => {
      setIsModal(false); // n초 후에 모달 사라짐
      setTimeout(() => {
          setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
      }, 500); // 애니메이션 시간과 맞추기
    }, 1000); // n초(예: 3초)
    console.log('주소저장완료');
  };

  const modalCancelHandler = () => {
    setIsOpen(false);
    setIsSelected(false);
  };

  return (
    <div>
      <div className="address" onClick={handleAddressSearch} ref={containerRef}>
        <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload"/>
        {status === 'authenticated' && userInfo?.userInfo?.address ? <p>{userInfo?.userInfo?.address || ''}</p> : <p>배송지 조회</p>}
        <IoMdArrowDropdownCircle color="black" />
      </div>

      {isOpen && (
        <div className="address-search-popup" ref={modalRef}>
          <div className="addressLayer" id="addressLayer"></div>
          {isSelected && (
            <>
              <div className="mapContainer" id="mapContainer"></div>
              <form onSubmit={handleSubmit} className="detail-form">
                <input 
                  type="text"
                  value={address}
                  readOnly
                />
                <div>
                  <input
                    type="text"
                    onChange={(e) => setDetails(e.target.value)}
                    required
                    placeholder="상세주소"
                    autoFocus
                  />
                  <button type="submit">배송지 변경</button>
                </div>
              </form>
            </>
          )}
          {/* {!isSelected &&
            <div className="prev_address_detail">
              <label htmlFor="prev_address_detail">상세주소 : </label>
              <input type="text" id="prev_address_detail" value={userInfo?.userInfo?.address_detail || ''} readOnly/>
            </div>
          } */}
          {!isSelected && userInfo?.userInfo?.address &&
            <div className="pres_address_detail">
              <label htmlFor="pres_address_detail">현재주소 : </label>
              <input id="pres_address_detail" value={`${userInfo?.userInfo?.address || ''} ${userInfo?.userInfo?.address_detail || ''}`}
              readOnly/>
            </div>
          }
          <button className="closeButton" onClick={modalCancelHandler}>
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
