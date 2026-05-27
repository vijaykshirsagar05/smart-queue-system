"use client"

import { useEffect, useState } from "react"
import api from "@/src/lib/api"
import { QueueToken, getDepartmentLabel, getStatusClass, getStatusLabel } from "@/src/lib/queue"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function QueueTable() {
  const [tokens, setTokens] = useState<QueueToken[]>([])

  const fetchTokens = async () => {
    try {
      const res = await api.get<QueueToken[]>("/queue/status")
      setTokens(res.data)
    } catch (err) {
      console.error("Fetch error:", err)
    }
  }

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={`${token.id || token.token_number}-${token.status}`}>
              <TableCell className="font-mono font-bold text-blue-700">{token.token_number}</TableCell>
              <TableCell>{getDepartmentLabel(token.department)}</TableCell>
              <TableCell className="text-right">
                <Badge className={getStatusClass(token.status)}>{getStatusLabel(token.status)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
