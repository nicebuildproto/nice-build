import { scaleRecipe } from "../tools/pure"

export const sampleRecipe = "2 cups flour\n1/2 tsp salt\n1 1/2 tbsp oil\n3 eggs"

export function scaledRecipe(source: string, from: number, to: number) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to < 0) return null
  return scaleRecipe(source, from, to)
}
