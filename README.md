# 2biz.storage

투게더BIZ 공개/개인 자료실 웹사이트.

## 현재 구성
- GitHub Pages 기반 정적 사이트
- POSCAM / 밴 / 업무용 공용 자료실
- 개인 자료실 진입점
- 데스크톱 3열 / 모바일 1열 반응형 레이아웃
- 모바일 햄버거 메뉴
- Google Apps Script를 통한 공용 Google Drive 목록 조회
- Google Cloud API Key 불필요

## 공용 자료실 구조
- POSCAM 자료실
- 밴 자료실
- 업무필요파일 자료실

실제 Google Drive 폴더 ID는 `apps-script/Code.gs` 안에서만 관리한다.

## Apps Script 배포
1. Google Apps Script에서 새 프로젝트를 만든다.
2. `apps-script/Code.gs` 내용을 붙여 넣는다.
3. 필요하면 `apps-script/appsscript.json` 내용을 프로젝트 manifest에 적용한다.
4. 최초 1회 에디터에서 `buildResponse_('poscam')` 같은 테스트 함수를 실행하여 Drive 권한을 승인한다.
5. 배포 > 새 배포 > 웹 앱을 선택한다.
6. 실행 사용자: 나
7. 액세스 권한: 모든 사용자
8. 배포 후 `/exec` 로 끝나는 웹 앱 URL을 복사한다.
9. `assets/js/config.js` 의 `publicDriveEndpoint` 값에 URL을 입력한다.

## 다음 단계
1. Apps Script 웹 앱 배포 및 실제 목록 검증
2. GitHub Pages 활성화
3. 실제 CI/아이콘 자산 적용
4. 개인 자료실 인증/업로드 구조 확정
5. 가비아 도메인 연결
