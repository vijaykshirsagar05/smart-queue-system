"use client"

import { useState } from "react"
import { AuthView } from "@/components/auth-view"
import { UserDashboard } from "@/components/user-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

type View = "auth" | "user" | "admin"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("auth")

  const handleLogin = () => {
    setCurrentView("user")
  }

  const handleAdminLogin = () => {
    setCurrentView("admin")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("userId")
    localStorage.removeItem("token")
    localStorage.removeItem("activeToken")
    localStorage.removeItem("activeDept")
    setCurrentView("auth")
  }

  return (
    <>
      {currentView === "auth" && <AuthView onLogin={handleLogin} onAdminLogin={handleAdminLogin} />}
      {currentView === "user" && <UserDashboard onLogout={handleLogout} />}
      {currentView === "admin" && <AdminDashboard onLogout={handleLogout} />}
    </>
  )
}
