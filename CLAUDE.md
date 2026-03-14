# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 椤圭洰姒傝堪

?????????????????????????????????????????

- **web-app/**: React + Vite + Capacitor ?????????????????

搴旂敤鏍稿績鍔熻兘锛氱敤鎴锋敞鍐岀櫥褰曘€佸疇鐗╀俊鎭鐞嗐€丄I 椹卞姩鐨勯ギ椋熻鍒掔敓鎴愩€佽惀鍏诲垎鏋愯拷韪€佹棩鍘嗚褰曠瓑銆?
## Web App 寮€鍙戝懡浠?
```bash
cd web-app

# 寮€鍙戞湇鍔″櫒锛圚MR锛?npm run dev

# 鐢熶骇鏋勫缓
npm run build

# 浠ｇ爜妫€鏌?npm run lint

# 棰勮鐢熶骇鏋勫缓
npm run preview

# Capacitor 绉诲姩绔紑鍙?npm run cap:sync       # 鍚屾璧勬簮鍒板師鐢熼」鐩?npm run cap:android    # 鎵撳紑 Android Studio
npm run cap:ios        # 鎵撳紑 Xcode

# 瀹屾暣绉诲姩绔瀯寤?npm run mobile:build   # 鏋勫缓 + sync
```

## 鏍稿績鏋舵瀯

### 鐩綍缁撴瀯锛坵eb-app锛?
```
web-app/src/
鈹溾攢鈹€ api/              # API 鏈嶅姟灞傦紙绫诲瀷瀹夊叏锛?鈹?  鈹溾攢鈹€ client.ts     # Axios 瀹㈡埛绔?+ 鎷︽埅鍣?+ Token 鑷姩鍒锋柊
鈹?  鈹溾攢鈹€ types.ts      # 瀹屾暣 TypeScript 绫诲瀷瀹氫箟
鈹?  鈹斺攢鈹€ *.ts          # 鍚勬ā鍧?API锛坅uth, pets, meals, plans 绛夛級
鈹溾攢鈹€ context/          # React Context 鍏ㄥ眬鐘舵€?鈹?  鈹溾攢鈹€ UserContext.jsx       # 鐢ㄦ埛璁よ瘉鐘舵€?鈹?  鈹溾攢鈹€ PetContext.jsx        # 瀹犵墿鏁版嵁绠＄悊
鈹?  鈹斺攢鈹€ PlanGenerationContext.jsx  # 璁″垝鐢熸垚 + SSE 娴佸紡澶勭悊
鈹溾攢鈹€ components/       # UI 缁勪欢
鈹?  鈹溾攢鈹€ layout/       # 甯冨眬缁勪欢锛圠ayout, BottomNav锛?鈹?  鈹斺攢鈹€ *.jsx         # 閫氱敤缁勪欢
鈹溾攢鈹€ pages/            # 椤甸潰缁勪欢
鈹溾攢鈹€ hooks/            # 鑷畾涔?Hooks
鈹溾攢鈹€ utils/            # 宸ュ叿鍑芥暟
鈹斺攢鈹€ index.css         # Tailwind + 鑷畾涔夋牱寮?```

### 鎶€鏈爤

- **鍓嶇妗嗘灦**: React 19.2 + React Router 7
- **鏍峰紡**: TailwindCSS 3.4 + UnoCSS
- **鍔ㄧ敾**: Framer Motion 12
- **绉诲姩绔?*: Capacitor 8
- **鏋勫缓**: Vite 7
- **鐘舵€佺鐞?*: React Context锛堟棤 Redux锛?
### API 鏋舵瀯

**Token 璁よ瘉鏈哄埗**:
- JWT Bearer Token 瀛樺偍 `localStorage.access_token`
- Refresh Token 瀛樺偍 `localStorage.refresh_token`
- Axios 鎷︽埅鍣ㄨ嚜鍔ㄥ鐞?401 鍒锋柊
- 璇锋眰闃熷垪鏈哄埗闃叉骞跺彂鍒锋柊

**SSE 娴佸紡澶勭悊**:
- 璁″垝鐢熸垚浣跨敤 `fetch` + `ReadableStream` 澶勭悊 SSE
- 浜嬩欢绫诲瀷: `task_created`, `node_started`, `progress_update`, `task_completed`, `error`
- `PlanGenerationContext` 绠＄悊鐢熸垚鐘舵€併€佽繘搴︺€佸悗鍙颁换鍔?
### Context 鏁版嵁娴?
```
UserProvider (璁よ瘉)
    鈹溾攢 isAuthenticated 鈫?璺敱淇濇姢
    鈹溾攢 user 鈫?鐢ㄦ埛淇℃伅
    鈹斺攢 login/register/logout 鈫?璁よ瘉鎿嶄綔

PetProvider (瀹犵墿鏁版嵁)
    鈹溾攢 pets 鈫?瀹犵墿鍒楄〃
    鈹溾攢 currentPet 鈫?褰撳墠閫変腑瀹犵墿
    鈹斺攢 addPet/updatePet/deletePet 鈫?CRUD 鎿嶄綔

PlanGenerationProvider (璁″垝鐢熸垚)
    鈹溾攢 status 鈫?idle/generating/completed/error
    鈹溾攢 progress 鈫?0-100
    鈹溾攢 startGeneration 鈫?鍚姩 SSE 璇锋眰
    鈹斺攢 handleSSEEvent 鈫?澶勭悊鍚庣鎺ㄩ€佷簨浠?```

### 璺敱缁撴瀯

**鍏紑璺敱**: `/login`
**鍙椾繚鎶よ矾鐢?*:
- 甯﹀簳閮ㄥ鑸? `/`, `/calendar`, `/analysis`, `/plan/create`, `/profile`
- 鏃犲簳閮ㄥ鑸? `/onboarding/step1-3`, `/planning`, `/plan/details`, `/profile/edit`, `/pet/edit/:id`

**杩斿洖鎸夐挳澶勭悊** (`useBackButton` hook):
- 涓婚〉: 鍙屽嚮閫€鍑哄簲鐢?- Onboarding: 姝ラ闂村鑸?- Loading: 绂佺敤杩斿洖
- 鍏朵粬: React Router 瀵艰埅

### Capacitor 閰嶇疆

- **App ID**: `com.petcare.app`
- **鍚庡彴妯″紡**: `@anuradev/capacitor-background-mode`
- **閫氱煡**: `@capacitor/local-notifications`锛堣鍒掑畬鎴愬悗鎺ㄩ€侊級
- **閰嶇疆鏂囦欢**: `capacitor.config.json`

### 鐜鍙橀噺

鍒涘缓 `web-app/.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ENABLE_SSE=true
VITE_RECONNECT_DELAY=3000
```

### 鏍峰紡绯荤粺

**Tailwind 涓婚鎵╁睍**:
- Primary: `#A3D9A5` (sage green)
- Secondary: `#FFE898` (warm yellow)
- Dark mode: class-based

**鑷畾涔夊伐鍏风被** (index.css):
- `.glass` - 鐜荤拑鎬佹晥鏋?- `.card-hover` - 鍗＄墖鎮仠
- `.btn-active` - 鐐瑰嚮鍙嶉
- `.no-scrollbar` - 闅愯棌婊氬姩鏉?
**绉诲姩绔紭鍖?*:
- `pb-safe`, `pt-safe` - 瀹夊叏鍖哄煙閫傞厤
- `-webkit-tap-highlight-color: transparent` - 绂佺敤鐐瑰嚮楂樹寒
- `overscroll-behavior: contain` - 闃叉杩囧害婊氬姩

## API 绔偣锛堝熀浜庡悗绔鑼冿級

### 璁よ瘉 (`/api/v1/auth/`)
- `POST /register` - 娉ㄥ唽
- `POST /login` - 鐧诲綍
- `GET /me` - 鑾峰彇褰撳墠鐢ㄦ埛
- `POST /send-code` - 鍙戦€侀獙璇佺爜
- `POST /verify-register` - 楠岃瘉鐮佹敞鍐?
### 瀹犵墿 (`/api/v1/pets/`)
- `GET /` - 鑾峰彇瀹犵墿鍒楄〃
- `POST /` - 鍒涘缓瀹犵墿
- `PUT /{id}` - 鏇存柊瀹犵墿
- `DELETE /{id}` - 鍒犻櫎瀹犵墿
- `POST /{id}/avatar` - 涓婁紶澶村儚

### 璁″垝 (`/api/v1/plans/`)
- `POST /stream` - SSE 娴佸紡鐢熸垚璁″垝
- `GET /` - 鑾峰彇璁″垝鍒楄〃
- `GET /{id}` - 鑾峰彇璁″垝璇︽儏
- `DELETE /{id}` - 鍒犻櫎璁″垝

### 浠诲姟 (`/api/v1/tasks/`)
- `GET /{id}` - 鑾峰彇浠诲姟鐘舵€?- `GET /{id}/result` - 鑾峰彇浠诲姟缁撴灉
- `DELETE /{id}` - 鍙栨秷浠诲姟

### 楗璁板綍 (`/api/v1/meals/`)
- `GET /today` - 浠婃棩椁愰
- `POST /{id}/complete` - 瀹屾垚椁愰
- `GET /history` - 鍘嗗彶璁板綍

### 鏃ュ巻 (`/api/v1/calendar/`)
- `GET /monthly` - 鏈堝害鏃ュ巻
- `GET /weekly` - 鍛ㄥ害鏃ュ巻

### 鍒嗘瀽 (`/api/v1/analysis/`)
- `GET /nutrition` - 钀ュ吇鍒嗘瀽

## 寮€鍙戞敞鎰忎簨椤?
1. **绫诲瀷瀹夊叏**: 鎵€鏈?API 璋冪敤浣跨敤 `src/api/types.ts` 涓畾涔夌殑绫诲瀷
2. **璺敱淇濇姢**: 浣跨敤 `<ProtectedRoute>` 鍖呰９闇€瑕佺櫥褰曠殑椤甸潰
3. **Token 绠＄悊**: API 瀹㈡埛绔嚜鍔ㄥ鐞?Token 鍒锋柊锛屾棤闇€鎵嬪姩澶勭悊
4. **绉诲姩绔繑鍥?*: 浣跨敤 `useBackButton` hook 鑰岄潪娴忚鍣ㄩ粯璁よ涓?5. **SSE 杩炴帴**: 璁″垝鐢熸垚椤甸潰蹇呴』澶勭悊 `PlanGenerationContext` 鐘舵€?6. **鐜鍙橀噺**: 寮€鍙戞椂纭繚 `VITE_API_BASE_URL` 鎸囧悜姝ｇ‘鐨勫悗绔湴鍧€

