"use client";

import { useEffect, useRef, useState } from "react";
import { useShareContext } from "@/context/ShareContext";


export default function Cart() {
    const { userInfo, setUserInfo, setIsOpen, setMainCategoryNum, session, status, router, localDateTime } = useShareContext();
    const [ totalPrice, setTotalPrice ] = useState(0);
    const [ isModal, setIsModal ] = useState(false);
    const [ isModalVisible, setIsModalVisible ] = useState(false);
    const [ message, setMessage ] = useState('');
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

    // totalPrice 계산 함수
    useEffect(() => {
        const calculateTotalPrice = () => {
            const total = userInfo?.cart
                .filter(item => item.cart_isChked)  // isChecked가 true인 항목만 계산
                .reduce((acc, item) => acc + (item.cart_price * item.cart_quantity), 0);
            setTotalPrice(total);
        };

        calculateTotalPrice();
    }, [userInfo?.cart]);

    useEffect(() => {
        if (isModal) {
            yesButtonRef.current?.focus();    
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isModal]);

    const allSelectHandler = () => {

        if ( userInfo?.cart.length === 0 ) {
            setIsModal(!isModal);
            setIsModalVisible(!isModalVisible);
            setMessage('장바구니에 상품이 존재하지 않습니다.')
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
            return;
        } 
        
        const areAllChecked = userInfo?.cart.every(item => item.cart_isChked); // 모든 항목이 체크되었는지 확인
    
        const updatedCart = userInfo?.cart.map(item => ({
            ...item,
            cart_isChked: !areAllChecked // 모든 항목이 체크되어 있다면 모두 체크 해제, 그렇지 않으면 모두 체크
        }));
    
        const updatedUserInfo = {
            ...userInfo,
            cart: updatedCart
        };
    
        setUserInfo(updatedUserInfo);
    };
    
    const selectDeleteButton = () => {
        if ( userInfo?.cart.length === 0 ) {
            setMessage('장바구니에 상품이 존재하지 않습니다.')
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
        } else if ( userInfo?.cart.filter((item)=>item.cart_isChked).length === 0 ) {
            setMessage('선택된 상품이 존재하지 않습니다.')
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
        } else {
            setMessage('선택한 상품이 삭제됩니다.\n계속하시겠습니까?');
        }

        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
    }

    const allDeleteButton = () => {
        if ( userInfo?.cart.length === 0 ) {
            setMessage('장바구니에 상품이 존재하지 않습니다.')
            setTimeout(() => {
                setIsModal(false); // n초 후에 모달 사라짐
                setTimeout(() => {
                    setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
                }, 500); // 애니메이션 시간과 맞추기
            }, 700);
        } else {
            setMessage('모든 상품목록이 삭제됩니다.\n계속하시겠습니까?');
        }
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
    };

    const executeAllDelete = () => {
        const updatedUserInfo = {
            ...userInfo,
            cart: []
        };
        setUserInfo(updatedUserInfo);
        setMessage('모든 상품목록이 삭제되었습니다.');
    }

    const executeSelectedDelete = () => {
        const selectedItems = userInfo?.cart.filter((item)=> !item.cart_isChked);

        const updatedUserInfo = {
            ...userInfo,
            cart: selectedItems,
        }
        setUserInfo(updatedUserInfo);
        setMessage('선택한 상품이 삭제되었습니다.');
    }

    const selectDeleteHandler = (selected) => {
        const updatedCart = userInfo?.cart.filter(item => item.cart_name !== selected.cart_name);

        const updatedUserInfo = {
            ...userInfo,
            cart: updatedCart
        };
        setUserInfo(updatedUserInfo);
        setMessage(selected.cart_name + '\n\n상품이 삭제되었습니다.');
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
        setTimeout(() => {
            setIsModal(false); // n초 후에 모달 사라짐
            setTimeout(() => {
                setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
            }, 500); // 애니메이션 시간과 맞추기
        }, 1000);
    };

    const minusHandler = (selected) => {
        if (selected.cart_quantity > 1) {
            const updatedCart = userInfo?.cart.map(item =>
                item.cart_name === selected.cart_name
                    ? { ...item, cart_quantity: selected.cart_quantity - 1 }
                    : item
            );

            const updatedUserInfo = {
                ...userInfo,
                cart: updatedCart
            };
            setUserInfo(updatedUserInfo);
        }
    };

    const plusHandler = (selected) => {
        const updatedCart = userInfo?.cart.map(item =>
            item.cart_name === selected.cart_name
                ? { ...item, cart_quantity: selected.cart_quantity + 1 }
                : item
        );

        const updatedUserInfo = {
            ...userInfo,
            cart: updatedCart
        };
        setUserInfo(updatedUserInfo);
    };

    const toggleChecked = (selected) => {
        const updatedCart = userInfo?.cart.map(item =>
            item.cart_name === selected.cart_name
                ? { ...item, cart_isChked: !item.cart_isChked }
                : item
        );

        const updatedUserInfo = {
            ...userInfo,
            cart: updatedCart
        };
        setUserInfo(updatedUserInfo);
    };

    const orderHandler = async () => {

        if(userInfo?.userInfo?.address !== null ) {

            const selectedItems = userInfo?.cart.filter(item => item.cart_isChked);
            
            if (selectedItems.length > 0) {
                
                const updatedCart = selectedItems.map(item => ({
                    order_name: item.cart_name,
                    order_price: item.cart_price,
                    order_category: item.cart_category,
                    order_quantity: item.cart_quantity,
                    order_img: item.cart_img,
                    order_date: localDateTime,
                    order_address: userInfo?.userInfo?.address,
                    order_detail: userInfo?.userInfo?.address_detail,
                }));
                
                const remainingCartItems = userInfo?.cart.filter(item => !item.cart_isChked);
                
                const updatedUserInfo = {
                    ...userInfo,
                    cart: remainingCartItems, // 선택된 항목을 제외한 나머지 항목으로 cart 업데이트
                    order: [...userInfo?.order, ...updatedCart]
                };
                
                try {
                    // 서버로 POST 요청을 보내 주문 정보와 장바구니 정보를 전송
                    const response = await fetch('/api/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userInfo?.userInfo?.email,
                            cart: updatedCart,
                        })
                    });
                    
                    if (response.ok) {
                        setUserInfo(updatedUserInfo);
                        setMessage('주문이 완료되었습니다!');
                        setIsModal(!isModal);
                        setIsModalVisible(!isModalVisible);
                        return;
                    } else {
                        const errorData = await response.json();
                        setMessage(errorData.error);
                    }
                } catch (error) {
                    console.error('Error processing order:', error);
                    setMessage('주문 처리 중 오류가 발생했습니다.');
                }
            } else if ( userInfo?.cart.length > 0 ) {
                setMessage('구매할 상품을 선택해주세요.');
            } else {
                setMessage('구매할 상품이 없습니다.');
                setIsModal(!isModal);
                setIsModalVisible(!isModalVisible);
                return;
            }
        } else {
            setMessage('배송지 정보가 없습니다.\n페이지 우측 상단의 배송지 조회로 배송지를 알려주세요!');
        }
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
        setTimeout(() => {
            setIsModal(false); // n초 후에 모달 사라짐
            setTimeout(() => {
                setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
            }, 500); // 애니메이션 시간과 맞추기
        }, 1000);
    };
        
    const handleModalConfirm = () => {

        if ( message === '모든 상품목록이 삭제됩니다.\n계속하시겠습니까?' ) {
            executeAllDelete();
        } else if ( message === '선택한 상품이 삭제됩니다.\n계속하시겠습니까?' ) {
            executeSelectedDelete();
        } else if ( message === '구매할 상품이 없습니다.' ) {
            setMainCategoryNum(1);
            router.push('/list');
            return;
        } else {
            setMainCategoryNum(4);
            router.push('/info');
            return;
        }
        setTimeout(() => {
            setIsModal(false); // n초 후에 모달 사라짐
            setTimeout(() => {
                setIsModalVisible(false); // 상태를 false로 바꿔서 모달을 완전히 숨김
            }, 500); // 애니메이션 시간과 맞추기
        }, 1000);
    };

    const handleModalCancel = () => {
        setIsModal(!isModal);
        setIsModalVisible(!isModalVisible);
        setMessage("");
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

    const handleClickOutside = (event) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(event.target)
        ) {
            handleModalCancel();
        }
    };
    
    return (
        <div className="cart">
            <h3 className="title">장바구니</h3>
            <div className="cart-delete">
                <button onClick={allSelectHandler}>전체 선택</button>
                <button onClick={allDeleteButton}>전체 삭제</button>
                <button onClick={selectDeleteButton}>선택 삭제</button>
            </div>
            { userInfo && userInfo?.cart?.length > 0 ? (
                <>
                    <div className="cart-info">
                        <div></div>
                        <div></div>
                        <p>상품명</p>
                        <p>가격(개당)</p>
                        <p>수량</p>
                        <div></div>
                    </div>
                    {[...userInfo?.cart].reverse().map((item, i) => (
                        <div className="cart-item" key={i}>
                            <input
                                type="checkbox"
                                checked={item.cart_isChked}
                                onChange={() => toggleChecked(item)}
                            />
                            <img src={item.cart_img} alt={item.cart_name} />
                            <p>{item.cart_name}</p>
                            <p>${item.cart_price}</p>
                            <div>
                                <button onClick={() => minusHandler(item)}>-</button>
                                <p>{item.cart_quantity}개</p>
                                <button onClick={() => plusHandler(item)}>+</button>
                            </div>
                            <button onClick={() => selectDeleteHandler(item)}>✕</button>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    <p className="cart-empty">장바구니가 비어있습니다.</p>
                </>
            )}
            <div className="cart-decide">
                {userInfo && userInfo?.cart?.length > 0 && (
                    <>
                        <p>Total</p>
                        <p>$</p>
                        <div>
                            <p>{totalPrice?.toFixed(1)}</p>
                        </div>
                    </>
                )}
                <button onClick={orderHandler}>주문하기</button>
            </div>

            {isModalVisible && (
                <div className={`modal ${ isModal ? 'show' : '' }`} onKeyPress={keyPressHandler} tabIndex={-1}>
                    <div className="modal-content" ref={modalRef}>
                    <h4>{message}</h4>
                    {message === '주문이 완료되었습니다!' && (
                        <p>주문 상세 페이지로 이동하시겠습니까?</p>
                    )}
                    {message === '구매할 상품이 없습니다.' && (
                        <p>어떤 상품이 있는지 보러갈까요?</p>
                    )}
                    {(
                        message === '주문이 완료되었습니다!' || 
                        message === '선택한 상품이 삭제됩니다.\n계속하시겠습니까?' || 
                        message === '모든 상품목록이 삭제됩니다.\n계속하시겠습니까?' ||
                        message === '구매할 상품이 없습니다.' ) && (
                        <div>
                            <button ref={yesButtonRef} onClick={handleModalConfirm}>예</button>
                            <button onClick={handleModalCancel}>아니오</button>
                        </div>
                    )}
                    </div>
                </div>
            )}
        </div>
    );
}
