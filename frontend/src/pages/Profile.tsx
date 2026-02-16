import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface UserProfile {
  name: string
  email: string
  dietaryPreferences: string[]
  allergies: string[]
}

export default function Profile() {
  const navigate = useNavigate()
  
  // Mock data for now - replace with API call later
  const [profile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john@email.com',
    dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
    allergies: ['Peanuts', 'Dairy']
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-base-content">Profile</h2>
        <p className="opacity-70">Your account and dietary info.</p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-6">
          {/* Account */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Account Information</h3>
              <span className="badge badge-secondary badge-outline">Student</span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-box border border-base-300 bg-base-200 p-4">
                <div className="text-sm opacity-70">Name</div>
                <div className="font-semibold">{profile.name}</div>
              </div>
              <div className="rounded-box border border-base-300 bg-base-200 p-4">
                <div className="text-sm opacity-70">Email</div>
                <div className="font-semibold">{profile.email}</div>
              </div>
            </div>
          </section>

          {/* Dietary preferences */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {profile.dietaryPreferences.map((p) => (
                <span key={p} className="badge badge-accent badge-outline">
                  {p}
                </span>
              ))}
              {profile.dietaryPreferences.length === 0 && (
                <span className="opacity-70">None selected</span>
              )}
            </div>
          </section>

          {/* Allergies */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a) => (
                <span key={a} className="badge badge-warning badge-outline">
                  {a}
                </span>
              ))}
              {profile.allergies.length === 0 && (
                <span className="opacity-70">No known allergies</span>
              )}
            </div>
          </section>

          <div className="card-actions justify-end">
            <button onClick={() => navigate('/profile/edit')} className="btn btn-primary">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}