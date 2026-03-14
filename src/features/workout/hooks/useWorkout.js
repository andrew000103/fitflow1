import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

function useWorkout() {
  const context = useOutletContext()

  // Keep the current data source the same for now, but expose a narrower
  // workout-focused interface so we can swap this for a dedicated store later.
  return useMemo(
    () => ({
      appLanguage: context.appLanguage,
      activeWorkout: context.activeWorkout,
      activeProgram: context.activeProgram,
      currentProgram: context.currentProgram,
      currentProgramDay: context.currentProgramDay,
      lastWorkoutSummary: context.lastWorkoutSummary,
      streakDays: context.streakDays,
      startWorkout: context.startWorkout,
    }),
    [
      context.activeWorkout,
      context.appLanguage,
      context.activeProgram,
      context.currentProgram,
      context.currentProgramDay,
      context.lastWorkoutSummary,
      context.streakDays,
      context.startWorkout,
    ],
  )
}

export default useWorkout
