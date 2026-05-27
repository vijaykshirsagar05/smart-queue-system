"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import api, { SOCKET_URL } from "@/src/lib/api"
import { DEPARTMENTS, QueueToken, getDepartmentLabel, getDepartmentShortLabel } from "@/src/lib/queue"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, CalendarClock, ChevronDown, Clock, LogOut, Plus, Ticket, Users } from "lucide-react"

interface UserDashboardProps {
  onLogout: () => void
}

export function UserDashboard({ onLogout }: UserDashboardProps) {
  const [userName, setUserName] = useState("User")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const [peopleAhead, setPeopleAhead] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [syncState, setSyncState] = useState<"online" | "offline">("online")

  useEffect(() => {
    const userSession = localStorage.getItem("user") || localStorage.getItem("token")

    if (!userSession) {
      onLogout()
      return
    }

    const namePart = userSession.includes("@") ? userSession.split("@")[0] : "User"
    setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1))

    const savedToken = localStorage.getItem("activeToken")
    const savedDept = localStorage.getItem("activeDept")
    if (savedToken && savedToken !== "undefined") setActiveToken(savedToken)
    if (savedDept) setSelectedDepartment(savedDept)
  }, [onLogout])

  const updateQueueInfo = useCallback(async (tokenOverride?: string | null) => {
    const currentToken = tokenOverride || activeToken || localStorage.getItem("activeToken")
    if (!currentToken || currentToken === "undefined") return

    try {
      const res = await api.get<QueueToken[]>("/queue/status")
      const fullQueue = res.data
      const myToken = fullQueue.find((token) => String(token.token_number) === String(currentToken))

      setSyncState("online")

      if (!myToken) {
        setActiveToken(null)
        localStorage.removeItem("activeToken")
        localStorage.removeItem("activeDept")
        setPeopleAhead(0)
        setEstimatedTime(0)
        setProgress(0)
        return
      }

      const waitingInDepartment = fullQueue.filter(
        (token) => token.status === "waiting" && String(token.department) === String(myToken.department)
      )
      const myIndex = waitingInDepartment.findIndex((token) => String(token.token_number) === String(currentToken))

      if (myIndex !== -1) {
        setPeopleAhead(myIndex)
        setEstimatedTime(myIndex * 5)
        setProgress(Math.max(20, Math.min(95, 100 - myIndex * 12)))
      } else if (myToken.status === "called") {
        setPeopleAhead(0)
        setEstimatedTime(0)
        setProgress(100)
      }
    } catch {
      setSyncState("offline")
    }
  }, [activeToken])

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socket.on("queueUpdated", () => updateQueueInfo())

    return () => {
      socket.disconnect()
    }
  }, [updateQueueInfo])

  useEffect(() => {
    updateQueueInfo()
    const interval = setInterval(updateQueueInfo, 5000)
    return () => clearInterval(interval)
  }, [updateQueueInfo])

  const handleJoinQueue = async () => {
    if (!selectedDepartment) return

    const userId = localStorage.getItem("userId")
    if (!userId) {
      onLogout()
      return
    }

    setLoading(true)
    try {
      const res = await api.post("/queue/book", {
        department: selectedDepartment,
        user_id: userId,
      })

      const data = res.data.tokenData || res.data
      const newToken = data.token_number || data.tokenNumber || data.token || data.t_number || data.id?.toString()

      if (newToken) {
        const tokenStr = String(newToken)
        setActiveToken(tokenStr)
        localStorage.setItem("activeToken", tokenStr)
        localStorage.setItem("activeDept", selectedDepartment)
        setDialogOpen(false)
        await updateQueueInfo(tokenStr)
      }
    } catch {
      setSyncState("offline")
    } finally {
      setLoading(false)
    }
  }

  const initials = userName.substring(0, 2).toUpperCase()
  const displayToken = activeToken && activeToken !== "undefined" ? activeToken : "---"
  const activeDepartmentLabel = useMemo(() => getDepartmentLabel(selectedDepartment), [selectedDepartment])

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">SmartQ</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Patient queue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={syncState === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
              {syncState === "online" ? "Live" : "Offline"}
            </Badge>
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-lg border border-transparent px-2 hover:border-slate-200">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-700 text-xs font-bold text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-semibold sm:inline">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-lg">
                <DropdownMenuLabel className="text-xs font-semibold uppercase text-slate-500">Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Hello, {userName}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Your current queue status</h1>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!!activeToken} className="h-11 rounded-lg font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    {activeToken ? "Token active" : "Book token"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Select department</DialogTitle>
                    <DialogDescription>Choose the counter you need today.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {DEPARTMENTS.map((department) => (
                          <SelectItem key={department.value} value={department.value}>
                            {department.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="h-11 w-full rounded-lg font-bold" disabled={!selectedDepartment || loading} onClick={handleJoinQueue}>
                      {loading ? "Booking..." : "Confirm booking"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Token number</p>
                    <p className="mt-2 font-mono text-6xl font-bold tracking-tight text-slate-950 sm:text-7xl">{displayToken}</p>
                  </div>
                  <Badge className={activeToken ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                    {activeToken ? "Active" : "No token"}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatusTile label="Department" value={getDepartmentShortLabel(selectedDepartment)} icon={Ticket} />
                  <StatusTile label="Ahead" value={activeToken ? String(peopleAhead) : "0"} icon={Users} />
                  <StatusTile label="Wait" value={`${activeToken ? estimatedTime : 0}m`} icon={Clock} />
                </div>
              </div>

              <Card className="rounded-lg border-slate-200 shadow-sm">
                <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="relative mb-5 h-36 w-36">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#2563eb"
                        strokeLinecap="round"
                        strokeWidth="8"
                        strokeDasharray={`${progress * 2.64} 264`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{activeToken ? progress : 0}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-700">Queue readiness</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{activeToken ? activeDepartmentLabel : "Book a token to begin"}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Joined", active: !!activeToken },
              { title: "Waiting", active: !!activeToken && peopleAhead > 0 },
              { title: "Next up", active: !!activeToken && peopleAhead === 0 },
            ].map((step, index) => (
              <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${step.active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {index + 1}
                </div>
                <p className="font-bold">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.active ? "Current" : "Pending"}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-blue-700" />
                Department guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEPARTMENTS.map((department) => (
                <div key={department.value} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700">{department.shortLabel}</span>
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${department.color}`}>Open</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-bold text-slate-700">Need help?</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep this screen open. The status will refresh automatically when the counter calls a token.
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}

interface StatusTileProps {
  label: string
  value: string
  icon: typeof Ticket
}

function StatusTile({ label, value, icon: Icon }: StatusTileProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-blue-700" />
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  )
}
