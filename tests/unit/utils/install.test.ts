import { describe, expect, it } from "vitest"
import { dismissedRecently, installPlatform, isIosSafari } from "@/utils/install"

const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1"
const PIXEL = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"

describe("install offer", () => {
  it("knows how each browser installs", () => {
    expect(installPlatform(true, false, PIXEL)).toBe("prompt")
    expect(installPlatform(false, false, IPHONE_SAFARI)).toBe("ios")
    expect(installPlatform(false, false, PIXEL)).toBeNull()
    expect(installPlatform(true, true, PIXEL)).toBeNull()   // already installed
  })
  it("only Safari on iOS gets the share-sheet steps", () => {
    expect(isIosSafari(IPHONE_SAFARI)).toBe(true)
    expect(isIosSafari(IPHONE_CHROME)).toBe(false)
  })
  it("stays quiet for two weeks after 'later'", () => {
    const now = Date.UTC(2026, 9, 10)
    expect(dismissedRecently(null, now)).toBe(false)
    expect(dismissedRecently(now - 3 * 86_400_000, now)).toBe(true)
    expect(dismissedRecently(now - 15 * 86_400_000, now)).toBe(false)
  })
})
