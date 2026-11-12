import { cn } from '../lib/cn'

/*
 * Smart Flow logo — single source used everywhere (sidebar, auth, placeholders).
 * Swap the file in ONE place here and it updates across the whole app.
 *
 * Smart Flow is a product of Rubsal Technologies. The source PNG is a clean,
 * tight, transparent export (~3:1), so we render it with object-contain — no
 * cropping or zoom hacks needed.
 */
const LOGO_SRC = '/logo/smart-flow.png'
const ASPECT = 3 // width : height of the logo

export function BrandLogo({ className, height = 40 }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Smart Flow"
      className={cn('object-contain object-center', className)}
      style={{ height, width: height * ASPECT }}
      draggable={false}
    />
  )
}
