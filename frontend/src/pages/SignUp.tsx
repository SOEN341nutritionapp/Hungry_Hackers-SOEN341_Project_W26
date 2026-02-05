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

     <div className="hero frontpage-bg min-h-screen">
      <div className="hero-content flex-col lg:flex-row">

        <div className="card bg-base-100/90 backdrop-blur-sm w-full max-w-sm shrink-0 shadow-2xl rounded-3xl">
  
          <form className="card-body" onSubmit={onSubmit}>
            <fieldset className="fieldset">

              <label className="label text-small font-bold">Name</label>
              <input 
              value = {name} onChange={(e) => setName(e.target.value)}
              type="name" className="input rounded-xl" placeholder="Name" />

              <label className="label text-small font-bold">Email</label>
              <input 
              value = {email} onChange={(e) => setEmail(e.target.value)}
              type="email" className="input rounded-xl" placeholder="Email" />


              <label className="label text-small font-bold">Password</label>
              <input 
              value = {password} onChange ={(e) => setPassword(e.target.value)}
              type="password" className="input rounded-xl" placeholder="Password" />


              <button className="btn bg-[#74b9ff] hover:bg-[#9cd33b] text-white border-none rounded-full mt-6 text-medium font-bold shadow-md ">Sign Up</button>

              <p className="py-6 text-center text-small">
                Already have an account? 
                <button 
                type = "button" onClick={() => navigate('/SignIn')}
                className="underline cursor-pointer ml-1">Sign in now</button>
              </p>

              {error && <p>{error}</p>}
            </fieldset>
          </form>

        </div>
      </div>
    </div>
  )
}
