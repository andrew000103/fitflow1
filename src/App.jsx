import AuthProvider from './features/auth/AuthProvider'
import AuthPage from './features/auth/AuthPage'
import ProtectedRoute from './features/auth/ProtectedRoute'
import OnboardingGate from './features/auth/OnboardingGate'
import LanguageProvider from './features/language/LanguageProvider.jsx'
import { supabaseConfigError } from './lib/supabase.js'

import './App.css'
import './styles/language.css'
import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardLayout from './components/DashboardLayout.jsx'

import CommunityPage from './pages/CommunityPage.jsx'
import ExerciseDatabasePage from './pages/ExerciseDatabasePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

import { TrainPage } from './features/workout/index.js'
import InsightsPage from './features/workout/pages/InsightsPage.jsx'

import NutritionLauncherPage from './pages/NutritionLauncherPage.jsx'
import NutritionHubPage from './pages/NutritionHubPage.jsx'
import AddFoodPage from './pages/AddFoodPage.jsx'
import FoodDetailPage from './pages/FoodDetailPage.jsx'
import CustomFoodPage from './pages/CustomFoodPage.jsx'

import TrainProgramDetailPage from './pages/TrainProgramDetailPage.jsx'
import TrainProgramBuilderPage from './pages/TrainProgramBuilderPage.jsx'
import TrainTemplatesPage from './pages/TrainTemplatesPage.jsx'
import TrainWorkoutPage from './pages/TrainWorkoutPage.jsx'

import ProfileLauncherPage from './pages/ProfileLauncherPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProfileEditPage from './pages/ProfileEditPage.jsx'

import ShopPage from './pages/ShopPage.jsx'

import OnboardingPage from './pages/OnboardingPage'

function App() {
  if (supabaseConfigError) {
    return (
      <div
        style={{
          minHeight: '100svh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background:
            'radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 30%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 26%), #f6fbff',
        }}
      >
        <div
          style={{
            width: 'min(100%, 560px)',
            display: 'grid',
            gap: '12px',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid rgba(37, 99, 235, 0.12)',
            background: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 18px 40px rgba(37, 99, 235, 0.08)',
            color: '#14263d',
          }}
        >
          <span style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: 700 }}>FitFlow Setup</span>
          <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.05 }}>앱 설정이 아직 연결되지 않았어요</h1>
          <p style={{ margin: 0, color: '#60738a', lineHeight: 1.6 }}>
            배포 환경에서 Supabase 환경변수가 빠져 있어서 앱이 시작되지 못하고 있습니다.
          </p>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontFamily: 'monospace',
              fontSize: '0.88rem',
            }}
          >
            {supabaseConfigError}
          </div>
          <p style={{ margin: 0, color: '#60738a', lineHeight: 1.6 }}>
            Cloudflare Pages에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 추가한 뒤 다시 배포하면 정상적으로 열립니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>

          {/* 로그인 페이지 */}
          <Route path="/auth" element={<AuthPage />} />

          {/* 온보딩 페이지 */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* 보호된 앱 영역 */}
          <Route
            element={
              <ProtectedRoute>
                <OnboardingGate>
                  <DashboardLayout />
                </OnboardingGate>
              </ProtectedRoute>
            }
          >

            <Route index element={<Navigate to="/train" replace />} />

            {/* TRAIN */}
            <Route path="/train" element={<TrainPage />} />
            <Route path="/train/insights" element={<InsightsPage />} />
            <Route path="/train/history" element={<HistoryPage />} />
            <Route path="/train/program/:programId" element={<TrainProgramDetailPage />} />
            <Route path="/train/programs" element={<TrainTemplatesPage />} />
            <Route path="/train/templates" element={<Navigate to="/train/programs" replace />} />
            <Route path="/train/create-program" element={<TrainProgramBuilderPage />} />
            <Route path="/train/workout" element={<TrainWorkoutPage />} />
            <Route path="/train/exercises" element={<ExerciseDatabasePage />} />

            {/* NUTRITION */}
            <Route path="/nutrition" element={<NutritionLauncherPage />} />
            <Route path="/nutrition/diary" element={<NutritionHubPage entry="nutrition" />} />
            <Route path="/nutrition/add-food" element={<AddFoodPage />} />
            <Route path="/nutrition/add-food/*" element={<AddFoodPage />} />
            <Route path="/nutrition/diary/add-food" element={<AddFoodPage />} />
            <Route path="/nutrition/food/:foodId" element={<FoodDetailPage />} />
            <Route path="/nutrition/custom-food" element={<CustomFoodPage />} />

            {/* COMMUNITY */}
            <Route path="/connect" element={<CommunityPage />} />
            <Route path="/connect/feed" element={<Navigate to="/connect" replace />} />

            {/* SHOP */}
            <Route path="/shop" element={<ShopPage />} />

            {/* PROFILE */}
            <Route path="/profile" element={<ProfileLauncherPage />} />
            <Route path="/profile/me" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/nutrition" element={<NutritionHubPage entry="profile" />} />

            {/* REDIRECTS */}
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
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
