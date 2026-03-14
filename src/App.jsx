import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import ExerciseDatabasePage from './pages/ExerciseDatabasePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import { TrainPage } from './features/workout/index.js'
import NutritionLauncherPage from './pages/NutritionLauncherPage.jsx'
import TrainProgramDetailPage from './pages/TrainProgramDetailPage.jsx'
import TrainProgramBuilderPage from './pages/TrainProgramBuilderPage.jsx'
import TrainTemplatesPage from './pages/TrainTemplatesPage.jsx'
import TrainWorkoutPage from './pages/TrainWorkoutPage.jsx'
import NutritionHubPage from './pages/NutritionHubPage.jsx'
import AddFoodPage from './pages/AddFoodPage.jsx'
import FoodDetailPage from './pages/FoodDetailPage.jsx'
import CustomFoodPage from './pages/CustomFoodPage.jsx'
import ProfileLauncherPage from './pages/ProfileLauncherPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ShopPage from './pages/ShopPage.jsx'
import InsightsPage from './features/workout/pages/InsightsPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/train" replace />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/train/insights" element={<InsightsPage />} />
        <Route path="/train/history" element={<HistoryPage />} />
        <Route path="/train/program/:programId" element={<TrainProgramDetailPage />} />
        <Route path="/train/programs" element={<TrainTemplatesPage />} />
        <Route path="/train/templates" element={<Navigate to="/train/programs" replace />} />
        <Route path="/train/create-program" element={<TrainProgramBuilderPage />} />
        <Route path="/train/workout" element={<TrainWorkoutPage />} />
        <Route path="/train/exercises" element={<ExerciseDatabasePage />} />
        <Route path="/nutrition" element={<NutritionLauncherPage />} />
        <Route path="/nutrition/diary" element={<NutritionHubPage entry="nutrition" />} />
        <Route path="/nutrition/add-food" element={<AddFoodPage />} />
        <Route path="/nutrition/add-food/*" element={<AddFoodPage />} />
        <Route path="/nutrition/diary/add-food" element={<AddFoodPage />} />
        <Route path="/nutrition/food/:foodId" element={<FoodDetailPage />} />
        <Route path="/nutrition/custom-food" element={<CustomFoodPage />} />
        <Route path="/connect" element={<CommunityPage />} />
        <Route path="/connect/feed" element={<Navigate to="/connect" replace />} />
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
