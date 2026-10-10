type Tree = { [key: string]: unknown }

const isTree = (value: unknown): value is Tree =>
  typeof value === "object" && value !== null && !Array.isArray(value)

// `over` wins; nested objects are merged, everything else is replaced.
export const deepMerge = <T extends Tree>(base: T, over: Tree): T => {
  const out: Tree = { ...base }
  for (const [key, value] of Object.entries(over)) {
    const current = out[key]
    out[key] = isTree(current) && isTree(value) ? deepMerge(current, value) : value
  }
  return out as T
}
