import { SCAN_CONFIDENT } from "@/constants/equipment"
import type { EquipmentCategory, KitchenItem, ScanResult } from "@/types/kitchen"

export const itemsIn = (items: readonly KitchenItem[], category: EquipmentCategory) =>
  items.filter((i) => i.category === category)

export const customItemsIn = (items: readonly KitchenItem[], category: EquipmentCategory) =>
  items.filter((i) => i.category === category && i.label !== null)

// What the scan found that I don't have yet. Confident finds start ticked.
export const newFinds = (results: readonly ScanResult[], owned: readonly KitchenItem[]) =>
  results.filter((r) => !owned.some((o) => o.key === r.key))

export const initiallyTicked = (finds: readonly ScanResult[]) =>
  finds.filter((f) => f.confidence >= SCAN_CONFIDENT).map((f) => f.key)
