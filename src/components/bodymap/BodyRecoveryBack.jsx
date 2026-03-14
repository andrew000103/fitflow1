import { getRecoveryRegionColor } from './bodyRecoveryModel.js'

function BodyRecoveryBack({ data = {}, sex = 'male' }) {
  const centerX = 120

  return (
    <svg
      viewBox="0 0 240 520"
      preserveAspectRatio="xMidYMid meet"
      className="body-recovery-svg"
      role="img"
      aria-label={`${sex} back recovery map`}
    >
      <g className="body-recovery-layer">
        {/* Base silhouette */}
        <circle className="body-recovery-base" cx="120" cy="44" r="20" />

        <rect className="body-recovery-base" x="108" y="64" width="24" height="16" rx="10" />

        <path
          className="body-recovery-base"
          d="
            M92 92
            Q102 76 120 76
            Q138 76 148 92
            L164 126
            Q172 144 172 170
            L172 222
            Q172 242 156 258
            L146 268
            L142 308
            Q140 326 128 338
            L112 338
            Q100 326 98 308
            L94 268
            L84 258
            Q68 242 68 222
            L68 170
            Q68 144 76 126
            Z
          "
        />

        <path
          className="body-recovery-base"
          d="
            M98 338
            Q120 328 142 338
            L148 366
            Q138 384 120 384
            Q102 384 92 366
            Z
          "
        />

        <rect className="body-recovery-base" x="48" y="118" width="26" height="122" rx="13" />
        <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
          <rect className="body-recovery-base" x="48" y="118" width="26" height="122" rx="13" />
        </g>

        <rect className="body-recovery-base" x="52" y="236" width="22" height="94" rx="11" />
        <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
          <rect className="body-recovery-base" x="52" y="236" width="22" height="94" rx="11" />
        </g>

        <rect className="body-recovery-base" x="94" y="384" width="22" height="104" rx="11" />
        <rect className="body-recovery-base" x="124" y="384" width="22" height="104" rx="11" />

        <rect className="body-recovery-base" x="96" y="482" width="18" height="26" rx="9" />
        <rect className="body-recovery-base" x="126" y="482" width="18" height="26" rx="9" />

        {/* Regions */}
        <g className="body-recovery-regions">
          {/* upper back / traps (legacy key: back) */}
          <path
            d="
              M102 92
              Q110 84 120 84
              Q130 84 138 92
              L136 116
              Q130 124 120 124
              Q110 124 104 116
              Z
            "
            fill={getRecoveryRegionColor(data, 'back')}
          />

          {/* shoulders */}
          <path
            d="
              M88 96
              Q98 88 110 90
              L112 112
              Q104 122 92 124
              Q84 116 88 96
              Z
            "
            fill={getRecoveryRegionColor(data, 'shoulders')}
          />
          <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
            <path
              d="
                M88 96
                Q98 88 110 90
                L112 112
                Q104 122 92 124
                Q84 116 88 96
                Z
              "
              fill={getRecoveryRegionColor(data, 'shoulders')}
            />
          </g>

          {/* side back / lats using legacy key: back */}
          <path
            d="
              M92 124
              Q102 130 106 146
              L104 210
              Q96 222 82 222
              L78 182
              Q80 144 92 124
              Z
            "
            fill={getRecoveryRegionColor(data, 'back')}
          />
          <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
            <path
              d="
                M92 124
                Q102 130 106 146
                L104 210
                Q96 222 82 222
                L78 182
                Q80 144 92 124
                Z
              "
              fill={getRecoveryRegionColor(data, 'back')}
            />
          </g>

          {/* triceps */}
          <rect
            x="54"
            y="136"
            width="16"
            height="64"
            rx="8"
            fill={getRecoveryRegionColor(data, 'triceps')}
          />
          <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
            <rect
              x="54"
              y="136"
              width="16"
              height="64"
              rx="8"
              fill={getRecoveryRegionColor(data, 'triceps')}
            />
          </g>

          {/* lower back */}
          <path
            d="
              M108 154
              Q114 148 120 148
              Q126 148 132 154
              L136 228
              Q130 242 120 248
              Q110 242 104 228
              Z
            "
            fill={getRecoveryRegionColor(data, 'lowerBack')}
          />

          {/* glutes */}
          <path
            d="
              M100 338
              Q110 330 120 330
              Q130 330 140 338
              L142 362
              Q134 372 120 372
              Q106 372 98 362
              Z
            "
            fill={getRecoveryRegionColor(data, 'glutes')}
          />

          {/* hamstrings */}
          <rect
            x="96"
            y="392"
            width="18"
            height="76"
            rx="9"
            fill={getRecoveryRegionColor(data, 'hamstrings')}
          />
          <rect
            x="126"
            y="392"
            width="18"
            height="76"
            rx="9"
            fill={getRecoveryRegionColor(data, 'hamstrings')}
          />

          {/* calves */}
          <rect
            x="98"
            y="470"
            width="14"
            height="30"
            rx="7"
            fill={getRecoveryRegionColor(data, 'calves')}
          />
          <rect
            x="128"
            y="470"
            width="14"
            height="30"
            rx="7"
            fill={getRecoveryRegionColor(data, 'calves')}
          />
        </g>
      </g>
    </svg>
  )
}

export default BodyRecoveryBack