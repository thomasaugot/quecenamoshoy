import { IconHeart, IconHistory, IconKitchen, IconSettings, IconToday } from "@/components/ui/Icons"
import type { NavIcon as NavIconName } from "@/constants/nav"

const ICONS = { today: IconToday, heart: IconHeart, history: IconHistory, kitchen: IconKitchen, settings: IconSettings } as const

export const NavIcon = ({ name, className = "" }: { name: NavIconName; className?: string }) => {
  const Icon = ICONS[name]
  return <Icon className={`shrink-0 ${className}`} />
}
