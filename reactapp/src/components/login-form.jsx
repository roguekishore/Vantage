import { useState } from "react"
import { cn } from "@/lib/utils"
import useUserStore from "@/stores/useUserStore"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { LogIn, Mail, KeyRound } from "lucide-react"

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8080"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }
      // Store user in localStorage AND update the reactive auth store
      // so the navbar and all subscribers update without a page refresh.
      useUserStore.getState().setUser(data)
      // Signal the Chrome extension (if installed) to update its linked lcusername
      window.postMessage({
        type: 'VANTAGE_LOGIN',
        lcusername: data.lcusername ?? null,
        uid: data.uid ?? null,
        sessionToken: data.sessionToken ?? null,
      }, '*')
      navigate("/")
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-[13px]">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[13px] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full h-10 bg-[#5542FF] hover:bg-[#4433DD] text-white font-medium" disabled={loading}>
                {loading ? "Signing in…" : "Continue"}
              </Button>
            </div>
            <div className="mt-6 text-center text-[13px] text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-[#5542FF] hover:text-[#4433DD] font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
