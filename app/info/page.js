"use client";

import { useShareContext } from "@/context/ShareContext";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { IoEyeSharp, IoEyeOffSharp } from "react-icons/io5";

export default function Info() {
    const { userInfo, setUserInfo, infoCategoryNum, session, status, router } = useShareContext();
    const [user, setUser] = useState({
        nickname: userInfo?.userInfo?.username,
        prevPwd: '',
        password: '',
        pwdChk: '',
        email: userInfo?.userInfo?.email,
    });
    const [condition, setCondition] = useState({
        nickname: false,
    });
    const [pwdCondition, setPwdCondition] = useState({
        prevPwd: false,
        password: false,
        pwdChk: false,
    });
    const [visibility, setVisibility] = useState({
        prevPwd: false,
        password: false,
        pwdChk: false,
    });
    const [isChangeInfo, setIsChangeInfo] = useState(false);
    const [isChangeCredentials, setIsChangeCredentials] = useState(false);

    const [tryCnt, setTryCnt] = useState(5);

    useEffect(() => {
        if (status === "loading") {
          // 세션 정보가 로딩 중일 때
          return;
        }
    
        if (status === "unauthenticated") {
          // 인증되지 않은 경우 리다이렉트
          router.push("/");
        }
      }, [status, router]);

    useEffect(() => {
        if (user.password === user.pwdChk) {
            setPwdCondition((prevCondition) => ({
                ...prevCondition,
                pwdChk: true,
            }));
        } else {
            setPwdCondition((prevCondition) => ({
                ...prevCondition,
                pwdChk: false,
            }));
        }
    }, [user]);

    useEffect(() => {
        const chkCondition = Object.values(condition).every(Boolean);
        setIsChangeInfo(chkCondition);
    }, [condition]);

    useEffect(() => {
        const chkCondition = Object.values(pwdCondition).every(Boolean);
        setIsChangeCredentials(chkCondition);
    }, [pwdCondition]);

    const checkDupIdHandler = async () => {
        const id = user.nickname;

        if (id) {
            // const savedInfo = JSON.parse(localStorage.getItem('users')) || [];
            // const isDuplicate = savedInfo.some(info => info.id === id);
            try {

                const response = await fetch('/api/dup-id',{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({id})
                })

                const data = await response.json();

                if (data.dupStatus) {
                    alert('중복된 닉네임이 존재합니다. 다른 닉네임을 사용해주세요.');
                } else {
                    alert('사용 가능한 닉네임입니다.');
                    setCondition(prevCondition=>({
                        ...prevCondition,
                        nickname : true
                    }));
                }
            } catch (e) {
                console.log(e);
            }
        } else {
            alert('아이디를 입력하세요.');
        }
    };

    const checkPwdHandler = (e) => {
        const newPassword = e.target.value;

        setUser((prevUser) => ({
            ...prevUser,
            password: newPassword,
        }));

        if (newPassword.length >= 8) {
            setPwdCondition((prevCondition) => ({
                ...prevCondition,
                password: true,
            }));
        } else {
            setPwdCondition((prevCondition) => ({
                ...prevCondition,
                password: false,
            }));
        }
    };

    const checkPwdChkHandler = (e) => {
        const pwdChk = e.target.value;
        setUser((prevUser) => ({
            ...prevUser,
            pwdChk,
        }));
    };

    const toggleVisibility = (field) => {
        setVisibility((prevVisibility) => ({
            ...prevVisibility,
            [field]: !prevVisibility[field],
        }));
    };

    const checkChangeable = async () => {
        if (isChangeInfo) {
            const request = await fetch('/api/update-id',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({email:userInfo?.userInfo?.email,changedId:user.nickname})
            })
            if( request.ok ) {
                setUserInfo((prevInfo)=>({
                    ...prevInfo,
                    userInfo : {
                        ...prevInfo.userInfo,
                        username:user.nickname,
                    }
                }))
                alert("회원정보 수정이 완료되었습니다!");
            }
        } else {
            alert("수정된 정보가 없거나 조건을 충족하지 않습니다.");
        }
    };

    const orderDeleteHandler = () => {
        const updatedUserInfo = {
            ...userInfo,
            order: [],
        };
        setUserInfo(updatedUserInfo);
        updateUserInDB(updatedUserInfo,router);
    };
    const keyPressHandler = (e) =>{
        if(e.key == 'Enter') checkCredentials();
    }

    const keyPressExecuteHandler = (e) => {
        if(e.key == 'Enter') executeHandler();
    }

    const checkCredentials = async () => {
        console.log(user);
        if (tryCnt > 0) {
            if(user.prevPwd === ''){
                alert(`입력된 정보를 확인해주세요.`);
                return;
            }
            try {
                const request = await fetch('/api/check-pwd',{
                    method:'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({email:userInfo?.userInfo?.email,password:user.prevPwd})
                })
        
                if(request.ok) {
                    setPwdCondition(prevCondition => ({
                        ...prevCondition,
                        prevPwd:true    
                    }))
                    alert('인증 성공!');
                } else {
                    alert(`비밀번호가 올바르지 않습니다.\n시도횟수 초과 시 강제 로그아웃됩니다.\n시도횟수 ${tryCnt}회 남았습니다.`);
                    setTryCnt(tryCnt-1);
                }
            } catch (e) {
                console.log(e);
            }   
        } else {
            alert('시도횟수 초과로 강제 로그아웃됩니다.');
            updateUserInDB(userInfo,router);
        }
    }

    const executeHandler = async () => {
        if (!isChangeCredentials) {
            alert("수정된 정보가 없거나 조건을 충족하지 않습니다.");
            return;
        }

        try {
            const response = await fetch('/api/update-pwd', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ email: userInfo?.userInfo?.email, password: user.password }),
            });

            if (response.ok) {
                alert('비밀번호가 변경되었습니다! 변경된 비밀번호로 다시 로그인 해주세요!');
                updateUserInDB(userInfo,router);
                signOut({ redirect:false }).then(()=>{
                  router.push('/');
                })
            } else {
                alert('이전의 비밀번호는 사용하실 수 없습니다.\n새로운 비밀번호를 설정해주세요.')
            }
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <div className="info-order">
            {   infoCategoryNum === 0 &&
            <>
                <h3 className="title">주문 상세 목록</h3>
                <div className="order-delete">
                    <button onClick={orderDeleteHandler}>전체 삭제</button>
                </div>
                {userInfo?.order.length > 0 ? (
                    <>
                    <div className="order-info">
                        <div></div>
                        <p>상품명</p>
                        <p>가격(개당)</p>
                        <p>수량</p>
                        <p>주문날짜</p>
                        <p>배송지</p>
                    </div>
                    {[...userInfo?.order].reverse().map((item, i) => (
                        <div className="order-item" key={i}>
                                <img src={item.order_img} alt={item.order_name} />
                                <p>{item.order_name}</p>
                                <p>${item.order_price}</p>
                                <p>{item.order_quantity}</p>
                                <p>{item.order_date}</p>
                                <div>
                                    <p>{item.order_address}</p>
                                    <p>{item.order_detail}</p>
                                </div>
                            </div>
                        ))}
                        </>
                    ) : (
                        <p className="order-empty">주문 목록이 비어있습니다.</p>
                    )}
            </>
            }
            {   infoCategoryNum === 1 &&
            <>
                <h3 className="title">회원 정보</h3>
                <div className="user-info">
                    <div>
                        <label htmlFor="id">닉네임</label>
                        <input
                            type="text"
                            id="id"
                            defaultValue={userInfo?.userInfo?.username}
                            onChange={(e) => setUser({ ...user, nickname: e.target.value })}
                            />
                        <button onClick={checkDupIdHandler}>중복확인</button>
                    </div>
                    <div>
                        <label htmlFor="email">이메일</label>
                        <input type="email" id="email" value={userInfo?.userInfo?.email} readOnly />
                    </div>
                    <div>
                        <button onClick={checkChangeable}>수정하기</button>
                    </div>
                </div>
            </>
            }
             {infoCategoryNum === 2 && session?.userData?.password !== null && (
                <>
                    <h3 className="title">비밀번호 변경</h3>
                    {!pwdCondition.prevPwd ? (
                        <div className="user-pwd-prev">
                            <div>
                                <label htmlFor="prevPwd">기존 비밀번호</label>
                                <input
                                    type={visibility.prevPwd ? 'text' : 'password'}
                                    id="prevPwd"
                                    onChange={(e) => setUser({ ...user, prevPwd: e.target.value })}
                                    onKeyPress={keyPressHandler}
                                />
                                <button
                                    onClick={() => toggleVisibility('prevPwd')}
                                    tabIndex="-1"
                                    aria-label="Toggle password visibility"
                                >
                                    {visibility.prevPwd ? <IoEyeOffSharp /> : <IoEyeSharp />}
                                </button>
                            </div>
                            <div>
                                <button onClick={checkCredentials}>확인</button>
                            </div>
                        </div>
                    ) : (
                        <div className="user-pwd">
                            <div>
                                <label htmlFor="password">변경할 비밀번호</label>
                                <input
                                    type={visibility.password ? 'text' : 'password'}
                                    id="password"
                                    value={user?.password}
                                    onChange={checkPwdHandler}
                                />
                                <button
                                    onClick={() => toggleVisibility('password')}
                                    tabIndex="-1"
                                    aria-label="Toggle password visibility"
                                >
                                    {visibility.password ? <IoEyeOffSharp /> : <IoEyeSharp />}
                                </button>
                            </div>
                            <div>
                                <label htmlFor="pwdChk">비밀번호 확인</label>
                                <input
                                    type={visibility.pwdChk ? 'text' : 'password'}
                                    id="pwdChk"
                                    onChange={checkPwdChkHandler}
                                    onKeyPress={keyPressExecuteHandler}
                                />
                                <button
                                    onClick={() => toggleVisibility('pwdChk')}
                                    tabIndex="-1"
                                    aria-label="Toggle password visibility"
                                >
                                    {visibility.pwdChk ? <IoEyeOffSharp /> : <IoEyeSharp />}
                                </button>
                            </div>
                            <div>
                                <button onClick={executeHandler}>변경하기</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
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
        console.log('User information successfully updated in the database');
        // signOut({ redirect:false }).then(()=>{
        //   router.push('/');
        // })
      } else {
        console.error('Failed to update user information in the database');
      }
    } catch (error) {
      console.error('Error during API request:', error);
    }
}