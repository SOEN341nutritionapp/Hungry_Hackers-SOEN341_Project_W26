import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'


export default function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  return (

    <div className="hero frontpage-bg min-h-screen">
      <div className="hero-content flex-col lg:flex-row">
        <div className="text-center lg:text-left">
          <h1 className="text-large ">MealMajor</h1>
          <p className="py-6 text-medium">
            Helping students plan out their meals, one major at a time
          </p>
        </div>
        <div className="card bg-base-100/90 backdrop-blur-sm w-full max-w-sm shrink-0 shadow-2xl rounded-3xl">
  
          <form className="card-body" onSubmit={onSubmit}>
            <fieldset className="fieldset">

              <label className="label text-small font-bold">Email</label>
              <input 
              value = {email} onChange={(e) => setEmail(e.target.value)}
              type="email" className="input rounded-xl" placeholder="Email" />


              <label className="label text-small font-bold">Password</label>
              <input 
              value = {password} onChange ={(e) => setPassword(e.target.value)}
              type="password" className="input rounded-xl" placeholder="Password" />


              <button className="btn bg-[#74b9ff] hover:bg-[#9cd33b] text-white border-none rounded-full mt-6 text-medium font-bold shadow-md">Sign In</button>

              <p className="py-6 text-center text-small">
                New to MealMajor? 
                <button 
                type = "button" onClick={() => navigate('/SignUp')}
                className="underline cursor-pointer ml-1">Sign Up</button>
              </p>

              {error && <p>{error}</p>}
            </fieldset>
          </form>

        </div>
      </div>
    </div>
  )
}
