import { getMuscleColor } from '../../utils/muscleFatigue.js'

function BodyMapFront({ scores }) {
  return (
    <svg
      viewBox="0 0 260 520"
      preserveAspectRatio="xMidYMid meet"
      className="bodymap-svg"
      role="img"
      aria-label="Front body map"
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
            d="M92 110c10-14 23-21 38-21s28 7 38 21l-7 18c-8 10-18 16-31 16s-23-6-31-16l-7-18Z"
            fill={getMuscleColor(scores.chest)}
          />
          <path
            d="M72 105c10-9 21-14 31-13l2 18c-2 10-9 18-20 24-11-2-17-10-20-29Z"
            fill={getMuscleColor(scores.frontDelts)}
          />
          <path
            d="M188 105c-10-9-21-14-31-13l-2 18c2 10 9 18 20 24 11-2 17-10 20-29Z"
            fill={getMuscleColor(scores.frontDelts)}
          />
          <path
            d="M55 118c8-10 18-15 29-15 4 0 9 1 13 3l-3 26c-7 7-16 11-27 12-9-5-13-13-12-26Z"
            fill={getMuscleColor(scores.middleDelts)}
          />
          <path
            d="M205 118c-8-10-18-15-29-15-4 0-9 1-13 3l3 26c7 7 16 11 27 12 9-5 13-13 12-26Z"
            fill={getMuscleColor(scores.middleDelts)}
          />
          <path
            d="M53 150c10-2 18 0 27 7l-3 74c-13-5-21-15-24-31v-50Z"
            fill={getMuscleColor(scores.biceps)}
          />
          <path
            d="M207 150c-10-2-18 0-27 7l3 74c13-5 21-15 24-31v-50Z"
            fill={getMuscleColor(scores.biceps)}
          />
          <path
            d="M104 148c8 4 17 7 26 7s18-3 26-7l8 28c-2 20-13 34-34 41-21-7-32-21-34-41l8-28Z"
            fill={getMuscleColor(scores.abs)}
          />
          <path
            d="M102 221c9 5 18 7 28 7s19-2 28-7l4 43c-5 19-15 29-32 29s-27-10-32-29l4-43Z"
            fill={getMuscleColor(scores.abs)}
            opacity="0.96"
          />
          <path
            d="M88 300c12 0 22 7 28 21l-8 104c-4 15-12 23-24 23-12 0-20-8-25-24l1-95c6-20 15-29 28-29Z"
            fill={getMuscleColor(scores.quadriceps)}
          />
          <path
            d="M172 300c-12 0-22 7-28 21l8 104c4 15 12 23 24 23 12 0 20-8 25-24l-1-95c-6-20-15-29-28-29Z"
            fill={getMuscleColor(scores.quadriceps)}
          />
          <path
            d="M87 447c8 0 14 6 16 17l-3 33c-2 9-7 13-15 13s-13-4-16-12l2-33c2-12 8-18 16-18Z"
            fill={getMuscleColor(scores.calves)}
          />
          <path
            d="M173 447c-8 0-14 6-16 17l3 33c2 9 7 13 15 13s13-4 16-12l-2-33c-2-12-8-18-16-18Z"
            fill={getMuscleColor(scores.calves)}
          />
        </g>
      </g>
    </svg>
  )
}

export default BodyMapFront
