export type Place={id:string;name:string;address:string;lat:number;lng:number;kind:'origin'|'market'}
// 대표 지점 좌표: 실제 시설 출입구는 현장 확인 후 보정해야 합니다.
export const places:Place[]=[
 {id:'saejanggol',name:'새장골경로당',address:'서울 은평구 연서로37길 47',lat:37.6254199,lng:126.9277516,kind:'origin'},
 {id:'yeonseo',name:'연서시장',address:'서울 은평구 통일로 850',lat:37.6194408,lng:126.9220428,kind:'market'},
]
