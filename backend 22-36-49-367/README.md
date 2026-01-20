# 🚀 CineMan AI Backend - Quick Start Guide

## 📦 What We're Building

एक **secure backend API server** जो:

- ✅ Gemini API calls को securely handle करेगा
- ✅ API keys को frontend से hide रखेगा
- ✅ Rate limiting और caching provide करेगा
- ✅ Fast responses के लिए optimize होगा

## 🎯 Main Components

### 1. **Express Server** (`server.js`)

- Main entry point
- CORS setup
- Middleware configuration
- Route mounting

### 2. **Routes** (`routes/`)

- `/api/recommendations` - Movie recommendations
- `/api/similar` - Similar items search
- `/api/taste-check` - Taste matching
- `/api/translate` - Text translation
- `/api/health` - Health check

### 3. **Services** (`services/`)

- `geminiService.js` - Gemini API wrapper
- `cacheService.js` - In-memory caching

### 4. **Middleware** (`middleware/`)

- Rate limiting
- Error handling
- Request validation

## 📊 Data Flow

```
┌─────────────┐
│   Frontend   │
│  (React App) │
└──────┬───────┘
       │ HTTP Request
       ↓
┌─────────────────┐
│  Express Server │
│  (Port 3001)    │
└──────┬──────────┘
       │
       ├─→ Rate Limiter
       ├─→ Cache Check
       ├─→ Validation
       ↓
┌─────────────────┐
│ Gemini Service  │
│  (API Wrapper)  │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  Gemini API     │
│  (Google Cloud) │
└─────────────────┘
```

## 🔑 Key Endpoints

| Endpoint               | Method | Purpose                   |
| ---------------------- | ------ | ------------------------- |
| `/api/recommendations` | POST   | Get movie recommendations |
| `/api/similar`         | POST   | Find similar movies       |
| `/api/taste-check`     | POST   | Check taste match         |
| `/api/translate`       | POST   | Translate text            |
| `/api/health`          | GET    | Server health check       |

## ⚙️ Configuration

### Environment Variables (.env)

```env
GEMINI_API_KEY=your_key_here
GEMINI_TRANSLATION_API_KEY=your_key_here
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

### Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Purpose**: Prevent API abuse

## 🎨 Frontend Integration

### Before (Current)

```typescript
// Direct API call from frontend
const ai = new GoogleGenAI({ apiKey: "EXPOSED_KEY" });
```

### After (With Backend)

```typescript
// Secure API call through backend
const response = await fetch('http://localhost:3001/api/recommendations', {
  method: 'POST',
  body: JSON.stringify({ preferences, ... })
});
```

## 📈 Benefits

1. **Security** 🔒

   - API keys server-side only
   - No exposure to frontend

2. **Performance** ⚡

   - Response caching
   - Reduced API calls
   - Faster responses

3. **Control** 🛡️

   - Rate limiting
   - Usage tracking
   - Error handling

4. **Scalability** 📊
   - Easy to add Redis
   - Load balancing ready
   - Microservices ready

## 🚀 Next Steps

1. ✅ Create server.js
2. ✅ Setup routes
3. ✅ Implement Gemini service
4. ✅ Add caching
5. ✅ Update frontend
6. ✅ Test & deploy

---

**Ready to build?** Let's start! 💪


