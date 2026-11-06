import {useEffect,useRef,useState} from 'react'
import {MapPin,Route, Settings2,CheckCircle2, AlertTriangle, ExternalLink} from 'lucide-react'
import {loadKakaoMap} from './kakao'
import {places} from './places'
const origin=places[0]
const destination=places[1]
const initialKey = ''
export default function App(){
 const mapEl=useRef<HTMLDivElement|null>(null)
 const [key,setKey]=useState(initialKey)
 const [appliedKey,setAppliedKey]=useState(initialKey)
 const [status,setStatus]=useState<'need-key'|'loading'|'ready'|'error'>(initialKey?'loading':'need-key')
 const [error,setError]=useState('')
 const [showSettings,setShowSettings]=useState(!initialKey)
 useEffect(()=>{
  if(!appliedKey){setStatus('need-key');return}
  if(!mapEl.current)return
  let disposed=false
  setStatus('loading');setError('')
  loadKakaoMap(appliedKey).then(k=>{
   if(disposed||!mapEl.current)return
   try{
    const start=new k.maps.LatLng(origin.lat,origin.lng)
    const end=new k.maps.LatLng(destination.lat,destination.lng)
    const map=new k.maps.Map(mapEl.current,{center:start,level:5})
    for(const [i,point] of places.entries()){
     const marker=new k.maps.Marker({position:new k.maps.LatLng(point.lat,point.lng),map})
     const info=new k.maps.InfoWindow({content:`<div style="padding:8px 12px;font-family:sans-serif;font-size:13px;white-space:nowrap"><b>${point.name}</b></div>`})
     k.maps.event.addListener(marker,'click',()=>info.open(map,marker))
     if(i===0)info.open(map,marker)
    }
    const bounds=new k.maps.LatLngBounds();bounds.extend(start);bounds.extend(end);map.setBounds(bounds)
    setStatus('ready')
   }catch(e){setStatus('error');setError(e instanceof Error?e.message:String(e))}
  }).catch(e=>{if(!disposed){setStatus('error');setError(e instanceof Error?e.message:String(e))}})
  return()=>{disposed=true}
 },[appliedKey])
 function applyKey(){if(!key.trim())return;setAppliedKey(key.trim());setShowSettings(false)}
 return <div className="app">
  <header className="header"><div><span className="eyebrow">SAEJANGGOL · ACCESSIBLE WALKING</span><h1>같은 거리, 다른 걸음</h1><p>가장 짧은 길을 넘어, 더 편안한 걸음을 위한 지도</p></div><button className="settings" onClick={()=>setShowSettings(v=>!v)}><Settings2 size={18}/> 지도 설정</button></header>
  <div className="workspace"><aside className="sidebar">
   <div className="section-label">01 · 첫 번째 길찾기</div><h2>새장골경로당 → 연서시장</h2>
   <div className="place origin"><MapPin size={19}/><div><strong>{origin.name}</strong><small>{origin.address}</small></div></div>
   <div className="vertical-link"/>
   <div className="place destination"><MapPin size={19}/><div><strong>{destination.name}</strong><small>{destination.address}</small></div></div>
   <div className="divider"/>
   <div className="section-label">02 · 다음에 구현할 기능</div>
   <div className="future"><Route size={18}/><span>실제 보행 도로망 연결</span><span className="pill">준비 중</span></div>
   <div className="future"><Route size={18}/><span>최단 / 최소 부담 경로 비교</span><span className="pill">준비 중</span></div>
   <div className="note"><AlertTriangle size={16}/><span>현재는 시설의 대표 위치만 표시합니다. 실제 보행 경로·고령자 체감거리·이동시간을 추측해 그리지 않습니다.</span></div>
  </aside>
  <section className="map-section"><div className="map-top"><div><b>불광2동 실제 지도</b><small>카카오맵 · 위치 마커 2개</small></div><span className={'status '+status}>{status==='ready'?<><CheckCircle2 size={15}/> 지도 연결됨</>:status==='loading'?'지도 연결 중':status==='need-key'?'키 입력 필요':'연결 오류'}</span></div>
   <div className="map-frame"><div className="map-canvas" ref={mapEl}/>{status!=='ready'&&<div className="map-overlay"><MapPin size={28}/><strong>{status==='loading'?'카카오맵을 불러오는 중입니다':status==='error'?'지도 연결을 확인해 주세요':'카카오맵 JavaScript 키를 설정해 주세요'}</strong><small>{status==='error'?error:'배포된 사이트 주소를 카카오 개발자 콘솔에 등록해야 합니다.'}</small></div>}</div>
   <div className="map-bottom">현재 단계: 실제 지도와 장소 위치 확인 · 경로는 아직 미연결 <a href="https://developers.kakao.com/console/app" target="_blank" rel="noreferrer">카카오 개발자 설정 <ExternalLink size={13}/></a></div>
  </section></div>
  {showSettings&&<div className="modal-backdrop" onClick={()=>setShowSettings(false)}><form className="modal" onSubmit={e=>{e.preventDefault();applyKey()}} onClick={e=>e.stopPropagation()}><h3>카카오맵 연결 설정</h3><p>카카오 디벨로퍼스에서 복사한 <b>JavaScript 키</b>만 입력하세요. REST API 키나 관리자 키는 사용하지 않습니다.</p><label htmlFor="key">JavaScript 키</label><input id="key" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="JavaScript 키 붙여넣기"/><small>키는 이 화면의 메모리에만 보관하며 서버로 별도 전송하지 않습니다. 카카오 SDK를 요청할 때는 키가 URL에 포함됩니다. 공개 배포 시 키를 프런트엔드 환경변수로 설정하세요.</small><small>현재 접속 주소: <code>{window.location.origin}</code></small><small>이 주소를 카카오 개발자 콘솔의 JavaScript SDK 도메인에 등록하세요.</small><div className="actions"><button type="button" className="cancel" onClick={()=>setShowSettings(false)}>닫기</button><button type="submit" className="primary">지도 연결</button></div></form></div>}
 </div>
}
