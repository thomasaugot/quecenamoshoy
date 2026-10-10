import { useForm } from "react-hook-form"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { sendMagicLink, signInWithPassword } from "@/services/auth"
import { showToast } from "@/stores/toast-store"
import { announce } from "@/utils/announce"
import { EMAIL_PATTERN } from "@/utils/validation"

type LoginValues = { email: string; password: string }

export const LoginForm = () => {
  const t = useTranslations("login.form")
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>()

  const fail = (message: string) => {
    // the provider's message is never shown: fixed copy in the site's language (11-SECURITY)
    showToast(message, "error")
    announce(message, "assertive")
  }

  const onSubmit = async ({ email, password }: LoginValues) => {
    try {
      await signInWithPassword(email, password)
      announce(t("success"))
      await navigateTo(localizedPath("home", locale))
    } catch {
      fail(t("failed"))
    }
  }

  const onMagicLink = async () => {
    if (!(await trigger("email"))) return
    try {
      await sendMagicLink(getValues("email"), window.location.origin + localizedPath("home", locale))
      showToast(t("magicSent"), "success")
    } catch {
      fail(t("magicFailed"))
    }
  }

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
        <Input
          label={t("password")}
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password", { required: t("required") })}
        />
      </div>

      <div className="min-h-8 grow lg:hidden" />

      <div data-anim="rise" className="invisible flex flex-col gap-1.5 px-6 pb-[calc(1.625rem+env(safe-area-inset-bottom))] lg:px-0 lg:pt-8 lg:pb-0">
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">{t("submit")}</Button>
        <Button variant="link" onClick={() => void onMagicLink()} className="self-center">{t("magicLink")}</Button>
      </div>
    </form>
  )
}
