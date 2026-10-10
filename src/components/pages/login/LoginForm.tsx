import { useForm } from "react-hook-form"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { signInWithPassword } from "@/services/auth"
import { showToast } from "@/stores/toast-store"
import { announce } from "@/utils/announce"
import { EMAIL_PATTERN } from "@/utils/validation"

type LoginValues = { email: string; password: string }

export const LoginForm = () => {
  const t = useTranslations("login")
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>()

  const onSubmit = async ({ email, password }: LoginValues) => {
    try {
      await signInWithPassword(email, password)
      announce(t("form.success"))
      await navigateTo(localizedPath("home", locale))
    } catch {
      // the provider's message is never shown: fixed copy in the site's language (11-SECURITY)
      showToast(t("form.failed"), "error")
      announce(t("form.failed"), "assertive")
    }
  }

  return (
    <section aria-labelledby="login-title" className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 id="login-title" className="text-title">{t("hero.title")}</h1>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t("form.email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email", {
            required: t("form.required"),
            pattern: { value: EMAIL_PATTERN, message: t("form.invalidEmail") },
          })}
        />
        <Input
          label={t("form.password")}
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password", { required: t("form.required") })}
        />
        <Button type="submit" size="lg" loading={isSubmitting}>{t("form.submit")}</Button>
      </form>
    </section>
  )
}
