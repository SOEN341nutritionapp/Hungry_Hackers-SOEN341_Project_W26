import { useAuth } from '../AuthContext'

export default function Main() {
  const { logout } = useAuth()

  return (
    <div>
      <h1>Main (Protected)</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
