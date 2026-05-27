export const DEPARTMENTS = [
  { value: "general", label: "General Consultation", shortLabel: "General", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "billing", label: "Billing & Payments", shortLabel: "Billing", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { value: "emergency", label: "Emergency Services", shortLabel: "Emergency", color: "bg-red-50 text-red-700 border-red-100" },
  { value: "lab", label: "Laboratory / Testing", shortLabel: "Lab", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
] as const

export type DepartmentValue = (typeof DEPARTMENTS)[number]["value"]

export interface QueueToken {
  id?: number
  token_number: string
  department: DepartmentValue | string
  status: "waiting" | "called" | "completed" | "skipped" | string
  created_at?: string
}

export const getDepartment = (value?: string) => {
  return DEPARTMENTS.find((department) => department.value === value)
}

export const getDepartmentLabel = (value?: string) => {
  return getDepartment(value)?.label || value || "Not selected"
}

export const getDepartmentShortLabel = (value?: string) => {
  return getDepartment(value)?.shortLabel || value || "N/A"
}

export const getStatusLabel = (status?: string) => {
  if (!status) return "Unknown"
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const getStatusClass = (status?: string) => {
  switch (status) {
    case "called":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "waiting":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "skipped":
      return "border-slate-200 bg-slate-50 text-slate-600"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}
