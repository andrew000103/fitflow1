import { getRecoveryRegionColor } from './bodyRecoveryModel.js'

function BodyRecoveryBack({ data = {}, sex = 'male' }) {
  const cx = 120
  const baseFill = '#f8fafc'
  const baseStroke = '#cbd5e1'
  const baseStrokeWidth = 2.5

  const backColor = getRecoveryRegionColor(data, 'back')
  const armsColor = getRecoveryRegionColor(data, 'triceps')

  return (
    <svg
      viewBox="0 0 240 360"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${sex} back recovery map`}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* head */}
      <circle
        cx="120"
        cy="28"
        r="15"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* neck */}
      <rect
        x="109"
        y="43"
        width="22"
        height="11"
        rx="5.5"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* torso */}
      <path
        d="
          M74 68
          Q92 54 120 54
          Q148 54 166 68
          L178 88
          Q186 100 186 118
          L186 142
          Q186 160 172 172
          L160 182
          Q152 190 148 204
          L144 226
          Q140 248 128 262
          L112 262
          Q100 248 96 226
          L92 204
          Q88 190 80 182
          L68 172
          Q54 160 54 142
          L54 118
          Q54 100 62 88
          Z
        "
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* pelvis */}
      <path
        d="
          M98 262
          Q120 254 142 262
          L146 278
          Q138 292 120 292
          Q102 292 94 278
          Z
        "
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* upper arms */}
      <rect
        x="36"
        y="98"
        width="22"
        height="80"
        rx="11"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />
      <g transform={`translate(${cx * 2} 0) scale(-1 1)`}>
        <rect
          x="36"
          y="98"
          width="22"
          height="80"
          rx="11"
          fill={baseFill}
          stroke={baseStroke}
          strokeWidth={baseStrokeWidth}
        />
      </g>

      {/* forearms */}
      <rect
        x="40"
        y="174"
        width="18"
        height="60"
        rx="9"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />
      <g transform={`translate(${cx * 2} 0) scale(-1 1)`}>
        <rect
          x="40"
          y="174"
          width="18"
          height="60"
          rx="9"
          fill={baseFill}
          stroke={baseStroke}
          strokeWidth={baseStrokeWidth}
        />
      </g>

      {/* hamstrings base */}
      <path
        d="
          M100 292
          L116 292
          L116 344
          Q110 350 104 350
          Q99 346 99 338
          Z
        "
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />
      <path
        d="
          M140 292
          L124 292
          L124 344
          Q130 350 136 350
          Q141 346 141 338
          Z
        "
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* calves base */}
      <rect
        x="103"
        y="342"
        width="10"
        height="14"
        rx="5"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />
      <rect
        x="127"
        y="342"
        width="10"
        height="14"
        rx="5"
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
      />

      {/* traps */}
      <path
        d="
          M103 66
          Q111 60 120 60
          Q129 60 137 66
          L135 86
          Q129 96 120 96
          Q111 96 105 86
          Z
        "
        fill={backColor}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* shoulders */}
      <path
        d="
          M78 68
          Q90 60 106 60
          L108 86
          Q100 96 88 98
          Q78 92 78 68
          Z
        "
        fill={getRecoveryRegionColor(data, 'shoulders')}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <g transform={`translate(${cx * 2} 0) scale(-1 1)`}>
        <path
          d="
            M78 68
            Q90 60 106 60
            L108 86
            Q100 96 88 98
            Q78 92 78 68
            Z
          "
          fill={getRecoveryRegionColor(data, 'shoulders')}
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* lats */}
      <path
        d="
          M90 96
          Q101 106 106 122
          L105 186
          Q98 198 88 198
          L84 162
          Q84 114 90 96
          Z
        "
        fill={backColor}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <g transform={`translate(${cx * 2} 0) scale(-1 1)`}>
        <path
          d="
            M90 96
            Q101 106 106 122
            L105 186
            Q98 198 88 198
            L84 162
            Q84 114 90 96
            Z
          "
          fill={backColor}
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* arms */}
      <rect
        x="41"
        y="112"
        width="12"
        height="76"
        rx="6"
        fill={armsColor}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <g transform={`translate(${cx * 2} 0) scale(-1 1)`}>
        <rect
          x="41"
          y="112"
          width="12"
          height="76"
          rx="6"
          fill={armsColor}
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>

      {/* lower back */}
      <path
        d="
          M109 124
          Q114 120 120 120
          Q126 120 131 124
          L134 186
          Q130 196 120 204
          Q110 196 106 186
          Z
        "
        fill={getRecoveryRegionColor(data, 'lowerBack')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* glutes */}
      <path
        d="
          M102 262
          Q110 256 120 256
          Q130 256 138 262
          L140 282
          Q132 290 120 290
          Q108 290 100 282
          Z
        "
        fill={getRecoveryRegionColor(data, 'glutes')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* hamstrings */}
      <path
        d="
          M101 290
          L116 290
          L116 340
          Q110 346 104 346
          Q100 342 100 334
          Z
        "
        fill={getRecoveryRegionColor(data, 'hamstrings')}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path
        d="
          M139 290
          L124 290
          L124 340
          Q130 346 136 346
          Q140 342 140 334
          Z
        "
        fill={getRecoveryRegionColor(data, 'hamstrings')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* calves */}
      <rect
        x="103"
        y="342"
        width="10"
        height="12"
        rx="5"
        fill={getRecoveryRegionColor(data, 'calves')}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <rect
        x="127"
        y="342"
        width="10"
        height="12"
        rx="5"
        fill={getRecoveryRegionColor(data, 'calves')}
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  )
}

export default BodyRecoveryBack