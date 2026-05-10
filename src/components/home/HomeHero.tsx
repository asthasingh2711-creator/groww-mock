import styles from "./HomeHero.module.css";

type Props = {
  onGetStarted: () => void;
};

/** Large inline SVG: Groww-inspired isometric “wealth campus” — exchange, ticker, MF billboard, market open clock. */
function WealthCampusIllustration() {
  return (
    <svg
      className={styles.art}
      viewBox="0 0 960 480"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="tealGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d09c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.55" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="6"
            floodOpacity="0.12"
          />
        </filter>
      </defs>

      <rect width="960" height="480" fill="url(#sky)" />
      {/* Horizon / ground plane */}
      <path
        d="M0 310 Q 240 285 480 295 T 960 288 L 960 480 L 0 480 Z"
        fill="url(#ground)"
        opacity="0.9"
      />
      <path
        d="M0 318 L 960 305"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="10 14"
        opacity="0.7"
      />

      {/* Distant chart silhouette — “markets in motion” */}
      <path
        d="M 60 268 L 120 240 L 180 252 L 240 210 L 300 228 L 360 185 L 420 200"
        fill="none"
        stroke="#00d09c"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="420" cy="200" r="5" fill="#00d09c" opacity="0.6" />

      {/* Left block — “SIP growth” stack */}
      <g filter="url(#softShadow)">
        <ellipse cx="140" cy="385" rx="72" ry="14" fill="#cbd5e1" opacity="0.5" />
        <path
          d="M 88 340 L 148 300 L 208 340 L 148 378 Z"
          fill="#fff"
          stroke="#e2e8f0"
        />
        <path
          d="M 148 300 L 148 255 L 208 285 L 208 340 Z"
          fill="#f8fafc"
          stroke="#e2e8f0"
        />
        <path
          d="M 88 340 L 148 378 L 148 300 L 88 268 Z"
          fill="#f1f5f9"
          stroke="#e2e8f0"
        />
        <circle cx="148" cy="220" r="22" fill="#00d09c" opacity="0.2" />
        <path
          d="M 148 235 Q 158 210 170 220"
          fill="none"
          stroke="#00d09c"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text
          x="118"
          y="355"
          fontSize="11"
          fill="#64748b"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          SIP
        </text>
      </g>

      {/* Center — exchange tower with wraparound ticker */}
      <g filter="url(#softShadow)">
        <ellipse cx="480" cy="400" rx="120" ry="18" fill="#94a3b8" opacity="0.25" />
        <path
          d="M 400 360 L 480 310 L 560 360 L 480 408 Z"
          fill="#fff"
          stroke="#e2e8f0"
        />
        <path
          d="M 480 310 L 480 175 L 560 230 L 560 360 Z"
          fill="#f8fafc"
          stroke="#e2e8f0"
        />
        <path
          d="M 400 360 L 480 408 L 480 310 L 400 255 Z"
          fill="#f1f5f9"
          stroke="#e2e8f0"
        />
        {/* Green roof slab */}
        <path
          d="M 400 255 L 480 205 L 560 255 L 480 302 Z"
          fill="url(#tealGlass)"
          stroke="#00d09c"
          strokeWidth="1.5"
        />
        {/* Ticker band */}
        <rect
          x="415"
          y="268"
          width="130"
          height="22"
          rx="4"
          fill="#0f172a"
          opacity="0.88"
        />
        <text
          x="422"
          y="284"
          fontSize="10"
          fill="#4ade80"
          fontWeight="700"
          fontFamily="ui-monospace, monospace"
        >
          NIFTY 50 ▲ LIVE
        </text>
        <rect x="445" y="320" width="18" height="28" fill="#00d09c" opacity="0.35" rx="2" />
        <rect x="472" y="312" width="18" height="36" fill="#00d09c" opacity="0.5" rx="2" />
        <rect x="499" y="325" width="18" height="23" fill="#00d09c" opacity="0.28" rx="2" />
      </g>

      {/* Right — billboard + cylinder tower */}
      <g filter="url(#softShadow)">
        <rect
          x="700"
          y="95"
          width="118"
          height="36"
          rx="6"
          fill="#fff"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text
          x="708"
          y="118"
          fontSize="12"
          fill="#0f766e"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.06em"
        >
          MUTUAL FUNDS
        </text>
        <line x1="720" y1="128" x2="798" y2="128" stroke="#00d09c" strokeWidth="2" opacity="0.5" />
        <rect x="752" y="138" width="8" height="210" fill="#e2e8f0" rx="2" />
        <ellipse cx="756" cy="138" rx="28" ry="10" fill="#cbd5e1" />
        <ellipse cx="756" cy="348" rx="32" ry="12" fill="#94a3b8" opacity="0.35" />
      </g>

      {/* Clock pavilion — 9:15 market reference */}
      <g>
        <path
          d="M 250 355 L 310 320 L 370 355 L 310 388 Z"
          fill="#fff"
          stroke="#e2e8f0"
          filter="url(#softShadow)"
        />
        <circle cx="310" cy="348" r="26" fill="#f8fafc" stroke="#94a3b8" />
        <line
          x1="310"
          y1="348"
          x2="310"
          y2="332"
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="310"
          y1="348"
          x2="322"
          y2="356"
          stroke="#00d09c"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="292"
          y="405"
          fontSize="11"
          fill="#64748b"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          9:15
        </text>
      </g>

      {/* Road + car */}
      <path
        d="M 180 430 Q 480 400 820 438"
        stroke="#cbd5e1"
        strokeWidth="36"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M 200 418 Q 480 392 800 426"
        stroke="#fff"
        strokeWidth="3"
        strokeDasharray="16 20"
        opacity="0.85"
      />
      <g transform="translate(520, 388)">
        <rect
          x="0"
          y="8"
          width="44"
          height="16"
          rx="4"
          fill="#fff"
          stroke="#94a3b8"
        />
        <rect x="6" y="2" width="32" height="14" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
        <circle cx="10" cy="26" r="4" fill="#334155" />
        <circle cx="34" cy="26" r="4" fill="#334155" />
      </g>

      {/* Tiny pedestrians */}
      <circle cx="420" cy="418" r="5" fill="#64748b" opacity="0.6" />
      <circle cx="438" cy="415" r="5" fill="#64748b" opacity="0.5" />
      <circle cx="600" cy="422" r="5" fill="#64748b" opacity="0.55" />

      {/* Trees */}
      <g opacity="0.85">
        <circle cx="95" cy="318" r="16" fill="#00d09c" opacity="0.35" />
        <rect x="91" y="318" width="8" height="22" fill="#78716c" rx="1" />
        <circle cx="880" cy="328" r="14" fill="#00d09c" opacity="0.3" />
        <rect x="877" y="328" width="6" height="18" fill="#78716c" rx="1" />
      </g>

      {/* Foreground glow */}
      <rect
        x="0"
        y="440"
        width="960"
        height="40"
        fill="url(#sky)"
        opacity="0.35"
      />
    </svg>
  );
}

export function HomeHero({ onGetStarted }: Props) {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Groww your wealth</h1>
      <button type="button" className={styles.cta} onClick={onGetStarted}>
        Get started
      </button>
      <div className={styles.artWrap} aria-hidden>
        <WealthCampusIllustration />
      </div>
    </main>
  );
}
