import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'


export default function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }

    try {
      const fullName = `${firstName} ${lastName}`
      await register(email, password, fullName)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Section */}
      <div className="hidden md:flex md:w-1/2 relative">
        <img 
          src="/bp.jpg?v=2" 
          alt="Healthy Food" 
          className="w-full h-full object-cover"
        />
        {/* Teal Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/40 via-teal-600/50 to-teal-900/80"></div>
        
        {/* Logo */}
        <div className="absolute top-6 left-6">
          <span className="text-white text-xl font-semibold">MealMajor</span>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <h2 className="text-5xl font-bold mb-4 leading-tight">
            Start your healthy<br />journey today.
          </h2>
          <p className="text-white/80 font-normal">
            Plan your meals, organize your grocery list, and eat better with our smart kitchen companion.
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-8 md:px-16">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-600 text-sm mb-8 font-normal">
            Sign up to start planning your meals.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">First Name</label>
                <input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="John" 
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-2 text-sm">Last Name</label>
                <input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Doe" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">Email Address</label>
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                type="email" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="name@company.com" 
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">Password</label>
              <div className="relative">
                <input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                  placeholder="••••••••" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.243 4.243l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">Confirm Password</label>
              <div className="relative">
                <input 
                  value={passwordConfirm} 
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                  placeholder="••••••••" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.243 4.243l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition text-sm"
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-400 text-sm font-normal">Or continue with</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-slate-700 text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-slate-700 text-sm font-medium">Apple</span>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-slate-600 text-sm font-normal">
            Already have an account? 
            <button 
              type="button" 
              onClick={() => navigate('/signin')}
              className="text-green-500 hover:text-green-600 font-semibold ml-1"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-12 font-normal">
          © 2024 MealMajor Planning Inc. All rights reserved.
        </div>
      </div>
    </div>
  )
}
