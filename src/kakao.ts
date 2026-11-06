export type KakaoGlobal={maps:{load:(callback:()=>void)=>void;LatLng:new(lat:number,lng:number)=>any;Map:new(el:HTMLElement,opts:any)=>any;Marker:new(opts:any)=>any;InfoWindow:new(opts:any)=>any;LatLngBounds:new()=>any;event:{addListener:(target:any,type:string,handler:()=>void)=>void}}}
declare global{interface Window{kakao?:KakaoGlobal}}
let loading:Promise<KakaoGlobal>|null=null
let loadedKey:string|null=null
export function loadKakaoMap(key:string):Promise<KakaoGlobal>{
 const trimmed=key.trim()
 if(!trimmed) return Promise.reject(new Error('JavaScript 키가 없습니다.'))
 if(loading){if(loadedKey!==trimmed) return Promise.reject(new Error('이미 다른 키로 SDK를 불러왔습니다. 새로고침 후 다시 시도하세요.'));return loading}
 loadedKey=trimmed
 loading=new Promise<KakaoGlobal>((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('카카오맵 응답 시간 초과: 도메인 등록과 네트워크를 확인하세요.')),15000)
  function ready(){if(!window.kakao?.maps?.load){clearTimeout(timer);reject(new Error('지도 SDK 객체를 찾지 못했습니다.'));return}
    window.kakao.maps.load(()=>{clearTimeout(timer);resolve(window.kakao!)})}
  if(window.kakao?.maps?.load){ready();return}
  const script=document.createElement('script')
  script.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(trimmed)}&autoload=false`
  script.async=true
  script.onload=ready
  script.onerror=()=>{clearTimeout(timer);reject(new Error('카카오맵 SDK 요청 실패: 카카오맵 사용 설정, JS 키 및 SDK 도메인을 확인하세요.'))}
  document.head.appendChild(script)
 })
 return loading
}
