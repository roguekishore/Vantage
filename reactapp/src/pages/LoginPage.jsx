import { LoginForm } from "../components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5542FF] to-[#B28EF2] grid place-items-center shadow-lg shadow-[#5542FF]/20">
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <p className="text-sm text-muted-foreground">Welcome back to Vantage</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
