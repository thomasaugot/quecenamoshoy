import type { EQUIPMENT } from "@/constants/equipment"
import type { KitchenLocation } from "@/types/database"

export type EquipmentCategory = keyof typeof EQUIPMENT

// label: null for catalogue items (translated), the typed text for my own ones
export type KitchenItem = { key: string; category: EquipmentCategory; label: string | null }

export type ScanPhoto = { mimeType: string; data: string }   // base64, resized in the browser
export type ScanResult = { key: string; category: EquipmentCategory; confidence: number }

export type KitchenItemInput = KitchenItem & { location: KitchenLocation; source: "mine" | "ai" }
