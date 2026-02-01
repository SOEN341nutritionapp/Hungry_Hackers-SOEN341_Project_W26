import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(email, password, name)
      navigate('/signin')
    } catch (err: any) {
      setError(err.message || 'Sign up failed')
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>Sign Up</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
      />
      <button type="submit">Sign Up</button>
      {error && <p>{error}</p>}
    </form>
  )
}
