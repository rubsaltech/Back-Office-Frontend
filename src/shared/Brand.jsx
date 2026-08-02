import { cn } from '../lib/cn'

/*
 * RUBSAL logo — single source used everywhere (sidebar, auth, placeholders).
 * Swap the file in ONE place here and it updates across the whole app.
 *
 * NOTE: logo1.png has a BLACK background (good for dark surfaces), logo2.png
 * has a LIGHT background. The app UI is light (white sidebar/cards), so we use
 * logo2 to avoid a black box. To switch, change LOGO_SRC below.
 *
 * The source PNGs are square with lots of padding, so we crop to the logo band
 * with a wide, short box + object-cover (padding blends into the light surface).
 *
 * NOTE: logo2.png has a thin dark frame baked into its edges (an ~8px black line
 * on the left, gray on top). We zoom in slightly (SCALE) so those defective
 * edges are clipped away by the overflow-hidden wrapper. A cleanly-exported logo
 * (tight crop, transparent background) would let us drop the zoom entirely.
 */
const LOGO_SRC = '/logo/logo2.png'
const ASPECT = 3.3 // width : height of the visible logo band
const SCALE = 1.08 // zoom to crop the image's baked-in edge frame

export function RubsalLogo({ className, height = 40 }) {
  return (
    <div
      className={cn('overflow-hidden', className)}
      style={{ height, width: height * ASPECT }}
    >
      <img
        src={LOGO_SRC}
        alt="RUBSAL Technologies"
        className="h-full w-full object-cover object-center"
        style={{ transform: `scale(${SCALE})` }}
        draggable={false}
      />
    </div>
  )
}
