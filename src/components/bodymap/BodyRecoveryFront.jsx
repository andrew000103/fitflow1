import { getRecoveryRegionColor } from './bodyRecoveryModel.js'

function BodyRecoveryFront({ data = {}, sex = 'male' }) {
  const cx = 120
  const baseFill = '#f8fafc'
  const baseStroke = '#cbd5e1'
  const baseStrokeWidth = 2.5

  const armsScore = Math.max(Number(data?.biceps || 0), Number(data?.forearms || 0))
  const armsColor = getRecoveryRegionColor({ arms: armsScore }, 'arms')

  return (
    <svg
      viewBox="0 0 240 360"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${sex} front recovery map`}
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

      {/* torso + narrow waist + bodybuilder shoulders */}
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

      {/* legs: start high, total length about 55% */}
      <path
        d="
          M100 292
          L116 292
          L116 350
          Q110 356 104 356
          Q98 350 98 342
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
          L124 350
          Q130 356 136 356
          Q142 350 142 342
          Z
        "
        fill={baseFill}
        stroke={baseStroke}
        strokeWidth={baseStrokeWidth}
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

      {/* chest */}
      <path
        d="
          M96 80
          Q106 72 120 72
          Q134 72 144 80
          L140 110
          Q132 122 120 122
          Q108 122 100 110
          Z
        "
        fill={getRecoveryRegionColor(data, 'chest')}
        stroke="#ffffff"
        strokeWidth="2"
      />

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

      {/* abs */}
      <path
        d="
          M109 126
          Q114 122 120 122
          Q126 122 131 126
          L134 168
          Q130 180 120 188
          Q110 180 106 168
          Z
        "
        fill={getRecoveryRegionColor(data, 'abs')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* quads */}
      <path
        d="
          M101 262
          Q108 258 116 262
          L116 340
          Q111 348 104 348
          Q99 342 99 334
          Z
        "
        fill={getRecoveryRegionColor(data, 'quads')}
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path
        d="
          M139 262
          Q132 258 124 262
          L124 340
          Q129 348 136 348
          Q141 342 141 334
          Z
        "
        fill={getRecoveryRegionColor(data, 'quads')}
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  )
}

export default BodyRecoveryFront