# CineMan AI Backend - Architecture Plan

## 📋 Overview

Backend API server जो Gemini API calls को securely handle करेगा और frontend को data provide करेगा।

## 🏗️ Architecture

### 1. **Server Structure**

```
backend/
├── server.js              # Main Express server
├── routes/
│   ├── recommendations.js # Movie/Series recommendations
│   ├── translations.js     # Translation endpoints
│   └── tasteCheck.js      # Taste matching
├── services/
│   ├── geminiService.js   # Gemini API wrapper
│   └── cacheService.js    # Caching layer
├── middleware/
│   ├── rateLimiter.js     # Rate limiting
│   └── errorHandler.js    # Error handling
├── config/
│   └── constants.js       # Configuration
├── package.json
└── .env                   # Environment variables
```

### 2. **API Endpoints**

#### Recommendations

- `POST /api/recommendations` - Get movie/series recommendations

  - Body: { preferences, recommendationType, sessionExcludedItems }
  - Response: Array of Movie objects

- `POST /api/similar` - Find similar items

  - Body: { itemTitle, recommendationType, stablePreferences }
  - Response: Array of Movie objects

- `POST /api/taste-check` - Check if user will like a movie

  - Body: { itemTitle, recommendationType, stablePreferences }
  - Response: { itemFound, movie, justification }

- `POST /api/replacement` - Get single replacement recommendation
  - Body: { preferences, recommendationType, allExcludedItems }
  - Response: Single Movie object

#### Translations

- `POST /api/translate` - Translate text

  - Body: { text, targetLanguageCode, targetLanguageName }
  - Response: { translatedText }

- `POST /api/translate-batch` - Translate multiple texts
  - Body: { texts: [], targetLanguageCode, targetLanguageName }
  - Response: { translatedTexts: [] }

#### Utility

- `GET /api/health` - Health check
- `POST /api/title-suggestions` - Get title autocomplete suggestions

### 3. **Key Features**

#### Security

- ✅ API keys server-side only (never exposed to frontend)
- ✅ CORS protection
- ✅ Rate limiting per IP
- ✅ Request validation

#### Performance

- ✅ Response caching (Redis or in-memory)
- ✅ Parallel API calls for translations
- ✅ Request batching

#### Error Handling

- ✅ Graceful error responses
- ✅ Retry logic for failed requests
- ✅ Fallback mechanisms

### 4. **Technology Stack**

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **AI**: Google Gemini API (@google/genai)
- **Rate Limiting**: express-rate-limit
- **Caching**: In-memory Map (can upgrade to Redis later)

### 5. **Environment Variables**

```env
GEMINI_API_KEY=main_api_key
GEMINI_TRANSLATION_API_KEY=translation_api_key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6. **Request/Response Flow**

```
Frontend Request
    ↓
Express Server (CORS, Rate Limit)
    ↓
Route Handler (Validation)
    ↓
Cache Check (if cached, return)
    ↓
Gemini Service (API Call)
    ↓
Response Processing (Translation if needed)
    ↓
Cache Result
    ↓
Return to Frontend
```

### 7. **Implementation Steps**

1. ✅ Setup Express server with basic routes
2. ✅ Create Gemini service wrapper
3. ✅ Implement rate limiting middleware
4. ✅ Add caching layer
5. ✅ Create recommendation endpoints
6. ✅ Create translation endpoints
7. ✅ Add error handling
8. ✅ Update frontend to use backend API
9. ✅ Testing & optimization

### 8. **Benefits**

- 🔒 **Security**: API keys hidden from frontend
- ⚡ **Performance**: Caching reduces API calls
- 🛡️ **Protection**: Rate limiting prevents abuse
- 📈 **Scalability**: Easy to add Redis, load balancing
- 🐛 **Debugging**: Centralized logging
- 💰 **Cost Control**: Better API usage tracking

### 9. **Frontend Changes Needed**

- Replace direct Gemini API calls with fetch/axios calls to backend
- Update `geminiService.ts` to call backend endpoints
- Remove API keys from frontend code
- Add backend URL configuration

---

**Ready to implement?** 🚀


