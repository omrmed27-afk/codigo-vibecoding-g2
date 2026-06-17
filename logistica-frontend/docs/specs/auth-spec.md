# Spec: Auth Module

**Status:** done
**Generated:** 2026-05-27
**Validated:** 2026-05-27
**Dependencies:** — (none)

---

## Infraestructura ya construida (NO recrear)

Los siguientes archivos existen y están completos:

- `services/auth.ts` — `login()`, `register()`, `refreshToken()` con plain axios
- `stores/auth.store.ts` — `login()`, `logout()`, `setAccessToken()`, `initFromStorage()`, cookie `is_logged_in`
- `app/(auth)/layout.tsx` — layout centrado, sin sidebar
- `app/(dashboard)/layout.tsx` — AuthGuard con `initFromStorage()` en mount
- `proxy.ts` — guard por cookie `is_logged_in`

---

## Hooks

- [x] ✅ `hooks/auth/use-login.ts`
  - [x] ✅ Exporta `useLogin()` — wraps `useMutation`
  - [x] ✅ `mutationFn`: llama `login(body)` de `@/services/auth`
  - [x] ✅ `onSuccess`: llama `authStore.login(access, refresh, user)`, luego `router.push('/shipments')`
  - [x] ✅ `onError`: no se implementó toast (ver edge case — error se muestra inline en el form, no como toast; decisión correcta)
  - [x] ✅ Retorna `{ mutate, isPending, error }` vía objeto mutation

- [x] ✅ `hooks/auth/use-register.ts`
  - [x] ✅ Exporta `useRegister()` — wraps `useMutation`
  - [x] ✅ `mutationFn`: llama `register(body)` de `@/services/auth`
  - [x] ✅ `onSuccess`: llama `authStore.login(access, refresh, user)`, luego `router.push('/shipments')`
  - [x] ✅ `onError`: extrae `details` → toast.error solo si no hay field errors (use-register.ts:25-32)
  - [x] ✅ Retorna `{ mutate, isPending, error }`

---

## Pages

### `app/(auth)/login/page.tsx`

- [x] ✅ Server Component (sin `"use client"` — correcto: LoginForm es "use client", la page no lo necesita)
- [x] ✅ Renderiza `LoginForm`
- [x] ✅ Link "Don't have an account? Register" → `/register`
- [x] ✅ Título "Sign in to your account"
- [x] ✅ No hace redirect aquí — `useLogin` lo maneja en `onSuccess`

### `app/(auth)/register/page.tsx`

- [x] ✅ Server Component (sin `"use client"` — correcto por misma razón)
- [x] ✅ Renderiza `RegisterForm`
- [x] ✅ Link "Already have an account? Sign in" → `/login`
- [x] ✅ Título "Create an account"
- [x] ✅ No hace redirect aquí — `useRegister` lo maneja en `onSuccess`

---

## Components

### `components/auth/LoginForm.tsx`

- [x] ✅ `"use client"` directive
- [x] ✅ Zod schema: `username` min(1), `password` min(1)
- [x] ✅ `react-hook-form` con `zodResolver`
- [x] ✅ Campos shadcn: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Campo `username`: Input type="text", autoComplete="username"
- [x] ✅ Campo `password`: Input type="password", autoComplete="current-password"
- [x] ✅ Submit button: `disabled={isPending}`, muestra `LoadingSpinner` cuando `isPending`
- [x] ✅ Usa `useLogin()` de `@/hooks/auth/use-login`
- [x] ✅ Error de credenciales inválidas: muestra `apiError` bajo el form (no toast) — LoginForm.tsx:40,73-75

### `components/auth/RegisterForm.tsx`

- [x] ✅ `"use client"` directive
- [x] ✅ Zod schema: `username` min(1)/max(150), `password` min(8), `email` email|literal('') optional, `first_name`/`last_name` max(150) optional
- [x] ✅ `react-hook-form` con `zodResolver`
- [x] ✅ Campos shadcn para: first_name, last_name, username, email, password
- [x] ✅ Submit button: `disabled={isPending}`, muestra `LoadingSpinner`
- [x] ✅ Usa `useRegister()` de `@/hooks/auth/use-register`
- [x] ✅ Mapea `error.response?.data?.error?.details` a `form.setError` via callback en `mutate()` — RegisterForm.tsx:46-55
- [x] ✅ Error general (no de campo): toast en `useRegister.onError`

---

## Error & Edge Cases

- [x] ✅ Login credenciales incorrectas: `apiError` se muestra bajo el form (LoginForm.tsx:73-75), no toast
- [x] ✅ Register username duplicado: `details.username` → `form.setError('username')` (RegisterForm.tsx:47-54)
- [x] ✅ Register email duplicado: `details.email` → `form.setError('email')` (RegisterForm.tsx:47-54)
- [x] ✅ Campos vacíos: validación zod client-side previene llamada al API
- [x] ✅ `isPending=true`: `Button disabled={isPending}` — no doble-submit posible
- [x] ✅ Network error: `useRegister.onError` → `toast.error` cuando no hay details
- [x] ✅ `useRouter` de `next/navigation` en ambos hooks
- [x] ✅ `toast` importado de `sonner` (use-register.ts:5)
