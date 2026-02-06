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
    <div className="p-8">
      <div className="max-w-2xl border border-gray-300 rounded p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Profile</h2>

        {/* Account Information */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Account Information</h3>
          <div className="space-y-2">
            <p className="text-gray-900"><strong>Name:</strong> {profile.name}</p>
            <p className="text-gray-900"><strong>Email:</strong> {profile.email}</p>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Dietary Preferences</h3>
          <p className="text-gray-900">{profile.dietaryPreferences.join(', ')}</p>
        </div>

        {/* Allergies */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900">Allergies</h3>
          <p className="text-gray-900">{profile.allergies.join(', ')}</p>
        </div>

        {/* Edit Button */}
        <button 
          onClick={() => navigate('/profile/edit')}
          className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-50 text-gray-900"
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}