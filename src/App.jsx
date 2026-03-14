import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import ExerciseDatabasePage from './pages/ExerciseDatabasePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import TrainPage from './pages/TrainPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import NutritionHubPage from './pages/NutritionHubPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/train" replace />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/train/exercises" element={<ExerciseDatabasePage />} />
        <Route path="/nutrition" element={<NutritionHubPage entry="nutrition" />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/analytics/nutrition" element={<NutritionHubPage entry="analytics" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/nutrition" element={<NutritionHubPage entry="profile" />} />
        <Route path="*" element={<Navigate to="/train" replace />} />
      </Route>
    </Routes>
  )
}

export default App
