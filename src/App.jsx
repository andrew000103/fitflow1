import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import CommunityLauncherPage from './pages/CommunityLauncherPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import ExerciseDatabasePage from './pages/ExerciseDatabasePage.jsx'
import HistoryLauncherPage from './pages/HistoryLauncherPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NutritionLauncherPage from './pages/NutritionLauncherPage.jsx'
import TrainPage from './pages/TrainPage.jsx'
import TrainProgramDetailPage from './pages/TrainProgramDetailPage.jsx'
import TrainProgramBuilderPage from './pages/TrainProgramBuilderPage.jsx'
import TrainTemplatesPage from './pages/TrainTemplatesPage.jsx'
import TrainWorkoutPage from './pages/TrainWorkoutPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import AnalyticsLauncherPage from './pages/AnalyticsLauncherPage.jsx'
import AnalyticsPerformancePage from './pages/AnalyticsPerformancePage.jsx'
import AnalyticsRecoveryPage from './pages/AnalyticsRecoveryPage.jsx'
import NutritionHubPage from './pages/NutritionHubPage.jsx'
import ProfileLauncherPage from './pages/ProfileLauncherPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/train" replace />} />
        <Route path="/community" element={<CommunityLauncherPage />} />
        <Route path="/community/feed" element={<CommunityPage />} />
        <Route path="/history" element={<HistoryLauncherPage />} />
        <Route path="/history/calendar" element={<HistoryPage />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/train/program/:programId" element={<TrainProgramDetailPage />} />
        <Route path="/train/templates" element={<TrainTemplatesPage />} />
        <Route path="/train/create-program" element={<TrainProgramBuilderPage />} />
        <Route path="/train/workout" element={<TrainWorkoutPage />} />
        <Route path="/train/exercises" element={<ExerciseDatabasePage />} />
        <Route path="/nutrition" element={<NutritionLauncherPage />} />
        <Route path="/nutrition/diary" element={<NutritionHubPage entry="nutrition" />} />
        <Route path="/analytics" element={<AnalyticsLauncherPage />} />
        <Route path="/analytics/overview" element={<AnalyticsPage />} />
        <Route path="/analytics/performance" element={<AnalyticsPerformancePage />} />
        <Route path="/analytics/recovery" element={<AnalyticsRecoveryPage />} />
        <Route path="/analytics/nutrition" element={<NutritionHubPage entry="analytics" />} />
        <Route path="/profile" element={<ProfileLauncherPage />} />
        <Route path="/profile/me" element={<ProfilePage />} />
        <Route path="/profile/nutrition" element={<NutritionHubPage entry="profile" />} />
        <Route path="*" element={<Navigate to="/train" replace />} />
      </Route>
    </Routes>
  )
}

export default App
