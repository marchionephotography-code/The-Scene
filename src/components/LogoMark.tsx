/**
 * The Scene's Tile S mark, simplified for small sizes (the header, favicons).
 * The full-detail version with the little pictures in each tile lives in
 * src/assets/logo/the-scene-icon.svg.
 */
export function LogoMark({ height = 30 }: { height?: number }) {
  return (
    <svg
      className="logo-mark"
      height={height}
      width={Math.round((height * 212) / 318)}
      viewBox="214 87 212 318"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M219,188 A96,96 0 0 1 315,92 L315,188 Z" fill="#FF5A36" />
      <rect x="325" y="92" width="96" height="96" rx="8" fill="#FFC53D" />
      <path d="M315,294 A96,96 0 0 1 219,198 L315,198 Z" fill="#3D6BFF" />
      <path d="M325,198 A96,96 0 0 1 421,294 L325,294 Z" fill="#FF8FC8" />
      <rect x="219" y="304" width="96" height="96" rx="8" fill="#121212" />
      <path d="M421,304 A96,96 0 0 1 325,400 L325,304 Z" fill="#8B74FF" />
    </svg>
  )
}
