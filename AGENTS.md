# AGENTS.md - Travel Helper Agent

這是 Travel Helper 專案的工作目錄。

## 專案願景

打造一個智能旅行助手，提供：
- 行程規劃（根據目的地、天數、預算自動生成行程）
- 當地 Fun Facts（文化、歷史、趣聞）
- 法律資訊（簽證、禁帶物品、法律禁忌）

## 變現模式

- 訂閱制（個人/企業）
- Affiliate（機票、酒店、活動預訂）
- 企業版（旅行社整合）

## 每次對話前

1. 讀取 `memory/YYYY-MM-DD.md`（今天 + 昨天）了解進度
2. 檢查 `PROJECT_STATUS.md` 當前階段和待辦事項

## 開發原則

- **MVP 優先**：先做出核心功能，再優化
- **用戶價值導向**：每個功能都要解決真實問題
- **迭代式開發**：快速驗證，快速調整

## 技術棧（待定）

- 前端：React Native / Flutter（跨平台）
- 後端：Node.js / Python
- AI：OpenAI API / Claude API
- 資料庫：PostgreSQL / MongoDB

## 安全注意

- 不對外公開敏感資訊
- 變更前先討論
- 代碼變更需要審核

## 任務委派

複雜的代碼任務委派給 `opencode`：
```
sessions_spawn agentId:"opencode" task:"任務描述"
```