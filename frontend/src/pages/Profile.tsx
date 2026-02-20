import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import * as auth from '../authClient'

interface UserProfile {
  name: string
  email: string
  dietaryPreferences: string[]
  allergies: string[]
  sex?: string
  heightCm?: number
  weightKg?: number
}

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth.getProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  const displayName = profile?.name || user?.name || 'User'
  const displayEmail = profile?.email || user?.email || 'No email found'

  return (
    <div className="max-w-3xl animate-fadeIn">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-base-content">Profile</h2>
          <p className="opacity-70">Your account and dietary info.</p>
        </div>
        <button 
          onClick={() => navigate('/profile/edit')}
          className="btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Profile
        </button>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-8">
          
          {/* Physical Metrics Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Physical Metrics
            </h3>
            <div className="grid grid-cols-3 gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300">
              <div className="text-center">
                <p className="text-xs uppercase opacity-50 font-bold">Sex</p>
                <p className="text-lg font-medium">{profile?.sex || '—'}</p>
              </div>
              <div className="text-center border-x border-base-300">
                <p className="text-xs uppercase opacity-50 font-bold">Height</p>
                <p className="text-lg font-medium">{profile?.heightCm ? `${profile.heightCm} cm` : '—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase opacity-50 font-bold">Weight</p>
                <p className="text-lg font-medium">{profile?.weightKg ? `${profile.weightKg} kg` : '—'}</p>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Account Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-base-200/30 p-3 rounded-lg border border-base-300">
                <p className="text-xs opacity-60 font-medium">Full Name</p>
                <p className="text-base font-semibold">{displayName}</p>
              </div>
              <div className="bg-base-200/30 p-3 rounded-lg border border-base-300">
                <p className="text-xs opacity-60 font-medium">Email Address</p>
                <p className="text-base font-semibold">{displayEmail}</p>
              </div>
            </div>
          </section>

          {/* Dietary Preferences */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.dietaryPreferences?.length ? (
                profile.dietaryPreferences.map(pref => (
                  <span key={pref} className="badge badge-primary badge-outline py-3 px-4 rounded-full font-medium">
                    {pref}
                  </span>
                ))
              ) : (
                <p className="text-sm opacity-50 italic">No preferences set</p>
              )}
            </div>
          </section>

          {/* Allergies */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.allergies?.length ? (
                profile.allergies.map(allergy => (
                  <span 
                    key={allergy} 
                    className="badge py-3 px-4 rounded-full font-medium border-2 bg-transparent"
                    style={{ borderColor: '#e79260', color: '#e79260' }}
                  >
                    {allergy}
                  </span>
                ))
              ) : (
                <p className="text-sm opacity-50 italic">No allergies listed</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}