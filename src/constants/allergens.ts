// Allergens and intolerances — a HARD rule (brief §3.8). Labels: locales → catalogue.allergy.
// `synonyms` are ingredient words (es / en / fr), matched by utils/allergens.ts: the safety net
// that never trusts the AI alone ("nata" = lactose, "piñones" = nuts). Matching data, not copy.
export const ALLERGENS = [
  { key: "gluten", synonyms: ["gluten", "trigo", "harina", "pan", "pasta", "cebada", "centeno", "wheat", "flour", "bread", "barley", "rye", "blé", "farine", "orge", "seigle", "couscous", "cuscús", "seitan", "espelta", "spelt", "épeautre"] },
  { key: "lactose", synonyms: ["leche", "nata", "queso", "mantequilla", "yogur", "lactosa", "milk", "cream", "cheese", "butter", "yogurt", "lactose", "lait", "crème", "fromage", "beurre", "yaourt", "parmesano", "parmesan", "mozzarella", "bechamel", "béchamel"] },
  { key: "eggs", synonyms: ["huevo", "huevos", "yema", "clara", "mayonesa", "egg", "eggs", "yolk", "mayonnaise", "œuf", "oeuf", "œufs", "oeufs", "jaune"] },
  { key: "nuts", synonyms: ["nuez", "nueces", "almendra", "avellana", "anacardo", "pistacho", "piñón", "piñones", "nut", "nuts", "walnut", "almond", "hazelnut", "cashew", "pistachio", "pine nut", "noix", "amande", "noisette", "cajou", "pistache", "pignon", "pecan", "pacana", "macadamia"] },
  { key: "peanuts", synonyms: ["cacahuete", "cacahuetes", "maní", "peanut", "peanuts", "cacahuète", "arachide"] },
  { key: "fish", synonyms: ["pescado", "merluza", "salmón", "atún", "bacalao", "anchoa", "sardina", "fish", "salmon", "tuna", "cod", "anchovy", "sardine", "poisson", "saumon", "thon", "cabillaud", "morue", "anchois", "dorada", "lubina"] },
  { key: "crustaceans", synonyms: ["gamba", "gambas", "langostino", "cangrejo", "bogavante", "cigala", "shrimp", "prawn", "crab", "lobster", "langoustine", "crevette", "crabe", "homard"] },
  { key: "molluscs", synonyms: ["mejillón", "mejillones", "almeja", "calamar", "pulpo", "sepia", "ostra", "vieira", "mussel", "clam", "squid", "octopus", "oyster", "scallop", "moule", "palourde", "calamar", "poulpe", "huître", "coquille"] },
  { key: "soy", synonyms: ["soja", "tofu", "edamame", "miso", "soy", "soya", "tempeh"] },
  { key: "sesame", synonyms: ["sésamo", "tahini", "sesame", "sésame"] },
  { key: "celery", synonyms: ["apio", "celery", "céleri"] },
  { key: "mustard", synonyms: ["mostaza", "mustard", "moutarde"] },
  { key: "sulphites", synonyms: ["sulfito", "sulfitos", "vino", "vinagre", "sulphite", "sulfite", "wine", "vinegar", "vin", "vinaigre"] },
  { key: "lupin", synonyms: ["altramuz", "altramuces", "lupin", "lupine"] },
] as const

export type AllergenKey = (typeof ALLERGENS)[number]["key"]
