import { Button } from "@/components/ui/Button"
import { crashCopy } from "@/i18n/crash-copy"

// Last net, OUTSIDE the router and the IntlProvider: copy comes straight from the locale
// files, in the language of <html lang>.
export const AppCrash = () => {
  const copy = crashCopy(document.documentElement.lang)
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-title">{copy.title}</h1>
      <p className="text-body">{copy.body}</p>
      <Button className="self-start" onClick={() => window.location.reload()}>{copy.reload}</Button>
    </main>
  )
}
