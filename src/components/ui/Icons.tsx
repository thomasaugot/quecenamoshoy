import type { IconBaseProps } from "react-icons"
import {
  FiAlertCircle, FiArrowLeft, FiChevronDown, FiArrowRight, FiCheck, FiClock, FiEdit2, FiGlobe, FiHeart, FiInfo, FiLogOut, FiMinus, FiPlus,
  FiPlusSquare, FiSettings, FiShare, FiSliders, FiShoppingBag, FiStar, FiSun, FiTrash2, FiX,
} from "react-icons/fi"
import {
  PiBowlFoodDuotone, PiBowlFoodFill, PiCookingPot, PiCookingPotFill, PiFireDuotone, PiFishFill, PiHamburgerFill,
  PiHouseLineDuotone, PiSparkle, PiPackageDuotone, PiShuffleDuotone, PiSnowflakeDuotone, PiSuitcaseRollingDuotone,
} from "react-icons/pi"

type IconProps = IconBaseProps

// The ONLY react-icons import site. aria-hidden always; swapping the library = this file.
export const IconToday = (p: IconProps) => <FiSun aria-hidden="true" {...p} />
export const IconHeart = (p: IconProps) => <FiHeart aria-hidden="true" {...p} />
export const IconHistory = (p: IconProps) => <FiClock aria-hidden="true" {...p} />
export const IconGlobe = (p: IconProps) => <FiGlobe aria-hidden="true" {...p} />
export const IconSignOut = (p: IconProps) => <FiLogOut aria-hidden="true" {...p} />
export const IconArrow = (p: IconProps) => <FiArrowRight aria-hidden="true" {...p} />
export const IconArrowLeft = (p: IconProps) => <FiArrowLeft aria-hidden="true" {...p} />
export const IconChevronDown = (p: IconProps) => <FiChevronDown aria-hidden="true" {...p} />
export const IconClose = (p: IconProps) => <FiX aria-hidden="true" {...p} />
export const IconCheck = (p: IconProps) => <FiCheck aria-hidden="true" {...p} />
export const IconAlert = (p: IconProps) => <FiAlertCircle aria-hidden="true" {...p} />
export const IconInfo = (p: IconProps) => <FiInfo aria-hidden="true" {...p} />
export const IconFilter = (p: IconProps) => <FiSliders aria-hidden="true" {...p} />
export const IconSparkle = (p: IconProps) => <PiSparkle aria-hidden="true" {...p} />
export const IconSettings = (p: IconProps) => <FiSettings aria-hidden="true" {...p} />
export const IconMinus = (p: IconProps) => <FiMinus aria-hidden="true" {...p} />
export const IconPlus = (p: IconProps) => <FiPlus aria-hidden="true" {...p} />
export const IconTrash = (p: IconProps) => <FiTrash2 aria-hidden="true" {...p} />
export const IconEdit = (p: IconProps) => <FiEdit2 aria-hidden="true" {...p} />
export const IconStar = (p: IconProps) => <FiStar aria-hidden="true" {...p} />
export const IconKitchen = (p: IconProps) => <PiCookingPot aria-hidden="true" {...p} />
export const IconShare = (p: IconProps) => <FiShare aria-hidden="true" {...p} />
export const IconBasket = (p: IconProps) => <FiShoppingBag aria-hidden="true" {...p} />
export const IconAddToHome = (p: IconProps) => <FiPlusSquare aria-hidden="true" {...p} />

// Dishes revealed by the Cloche logo — one family (Phosphor Fill) so they read as one mark
export const IconDishBowl = (p: IconProps) => <PiBowlFoodFill aria-hidden="true" {...p} />
export const IconDishBurger = (p: IconProps) => <PiHamburgerFill aria-hidden="true" {...p} />
export const IconDishFish = (p: IconProps) => <PiFishFill aria-hidden="true" {...p} />
export const IconDishPot = (p: IconProps) => <PiCookingPotFill aria-hidden="true" {...p} />

// Wizard answers — Phosphor Duotone: two tones of one colour, warmer than a line icon
export const IconAtHome = (p: IconProps) => <PiHouseLineDuotone aria-hidden="true" {...p} />
export const IconTravel = (p: IconProps) => <PiSuitcaseRollingDuotone aria-hidden="true" {...p} />
export const IconHot = (p: IconProps) => <PiFireDuotone aria-hidden="true" {...p} />
export const IconCold = (p: IconProps) => <PiSnowflakeDuotone aria-hidden="true" {...p} />
export const IconEither = (p: IconProps) => <PiShuffleDuotone aria-hidden="true" {...p} />
export const IconLeftovers = (p: IconProps) => <PiPackageDuotone aria-hidden="true" {...p} />
export const IconTonightOnly = (p: IconProps) => <PiBowlFoodDuotone aria-hidden="true" {...p} />
