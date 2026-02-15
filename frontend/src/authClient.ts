import { apiPost, apiGet, apiPatch } from './api'

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
 
  const data = await apiPost<{ accessToken: string; user: any }>('/auth/login', {
    email,
    password,
  })
  setAccessToken(data.accessToken)
  

  return data 
}

export async function refresh() {
 
  const data = await apiPost<{ accessToken: string; user: any }>('/auth/refresh', {})
  setAccessToken(data.accessToken)
  return data
}

export async function logout() {
  await apiPost('/auth/logout', {})
  setAccessToken(null)
}




export async function getProfile() {
  return apiGet<any>('/auth/profile', accessToken || undefined)
}


export async function updateProfile(updates: any) {
  return apiPatch<any>('/auth/profile', updates, accessToken || undefined)
}