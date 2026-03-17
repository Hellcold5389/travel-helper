# 技術選型建議

**日期**：2026-03-17
**版本**：v1.0

---

## 一、前端技術選型

### 選項比較

| 選項 | 優勢 | 劣勢 | 推薦度 |
|------|------|------|--------|
| **React Native** | 生態成熟、社群大、人才好找、熱更新支援 | 效能略遜於原生、部分 Native 功能需要橋接 | ⭐⭐⭐⭐⭐ |
| **Flutter** | 效能好、UI 一致性高、熱重載 | Dart 語言較小眾、社群較小 | ⭐⭐⭐⭐ |
| **原生開發** | 效能最佳、完整 Native 功能 | 開發成本高、需要兩個團隊 | ⭐⭐ |

### ✅ 建議：React Native

**理由**：
1. **人才庫**：台灣 React/React Native 開發者較多
2. **生態系**：expo.io 快速開發、豐富的第三方庫
3. **成本**：一套代碼支援 iOS + Android
4. **未來**：可擴展至 Web（React Native Web）

**技術棧**：
```
React Native + Expo
TypeScript（類型安全）
React Navigation（導航）
Redux Toolkit / Zustand（狀態管理）
React Query（API 快取）
```

---

## 二、後端技術選型

### 選項比較

| 選項 | 優勢 | 劣勢 | 推薦度 |
|------|------|------|--------|
| **Node.js** | JavaScript 全棧、生態豐富、適合 I/O 密集 | CPU 密集任務較弱 | ⭐⭐⭐⭐⭐ |
| **Python (FastAPI)** | AI 整合友善、語法簡潔、適合資料處理 | 非同步支援較新 | ⭐⭐⭐⭐ |
| **Go** | 效能極佳、併發處理強 | 學習曲線較陡、人才較少 | ⭐⭐⭐ |

### ✅ 建議：Node.js + TypeScript

**理由**：
1. **全棧 JavaScript**：前後端共用類型定義
2. **開發效率**：快速迭代、適合 MVP
3. **AI 整合**：OpenAI SDK 支援完善

**技術棧**：
```
Node.js + Express / Fastify
TypeScript
Prisma ORM
PostgreSQL（主資料庫）
Redis（快取）
```

**替代方案**：如果 AI 處理是核心，考慮 Python FastAPI 作為 AI 服務微服務。

---

## 三、AI 技術選型

### LLM 提供商比較

| 提供商 | 優勢 | 劣勢 | 價格 | 推薦度 |
|--------|------|------|------|--------|
| **OpenAI (GPT-4o)** | 效能最佳、生態成熟、多模態 | 成本較高 | $2.5/1M input | ⭐⭐⭐⭐⭐ |
| **Claude (Anthropic)** | 長上下文、安全可靠 | 稍慢 | $3/1M input | ⭐⭐⭐⭐ |
| **Gemini** | 價格便宜、Google 生態整合 | 效能較不穩定 | 免費額度大 | ⭐⭐⭐ |
| **開源模型** | 無使用費、資料隱私 | 需自建、維護成本 | GPU 成本 | ⭐⭐ |

### ✅ 建議：OpenAI GPT-4o（初期）

**理由**：
1. **效能穩定**：行程規劃需要理解複雜需求
2. **開發速度快**：SDK 完善、文件齊全
3. **多模態**：未來可支援圖片辨識（拍照查景點）

**成本控制策略**：
- 使用 GPT-4o-mini 處理簡單查詢
- 快取常見問答
- 設定用量上限

**替代方案**：MVP 驗證後可考慮多模型混合（Gemini 做初篩、GPT 做複雜規劃）。

---

## 四、資料庫設計

### PostgreSQL（主資料庫）

**為什麼選 PostgreSQL**：
- 結構化資料（簽證、法律、景點）
- ACID 保證（資料一致性重要）
- 支援 JSON 欄位（彈性）
- 開源、成熟、託管服務多

**核心資料表**：
```sql
-- 用戶
users (id, email, created_at, ...)

-- 行程
trips (id, user_id, destination, start_date, end_date, ...)

-- 簽證資訊
visa_requirements (id, country_code, nationality, requirement, ...)

-- 法律禁忌
legal_restrictions (id, country_code, category, title, description, ...)

-- Fun Facts
fun_facts (id, country_code, content, category, ...)

-- 景點
attractions (id, country_code, city, name, description, ...)
```

### Redis（快取）

**用途**：
- API 回應快取（簽證查詢、法律禁忌）
- 用戶 Session
- Rate limiting

---

## 五、基礎設施

### 初期架構（MVP）

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Mobile App)                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│              (Rate Limiting / Auth)                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────┬──────────────────┬──────────────────┐
│   Trip Service    │   Info Service   │   AI Service    │
│   (行程規劃)       │   (簽證/法律)     │   (AI 處理)     │
└──────────────────┴──────────────────┴──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │    Redis      │   │   OpenAI API  │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 雲端平台選擇

| 平台 | 優勢 | 劣勢 | 成本估算 | 推薦度 |
|------|------|------|----------|--------|
| **Vercel + Supabase** | 快速部署、免費額度大、開發者友善 | 進階功能需付費 | ~$0-50/月 | ⭐⭐⭐⭐⭐ |
| **AWS** | 功能最完整、企業級 | 學習曲線陡、成本難控制 | ~$50-200/月 | ⭐⭐⭐ |
| **GCP** | BigQuery 整合好、價格透明 | 服務較分散 | ~$30-150/月 | ⭐⭐⭐⭐ |
| **Railway/Render** | 簡單易用、適合小型專案 | 擴展性有限 | ~$20-50/月 | ⭐⭐⭐⭐ |

### ✅ 建議：Vercel + Supabase（初期）

**理由**：
1. **快速啟動**：Supabase 提供 PostgreSQL + Auth + Storage
2. **免費額度**：MVP 階段幾乎免費
3. **擴展性**：用戶增長後可遷移到其他平台

---

## 六、第三方服務

| 服務類型 | 推薦選項 | 用途 | 成本 |
|----------|----------|------|------|
| 地圖 API | Google Maps / Mapbox | 景點位置、路線規劃 | $200/月免費額度 |
| 支付 | Stripe | 訂閱付費 | 3.4% + HK$2.35 |
| 推播 | Firebase Cloud Messaging | 即時通知 | 免費 |
| 分析 | Mixpanel / PostHog | 用戶行為分析 | 免費額度 |

---

## 七、開發工具鏈

```
版本控制：GitHub
CI/CD：GitHub Actions
專案管理：Linear / Notion
設計：Figma
API 文件：Swagger / OpenAPI
測試：Jest + Detox（E2E）
```

---

## 八、技術風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| OpenAI API 變更 | 高 | 抽象化 AI 服務層，方便替換 |
| 資料準確性 | 高 | 多來源驗證 + 用戶回報機制 |
| 效能問題 | 中 | 快取 + CDN + 查詢優化 |
| 擴展性 | 中 | 設計時預留微服務架構空間 |

---

## 九、技術選型總結

| 層級 | 選擇 | 理由 |
|------|------|------|
| **前端** | React Native + Expo | 快速開發、人才好找 |
| **後端** | Node.js + TypeScript | 全棧 JS、生態豐富 |
| **AI** | OpenAI GPT-4o | 效能穩定、開發快 |
| **資料庫** | PostgreSQL + Redis | 成熟穩定、開源 |
| **雲端** | Vercel + Supabase | 免費額度、快速啟動 |
| **地圖** | Google Maps API | 生態完整 |

---

## 十、下一步行動

1. [ ] 建立專案骨架（monorepo 結構）
2. [ ] 設計資料庫 Schema
3. [ ] 建立 API 架構文件
4. [ ] 註冊 Supabase 專案
5. [ ] 建立 GitHub Repository