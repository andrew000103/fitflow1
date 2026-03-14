import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import CommunityLauncherPage from './pages/CommunityLauncherPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import ExerciseDatabasePage from './pages/ExerciseDatabasePage.jsx'
import HistoryLauncherPage from './pages/HistoryLauncherPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import { TrainPage } from './features/workout/index.js'
import NutritionLauncherPage from './pages/NutritionLauncherPage.jsx'
import TrainProgramDetailPage from './pages/TrainProgramDetailPage.jsx'
import TrainProgramBuilderPage from './pages/TrainProgramBuilderPage.jsx'
import TrainTemplatesPage from './pages/TrainTemplatesPage.jsx'
import TrainWorkoutPage from './pages/TrainWorkoutPage.jsx'
import NutritionHubPage from './pages/NutritionHubPage.jsx'
import ProfileLauncherPage from './pages/ProfileLauncherPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ShopPage from './pages/ShopPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/train" replace />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/train/history" element={<HistoryPage />} />
        <Route path="/train/insights" element={<HistoryLauncherPage />} />
        <Route path="/train/program/:programId" element={<TrainProgramDetailPage />} />
        <Route path="/train/templates" element={<TrainTemplatesPage />} />
        <Route path="/train/create-program" element={<TrainProgramBuilderPage />} />
        <Route path="/train/workout" element={<TrainWorkoutPage />} />
        <Route path="/train/exercises" element={<ExerciseDatabasePage />} />
        <Route path="/nutrition" element={<NutritionLauncherPage />} />
        <Route path="/nutrition/diary" element={<NutritionHubPage entry="nutrition" />} />
        <Route path="/connect" element={<CommunityLauncherPage />} />
        <Route path="/connect/feed" element={<CommunityPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/profile" element={<ProfileLauncherPage />} />
        <Route path="/profile/me" element={<ProfilePage />} />
        <Route path="/profile/nutrition" element={<NutritionHubPage entry="profile" />} />
        <Route path="/community" element={<Navigate to="/connect" replace />} />
        <Route path="/community/feed" element={<Navigate to="/connect/feed" replace />} />
        <Route path="/history" element={<Navigate to="/train/insights" replace />} />
        <Route path="/history/calendar" element={<Navigate to="/train/history" replace />} />
        <Route path="/analytics" element={<Navigate to="/train/insights" replace />} />
        <Route path="/analytics/overview" element={<Navigate to="/train/insights" replace />} />
        <Route path="/analytics/performance" element={<Navigate to="/train/insights" replace />} />
        <Route path="/analytics/recovery" element={<Navigate to="/train/insights" replace />} />
        <Route path="/analytics/nutrition" element={<Navigate to="/profile/nutrition" replace />} />
        <Route path="*" element={<Navigate to="/train" replace />} />
      </Route>
    </Routes>
  )
}

export default App
