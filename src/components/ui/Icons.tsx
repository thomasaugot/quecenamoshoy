import type { IconBaseProps } from "react-icons"
import {
  FiAlertCircle, FiCheck, FiClock, FiGlobe, FiHeart, FiInfo, FiLogOut, FiSun, FiX,
} from "react-icons/fi"

type IconProps = IconBaseProps

// The ONLY react-icons import site. aria-hidden always; swapping the library = this file.
export const IconToday = (p: IconProps) => <FiSun aria-hidden="true" {...p} />
export const IconHeart = (p: IconProps) => <FiHeart aria-hidden="true" {...p} />
export const IconHistory = (p: IconProps) => <FiClock aria-hidden="true" {...p} />
export const IconGlobe = (p: IconProps) => <FiGlobe aria-hidden="true" {...p} />
export const IconSignOut = (p: IconProps) => <FiLogOut aria-hidden="true" {...p} />
export const IconClose = (p: IconProps) => <FiX aria-hidden="true" {...p} />
export const IconCheck = (p: IconProps) => <FiCheck aria-hidden="true" {...p} />
export const IconAlert = (p: IconProps) => <FiAlertCircle aria-hidden="true" {...p} />
export const IconInfo = (p: IconProps) => <FiInfo aria-hidden="true" {...p} />
