import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Check, ChevronsUpDown, Eye, EyeOff, ChevronDown } from "lucide-react"
import useUserStore from "@/stores/useUserStore"
import { NQueensCanvas } from "../components/ComplexAnimations"
import CustomCursor from "@/components/CustomCursor"
import Logo from "@/components/Logo"
import { MONUMENT_TYPO as T } from "@/components/MonumentTypography"

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080"

/* ─────────────────────────────────────────────
   INPUT
───────────────────────────────────────────── */
function VInput({ id, type = "text", placeholder, value, onChange, required, min, max, maxLength }) {
  const [focused, setFocused] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const isPw = type === "password"
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={isPw ? (showPw ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", height: 38,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 9,
          padding: isPw ? "0 36px 0 12px" : "0 12px",
          fontSize: 12.5, color: "#fff", outline: "none",
          transition: "border-color 0.15s",
          fontFamily: "'Inter', sans-serif",
          cursor: "none",
        }}
      />
      {isPw && (
        <button type="button" onClick={() => setShowPw(p => !p)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "none", color: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center" }}>
          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   FIELD
───────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   COLLAPSIBLE OPTIONAL SECTION
───────────────────────────────────────────── */
function OptionalSection({ children }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      gsap.set(bodyRef.current, { height: "auto", opacity: 1 })
      gsap.from(bodyRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "power3.out" })
    } else {
      gsap.to(bodyRef.current, { height: 0, opacity: 0, duration: 0.25, ease: "power3.in" })
    }
  }, [open])

  return (
    <div>
      <button type="button" onClick={() => setOpen(p => !p)} data-cursor="EXPAND"
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: "none", border: "none", cursor: "none",
          padding: "8px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: open ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          Optional Details
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        <ChevronDown size={11} style={{ color: "rgba(255,255,255,0.28)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }} />
      </button>
      <div ref={bodyRef} style={{ height: 0, opacity: 0, overflow: open ? "visible" : "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, paddingBottom: 6 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   INSTITUTION PICKER
───────────────────────────────────────────── */
function InstitutionPicker({ value, onSelect }) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const debounceRef           = useRef(null)
  const dropRef               = useRef(null)
  const containerRef          = useRef(null)

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

  useEffect(() => {
    if (!dropRef.current) return
    gsap.to(dropRef.current, { height: open ? "auto" : 0, opacity: open ? 1 : 0, duration: 0.2, ease: "power2.inOut" })
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(p => !p)} data-cursor="SELECT"
        style={{
          width: "100%", height: 38, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${open ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 9, cursor: "none",
          fontSize: 12.5, color: value ? "#fff" : "rgba(255,255,255,0.22)",
          fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
        }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
          {value ? value.name : "Search institution…"}
        </span>
        <ChevronsUpDown size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, marginLeft: 6 }} />
      </button>
      <div ref={dropRef} style={{ height: 0, opacity: 0, overflow: "hidden", position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50 }}>
        <div style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search…"
              style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 12, color: "#fff", fontFamily: "'Inter', sans-serif", cursor: "none" }}
            />
          </div>
          <div style={{ maxHeight: 150, overflowY: "auto" }}>
            {results.length === 0
              ? <div style={{ padding: "12px", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{query ? "No results." : "Start typing…"}</div>
              : results.map(inst => (
                <button key={inst.id} type="button"
                  onClick={() => { onSelect(value?.id === inst.id ? null : inst); setOpen(false) }}
                  data-cursor="SELECT"
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "none", cursor: "none", textAlign: "left", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Check size={10} style={{ color: "#34d399", opacity: value?.id === inst.id ? 1 : 0, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{inst.name}</div>
                    {inst.university && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{inst.university}{inst.district ? `, ${inst.district}` : ""}</div>}
                  </div>
                </button>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────── */
function VButton({ children, loading }) {
  return (
    <button type="submit" disabled={loading} data-cursor="GO"
      style={{
        width: "100%", height: 42, borderRadius: 10, border: "none", cursor: "none",
        background: loading ? "rgba(237,255,102,0.5)" : "#EDFF66",
        color: "#09090b", fontSize: 11, fontWeight: 900, letterSpacing: "0.09em",
        textTransform: "uppercase", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88" }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────
   ERROR
───────────────────────────────────────────── */
function ErrorBanner({ msg }) {
  if (!msg) return null
  return (
    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", fontSize: 11.5, color: "#f87171" }}>
      {msg}
    </div>
  )
}

/* ─────────────────────────────────────────────
   LEFT PANEL
───────────────────────────────────────────── */
function LeftPanel() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo(".lp-line",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "expo.out", delay: 0.1 }
    )
  }, { scope: ref })

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#050507" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <NQueensCanvas size={8} color="#EDFF66" />
      </div>
      {/* vignette */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(5,5,7,0.75) 0%, rgba(5,5,7,0.25) 50%, rgba(5,5,7,0.65) 100%)", pointerEvents: "none" }} />

      {/* Editorial overlay — bottom-left */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 32px", pointerEvents: "none" }}>
        {/* Logo */}
        <div className="lp-line" style={{ opacity: 0, display: "flex", alignItems: "center", gap: 9, marginBottom: 24 }}>
          <Logo size={26} style={{ borderRadius: 6 }} />
          <span style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 14, color: "#fff", letterSpacing: "0.05em" }}>VANTAGE</span>
        </div>

        <div className="lp-line" style={{ opacity: 0 }}>
          <h2 style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(2rem,3.4vw,3rem)", lineHeight: 0.9, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 10px" }}>
            VISUALIZE.<br /><span style={{ color: "#EDFF66" }}>DOMINATE.</span>
          </h2>
        </div>

        <div className="lp-line" style={{ opacity: 0 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
            Real-time 1v1 battles, algorithm visualization, and an online judge — for developers who actually want to win.
          </p>
        </div>

        {/* Stats strip */}
        <div className="lp-line" style={{ opacity: 0, display: "flex", gap: 0, marginTop: 20, overflow: "hidden", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", width: "fit-content", background: "rgba(255,255,255,0.03)" }}>
          {[["50+", "Algorithms"], ["150+", "Problems"], ["1v1", "Battles"]].map(([v, l], i) => (
            <div key={l} style={{ padding: "9px 15px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 15, color: "#EDFF66", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login")
  const isLogin = mode === "login"
  const formRef = useRef(null)

  useEffect(() => { setMode(initialMode === "signup" ? "signup" : "login") }, [initialMode])

  /* Mode switch — quick fade swap */
  const switchMode = (next) => {
    if (!formRef.current) { setMode(next); return }
    gsap.to(formRef.current, {
      opacity: 0, y: 8, duration: 0.15, ease: "power2.in",
      onComplete: () => {
        setMode(next)
        gsap.fromTo(formRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" })
      }
    })
  }

  /* Right panel entrance — fast */
  const rightRef = useRef(null)
  useGSAP(() => {
    gsap.fromTo(".rp-in",
      { opacity: 0, x: 16 },
      { opacity: 1, x: 0, stagger: 0.04, duration: 0.38, ease: "expo.out", delay: 0.1 }
    )
  }, { scope: rightRef })

  /* ── Login ── */
  const [loginEmail,    setLoginEmail]    = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError,    setLoginError]    = useState("")
  const [loginLoading,  setLoginLoading]  = useState(false)

  async function handleLogin(e) {
    e.preventDefault(); setLoginError(""); setLoginLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error || "Login failed"); return }
      useUserStore.getState().setUser(data)
      window.postMessage({ type: "VANTAGE_LOGIN", lcusername: data.lcusername ?? null, uid: data.uid ?? null }, "*")
      navigate("/")
    } catch { setLoginError("Could not reach the server.") }
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
    } catch { setSignupError("Could not reach the server.") }
    finally { setSignupLoading(false) }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#09090b", cursor: "none", overflow: "hidden" }}>
      <CustomCursor />

      {/* ══ LEFT ══ */}
      <LeftPanel />

      {/* ══ RIGHT ══ */}
      <div ref={rightRef}
        style={{
          position: "relative", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#09090b",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Logo mark — top right, outside flow */}
        <div className="rp-in" style={{ opacity: 0, position: "absolute", top: 26, right: 30, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Vantage</span>
          <Logo size={20} style={{ borderRadius: 5 }} />
        </div>

        {/* ── Centered content column ── */}
        <div style={{ width: "100%", maxWidth: 600, padding: "0 clamp(28px,4vw,52px)", display: "flex", flexDirection: "column" }}>

          {/* Eyebrow */}
          <div className="rp-in" style={{ opacity: 0, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ height: 1, width: 20, background: "rgba(255,255,255,0.18)" }} />
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              {isLogin ? "Welcome back" : "Get started"}
            </span>
          </div>

          {/* Heading */}
          <div className="rp-in" style={{ opacity: 0, marginBottom: 22 }}>
            <h1 style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(2.2rem,3.8vw,3.2rem)", letterSpacing: "-0.025em", lineHeight: 0.88, color: "#fff", margin: 0 }}>
              {isLogin
                ? <><span style={{ display: "block" }}>Sign</span><span style={{ display: "block", color: "rgba(255,255,255,0.2)" }}>In.</span></>
                : <><span style={{ display: "block" }}>Create</span><span style={{ display: "block", color: "rgba(255,255,255,0.2)" }}>Account.</span></>
              }
            </h1>
          </div>

          {/* Form card */}
          <div className="rp-in" ref={formRef}
            style={{ opacity: 0, background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "visible", width: "100%" }}
          >
            {/* Top accent line */}
            <div style={{ height: 1, background: "linear-gradient(90deg,#EDFF66,rgba(237,255,102,0.15),transparent)", borderRadius: "16px 16px 0 0" }} />

            <div style={{ padding: "20px 22px 18px" }}>

              {isLogin ? (
                /* ──── LOGIN ──── */
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <ErrorBanner msg={loginError} />
                  <Field label="Email">
                    <VInput id="le" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                  </Field>
                  <Field label="Password">
                    <VInput id="lp" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                  </Field>
                  <div style={{ paddingTop: 4 }}>
                    <VButton loading={loginLoading}>{loginLoading ? "Signing in…" : "Continue →"}</VButton>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                    No account?{" "}
                    <button type="button" onClick={() => switchMode("signup")} data-cursor="SWITCH"
                      style={{ background: "none", border: "none", cursor: "none", color: "#EDFF66", fontWeight: 800, fontSize: 11.5 }}>
                      Sign up
                    </button>
                  </p>
                </form>
              ) : (
                /* ──── SIGNUP ──── */
                <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <ErrorBanner msg={signupError} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Username">
                      <VInput
                        id="su"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20))}
                        maxLength={20}
                        required
                      />
                    </Field>
                    <Field label="Email">
                      <VInput id="se" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Password">
                      <VInput id="sp" type="password" placeholder="8+ chars" value={password} onChange={e => setPassword(e.target.value)} required />
                    </Field>
                    <Field label="Confirm">
                      <VInput id="sc" type="password" placeholder="repeat" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </Field>
                  </div>

                  <OptionalSection>
                    <Field label="LeetCode Username">
                      <VInput id="slc" type="text" placeholder="john_doe" value={lcusername} onChange={e => setLcusername(e.target.value)} />
                    </Field>
                    <Field label="Institution">
                      <InstitutionPicker value={selectedInstitution} onSelect={setSelectedInstitution} />
                    </Field>
                    <Field label="Graduation Year">
                      <VInput id="sgy" type="number" placeholder="2027" min="1980" max="2040" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
                    </Field>
                  </OptionalSection>

                  <div style={{ paddingTop: 2 }}>
                    <VButton loading={signupLoading}>{signupLoading ? "Creating…" : "Create Account →"}</VButton>
                  </div>

                  <p style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                    Already a member?{" "}
                    <button type="button" onClick={() => switchMode("login")} data-cursor="SWITCH"
                      style={{ background: "none", border: "none", cursor: "none", color: "#EDFF66", fontWeight: 800, fontSize: 11.5 }}>
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Footnote */}
          <div className="rp-in" style={{ opacity: 0, marginTop: 16, fontSize: 10, color: "rgba(255,255,255,0.14)", letterSpacing: "0.04em" }}>
            Competitive DSA Platform · Est. 2026
          </div>

        </div>{/* end centered column */}
      </div>{/* end right panel */}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }
        input::placeholder { color: rgba(255,255,255,0.18); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}