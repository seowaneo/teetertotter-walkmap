# Teetertotter v0.3 route overlay patch

기존 React 메인 화면을 건드리지 않는 지도 시험 패치입니다.

## GitHub에 반영

1. `public/2-5d.html`을 기존 같은 경로의 파일과 교체합니다.
2. `public/data/pilot_routes.geojson`을 신규 생성합니다.
3. Commit 후 GitHub Actions 성공 확인.
4. `https://seowaneo.github.io/teetertotter-walkmap/2-5d.html` 접속.
5. **시험용 계산 경로 표시** 클릭. 958.1m 및 토블러 기본 11.0분을 확인.

## 주의

이는 '고정된 1개 목적지의 사전 계산된 경로 표시'이며 자유 검색이나 브라우저에서 자체 경로 재계산하는 버전은 아닙니다.
두 경로는 현재 동일합니다. 지도 상에 파란색 경로 하나만 표시됩니다.
출입구와 네트워크 연결 구간 약 44.9m는 958.1m에 미포함, 안전 검증 전, 데이터 라이선스 검토 필요.
