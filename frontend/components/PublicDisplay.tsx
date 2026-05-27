"use client"

import { useEffect, useState } from "react"
import api from "@/src/lib/api"
import { QueueToken, getDepartmentLabel } from "@/src/lib/queue"

export default function PublicDisplay() {
  const [tokens, setTokens] = useState<QueueToken[]>([])
  const [time, setTime] = useState("")

  const fetchData = async () => {
    try {
      const res = await api.get<QueueToken[]>("/queue/status")
      const called = res.data.filter((token) => token.status === "called").slice(0, 5)
      setTokens(called)
    } catch (err) {
      console.error("Display fetch error:", err)
    }
  }

  useEffect(() => {
    fetchData()
    const queueInterval = setInterval(fetchData, 3000)
    const clockInterval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)

    setTime(new Date().toLocaleTimeString())

    return () => {
      clearInterval(queueInterval)
      clearInterval(clockInterval)
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Now Serving</h1>
          <p className="mt-2 text-sm font-semibold uppercase text-slate-400">SmartQ live display</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-right">
          <p className="text-xs font-bold uppercase text-slate-400">Current time</p>
          <p className="mt-1 font-mono text-2xl">{time}</p>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-8">
          <p className="mb-4 inline-flex rounded-md bg-blue-500 px-3 py-1 text-sm font-bold uppercase">Main call</p>
          <p className="font-mono text-[12rem] font-bold leading-none tracking-tight">
            {tokens[0]?.token_number || "---"}
          </p>
          <p className="mt-6 text-3xl font-semibold text-slate-300">
            {tokens[0] ? getDepartmentLabel(tokens[0].department) : "Waiting for the next token"}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-bold uppercase text-slate-400">Recent calls</p>
          {tokens.slice(1, 5).map((token, index) => (
            <div key={`${token.id || token.token_number}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-5">
              <div>
                <p className="font-mono text-4xl font-bold">{token.token_number}</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">{getDepartmentLabel(token.department)}</p>
              </div>
              <p className="rounded-md bg-white/10 px-3 py-2 text-sm font-bold">Counter {(token.id ? token.id % 5 : index) + 1}</p>
            </div>
          ))}

          {tokens.length <= 1 && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 text-slate-500">
              No recent calls yet.
            </div>
          )}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 w-full border-t border-white/10 bg-slate-900 px-8 py-4">
        <p className="text-center text-lg font-semibold text-slate-200">
          Please watch the display and proceed only when your token is called.
        </p>
      </footer>
    </main>
  )
}
