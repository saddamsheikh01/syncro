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

Nota: la logout e stateless, il client deve eliminare i token salvati.

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
