---
type: backend security domain
title: Authentication and sessions
description: JWT access/refresh authentication, bcrypt password handling, rotation, and browser session recovery.
tags: [backend, auth, security, jwt]
---

# Authentication and sessions

Route response contracts are JSON. `POST /register` returns 201 `{access_token,refresh_token,user}`; missing email/password returns 400 `{error:'Email y contraseña son requeridos'}`; password under six returns 400 `{error:'La contraseña debe tener al menos 6 caracteres'}`; duplicate lowercased email returns 409 `{error:'Ya existe una cuenta con este email'}`. `POST /login` returns 200 with the same session body; missing fields returns 400 `{error:'Email y contraseña son requeridos'}`; unknown/wrong credentials returns 401 `{error:'Credenciales inválidas'}`. `POST /refresh` returns 200 with a rotated session body; missing token is 400 `{error:'Refresh token requerido'}`; JWT verification failure is 401 `{error:'Refresh token inválido o expirado'}`; wrong type is 401 `{error:'Token inválido'}`; missing user/hash is 401 `{error:'Sesión inválida'}`; bcrypt mismatch is 401 `{error:'Refresh token inválido'}`. `GET /me` returns 200 `{user}` when bearer auth succeeds. `POST /logout` returns 200 `{message:'Sesión cerrada'}` after clearing the hash.

For protected routes, missing Authorization or a non-Bearer value returns 401 `{error:'Token no proporcionado'}`; expired access returns 401 `{error:'Token expirado',code:'TOKEN_EXPIRED'}`; other JWT errors return 401 `{error:'Token inválido'}`; a verified token whose user is absent returns 401 `{error:'Usuario no encontrado'}`. Database exceptions reach `errorHandler` rather than these route bodies.

`routes/auth.js` lowercases lookup, bcrypt-hashes passwords and refresh tokens, signs access JWTs (default 15m) and refresh JWTs (default 7d, `type: refresh`), and rotates both on refresh. `ApiClient` stores the complete session response JSON under `localStorage` key `linksight_auth`; requests set `Content-Type: application/json` and `Authorization: Bearer ${access_token}`. A 401 with refresh token calls `/api/auth/refresh`, stores the replacement session, retries once, or removes storage, redirects to `/login`, and throws `Sesión expirada`. `useAuth` refreshes stored sessions on startup and every ten minutes; sign-out calls logout, clears session, and navigates home. No automated auth tests exist.
