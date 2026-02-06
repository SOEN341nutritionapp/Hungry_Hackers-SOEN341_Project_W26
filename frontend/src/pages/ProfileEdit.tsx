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
    <div className="p-8">
      <div className="max-w-2xl border border-gray-300 rounded p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Profile</h2>

        {/* Account Information */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Account Information</h3>
          
          <div className="mb-4">
            <label className="block mb-1 text-gray-900 font-medium">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="border border-gray-300 px-3 py-2 w-full rounded text-gray-900"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-gray-900 font-medium">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="border border-gray-300 px-3 py-2 w-full rounded text-gray-900"
            />
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Dietary Preferences</h3>
          <div className="space-y-2">
            {availablePreferences.map((pref) => {
              const isSelected = profile.dietaryPreferences.includes(pref)
              return (
                <label key={pref} className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePreference(pref)}
                    className="mr-2"
                  />
                  {pref}
                </label>
              )
            })}
          </div>
        </div>

        {/* Allergies */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Allergies</h3>
          <input
            type="text"
            value={profile.allergies}
            onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
            className="border border-gray-300 px-3 py-2 w-full rounded text-gray-900"
            placeholder="e.g., Peanuts, Dairy, Shellfish"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-50 text-gray-900"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-50 text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}