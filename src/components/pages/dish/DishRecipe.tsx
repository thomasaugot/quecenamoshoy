import { useState } from "react"
import { useTranslations } from "use-intl"
import { DishRecipeEditor } from "@/components/pages/dish/DishRecipeEditor"
import { DishRecipeEmpty } from "@/components/pages/dish/DishRecipeEmpty"
import { DishRecipeView } from "@/components/pages/dish/DishRecipeView"
import { DishMyNotes } from "@/components/pages/dish/DishMyNotes"
import { DishNotes } from "@/components/pages/dish/DishNotes"
import { useRecipe } from "@/hooks/useRecipe"
import type { Dish } from "@/types/dish"

// The recipe: written by Gemini for my kitchen, imported from a link, or my own — and editable.
// Animated as one block: its content changes after the entrance.
export const DishRecipe = ({ dish }: { dish: Dish }) => {
  const t = useTranslations("dish.recipe")
  const { data: recipe } = useRecipe(dish.id)
  const [editing, setEditing] = useState(false)

  return (
    <section aria-labelledby="dish-recipe" data-anim="rise" className="invisible flex flex-col gap-6">
      <DishMyNotes dish={dish} />
      <DishNotes dishId={dish.id} />
      <h2 id="dish-recipe" className="text-heading">{t("title")}</h2>
      {editing && recipe ? (
        <DishRecipeEditor dishId={dish.id} recipe={recipe} onDone={() => setEditing(false)} />
      ) : recipe ? (
        <DishRecipeView dish={dish} recipe={recipe} onEdit={() => setEditing(true)} />
      ) : (
        <DishRecipeEmpty dish={dish} />
      )}
    </section>
  )
}
