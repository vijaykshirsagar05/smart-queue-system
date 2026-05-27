import axios from "axios"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "")

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
})

export default api
