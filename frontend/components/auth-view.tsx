"use client"

import { FormEvent, useMemo, useState } from "react"
import api from "@/src/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Lock, Mail, ShieldCheck, Ticket, User, Users } from "lucide-react"

interface AuthViewProps {
  onLogin: () => void
  onAdminLogin: () => void
}

const getErrorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { message?: string; error?: string } } }).response
  return response?.data?.message || response?.data?.error || "Unable to reach the server."
}

export function AuthView({ onLogin, onAdminLogin }: AuthViewProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false
    if (activeTab === "signup" && !name.trim()) return false
    return true
  }, [activeTab, email, name, password])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!canSubmit) {
      setError("Please complete the required fields.")
      return
    }

    setLoading(true)

    try {
      if (activeTab === "signup") {
        await api.post("/users/register", {
          full_name: name.trim(),
          email: email.trim(),
          password,
        })

        setMessage("Account created. You can sign in now.")
        setPassword("")
        setActiveTab("login")
        return
      }

      const res = await api.post("/users/login", {
        email: email.trim(),
        password,
      })

      const userData = res.data.user
      localStorage.setItem("user", userData.email)
      localStorage.setItem("userId", String(userData.id))
      localStorage.setItem("token", rememberMe ? "remembered-session" : "active-session")

      onLogin()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">SmartQ</p>
              <p className="text-sm font-medium text-slate-500">Queue operations desk</p>
            </div>
          </div>

          <div className="grid max-w-2xl gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Today&apos;s floor</p>
                  <h1 className="mt-1 text-4xl font-bold tracking-tight">Patients move faster when counters stay clear.</h1>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Waiting", value: "18", icon: Users, tone: "bg-blue-50 text-blue-700" },
                  { label: "Avg wait", value: "14m", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
                  { label: "Served", value: "63", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-md ${item.tone}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Live counters</p>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  Online
                </span>
              </div>
              <div className="grid gap-3">
                {[
                  ["General", "TKN-1042", "Counter 1"],
                  ["Billing", "TKN-2091", "Counter 3"],
                  ["Lab", "TKN-3110", "Counter 2"],
                ].map(([dept, token, counter]) => (
                  <div key={dept} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-700">{dept}</span>
                    <span className="font-mono text-lg font-bold text-slate-950">{token}</span>
                    <span className="text-sm font-medium text-slate-500">{counter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Card className="rounded-lg border-slate-200 shadow-lg shadow-slate-200/60">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white lg:hidden">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome to SmartQ</CardTitle>
              <CardDescription>Sign in to continue your queue session.</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 rounded-lg bg-slate-100">
                <TabsTrigger value="login" className="rounded-md font-semibold">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md font-semibold">Register</TabsTrigger>
              </TabsList>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <TabsContent value="login" className="m-0 space-y-4">
                  <AuthFields
                    email={email}
                    password={password}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="remember" className="text-sm text-slate-600">
                        Remember me
                      </Label>
                    </div>
                    <button type="button" className="text-sm font-semibold text-blue-700">
                      Forgot password?
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="m-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-11 rounded-lg border-slate-200 pl-10"
                      />
                    </div>
                  </div>

                  <AuthFields
                    email={email}
                    password={password}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                  />
                </TabsContent>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading || !canSubmit} className="h-11 w-full rounded-lg font-bold">
                  {loading ? "Please wait..." : activeTab === "signup" ? "Create account" : "Sign in"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="my-6 h-px bg-slate-200" />

              <Button
                type="button"
                variant="outline"
                onClick={onAdminLogin}
                className="h-11 w-full rounded-lg border-slate-200 font-bold"
              >
                <ShieldCheck className="mr-2 h-4 w-4 text-blue-700" />
                Open admin console
              </Button>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

interface AuthFieldsProps {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
}

function AuthFields({ email, password, onEmailChange, onPasswordChange }: AuthFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-11 rounded-lg border-slate-200 pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="h-11 rounded-lg border-slate-200 pl-10"
          />
        </div>
      </div>
    </>
  )
}
