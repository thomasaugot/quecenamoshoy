// The equipment catalogue (brief §3.6) — keys only; labels: locales → catalogue.equipment.
// SAME list as supabase/functions/_shared/equipment.ts (the Edge Functions' copy): the
// equipment test fails if the two drift.
export const EQUIPMENT = {
  appliance: [
    "hob", "oven", "microwave", "air_fryer", "slow_cooker", "pressure_cooker", "rice_cooker",
    "thermomix", "blender", "hand_blender", "food_processor", "stand_mixer", "hand_mixer",
    "toaster", "sandwich_maker", "deep_fryer", "grill", "kettle",
  ],
  cookware: [
    "frying_pan", "saucepan", "stock_pot", "wok", "casserole", "paella_pan", "griddle",
    "grill_pan", "roasting_tray", "baking_dish", "baking_tray", "cake_tin", "tart_tin",
    "muffin_tin", "steamer_basket",
  ],
  tool: [
    "chef_knife", "grater", "mandoline", "peeler", "scales", "thermometer", "measuring_jug",
    "whisk", "rolling_pin", "sieve", "colander", "salad_spinner", "mortar", "garlic_press",
    "zester", "spiralizer", "pasta_machine",
  ],
} as const

export const EQUIPMENT_CATEGORIES = ["appliance", "cookware", "tool"] as const

export const KITCHEN_LOCATIONS = ["home", "travel"] as const

// Scan: photos sent per call, and their longest side once resized in the browser
export const SCAN_MAX_PHOTOS = 6
export const SCAN_MAX_SIDE = 1280
// Below this, a found item starts unticked in the review
export const SCAN_CONFIDENT = 0.6
