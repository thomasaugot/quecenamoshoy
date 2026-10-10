// The equipment catalogue — keys only. SAME list as src/constants/equipment.ts (a Vitest
// test fails if the two drift). The model may only answer with these keys.
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

export type EquipmentCategory = keyof typeof EQUIPMENT
