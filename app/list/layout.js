"use client";

import "../globals.css";
import { useShareContext } from "@/context/ShareContext";

export default function ListLayout({ children }) {

    const { listCategoryNum, setListCategoryNum } = useShareContext();

//   // 클라이언트에서만 로컬 스토리지 접근
//   useEffect(() => {
//     const storedSelection = parseInt(localStorage.getItem('listCategoryNum'));
//     // 로컬 스토리지에 값이 있을 경우에만 설정, 없을 경우 0으로 초기화
//     if (!isNaN(storedSelection)) {
//         setListCategoryNum(storedSelection);
//     } else {
//         setListCategoryNum(0);
//     }
//   }, []);

//   useEffect(() => {
//     if (listCategoryNum !== null) {
//       localStorage.setItem('listCategoryNum', listCategoryNum);
//     }
//   }, [listCategoryNum]);

  return (
    <div>
        <ListNav listCategoryNum={listCategoryNum} setListCategoryNum={setListCategoryNum}/>
        {children}
    </div>
  );
}

function listCategoryHandler(setListCategoryNum,num) {
    setListCategoryNum(num);
    scrollTo({top:0})
}

function ListNav({ listCategoryNum, setListCategoryNum }) {

    return(
        <>
            <div className="list-category">
                <div onClick={()=> listCategoryHandler(setListCategoryNum,0)}>
                    <p style={listCategoryNum == 0 ? { color: "cornflowerblue" } : { color: "black" }}>전체</p>
                </div>
                <div onClick={()=> listCategoryHandler(setListCategoryNum,1)}>
                    <p style={listCategoryNum == 1 ? { color: "cornflowerblue" } : { color: "black" }}>피규어</p>
                </div>
                {/* <div onClick={()=> listCategoryHandler(setListCategoryNum,2)}>
                    <p style={listCategoryNum == 2 ? { color: "cornflowerblue" } : { color: "black" }}>과일</p>
                </div>
                <div onClick={()=> listCategoryHandler(setListCategoryNum,3)}>
                    <p style={listCategoryNum == 3 ? { color: "cornflowerblue" } : { color: "black" }}>야채</p>
                </div> */}
            </div>
        </>
    )
}