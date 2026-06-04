/**
 * SVG felt-texture pattern used as the board background.
 * Renders a green baize pattern with subtle fiber noise and a wood-grain border.
 */
export function BoardFeltPattern() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Felt fiber noise */}
        <filter id="felt-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
          <feBlend in="SourceGraphic" in2="grey" mode="multiply" result="blended" />
          <feComponentTransfer in="blended">
            <feFuncA type="linear" slope="1" />
          </feComponentTransfer>
        </filter>

        {/* Radial vignette */}
        <radialGradient id="felt-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>
    </svg>
  );
}
