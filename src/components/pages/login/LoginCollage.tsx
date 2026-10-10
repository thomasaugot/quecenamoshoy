import { useTranslations } from "use-intl"

// Decorative collage (design: "Entrar"): three dinners pinned on the fridge + a scribbled hello.
// Mobile = the design's 390px composition; lg = the same composition ×1.6, left of the form.
export const LoginCollage = () => {
  const t = useTranslations("login.hero")
  return (
    <div aria-hidden="true" className="pointer-events-none relative mx-auto h-82 w-full max-w-97 lg:h-131 lg:max-w-155">
      <img
        data-anim="pin"
        src="/assets/images/login/photo-left.webp"
        alt=""
        width={544}
        height={544}
        fetchPriority="high"
        className="invisible photo-frame absolute top-10 left-5.5 size-42 -rotate-7 lg:top-16 lg:left-9 lg:size-68"
      />
      <img
        data-anim="pin"
        src="/assets/images/login/photo-right.webp"
        alt=""
        width={512}
        height={512}
        className="invisible photo-frame absolute top-6.5 right-6.5 size-40 rotate-6 lg:top-10.5 lg:right-10.5 lg:size-64"
      />
      <img
        data-anim="pin"
        src="/assets/images/login/photo-bottom.webp"
        alt=""
        width={480}
        height={480}
        className="invisible photo-frame absolute top-42.5 left-31 size-37.5 -rotate-2 lg:top-68 lg:left-50 lg:size-60"
      />
      <span data-anim="scribble" className="invisible text-voice-lg absolute top-53.5 right-7.5 -rotate-6 text-accent lg:top-85 lg:right-12">
        {t("hello")}
      </span>
    </div>
  )
}
