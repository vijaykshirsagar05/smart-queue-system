"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import api, { SOCKET_URL } from "@/src/lib/api"
import { DEPARTMENTS, QueueToken, getDepartmentLabel, getStatusClass, getStatusLabel } from "@/src/lib/queue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  Zap,
} from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard },
  { title: "Queue Management", icon: Users },
  { title: "Analytics", icon: BarChart3 },
  { title: "Staff", icon: UserCog },
  { title: "Notifications", icon: Bell },
  { title: "Settings", icon: Settings },
]

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [queue, setQueue] = useState<QueueToken[]>([])
  const [currentToken, setCurrentToken] = useState("---")
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [adminDepartment, setAdminDepartment] = useState("general")
  const [notice, setNotice] = useState("")
  const [syncState, setSyncState] = useState<"online" | "offline">("online")

  const fetchLiveQueue = useCallback(async () => {
    try {
      const res = await api.get<QueueToken[]>("/queue/status")
      const tokens = res.data
      const beingServed = tokens.find(
        (token) => token.status === "called" && String(token.department) === adminDepartment
      )

      setQueue(tokens)
      setCurrentToken(beingServed ? beingServed.token_number : "---")
      setSyncState("online")
    } catch {
      setSyncState("offline")
    }
  }, [adminDepartment])

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socket.on("queueUpdated", fetchLiveQueue)

    return () => {
      socket.disconnect()
    }
  }, [fetchLiveQueue])

  useEffect(() => {
    fetchLiveQueue()
    const interval = setInterval(fetchLiveQueue, 5000)
    return () => clearInterval(interval)
  }, [fetchLiveQueue])

  const analytics = useMemo(() => {
    const waiting = queue.filter((token) => token.status === "waiting").length
    const inService = queue.filter((token) => token.status === "called").length
    const departmentCounts = DEPARTMENTS.map((department) => ({
      ...department,
      count: queue.filter((token) => token.status === "waiting" && token.department === department.value).length,
    }))
    const maxLine = Math.max(0, ...departmentCounts.map((department) => department.count))

    return {
      waiting,
      inService,
      avgWait: maxLine * 5,
      departmentCounts,
    }
  }, [queue])

  const handleCallNext = async () => {
    setLoading(true)
    setNotice("")

    try {
      const res = await api.post("/admin/next", {
        department: adminDepartment,
      })

      setNotice(`${res.data.token} called for ${getDepartmentLabel(adminDepartment)}.`)
      await fetchLiveQueue()
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      setNotice(response?.data?.message || "Unable to call the next token.")
    } finally {
      setLoading(false)
    }
  }

  const filteredQueue = queue.filter(
    (item) =>
      String(item.token_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.department || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f6f8fb] text-slate-950">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">SmartQ</span>
                <p className="text-xs font-semibold uppercase text-slate-500">Admin control</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs font-bold uppercase text-slate-500">Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={activeTab === item.title}
                        onClick={() => setActiveTab(item.title)}
                        className="h-10 rounded-lg px-3 font-semibold data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <Button variant="ghost" onClick={onLogout} className="h-10 w-full justify-start rounded-lg text-slate-600 hover:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 bg-transparent">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="rounded-lg text-slate-500" />
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">{activeTab}</h1>
                <p className="text-xs font-medium text-slate-500">{getDepartmentLabel(adminDepartment)}</p>
              </div>
            </div>
            <Badge className={syncState === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
              {syncState === "online" ? "Live connection" : "Backend offline"}
            </Badge>
          </header>

          <main className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-8">
            {activeTab === "Dashboard" && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Waiting" value={analytics.waiting} icon={Users} tone="blue" />
                  <MetricCard label="In service" value={analytics.inService} icon={CheckCircle2} tone="emerald" />
                  <MetricCard label="Est. wait" value={`${analytics.avgWait}m`} icon={Clock} tone="amber" />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <Card className="rounded-lg border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-700" />
                          Counter controller
                        </CardTitle>
                        <CardDescription>Call the next waiting token for the selected department.</CardDescription>
                      </div>
                      <Select value={adminDepartment} onValueChange={setAdminDepartment}>
                        <SelectTrigger className="h-10 w-full rounded-lg sm:w-[220px]">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {DEPARTMENTS.map((department) => (
                            <SelectItem key={department.value} value={department.value}>
                              {department.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                        <p className="text-xs font-bold uppercase text-slate-500">Currently serving</p>
                        <p className="mt-3 font-mono text-6xl font-bold tracking-tight">{currentToken}</p>
                        {notice && <p className="mt-4 text-sm font-medium text-slate-600">{notice}</p>}
                      </div>

                      <Button onClick={handleCallNext} disabled={loading} className="h-14 rounded-lg px-8 text-base font-bold">
                        {loading ? "Calling..." : "Call next"}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Department load</CardTitle>
                      <CardDescription>Waiting tokens by counter.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics.departmentCounts.map((department) => (
                        <div key={department.value} className="space-y-2">
                          <div className="flex items-center justify-between text-sm font-semibold">
                            <span>{department.shortLabel}</span>
                            <span>{department.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-700"
                              style={{ width: `${Math.max(8, Math.min(100, department.count * 18))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "Queue Management" && (
              <QueueRegistry queue={filteredQueue} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
            )}

            {activeTab === "Analytics" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-lg border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Queue mix</CardTitle>
                    <CardDescription>Current waiting distribution.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.departmentCounts.map((department) => (
                      <div key={department.value} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold">{department.label}</span>
                          <span className="font-bold text-blue-700">{department.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.max(6, department.count * 18)}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Operational notes</CardTitle>
                    <CardDescription>Snapshot generated from live queue state.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <Insight label="Longest line" value={`${analytics.avgWait / 5} people`} />
                    <Insight label="Next refresh" value="5 seconds" />
                    <Insight label="Active department" value={getDepartmentLabel(adminDepartment)} />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "Staff" && (
              <Card className="rounded-lg border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Staff directory</CardTitle>
                  <CardDescription>Counter assignments for the current shift.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operator</TableHead>
                        <TableHead>Terminal</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: "Vijay Kshirsagar", term: "Counter 01", status: "Online" },
                        { name: "Siddharth Gawari", term: "Counter 02", status: "Break" },
                        { name: "Hemant Patil", term: "Front Desk", status: "Offline" },
                      ].map((staff) => (
                        <TableRow key={staff.name}>
                          <TableCell className="font-semibold">{staff.name}</TableCell>
                          <TableCell className="text-slate-500">{staff.term}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={staff.status === "Online" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                              {staff.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === "Notifications" && (
              <Card className="max-w-2xl rounded-lg border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Notification settings</CardTitle>
                  <CardDescription>Controls for counter and customer alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NotificationRow title="Audio chime" description="Play a short sound when a token is called." checked={notifications} onCheckedChange={setNotifications} />
                  <NotificationRow title="Queue pressure alerts" description="Flag departments with more than ten waiting tokens." checked />
                  <NotificationRow title="Customer SMS" description="Reserved for a future SMS provider integration." checked={false} />
                </CardContent>
              </Card>
            )}

            {activeTab === "Settings" && (
              <div className="grid max-w-3xl gap-6">
                <Card className="rounded-lg border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-700" />
                      Terminal configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Terminal name</label>
                      <Input className="h-10 rounded-lg" defaultValue="Main Terminal" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Refresh seconds</label>
                      <Input className="h-10 rounded-lg" defaultValue="5" />
                    </div>
                    <Button className="h-10 rounded-lg font-bold sm:col-span-2">Update settings</Button>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-red-200 bg-red-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Trash2 className="h-5 w-5" />
                      Daily reset
                    </CardTitle>
                    <CardDescription className="text-red-700/70">Clears the active queue for a new operating day.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="rounded-lg font-bold">Reset daily queue</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

interface MetricCardProps {
  label: string
  value: number | string
  icon: typeof Users
  tone: "blue" | "emerald" | "amber"
}

function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone]

  return (
    <Card className="rounded-lg border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

interface QueueRegistryProps {
  queue: QueueToken[]
  searchTerm: string
  onSearchTermChange: (value: string) => void
}

function QueueRegistry({ queue, searchTerm, onSearchTermChange }: QueueRegistryProps) {
  return (
    <Card className="rounded-lg border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Queue registry</CardTitle>
          <CardDescription>Live tokens currently waiting or being served.</CardDescription>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search token, department, status"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                    No matching tokens.
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((item) => (
                  <TableRow key={`${item.id || item.token_number}-${item.status}`}>
                    <TableCell className="font-mono font-bold text-blue-700">{item.token_number}</TableCell>
                    <TableCell className="font-medium">{getDepartmentLabel(item.department)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getStatusClass(item.status)}>{getStatusLabel(item.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function NotificationRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
