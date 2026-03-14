import { getMuscleColor } from '../../utils/muscleFatigue.js'

function BodyMapBack({ scores }) {
  return (
    <svg
      viewBox="0 0 260 520"
      preserveAspectRatio="xMidYMid meet"
      className="bodymap-svg"
      role="img"
      aria-label="Back body map"
    >
      <g className="bodymap-layer">
        <path
          className="bodymap-outline"
          d="M130 20c22 0 36 18 36 41 0 16-7 29-19 37v21c21 4 42 16 56 33 13 17 21 39 21 61 0 13-2 24-7 34-7 15-18 25-27 36-10 13-13 35-14 63l-2 64c0 8-5 13-13 13h-15c-7 0-12-5-12-12v-88c0-9-1-16-4-21h-7c-3 5-4 12-4 21v88c0 7-5 12-12 12H99c-8 0-13-5-13-13l-2-64c-1-28-4-50-14-63-9-11-20-21-27-36-5-10-7-21-7-34 0-22 8-44 21-61 14-17 35-29 56-33V98c-12-8-19-21-19-37 0-23 14-41 36-41Z"
        />
        <path
          className="bodymap-outline"
          d="M101 310c-14 13-22 34-24 64l-2 88c0 8-6 15-14 15H46c-7 0-11-5-11-11l6-107c2-37 16-67 42-92l18 43Zm58 0 18-43c26 25 40 55 42 92l6 107c0 6-4 11-11 11h-15c-8 0-14-7-14-15l-2-88c-2-30-10-51-24-64Z"
        />

        <g className="bodymap-muscles">
          <path
            d="M92 88c10-8 23-12 38-12s28 4 38 12l3 31c-5 18-19 29-41 34-22-5-36-16-41-34l3-31Z"
            fill={getMuscleColor(scores.upperBack)}
          />
          <path
            d="M71 104c10-8 20-12 31-12l2 18c-2 9-8 17-19 23-11-3-17-12-20-29Z"
            fill={getMuscleColor(scores.rearDelts)}
          />
          <path
            d="M189 104c-10-8-20-12-31-12l-2 18c2 9 8 17 19 23 11-3 17-12 20-29Z"
            fill={getMuscleColor(scores.rearDelts)}
          />
          <path
            d="M55 118c8-10 18-15 29-15 4 0 9 1 13 3l-3 25c-7 7-16 11-27 12-9-4-13-13-12-25Z"
            fill={getMuscleColor(scores.middleDelts)}
          />
          <path
            d="M205 118c-8-10-18-15-29-15-4 0-9 1-13 3l3 25c7 7 16 11 27 12 9-4 13-13 12-25Z"
            fill={getMuscleColor(scores.middleDelts)}
          />
          <path
            d="M81 142c12 4 22 11 28 22l-10 70c-8 11-17 17-29 19l-7-63c3-23 9-39 18-48Z"
            fill={getMuscleColor(scores.lats)}
          />
          <path
            d="M179 142c-12 4-22 11-28 22l10 70c8 11 17 17 29 19l7-63c-3-23-9-39-18-48Z"
            fill={getMuscleColor(scores.lats)}
          />
          <path
            d="M52 149c10-2 18 0 27 7l-3 74c-13-6-21-16-24-31v-50Z"
            fill={getMuscleColor(scores.triceps)}
          />
          <path
            d="M208 149c-10-2-18 0-27 7l3 74c13-6 21-16 24-31v-50Z"
            fill={getMuscleColor(scores.triceps)}
          />
          <path
            d="M103 181c8 4 17 6 27 6s19-2 27-6l5 58c-4 19-15 29-32 29s-28-10-32-29l5-58Z"
            fill={getMuscleColor(scores.lowerBack)}
          />
          <path
            d="M85 274c11-10 26-15 45-15s34 5 45 15l-8 34c-9 12-21 18-37 18s-28-6-37-18l-8-34Z"
            fill={getMuscleColor(scores.glutes)}
          />
          <path
            d="M88 326c12 0 21 8 26 24l-7 83c-4 16-12 24-24 24s-20-8-24-24l2-74c5-22 14-33 27-33Z"
            fill={getMuscleColor(scores.hamstrings)}
          />
          <path
            d="M172 326c-12 0-21 8-26 24l7 83c4 16 12 24 24 24s20-8 24-24l-2-74c-5-22-14-33-27-33Z"
            fill={getMuscleColor(scores.hamstrings)}
          />
          <path
            d="M86 455c8 0 14 6 16 17l-2 28c-2 8-7 12-15 12s-13-4-15-11l1-28c2-12 8-18 15-18Z"
            fill={getMuscleColor(scores.calves)}
          />
          <path
            d="M174 455c-8 0-14 6-16 17l2 28c2 8 7 12 15 12s13-4 15-11l-1-28c-2-12-8-18-15-18Z"
            fill={getMuscleColor(scores.calves)}
          />
        </g>
      </g>
    </svg>
  )
}

export default BodyMapBack
