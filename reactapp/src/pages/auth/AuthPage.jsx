import { forwardRef, useEffect, useId, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { AlertTriangle, Check, ChevronDown, ChevronsUpDown, Eye, EyeOff } from "lucide-react"
import useUserStore from "@/stores/useUserStore"
import Logo from "@/components/common/Logo"
import { NQueensCanvas } from "@/components/animations/ComplexAnimations"
import { useThemeTokens } from "@/hooks/useThemeTokens"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"
import { rgba } from "@/lib/canvasTheme"
import {
  Button,
  Field,
  IconButton,
  Input,
  OfflineState,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeToggle,
  useField,
} from "@/components/ds"

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080"

/* Message both handlers set when fetch throws (network failure). */
const NETWORK_ERROR = "Could not reach the server."

/* Client-side validation messages from handleSignup, shown on their field. */
const SIGNUP_FIELD_ERRORS = {
  "Username must be 1-20 chars using only lowercase letters and numbers": "username",
  "Password must be at least 8 characters": "password",
  "Passwords do not match": "confirmPassword",
}

const FOCUS_RING = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus"

/* ─────────────────────────────────────────────
   PASSWORD INPUT: ds Input + show/hide IconButton
───────────────────────────────────────────── */
const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [showPw, setShowPw] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} {...props} type={showPw ? "text" : "password"} className="pr-10" />
      <IconButton
        size="sm"
        icon={showPw ? EyeOff : Eye}
        aria-label={showPw ? "Hide password" : "Show password"}
        onClick={() => setShowPw(p => !p)}
        className="absolute right-1 top-1"
      />
    </div>
  )
})

/* ─────────────────────────────────────────────
   INLINE API ERROR (above the form fields)
───────────────────────────────────────────── */
function FormAlert({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-2 border border-err bg-err-soft px-3 py-2 font-mono text-small text-err">
      <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COLLAPSIBLE OPTIONAL SECTION
───────────────────────────────────────────── */
function OptionalSection({ children }) {
  const [open, setOpen] = useState(false)
  const bodyId = `optional-${useId().replace(/:/g, "")}`
  const bodyRef = useRef(null)
  useEffect(() => {
    if (!open || !bodyRef.current || prefersReducedMotion()) return
    gsap.from(bodyRef.current, { opacity: 0, y: -6, duration: 0.3, ease: "power3.out" })
  }, [open])
  return (
    <div className="grid gap-4">
      <Button
        variant="ghost"
        className="w-full justify-between border-x-transparent border-border px-0"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(p => !p)}
      >
        Optional details
        <ChevronDown aria-hidden="true" className={open ? "rotate-180" : undefined} />
      </Button>
      <div ref={bodyRef} id={bodyId} hidden={!open} className={open ? "grid gap-4" : "hidden"}>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   INSTITUTION PICKER: field-style trigger, ds Popover with a search Input
   and a listbox of results
───────────────────────────────────────────── */
function InstitutionPicker({ value, onSelect }) {
  const field = useField()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const debounceRef           = useRef(null)
  const listRef               = useRef(null)
  const listId                = `institutions-${useId().replace(/:/g, "")}`

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/institutions/search?q=${encodeURIComponent(query)}&limit=8`)
        if (res.ok) setResults(await res.json())
      } catch {}
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [open, query])

  const options = () => Array.from(listRef.current?.querySelectorAll('[role="option"]') ?? [])

  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      options()[0]?.focus()
    }
  }

  const onListKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const opts = options()
    const i = opts.indexOf(document.activeElement)
    const next = e.key === "ArrowDown" ? Math.min(i + 1, opts.length - 1) : i - 1
    if (next < 0) listRef.current?.closest("[data-institution-popover]")?.querySelector("input")?.focus()
    else opts[next]?.focus()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={field?.id}
          aria-describedby={field?.describedBy}
          aria-haspopup="listbox"
          className={`flex h-9 w-full items-center justify-between gap-2 border border-border bg-elevated px-3 text-left font-mono text-body transition-colors duration-[120ms] ease-out ds-hover:border-border-strong ${FOCUS_RING}`}
        >
          <span className={`min-w-0 flex-1 truncate ${value ? "text-fg" : "text-fg-dim"}`}>
            {value ? value.name : "Search institution"}
          </span>
          <ChevronsUpDown size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-fg-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent data-institution-popover="" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-border p-2">
          <Input
            id={`${listId}-search`}
            size="sm"
            role="combobox"
            aria-label="Search institutions"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Type to search"
          />
        </div>
        {results.length === 0 ? (
          <p role="status" className="px-3 py-3 text-fg-muted">{query ? "No results." : "Start typing."}</p>
        ) : (
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Institutions"
            onKeyDown={onListKeyDown}
            className="max-h-48 overflow-y-auto py-1"
          >
            {results.map(inst => {
              const selected = value?.id === inst.id
              return (
                <button
                  key={inst.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onSelect(value?.id === inst.id ? null : inst); setOpen(false) }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors duration-[120ms] ease-out ds-hover:bg-elevated ds-focus:bg-elevated ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-[-2px] ds-focus:outline-focus"
                >
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 text-ok ${selected ? "" : "opacity-0"}`}
                  />
                  <span className="grid min-w-0 gap-1">
                    <span className="truncate text-small text-fg">{inst.name}</span>
                    {inst.university && (
                      <span className="truncate text-small text-fg-muted">
                        {inst.university}{inst.district ? `, ${inst.district}` : ""}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ─────────────────────────────────────────────
   LEFT PANEL: NQueens canvas, vignette and editorial overlay
───────────────────────────────────────────── */
const STATS = [["50+", "Algorithms"], ["150+", "Problems"], ["1v1", "Battles"]]

function LeftPanel() {
  const ref = useRef(null)
  useThemeTokens() /* re-render on theme toggle so the vignette repaints */
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(".lp-line", { opacity: 0, y: 14, stagger: 0.06, duration: 0.45, ease: "expo.out", delay: 0.1 })
  }, { scope: ref })

  return (
    <section
      ref={ref}
      aria-label="About Vantage"
      className="relative h-64 w-full overflow-hidden bg-bg sm:h-80 lg:h-full"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <NQueensCanvas size={8} color="accent-ink" />
      </div>
      {/* vignette: a visual effect inside the canvas panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${rgba("bg", 0.75)} 0%, ${rgba("bg", 0.25)} 50%, ${rgba("bg", 0.65)} 100%)` /* ui-allow: visual */ }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 py-5 sm:px-8 sm:py-7">
        <div className="lp-line mb-4 flex items-center gap-2 lg:mb-6">
          <Logo size={26} alt="" />
          <span className="font-display text-body uppercase tracking-wider text-fg" style={{ fontWeight: "var(--display-weight)", fontSynthesis: "none" }}>
            Vantage
          </span>
        </div>

        <h2
          className="lp-line mb-2 font-display text-h1 uppercase leading-[0.9] text-fg lg:mb-3 lg:text-display"
          style={{ fontWeight: "var(--display-weight)", fontSynthesis: "none" }}
        >
          Visualize.
          <br />
          <span className="text-accent-ink">Dominate.</span>
        </h2>

        <p className="lp-line hidden max-w-xs text-small text-fg-muted lg:block">
          Real-time 1v1 battles, algorithm visualization, and an online judge, for developers who actually want to win.
        </p>

        <dl className="lp-line mt-5 hidden w-fit border border-border bg-bg/40 lg:flex">
          {STATS.map(([v, l], i) => (
            <div key={l} className={`px-4 py-2 ${i < STATS.length - 1 ? "border-r border-border" : ""}`}>
              <dd className="font-display text-h3 leading-none text-accent-ink" style={{ fontWeight: "var(--display-weight)", fontSynthesis: "none" }}>{v}</dd>
              <dt className="mt-1 font-mono text-micro uppercase text-fg-dim">{l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login")
  const isLogin = mode === "login"
  const formRef = useRef(null)

  useEffect(() => { setMode(initialMode === "signup" ? "signup" : "login") }, [initialMode])

  const switchMode = (next) => setMode(next)

  /* ── Login ── */
  const [loginEmail,    setLoginEmail]    = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError,    setLoginError]    = useState("")
  const [loginLoading,  setLoginLoading]  = useState(false)

  useEffect(() => {
    const msg = location.state?.authExpiredMessage
    if (!msg) return

    setMode("login")
    setLoginError(msg)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  async function handleLogin(e) {
    e.preventDefault(); setLoginError(""); setLoginLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error || "Login failed"); return }
      useUserStore.getState().setUser(data)
      window.postMessage({ type: "VANTAGE_LOGIN", lcusername: data.lcusername ?? null, uid: data.uid ?? null }, "*")
      navigate("/")
    } catch { setLoginError(NETWORK_ERROR) }
    finally { setLoginLoading(false) }
  }

  /* ── Signup ── */
  const [username,            setUsername]           = useState("")
  const [email,               setEmail]              = useState("")
  const [password,            setPassword]           = useState("")
  const [confirmPassword,     setConfirmPassword]    = useState("")
  const [lcusername,          setLcusername]         = useState("")
  const [graduationYear,      setGraduationYear]     = useState("")
  const [selectedInstitution, setSelectedInstitution]= useState(null)
  const [signupError,         setSignupError]        = useState("")
  const [signupLoading,       setSignupLoading]      = useState(false)

  async function handleSignup(e) {
    e.preventDefault(); setSignupError("")
    const usernamePattern = /^[a-z0-9]{1,20}$/
    if (!usernamePattern.test(username)) {
      setSignupError("Username must be 1-20 chars using only lowercase letters and numbers")
      return
    }
    if (password !== confirmPassword) { setSignupError("Passwords do not match"); return }
    if (password.length < 8) { setSignupError("Password must be at least 8 characters"); return }
    setSignupLoading(true)
    try {
      const body = { username, email, password, ...(lcusername.trim() && { lcusername: lcusername.trim() }), ...(selectedInstitution && { institutionId: selectedInstitution.id }), ...(graduationYear && { graduationYear: parseInt(graduationYear, 10) }) }
      const res  = await fetch(`${API_BASE}/api/auth/signup`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setSignupError(data.error || "Signup failed"); return }
      useUserStore.getState().setUser(data)
      window.postMessage({ type: "VANTAGE_LOGIN", lcusername: data.lcusername ?? null, uid: data.uid ?? null }, "*")
      navigate("/")
    } catch { setSignupError(NETWORK_ERROR) }
    finally { setSignupLoading(false) }
  }

  /* ── View state derived from the error strings ── */
  const activeError = isLogin ? loginError : signupError
  const offline = activeError === NETWORK_ERROR
  const signupFieldKey = isLogin ? null : SIGNUP_FIELD_ERRORS[signupError] ?? null
  const bannerError = offline || signupFieldKey ? "" : activeError
  const fieldError = (key) => (signupFieldKey === key ? signupError : undefined)

  /* Move focus to the field a validation message points at. */
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)
  useEffect(() => {
    const target = { username: usernameRef, password: passwordRef, confirmPassword: confirmPasswordRef }[signupFieldKey]
    target?.current?.focus()
  }, [signupFieldKey, signupError])

  const retry = () => formRef.current?.requestSubmit?.()

  /* Right panel entrance */
  const rightRef = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(".rp-in", { opacity: 0, x: 16, stagger: 0.04, duration: 0.38, ease: "expo.out", delay: 0.1 })
  }, { scope: rightRef })

  return (
    <div className="grid min-h-screen bg-bg text-fg lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <LeftPanel />

      <main ref={rightRef} className="relative flex border-t border-border bg-bg lg:h-full lg:overflow-y-auto lg:border-l lg:border-t-0">
        {/* Brand mark and theme toggle, top right */}
        <div className="rp-in absolute right-4 top-4 z-raised flex items-center gap-3 sm:right-7 sm:top-6">
          <span className="font-mono text-micro uppercase tracking-widest text-fg-dim">Vantage</span>
          <Logo size={20} alt="" />
          <ThemeToggle />
        </div>

        <div className="mx-auto my-auto flex w-full max-w-[600px] flex-col px-5 pb-10 pt-20 sm:px-[clamp(28px,4vw,52px)]">
          <div className="rp-in mb-3 flex items-center gap-2">
            <span className="h-px w-5 bg-border-strong" aria-hidden="true" />
            <span className="font-mono text-micro uppercase tracking-widest text-fg-muted">
              {isLogin ? "Welcome back" : "Get started"}
            </span>
          </div>

          <h1
            className="rp-in mb-6 font-display text-display uppercase leading-[0.9] text-fg"
            style={{ fontWeight: "var(--display-weight)", fontSynthesis: "none" }}
          >
            {isLogin ? (
              <>
                <span className="block">Sign</span>
                <span className="block text-fg-dim">In.</span>
              </>
            ) : (
              <>
                <span className="block">Create</span>
                <span className="block text-fg-dim">Account.</span>
              </>
            )}
          </h1>

          {offline ? (
            <OfflineState
              className="mb-6 px-4 py-8"
              description={`Vantage can't ${isLogin ? "sign you in" : "create your account"} while the server is unreachable. Check your connection and retry. The visualizers run in your browser and keep working offline.`}
              onRetry={retry}
            />
          ) : null}

          <div className="rp-in w-full border border-border bg-surface">
            {/* Top accent line */}
            <div aria-hidden="true" className="h-px" style={{ background: `linear-gradient(90deg, ${rgba("accent", 1)}, ${rgba("accent", 0.15)}, transparent)` /* ui-allow: visual */ }} />
            <div className="px-5 pb-5 pt-5 sm:px-6">
              {isLogin ? (
                /* ──── LOGIN ──── */
                <form ref={formRef} onSubmit={handleLogin} className="grid gap-4">
                  <FormAlert message={bannerError} />
                  <Field label="Email" required>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Password" required>
                    <PasswordInput
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </Field>
                  <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={loginLoading}>
                    {loginLoading ? "Signing in…" : "Continue"}
                  </Button>
                  <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-small text-fg-muted">
                    No account?
                    <Button variant="link" onClick={() => switchMode("signup")}>Sign up</Button>
                  </p>
                </form>
              ) : (
                /* ──── SIGNUP ──── */
                <form ref={formRef} onSubmit={handleSignup} className="grid gap-4">
                  <FormAlert message={bannerError} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Username" required hint="Lowercase letters and numbers, up to 20" error={fieldError("username")}>
                      <Input
                        ref={usernameRef}
                        type="text"
                        autoComplete="username"
                        placeholder="johndoe"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20))}
                        maxLength={20}
                      />
                    </Field>
                    <Field label="Email" required>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Password" required hint="At least 8 characters" error={fieldError("password")}>
                      <PasswordInput
                        ref={passwordRef}
                        autoComplete="new-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </Field>
                    <Field label="Confirm password" required error={fieldError("confirmPassword")}>
                      <PasswordInput
                        ref={confirmPasswordRef}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  </div>

                  <OptionalSection>
                    <Field label="LeetCode username">
                      <Input type="text" placeholder="john_doe" value={lcusername} onChange={e => setLcusername(e.target.value)} />
                    </Field>
                    <Field label="Institution">
                      <InstitutionPicker value={selectedInstitution} onSelect={setSelectedInstitution} />
                    </Field>
                    <Field label="Graduation year">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="2027"
                        min="1980"
                        max="2040"
                        className="tabular-nums"
                        value={graduationYear}
                        onChange={e => setGraduationYear(e.target.value)}
                      />
                    </Field>
                  </OptionalSection>

                  <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" loading={signupLoading}>
                    {signupLoading ? "Creating account…" : "Create account"}
                  </Button>

                  <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-small text-fg-muted">
                    Already a member?
                    <Button variant="link" onClick={() => switchMode("login")}>Sign in</Button>
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="rp-in mt-4 font-mono text-micro uppercase tracking-wider text-fg-dim">
            Competitive DSA Platform · Est. 2026
          </p>
        </div>
      </main>
    </div>
  )
}
