"use client"

import { useShareContext } from "@/context/ShareContext";
import { useEffect, useRef, useState } from "react";
import { BsCartPlusFill } from "react-icons/bs";

export default function Jjim() {

    const { userInfo, setUserInfo, status, router } = useShareContext();
    const [ isModal, setIsModal ] = useState(false);
    const [ isModalVisible, setIsModalVisible ] = useState(false);
    const [ message, setMessage ] = useState("");
    const modalRef = useRef(null);
    const yesButtonRef = useRef(null);

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
        modalRef.current &&
        !modalRef.current.contains(event.target)
    ) {
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
    }
    };

    const handleModalConfirm = () => {
        const updatedUserInfo = {
            ...userInfo,
            jjim: []
        }
        setUserInfo(updatedUserInfo);
        setMessage('모든 상품이 삭제되었습니다.')
        setTimeout(() => {
            setIsModal(false); // n초 후에 모달 사라짐
            setTimeout(() => {
                setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
            }, 500); // 애니메이션 시간과 맞추기
        }, 700);
    };

    const handleModalCancel = () => {
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
    };

    const keyPressHandler = (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // 기본 동작 방지
            handleModalConfirm(); // "예" 버튼 동작
        } else if (event.key === "Escape") {
            event.preventDefault(); // 기본 동작 방지
            handleModalCancel(); // "아니오" 버튼 동작
        }
    };

    const jjimAllDeleteHandler = () => {
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);

        if ( userInfo?.jjim.length === 0 ) {
            setMessage('상품이 존재하지 않습니다.')
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
        } else {
            setMessage('모든 찜 목록이 삭제됩니다.\n계속하시겠습니까?');
        }
    }
    
    const selectDeleteHandler = (selected) => {
        
        const updatedJjim = userInfo?.jjim.filter(item => item.intrst_name !== selected.intrst_name);
        
        const updatedUserInfo = {
            ...userInfo,
            jjim: updatedJjim
        }
        setUserInfo(updatedUserInfo);
        setIsModal(true);
        setIsModalVisible(true);
        setMessage('해당 상품이 삭제되었습니다.');
        setTimeout(() => {
            setIsModal(false); // n초 후에 모달 사라짐
            setTimeout(() => {
                setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
            }, 500); // 애니메이션 시간과 맞추기
        }, 700);
    }

    const putCartHandler = (product) => {
        if (userInfo) {
            const isExisting = userInfo?.cart.find(item => item.cart_name === product.intrst_name);
            if (isExisting) {
                setMessage('이미 장바구니에 있어요~');
            } else {
                const updatedProduct = { 
                    cart_name: product.intrst_name,
                    cart_price: product.intrst_price,
                    cart_quantity: 1,
                    cart_category: product.intrst_category,
                    cart_img: product.intrst_img,
                    cart_isChked: true,
                }; // 선택한 수량으로 업데이트된 상품
                const updatedCart = [...userInfo?.cart, updatedProduct];

                // 해당 찜목록 삭제
                // const updatedJjim = userInfo.jjim.filter(
                //     (item) => item.jjim_name !== product.intrst_name
                // ); 
                const updatedUserInfo = {
                    ...userInfo,
                    cart: updatedCart,
                    // jjim: updatedJjim,
                };
                setUserInfo(updatedUserInfo);
                setMessage('선택한 상품이 장바구니에 담겼어요!');
            }
            setIsModal(!isModal);
            setIsModalVisible(!isModalVisible);
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
        }
    }

    return(
    <div className="jjim">
        <h3 className="title">찜 목록</h3>
        <div className="jjim-delete">
            <button onClick={()=> jjimAllDeleteHandler()}>전체 삭제</button>
        </div>
        {   
            userInfo?.jjim.length > 0 ?(
            <>
                <div className="jjim-info">
                    <div></div>
                    <div></div>
                    <p>상품명</p>
                    <p>가격</p>
                    <div></div>
                </div>
                {[...userInfo?.jjim].reverse().map((item,i)=>{
                    return(
                        <div className="jjim-item" key={i}>
                            <button onClick={() => selectDeleteHandler(item)}>✕</button>
                            <img src={item.intrst_img} alt={item.intrst_name}/>
                            <p>{item.intrst_name}</p>
                            <p>${item.intrst_price}</p>
                            <BsCartPlusFill onClick={() => putCartHandler(item)} style={{cursor:"pointer"}} color="cornflowerblue" size='27px'/>
                        </div>
                    )
                })}
            </>)
            :
            <p className="jjim-empty">찜 목록이 비어있습니다.</p>
        }

        {isModalVisible && (
            <div className={`modal ${ isModal ? 'show' : '' }`} onKeyPress={keyPressHandler}>
                <div className="modal-content" ref={modalRef}>
                    <h4>{message}</h4>
                    {
                        message !== '해당 상품이 삭제되었습니다.' && 
                        message !== '모든 상품이 삭제되었습니다.' &&
                        message !== '상품이 존재하지 않습니다.' &&
                        message !== '선택한 상품이 장바구니에 담겼어요!' &&
                        message !== '이미 장바구니에 있어요~' &&
                        (
                        <>
                            <div>
                                <button ref={yesButtonRef} onClick={handleModalConfirm}>예</button>
                                <button onClick={handleModalCancel}>아니오</button>
                            </div>
                        </>
                        )
                    }
                </div>
            </div>
        )}
    </div>
    )
}