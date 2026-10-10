import { useId, useState, type ChangeEvent } from "react"
import { useTranslations } from "use-intl"
import { KitchenScanReview } from "@/components/pages/kitchen/KitchenScanReview"
import { Cloche } from "@/components/ui/Cloche"
import { SCAN_MAX_PHOTOS, SCAN_MAX_SIDE } from "@/constants/equipment"
import { useKitchen, useScanKitchen } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"
import { photoForUpload } from "@/utils/image"
import { newFinds } from "@/utils/kitchen"
import { logger } from "@/utils/logger"
import { showToast } from "@/stores/toast-store"
import type { ScanResult } from "@/types/kitchen"

// Photograph the worktop, cupboards, drawers; Gemini says what it sees; I confirm.
export const KitchenScan = () => {
  const t = useTranslations("kitchen.scan")
  const inputId = useId()
  const location = useKitchenStore((s) => s.location)
  const { data: owned = [] } = useKitchen(location)
  const scan = useScanKitchen()
  const [finds, setFinds] = useState<ScanResult[] | null>(null)
  const [preparing, setPreparing] = useState(false)
  const busy = preparing || scan.isPending

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, SCAN_MAX_PHOTOS)
    event.target.value = ""
    if (!files.length) return
    setPreparing(true)
    try {
      const photos = await Promise.all(files.map((f) => photoForUpload(f, SCAN_MAX_SIDE)))
      setPreparing(false)
      scan.mutate(photos, { onSuccess: (results) => setFinds(newFinds(results, owned)) })
    } catch (error) {
      setPreparing(false)
      logger.error("photo prepare failed", error)
      showToast(t("unreadable"), "error")
    }
  }

  return (
    <section aria-labelledby="kitchen-scan" data-anim="rise" aria-busy={busy}
      className="invisible flex flex-col gap-4 rounded-xl bg-surface-2 p-6 lg:sticky lg:top-28 lg:p-8">
      <h2 id="kitchen-scan" className="text-heading">{t("title")}</h2>
      {finds ? (
        <KitchenScanReview finds={finds} onDone={() => setFinds(null)} />
      ) : (
        <>
          <p className="text-body text-text-soft">{t("intro", { max: SCAN_MAX_PHOTOS })}</p>
          {busy ? (
            <div role="status" className="flex items-center gap-3">
              <Cloche inLoader className="h-12" />
              <span className="text-note text-primary">{t("looking")}</span>
            </div>
          ) : (
            <div className="flex">
              <input id={inputId} type="file" accept="image/*" multiple onChange={(event) => void pick(event)} className="peer sr-only" />
              <label htmlFor={inputId}
                className="text-button inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-on-primary transition-colors hover:bg-primary-hover peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary">
                {t("cta")}
              </label>
            </div>
          )}
        </>
      )}
    </section>
  )
}
