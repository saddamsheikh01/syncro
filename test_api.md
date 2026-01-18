# Test API - Auth (Postman)

## Prerequisiti
- Backend avviato su `http://localhost:8080`.
- Database locale attivo con schema `syncro_dev`.
- Variabili JWT valorizzate in `.env`.

## Variabili Postman consigliate
- `baseUrl` = `http://localhost:8080`
- `accessToken` = (vuoto)
- `refreshToken` = (vuoto)

## 1) Registrazione
**POST** `{{baseUrl}}/api/v1/auth/register`  
Headers: `Content-Type: application/json`

Body (raw JSON):
```json
{
  "email": "utente@example.com",
  "password": "Password123!"
}
```

Atteso:
- **201 Created**
- Response con `tokens.accessToken` e `tokens.refreshToken`

Azioni Postman:
- Salva `tokens.accessToken` in `accessToken`
- Salva `tokens.refreshToken` in `refreshToken`

## 2) Login
**POST** `{{baseUrl}}/api/v1/auth/login`  
Headers: `Content-Type: application/json`

Body (raw JSON):
```json
{
  "email": "utente@example.com",
  "password": "Password123!"
}
```

Atteso:
- **200 OK**
- Nuovi `accessToken` e `refreshToken`

## 3) Refresh Token
**POST** `{{baseUrl}}/api/v1/auth/refresh`  
Headers: `Content-Type: application/json`

Body (raw JSON):
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

Atteso:
- **200 OK**
- Nuovi `accessToken` e `refreshToken`

## 4) Profilo corrente (/me)
**GET** `{{baseUrl}}/api/v1/auth/me`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Dati utente (id, email, status, onboardingCompleted, timestamps)

## 5) Logout
**POST** `{{baseUrl}}/api/v1/auth/logout`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **204 No Content**

---

# Test API - Analytics (Postman)

## 1) Registra evento (APP_OPEN)
**POST** `{{baseUrl}}/api/v1/analytics/events`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "eventType": "APP_OPEN",
  "payload": {}
}
```

Atteso:
- **201 Created**

## 2) Registra evento (SESSION_DURATION)
**POST** `{{baseUrl}}/api/v1/analytics/events`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "eventType": "SESSION_DURATION",
  "payload": {
    "duration_seconds": 245
  }
}
```

Atteso:
- **201 Created**

---

# Test API - Admin Analytics (Postman)

## 1) KPI analytics
**GET** `{{baseUrl}}/api/v1/admin/analytics?from=2025-01-01&to=2025-01-31`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**
- Risposta con KPI aggregati (serie giornaliere/settimanali e metriche base)

Nota: la logout e stateless, il client deve eliminare i token salvati.

---

# Test API - Users (Postman)

## 1) Profilo utente corrente (/me)
**GET** `{{baseUrl}}/api/v1/users/me`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Dati utente (id, email, status, onboardingCompleted, timestamps)

## 2) Aggiorna dati utente (/me)
**PATCH** `{{baseUrl}}/api/v1/users/me`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "language": "en",
  "onboardingCompleted": true
}
```

Atteso:
- **200 OK**
- Dati utente aggiornati

---

# Test API - Profile (Postman)

## 1) Profilo utente corrente
**GET** `{{baseUrl}}/api/v1/profile`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Dati profilo con `visibility` e `age` (se birthDate valorizzata)

## 2) Crea/aggiorna profilo
**PUT** `{{baseUrl}}/api/v1/profile`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "fullName": "Mario Rossi",
  "birthDate": "1990-05-12",
  "city": "Milano",
  "country": "Italia",
  "visibility": "PUBLIC"
}
```

Atteso:
- **200 OK**
- Profilo aggiornato

---

# Test API - Tests (Postman)

## 1) Lista test
**GET** `{{baseUrl}}/api/v1/tests`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Lista test con `testType`

## 2) Dettaglio test
**GET** `{{baseUrl}}/api/v1/tests/{testId}`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Test con `questionType`, `required`, `maxSelections`, `config`

## 3) Submit test (multi-select)
**POST** `{{baseUrl}}/api/v1/tests/{testId}/submit`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "answers": [
    {
      "questionId": "11111111-1111-1111-1111-111111111111",
      "answerOptionIds": [
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
      ]
    }
  ]
}
```

Atteso:
- **201 Created**

---

# Test API - Preferences (Postman)

## 1) Preferenze utente correnti
**GET** `{{baseUrl}}/api/v1/preferences`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Preferenze utente

## 2) Crea/aggiorna preferenze
**PUT** `{{baseUrl}}/api/v1/preferences`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "matchmakingFilters": {
    "ageRange": [25, 35],
    "distanceKm": 20
  },
  "feedPreferences": {
    "showOnlyVerified": true
  }
}
```

Atteso:
- **200 OK**
- Preferenze aggiornate

---

# Test API - Positions (Postman)

## 1) Posizione utente corrente
**GET** `{{baseUrl}}/api/v1/positions`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Posizione utente

## 2) Aggiorna posizione
**PUT** `{{baseUrl}}/api/v1/positions`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "latitude": 45.4642,
  "longitude": 9.19,
  "accuracyMeters": 15.5
}
```

Atteso:
- **200 OK**
- Posizione aggiornata

---

# Test API - Tags & Interests (Postman)

## 1) Lista tag
**GET** `{{baseUrl}}/api/v1/tags`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Lista tag disponibili

## 2) Interessi utente correnti
**GET** `{{baseUrl}}/api/v1/users/me/interests`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Lista interessi utente

## 3) Aggiorna interessi
**PUT** `{{baseUrl}}/api/v1/users/me/interests`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "tagIds": [
    "00000000-0000-0000-0000-000000000000",
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

Atteso:
- **200 OK**
- Interessi aggiornati

---

# Test API - Admin Auth (Postman)

## Prerequisiti
- Bootstrap disponibile tramite header `X-Admin-Bootstrap`.

## Variabili Postman consigliate
- `adminAccessToken` = (vuoto)
- `adminRefreshToken` = (vuoto)

## 1) Registrazione Super Admin (bootstrap)
**POST** `{{baseUrl}}/api/v1/auth/admin/register`  
Headers:
- `Content-Type: application/json`
- `X-Admin-Bootstrap: <ADMIN_BOOTSTRAP_SECRET>`

Nota: il bootstrap funziona solo se non esistono admin nel database.
Per creare altri admin dopo il bootstrap, usa lo stesso endpoint con header `Authorization: Bearer {{adminAccessToken}}` (SUPER_ADMIN richiesto).

Body (raw JSON):
```json
{
  "email": "admin@syncro.com",
  "password": "Password123!",
  "role": "SUPER_ADMIN"
}
```

Atteso:
- **201 Created**
- Response con `tokens.accessToken` e `tokens.refreshToken`

Azioni Postman:
- Salva `tokens.accessToken` in `adminAccessToken`
- Salva `tokens.refreshToken` in `adminRefreshToken`

## 2) Login Admin
**POST** `{{baseUrl}}/api/v1/auth/admin/login`  
Headers: `Content-Type: application/json`

Body (raw JSON):
```json
{
  "email": "admin@syncro.com",
  "password": "Password123!"
}
```

Atteso:
- **200 OK**
- Response con `tokens.accessToken` e `tokens.refreshToken`

## 3) Refresh Token Admin
**POST** `{{baseUrl}}/api/v1/auth/admin/refresh`  
Headers: `Content-Type: application/json`

Body (raw JSON):
```json
{
  "refreshToken": "{{adminRefreshToken}}"
}
```

Atteso:
- **200 OK**
- Nuovi `accessToken` e `refreshToken`

## 4) Profilo admin corrente (/me)
**GET** `{{baseUrl}}/api/v1/auth/admin/me`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**
- Dati admin (id, email, role, status, lastLogin, createdAt)

## 5) Logout Admin
**POST** `{{baseUrl}}/api/v1/auth/admin/logout`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **204 No Content**

---

# Test API - Tests (Postman)

## 1) Lista test attivi
**GET** `{{baseUrl}}/api/v1/tests`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Lista test attivi

## 2) Dettaglio test
**GET** `{{baseUrl}}/api/v1/tests/<testId>`  
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Domande e opzioni del test

## 3) Submit test
**POST** `{{baseUrl}}/api/v1/tests/<testId>/submit`  
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "answers": [
    {
      "questionId": "00000000-0000-0000-0000-000000000000",
      "answerOptionId": "11111111-1111-1111-1111-111111111111"
    }
  ]
}
```

Atteso:
- **201 Created**

---

# Test API - Admin Tests (Postman)

Nota: richiede token `adminAccessToken` con ruolo SUPER_ADMIN.

## 1) Crea test
**POST** `{{baseUrl}}/api/v1/admin/tests`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "title": "Micro-test social",
  "description": "Preferenze sociali di base",
  "active": true
}
```

Atteso:
- **201 Created**

## 2) Aggiungi domanda
**POST** `{{baseUrl}}/api/v1/admin/tests/<testId>/questions`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "question": "Preferisci attività di gruppo o individuali?",
  "position": 1
}
```

Atteso:
- **201 Created**

## 3) Aggiungi opzione
**POST** `{{baseUrl}}/api/v1/admin/tests/<testId>/questions/<questionId>/options`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "label": "Gruppo",
  "weight": 5
}
```

Atteso:
- **201 Created**

## 4) Dettaglio test (admin)
**GET** `{{baseUrl}}/api/v1/admin/tests/<testId>`  
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**

---

# Test API - Catalogo (Postman)

## 1) Lista categorie
**GET** `{{baseUrl}}/api/v1/categories?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Page con `content` e metadata

## 2) Lista luoghi con filtri
**GET** `{{baseUrl}}/api/v1/places?page=0&size=20&categoryId=<categoryId>&tagIds=<tagId>&lat=45.4642&lng=9.1900&radiusKm=10&q=bar`
Headers:
- `Authorization: Bearer {{accessToken}}`

Nota: `tagIds` supporta piu valori con parametri ripetuti.

Atteso:
- **200 OK**
- Page di luoghi ordinata per rilevanza

## 3) Dettaglio luogo
**GET** `{{baseUrl}}/api/v1/places/<placeId>`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Dettaglio con tag e affiliazioni

## 4) Lista esperienze con filtri
**GET** `{{baseUrl}}/api/v1/experiences?page=0&size=20&categoryId=<categoryId>&tagIds=<tagId>&lat=45.4642&lng=9.1900&radiusKm=10&q=tour`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Page di esperienze ordinata per rilevanza

## 5) Dettaglio esperienza
**GET** `{{baseUrl}}/api/v1/experiences/<experienceId>`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Dettaglio con tag e affiliazioni

---

# Test API - Admin Catalogo (Postman)

Nota: richiede token `adminAccessToken` con ruolo ADMIN o SUPER_ADMIN.

## 1) Crea categoria
**POST** `{{baseUrl}}/api/v1/admin/categories`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "name": "Ristoranti"
}
```

Atteso:
- **201 Created**

## 2) Crea luogo
**POST** `{{baseUrl}}/api/v1/admin/places`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "name": "Trattoria Milano",
  "description": "Cucina tradizionale",
  "latitude": 45.4642,
  "longitude": 9.1900,
  "categoryId": "<categoryId>",
  "source": "MANUAL",
  "tagIds": ["<tagId>"]
}
```

Atteso:
- **201 Created**

## 3) Crea esperienza
**POST** `{{baseUrl}}/api/v1/admin/experiences`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "name": "Tour enogastronomico",
  "description": "Degustazione guidata",
  "categoryId": "<categoryId>",
  "placeId": "<placeId>",
  "source": "MANUAL",
  "tagIds": ["<tagId>"]
}
```

Atteso:
- **201 Created**

## 4) Crea affiliazione luogo
**POST** `{{baseUrl}}/api/v1/admin/places/<placeId>/affiliations`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "url": "https://partner.example.com/offer",
  "provider": "affiliate-x"
}
```

Atteso:
- **201 Created**

## 5) Crea affiliazione esperienza
**POST** `{{baseUrl}}/api/v1/admin/experiences/<experienceId>/affiliations`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "url": "https://partner.example.com/experience",
  "provider": "affiliate-x"
}
```

Atteso:
- **201 Created**

---

# Test API - Favorites (Postman)

## 1) Lista preferiti
**GET** `{{baseUrl}}/api/v1/favorites?page=0&size=20&type=PLACE`
Headers:
- `Authorization: Bearer {{accessToken}}`

Note:
- `type` opzionale: `PLACE` o `EXPERIENCE`.

Atteso:
- **200 OK**
- Page con preferiti

## 2) Aggiungi preferito (luogo)
**POST** `{{baseUrl}}/api/v1/favorites`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "placeId": "<placeId>"
}
```

Atteso:
- **201 Created**

## 3) Aggiungi preferito (esperienza)
**POST** `{{baseUrl}}/api/v1/favorites`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "experienceId": "<experienceId>"
}
```

Atteso:
- **201 Created**

## 4) Rimuovi preferito (luogo)
**DELETE** `{{baseUrl}}/api/v1/favorites?placeId=<placeId>`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **204 No Content**

## 5) Rimuovi preferito (esperienza)
**DELETE** `{{baseUrl}}/api/v1/favorites?experienceId=<experienceId>`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **204 No Content**

---

# Test API - Matchmaking (Postman)

## 1) Lista match utenti
**GET** `{{baseUrl}}/api/v1/matches/users?page=0&size=20&refresh=true`
Headers:
- `Authorization: Bearer {{accessToken}}`

Note:
- `refresh=true` forza il ricalcolo.

Atteso:
- **200 OK**
- Page con match utenti

## 2) Lista raccomandazioni luoghi/esperienze
**GET** `{{baseUrl}}/api/v1/matches/places?page=0&size=20&type=PLACE&refresh=true`
Headers:
- `Authorization: Bearer {{accessToken}}`

Note:
- `type` opzionale: `PLACE` o `EXPERIENCE`.
- `refresh=true` forza il ricalcolo.

Atteso:
- **200 OK**
- Page con raccomandazioni

---

# Test API - Social (Postman)

## 1) Crea post
**POST** `{{baseUrl}}/api/v1/posts`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "content": "Ciao da Milano!",
  "language": "it",
  "latitude": 45.4642,
  "longitude": 9.1900
}
```

Atteso:
- **201 Created**

## 2) Feed post
**GET** `{{baseUrl}}/api/v1/posts?page=0&size=20&lat=45.4642&lng=9.1900&radiusKm=10`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

## 3) Like post
**POST** `{{baseUrl}}/api/v1/posts/<postId>/likes`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **201 Created**

## 4) Unlike post
**DELETE** `{{baseUrl}}/api/v1/posts/<postId>/likes`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **204 No Content**

## 5) Crea conversazione
**POST** `{{baseUrl}}/api/v1/chats`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "otherUserId": "<otherUserId>"
}
```

Atteso:
- **201 Created**

## 6) Lista conversazioni
**GET** `{{baseUrl}}/api/v1/chats?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

## 7) Lista messaggi
**GET** `{{baseUrl}}/api/v1/chats/<conversationId>/messages?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

## 8) Invia messaggio
**POST** `{{baseUrl}}/api/v1/chats/<conversationId>/messages`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "content": "Ciao!"
}
```

Atteso:
- **201 Created**

---

# Test API - Media (Postman)

## 1) Upload media per owner
**POST** `{{baseUrl}}/api/v1/media`
Headers:
- `Authorization: Bearer {{accessToken}}`

Body (form-data):
- `file`: (seleziona file)
- `ownerType`: `USER_PROFILE` | `POST` | `PLACE` | `EXPERIENCE`
- `ownerId`: `<ownerId>`

Atteso:
- **201 Created**
- Response con `url`, `mediaType`, `ownerType`, `ownerId`

## 2) Lista media per owner
**GET** `{{baseUrl}}/api/v1/media?ownerType=USER_PROFILE&ownerId=<ownerId>&page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**
- Page di media

## 3) Upload media per post
**POST** `{{baseUrl}}/api/v1/posts/<postId>/media`
Headers:
- `Authorization: Bearer {{accessToken}}`

Body (form-data):
- `file`: (seleziona file)

Atteso:
- **201 Created**
- Response con `url`

## 4) Lista media per post
**GET** `{{baseUrl}}/api/v1/posts/<postId>/media?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

---

# Test API - Zyra (Postman)

## 1) Crea sessione Zyra
**POST** `{{baseUrl}}/api/v1/zyra/sessions`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **201 Created**
- Response con `id` sessione

## 2) Lista sessioni Zyra
**GET** `{{baseUrl}}/api/v1/zyra/sessions?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

## 3) Invia messaggio a Zyra
**POST** `{{baseUrl}}/api/v1/zyra/sessions/<sessionId>/messages`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "content": "Consigliami un posto interessante vicino a me"
}
```

Atteso:
- **201 Created**
- Response con `userMessage` e `assistantMessage`

## 4) Lista messaggi Zyra
**GET** `{{baseUrl}}/api/v1/zyra/sessions/<sessionId>/messages?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

## 5) Genera suggerimento Zyra
**POST** `{{baseUrl}}/api/v1/zyra/suggestions`
Headers:
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "suggestionType": "MATCH_OF_THE_DAY",
  "context": "Preferisco attività all'aperto"
}
```

Atteso:
- **201 Created**

## 6) Lista suggerimenti Zyra
**GET** `{{baseUrl}}/api/v1/zyra/suggestions?page=0&size=20`
Headers:
- `Authorization: Bearer {{accessToken}}`

Atteso:
- **200 OK**

---

# Test API - Admin Backoffice (Postman)

## Prerequisiti
- Admin autenticato con token SUPER_ADMIN (`Authorization: Bearer {{adminAccessToken}}`).

## 1) Lista utenti app
**GET** `{{baseUrl}}/api/v1/admin/users?page=0&size=20&email=rossi&status=ACTIVE&onboardingCompleted=true`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**

## 2) Dettaglio utente app
**GET** `{{baseUrl}}/api/v1/admin/users/<userId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**

## 3) Crea utente app
**POST** `{{baseUrl}}/api/v1/admin/users`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "email": "nuovo.utente@example.com",
  "password": "Password123!",
  "language": "it"
}
```

Atteso:
- **201 Created**

## 4) Aggiorna utente app
**PATCH** `{{baseUrl}}/api/v1/admin/users/<userId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "language": "en",
  "onboardingCompleted": true,
  "status": "SUSPENDED"
}
```

Atteso:
- **200 OK**

## 5) Elimina utente app (soft delete)
**DELETE** `{{baseUrl}}/api/v1/admin/users/<userId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **204 No Content**

## 6) Lista admin
**GET** `{{baseUrl}}/api/v1/admin/admin-users?page=0&size=20&email=admin&status=ACTIVE&role=ADMIN`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**

## 7) Dettaglio admin
**GET** `{{baseUrl}}/api/v1/admin/admin-users/<adminId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **200 OK**

## 8) Crea admin (solo ADMIN)
**POST** `{{baseUrl}}/api/v1/admin/admin-users`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "email": "nuovo.admin@example.com",
  "password": "Password123!"
}
```

Atteso:
- **201 Created**

## 9) Aggiorna admin
**PATCH** `{{baseUrl}}/api/v1/admin/admin-users/<adminId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`
- `Content-Type: application/json`

Body (raw JSON):
```json
{
  "status": "SUSPENDED"
}
```

Atteso:
- **200 OK**

## 10) Elimina admin
**DELETE** `{{baseUrl}}/api/v1/admin/admin-users/<adminId>`
Headers:
- `Authorization: Bearer {{adminAccessToken}}`

Atteso:
- **204 No Content**
