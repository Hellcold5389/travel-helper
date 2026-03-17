# 資料庫 Schema 設計

**最後更新**: 2026-03-17

---

## 概覽

Travel Helper 資料庫包含以下主要模組：

| 模組 | 說明 | 主要資料表 |
|------|------|-----------|
| 用戶系統 | 用戶資料、偏好、護照 | `User`, `Passport`, `UserPreference` |
| 行程規劃 | 行程、活動 | `Trip`, `Activity` |
| 簽證資訊 | 簽證需求查詢 | `VisaRequirement` |
| 法律禁忌 | 禁帶物品、法律限制 | `LegalRestriction` |
| 趣味知識 | Fun Facts | `FunFact` |
| 國家資訊 | 國家基本資料 | `Country` |
| 目的地 | 熱門目的地、景點 | `Destination`, `Attraction` |
| 通知系統 | 推播通知記錄 | `Notification` |
| 系統日誌 | API、資料變更記錄 | `ApiLog`, `DataUpdateLog` |

---

## 資料表詳細說明

### 1. 用戶系統

#### User
```prisma
- id: String (CUID)
- email: String (唯一)
- name, avatar, phone: String?
- nationality: String? (ISO 3166-1 alpha-2)
```

#### Passport
用於簽證到期提醒功能
```prisma
- passportNo, fullName, dateOfBirth
- issueDate, expiryDate
- issuingCountry
```

#### UserPreference
用戶偏好設定
```prisma
- language, currency, timezone
- 通知開關: visaExpiry, policyChanges, tripReminders
```

---

### 2. 行程規劃

#### Trip
```prisma
- title, destination, countryCode, city
- startDate, endDate, duration
- budget, currency
- status: PLANNING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED
- travelStyle: RELAX | ADVENTURE | CULTURE | FOOD | NATURE | SHOPPING | BUSINESS
- groupSize: Int
- itinerary: Json (AI 生成的行程)
```

#### Activity
```prisma
- date, type, name, description
- placeId (Google Place ID), address, lat, lng
- startTime, endTime, duration
- cost, currency
- bookingUrl, notes
- order (排序)
```

---

### 3. 簽證資訊

#### VisaRequirement
```prisma
- countryCode (目的地國家)
- nationalityCode (護照國籍)
- requirement: VISA_FREE | VISA_ON_ARRIVAL | E_VISA | ETA | VISA_REQUIRED | VISA_RESTRICTED | VISA_SUSPENDED
- visaType: String? (觀光、商務等)
- durationDays, durationNote
- documents: Json (所需文件清單)
- conditions: Json (條件/例外)
- processingTime, processingNote
- fee, feeCurrency
- passportValidity (護照效期要求)
- blankPages (空白頁數要求)
- officialUrl, source
```

**範例資料**:
```
台灣護照 → 日本
- countryCode: "JP"
- nationalityCode: "TW"
- requirement: VISA_FREE
- durationDays: 90
- passportValidity: "6 months"

台灣護照 → 美國
- countryCode: "US"
- nationalityCode: "TW"
- requirement: VISA_REQUIRED
- visaType: "B1/B2"
- processingTime: "視情況而定"
- documents: ["DS-160", "護照", "財力證明", "面試"]
```

---

### 4. 法律禁忌

#### LegalRestriction
```prisma
- countryCode
- category: PROHIBITED_ITEMS | RESTRICTED_ITEMS | MEDICATION | FOOD_PRODUCTS | CURRENCY | BEHAVIOR | PHOTOGRAPHY | DRESS_CODE | CUSTOMS | OTHER
- severity: CRITICAL | HIGH | MEDIUM | LOW | INFO
- type: ITEM | BEHAVIOR | DOCUMENT | CURRENCY | OTHER
- title, description
- items: Json (具體物品清單)
- penalty, fineMin, fineMax, imprisonment
- exceptions, permitRequired, permitInfo
- officialUrl, source
```

**範例資料**:
```
日本 - 禁帶物品
- countryCode: "JP"
- category: MEDICATION
- severity: HIGH
- title: "含偽麻黃鹼藥品禁止攜帶"
- description: "含 pseudoephedrine 的感冒藥禁止攜帶入境"
- items: ["興P感冒膠囊", "伏冒錠", "康是美感冒藥"]
- penalty: "沒收藥品，嚴重者可能被拒絕入境或起訴"

泰國 - 行為禁忌
- countryCode: "TH"
- category: BEHAVIOR
- severity: CRITICAL
- title: "不得對王室不敬"
- description: "泰國法律嚴格禁止對王室不敬的言行"
- penalty: "最高 15 年監禁"
```

---

### 5. 趣味知識

#### FunFact
```prisma
- countryCode
- category: CULTURE | HISTORY | FOOD | NATURE | LANGUAGE | ETIQUETTE | STATISTICS | TRIVIA | OTHER
- title, content
- imageUrl, source, sourceUrl
- priority (顯示優先順序)
```

**範例資料**:
```
日本
- countryCode: "JP"
- category: STATISTICS
- content: "日本有超過 6 萬家便利店，平均每 2300 人就有一家"
- category: FOOD
- content: "東京的米其林星星數量全球第一，超過巴黎和紐約的總和"
```

---

### 6. 國家資訊

#### Country
```prisma
- code: String @id (ISO 3166-1 alpha-2)
- name, nameLocal, nameZh, nameZhHant
- capital, region, subregion
- iso3, phoneCode, currency, currencyName
- languages: Json
- timezone, area, population
- visaFreeFor: Json (免簽國家清單)
- flagEmoji, imageUrl
```

---

### 7. 目的地 & 景點

#### Destination
```prisma
- countryCode, name, nameZh
- type: CITY | REGION | ATTRACTION | NATURE | BEACH | MOUNTAIN | ISLAND | OTHER
- city, region, lat, lng
- description, descriptionZh
- bestTimeToVisit, avgCostPerDay, currency
- categories: Json
- imageUrl, images: Json
- rating, reviewCount, popularity
```

#### Attraction
```prisma
- destinationId, countryCode
- name, nameZh
- type: LANDMARK | MUSEUM | TEMPLE | PARK | BEACH | MOUNTAIN | MARKET | MALL | RESTAURANT | CAFE | BAR | HOTEL | ACTIVITY | OTHER
- city, address, lat, lng, placeId
- description, descriptionZh
- openingHours: Json
- admission, currency, duration
- categories, tags: Json
- imageUrl, images: Json
- rating, reviewCount, popularity
```

---

### 8. 通知系統

#### Notification
```prisma
- userId
- type: VISA_EXPIRY | PASSPORT_EXPIRY | POLICY_CHANGE | TRIP_REMINDER | PRICE_ALERT | SYSTEM
- title, message
- relatedId, relatedType
- isRead, readAt
- sentVia, sentAt
```

---

### 9. 系統日誌

#### ApiLog
記錄 API 呼叫，用於除錯和分析

#### DataUpdateLog
記錄資料變更，用於追蹤和審計

---

## 索引設計

主要索引：
- `User`: email (unique)
- `Trip`: userId, countryCode, status
- `VisaRequirement`: countryCode + nationalityCode (unique)
- `LegalRestriction`: countryCode, category, severity
- `FunFact`: countryCode, category
- `Attraction`: countryCode, type, isActive

---

## 資料來源規劃

| 資料 | 來源 |
|------|------|
| 簽證資訊 | 外交部領事事務局、Wikipedia |
| 法律禁忌 | 各國海關官網、旅遊警示 |
| Fun Facts | Wikipedia、旅遊網站、自編 |
| 國家資訊 | REST Countries API |
| 景點資料 | Google Places API |

---

## 下一步

1. [ ] 建立 seed data (初始資料)
2. [ ] 實作 API endpoints
3. [ ] 整合 OpenAI 生成行程