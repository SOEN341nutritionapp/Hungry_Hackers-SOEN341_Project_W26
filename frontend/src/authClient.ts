import { apiPost } from './api'

let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

function setAccessToken(token: string | null) {
  accessToken = token
}

export async function register(email: string, password: string, name: string) {
  return apiPost('/auth/register', { email, password, name })
}

export async function login(email: string, password: string) {
  const data = await apiPost<{ accessToken: string }>('/auth/login', {
    email,
    password,
  })
  setAccessToken(data.accessToken)
  return data.accessToken
}

export async function refresh() {
  const data = await apiPost<{ accessToken: string }>('/auth/refresh', {})
  setAccessToken(data.accessToken)
  return data.accessToken
}

export async function logout() {
  await apiPost('/auth/logout', {})
  setAccessToken(null)
}
