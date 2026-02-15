import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import * as auth from '../authClient'

interface UserProfile {
  name: string
  email: string
  dietaryPreferences: string[]
  allergies: string[]
}

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth() // Get the initial user from context
  
  // 1. Start with null or initial context data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 2. Call the GET API
    auth.getProfile()
      .then((data) => {
        setProfile(data)
      })
      .catch((err) => {
        console.error("Failed to load profile:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 3. Show a loading state while fetching
  if (loading) {
    return <div className="p-8 text-gray-900">Loading your profile...</div>
  }

  // 4. Fallback to AuthContext if the profile fetch fails
  const displayName = profile?.name || user?.name || 'User'
  const displayEmail = profile?.email || user?.email || 'No email found'

  return (
    <div className="p-8">
      <div className="max-w-2xl border border-gray-300 rounded p-6 bg-white">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Profile</h2>

        {/* Account Information */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900 border-b pb-1">Account Information</h3>
          <div className="space-y-2">
            <p className="text-gray-900"><strong>Name:</strong> {displayName}</p>
            <p className="text-gray-900"><strong>Email:</strong> {displayEmail}</p>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900 border-b pb-1">Dietary Preferences</h3>
          <p className="text-gray-900">
            {profile?.dietaryPreferences?.length 
              ? profile.dietaryPreferences.join(', ') 
              : 'None set'}
          </p>
        </div>

        {/* Allergies */}
        <div className="mb-5">
          <h3 className="font-semibold mb-3 text-gray-900 border-b pb-1">Allergies</h3>
          <p className="text-gray-900">
            {profile?.allergies?.length 
              ? profile.allergies.join(', ') 
              : 'None set'}
          </p>
        </div>

        {/* Edit Button */}
        <button 
          onClick={() => navigate('/profile/edit')}
          className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-50 text-gray-900 font-medium"
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}