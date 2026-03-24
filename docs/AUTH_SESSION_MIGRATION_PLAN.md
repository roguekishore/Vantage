# Auth + Session + Extension + Realtime Migration Plan

## Goal
Single, stable authentication model that works for:
- Web app session management
- Chrome extension sync
- SSE stream
- WebSocket features

## Target Architecture
- Web auth: HttpOnly cookie (`vantage_at`) as primary mechanism
- API auth: cookie-first, Bearer-token bridge during migration
- Extension auth: token bridge now, cookie fallback enabled, dedicated extension token flow next
- SSE: cookie-authenticated stream URL (no token in query)
- WebSocket: cookie/JWT-authenticated connect path with server-side user binding

## Rollout Phases

### Phase 1 - Foundation (Implemented)
- [x] Backend sets HttpOnly auth cookie on login/signup
- [x] Backend exposes `GET /api/auth/me` and `POST /api/auth/logout`
- [x] JWT filter accepts cookie token in addition to header/query
- [x] React API calls send `credentials: include`
- [x] React no longer persists auth tokens in `localStorage`
- [x] React SSE URL migrated away from `?token=`
- [x] Extension identity sync no longer requires tokens to detect logged-in user
- [x] Extension backend calls try cookie auth (`credentials: include`)

### Phase 2 - Web Hardening (Implemented)
- [x] Remove token fields from web login/signup payload handling
- [x] Replace remaining direct `localStorage.getItem('user')` reads with auth store accessors
- [x] Add CSRF protection strategy for cookie-authenticated mutating endpoints (origin/referer guard)

### Phase 3 - Extension Hardening (Implemented)
- [x] Add backend endpoint to mint scoped extension token from cookie-authenticated app session
- [x] Store scoped extension token in extension storage (preferred for sync auth)
- [x] Remove extension dependence on app auth tokens entirely

### Phase 4 - Realtime Hardening (Implemented)
- [x] Add WebSocket inbound auth interceptor (`CONNECT`) and bind authenticated principal
- [x] Restrict battle/friend topic subscription paths by authenticated user
- [x] Add SSE heartbeat event every 20–30s to reduce edge/proxy idle disconnects

### Phase 5 - Cleanup (Final)
- [x] Remove legacy query-token support from SSE/auth extraction path
- [x] Remove legacy sessionToken fallback paths in sync/auth filter
- [x] Document final environment requirements

## Environment Settings
Set these on backend per environment:
- `auth.cookie.secure=true` in HTTPS production
- `auth.cookie.same-site=Lax` for same-site subdomains (`vantagecode.tech` + `api.vantagecode.tech`)
- `auth.cookie.same-site=None` only if truly cross-site embedding is required (must keep `secure=true`)
- `auth.cookie.max-age-seconds=86400` (or desired)

## Validation Checklist
- [ ] Login sets cookie and `GET /api/auth/me` succeeds
- [ ] Refresh browser keeps session without token in `localStorage`
- [ ] SSE connects on `/api/progress/stream` and receives updates
- [ ] Extension can identify app user even if installed post-login
- [ ] Extension sync works with scoped extension token
- [ ] Battle/Friend WebSocket flows remain functional
