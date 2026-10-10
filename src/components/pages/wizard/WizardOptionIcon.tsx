import { IconAtHome, IconCold, IconEither, IconHot, IconLeftovers, IconTonightOnly, IconTravel } from "@/components/ui/Icons"

// Each answer gets its own picture and colour: home green, travel terracotta, fire, frost…
const ICONS = {
  home: { Icon: IconAtHome, tone: "text-primary" },
  travel: { Icon: IconTravel, tone: "text-accent-strong" },
  hot: { Icon: IconHot, tone: "text-accent-strong" },
  cold: { Icon: IconCold, tone: "text-sage" },
  any: { Icon: IconEither, tone: "text-highlight-deep" },
  yes: { Icon: IconLeftovers, tone: "text-highlight-deep" },
  no: { Icon: IconTonightOnly, tone: "text-sage" },
} as const

export const WizardOptionIcon = ({ option }: { option: keyof typeof ICONS }) => {
  const { Icon, tone } = ICONS[option]
  return <Icon className={`h-10 w-10 shrink-0 group-aria-pressed:text-on-primary lg:h-14 lg:w-14 ${tone}`} />
}
