import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAuth() {
  const { accessToken, loading } = useAuth()
  if (loading) {
    return <div>Loading...</div>
  }
  if (!accessToken) {
    return <Navigate to="/signin" replace />
  }
  return <Outlet />
}
