import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Main() {
  const { logout } = useAuth()

  return (
    <div>
      <h1>Main (Protected)</h1>

      <Link to="/profile">
        <button>Go to Profile</button>
      </Link>

      <br /><br />

      <button onClick={logout}>Logout</button>
    </div>
  )
}
