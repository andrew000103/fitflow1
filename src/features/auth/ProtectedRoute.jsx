import { Navigate, useLocation } from 'react-router-dom'
import BrandLoader from '../../components/BrandLoader.jsx'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ children }) {
  const { loading, isLoggedIn } = useAuth()
  const location = useLocation()

  if (loading) {
    return <BrandLoader />
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return children
}
