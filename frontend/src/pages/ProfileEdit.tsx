// src/pages/ProfileEdit.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface UserProfile {
  name: string
  email: string
  dietaryPreferences: string[]
  allergies: string
}

export default function ProfileEdit() {
  const navigate = useNavigate()

  // Mock data for now - replace with API call later
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john@email.com',
    dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
    allergies: 'Peanuts, Dairy'
  })

  const availablePreferences = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo'
  ]

  const togglePreference = (preference: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }))
  }

  const handleSave = () => {
    // TODO: Call API to save profile
    console.log('Saving profile:', profile)
    navigate('/profile')
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
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="input input-bordered w-full bg-base-100"
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