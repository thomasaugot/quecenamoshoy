import { useState } from "react"
import { useForm } from "react-hook-form"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { sendMagicLink, signInWithPassword } from "@/services/auth"
import { showToast } from "@/stores/toast-store"
import { announce } from "@/utils/announce"
import { RateLimitedError } from "@/utils/errors"
import { EMAIL_PATTERN } from "@/utils/validation"

type LoginValues = { email: string; password: string }
type Mode = "password" | "magic"

// Two ways in, one form: email + password, or email only and a magic link. Switching mode
// swaps the password field and the main button; a sent link replaces the button with where
// it went. shouldUnregister: the hidden password field is not validated in magic mode.
export const LoginForm = () => {
  const t = useTranslations("login.form")
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const [mode, setMode] = useState<Mode>("password")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ shouldUnregister: true })

  const fail = (message: string) => {
    // the provider's message is never shown: fixed copy in the site's language (11-SECURITY)
    showToast(message, "error")
    announce(message, "assertive")
  }

  const onSubmit = async ({ email, password }: LoginValues) => {
    if (mode === "magic") {
      try {
        await sendMagicLink(email, window.location.origin + localizedPath("home", locale))
        setSentTo(email)
        announce(t("magicSent"))
      } catch (error) {
        fail(t(error instanceof RateLimitedError ? "magicTooMany" : "magicFailed"))
      }
      return
    }
    try {
      await signInWithPassword(email, password)
      announce(t("success"))
      await navigateTo(localizedPath("home", locale))
    } catch {
      fail(t("failed"))
    }
  }

  const switchTo = (next: Mode) => { setMode(next); setSentTo(null) }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex grow flex-col">
      <div data-anim="rise" className="invisible flex flex-col gap-3.5 px-6 pt-6 lg:px-0 lg:pt-10">
        <Input
          label={t("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          required
          error={errors.email?.message}
          {...register("email", {
            required: t("required"),
            pattern: { value: EMAIL_PATTERN, message: t("invalidEmail") },
          })}
        />
        {mode === "password" ? (
          <Input
            label={t("password")}
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register("password", { required: t("required") })}
          />
        ) : (
          <p className="text-note text-primary">{t("magicExplain")}</p>
        )}
      </div>

      <div className="min-h-8 grow lg:hidden" />

      <div data-anim="rise" className="invisible flex flex-col gap-1.5 px-6 pb-[calc(1.625rem+env(safe-area-inset-bottom))] lg:px-0 lg:pt-8 lg:pb-0">
        {sentTo ? (
          <p role="status" className="text-body rounded-xl bg-sage-soft p-4 text-center">{t("magicSentTo", { email: sentTo })}</p>
        ) : (
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {mode === "password" ? t("submit") : t("magicSubmit")}
          </Button>
        )}
        <Button variant="link" onClick={() => switchTo(mode === "password" ? "magic" : "password")} className="self-center">
          {mode === "password" ? t("magicLink") : t("usePassword")}
        </Button>
      </div>
    </form>
  )
}
