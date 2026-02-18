// src/pages/ProfileEdit.tsx
import { useState, useEffect } from 'react' 
import { useNavigate } from 'react-router-dom'
import * as auth from '../authClient'



interface UserProfile {
  name: string
  email: string
  dietaryPreferences: string[]
  allergies: string | string[]
  sex?: string;
  heightCm?: number;
  weightKg?: number;
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Mock data for now - replace with API call later
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    dietaryPreferences: [],
    allergies: ''
  })

  const availablePreferences = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo'
  ]

  useEffect(() => {
    auth.getProfile()
      .then((data) => {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          dietaryPreferences: data.dietaryPreferences || [],
          allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : '',
          sex: data.sex || '',
          heightCm: data.heightCm || 0,
          weightKg: data.weightKg || 0
        })
      })
      .catch(err => console.error("Load failed:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-10 text-center">Loading...</div>



  const togglePreference = (preference: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }))
  }

  const handleSave = async () => {
    try {
      const updatedData = {
        name: profile.name,
        email: profile.email,
        dietaryPreferences: profile.dietaryPreferences,
        sex: profile.sex,
        heightCm: profile.heightCm ? parseInt(profile.heightCm.toString()) : null,
        weightKg: profile.weightKg ? parseInt(profile.weightKg.toString()) : null,
        allergies: typeof profile.allergies === 'string'
          ? profile.allergies.split(',').map(s => s.trim()).filter(Boolean)
          : profile.allergies
      }

      await auth.updateProfile(updatedData)
      console.log('Save successful!')
      navigate('/profile') 
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save profile. Is the backend running?')
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-base-content">Edit Profile</h2>
        <p className="opacity-70">Update your account details and dietary settings.</p>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-6">
          {/* Physical Metrics Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">

              Physical Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Sex</span></label>
                <select 
                  className="select select-bordered w-full bg-base-100"
                  value={profile.sex || ''}
                  onChange={(e) => setProfile({...profile, sex: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Height (cm)</span></label>
                <input 
                  type="number" 
                  placeholder="180"
                  className="input input-bordered w-full bg-base-100" 
                  value={profile.heightCm || ''}
                  onChange={(e) => setProfile({...profile, heightCm: e.target.value ? parseInt(e.target.value) : 0})}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Weight (kg)</span></label>
                <input 
                  type="number" 
                  placeholder="75"
                  className="input input-bordered w-full bg-base-100" 
                  value={profile.weightKg || ''}
                  onChange={(e) => setProfile({...profile, weightKg: e.target.value ? parseInt(e.target.value) : 0})}
                />
              </div>
            </div>
          </section>
          {/* Account Information */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Account Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Name</span>
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                    type="email"
                    value={profile.email}
                    disabled 
                    className="input input-bordered w-full bg-base-200 cursor-not-allowed opacity-70"
                  />
              </div>
            </div>
          </section>

          {/* Dietary Preferences */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Dietary Preferences</h3>

            <div className="grid sm:grid-cols-2 gap-2">
              {availablePreferences.map((pref) => {
                const isSelected = profile.dietaryPreferences.includes(pref)
                return (
                  <label
                    key={pref}
                    className="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 bg-base-200 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePreference(pref)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">{pref}</span>
                  </label>
                )
              })}
            </div>
          </section>

          {/* Allergies */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Allergies</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">List any allergies</span>
              </label>
              <input
                type="text"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="input input-bordered w-full bg-base-100"
                placeholder="e.g., Peanuts, Dairy, Shellfish"
              />
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Tip: separate with commas
                </span>
              </label>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="card-actions justify-end gap-3">
            <button onClick={handleCancel} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}