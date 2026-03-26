import { Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import Main from './pages/Main'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import DashboardLayout from './components/DashboardLayout'
import ExtensionTokenBridge from './components/ExtensionTokenBridge'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import Shopping from './pages/Shopping'

import RecipeDetail from './pages/RecipeDetail'
import RecipeCreate from './pages/RecipeCreate'
import RecipeList from './pages/RecipeList'
import RecipeEdit from './pages/RecipeEdit'


export default function App() {
  return (
    <>
      <ExtensionTokenBridge />
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />


        {/* Protected routes with dashboard layout */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Main />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/new" element={<RecipeCreate />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeEdit />} />
            <Route path="/shopping" element={<Shopping />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
