import { getRecoveryRegionColor } from './bodyRecoveryModel.js'

function BodyRecoveryFront({ data = {}, sex = 'male' }) {
  const centerX = 120

  return (
    <svg
      viewBox="0 0 240 520"
      preserveAspectRatio="xMidYMid meet"
      className="body-recovery-svg"
      role="img"
      aria-label={`${sex} front recovery map`}
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

          {/* chest */}
          <path
            d="
              M98 106
              Q106 94 120 94
              Q134 94 142 106
              L138 140
              Q130 150 120 150
              Q110 150 102 140
              Z
            "
            fill={getRecoveryRegionColor(data, 'chest')}
          />

          {/* biceps */}
          <rect
            x="54"
            y="136"
            width="16"
            height="64"
            rx="8"
            fill={getRecoveryRegionColor(data, 'biceps')}
          />
          <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
            <rect
              x="54"
              y="136"
              width="16"
              height="64"
              rx="8"
              fill={getRecoveryRegionColor(data, 'biceps')}
            />
          </g>

          {/* forearms */}
          <rect
            x="56"
            y="244"
            width="14"
            height="58"
            rx="7"
            fill={getRecoveryRegionColor(data, 'forearms')}
          />
          <g transform={`translate(${centerX * 2} 0) scale(-1 1)`}>
            <rect
              x="56"
              y="244"
              width="14"
              height="58"
              rx="7"
              fill={getRecoveryRegionColor(data, 'forearms')}
            />
          </g>

          {/* abs */}
          <path
            d="
              M106 160
              Q112 154 120 154
              Q128 154 134 160
              L138 214
              Q132 234 120 244
              Q108 234 102 214
              Z
            "
            fill={getRecoveryRegionColor(data, 'abs')}
          />

          {/* quads */}
          <rect
            x="96"
            y="392"
            width="18"
            height="76"
            rx="9"
            fill={getRecoveryRegionColor(data, 'quads')}
          />
          <rect
            x="126"
            y="392"
            width="18"
            height="76"
            rx="9"
            fill={getRecoveryRegionColor(data, 'quads')}
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

export default BodyRecoveryFront