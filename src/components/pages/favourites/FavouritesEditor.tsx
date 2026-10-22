import { useTranslations } from "use-intl"
import { FavouritesDishForm } from "@/components/pages/favourites/FavouritesDishForm"
import { Modal } from "@/components/ui/Modal"
import { useDishes } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import { useFavouritesStore } from "@/stores/favourites-store"
import type { DishInput } from "@/types/dish"

// Add or edit a dish. A new dish starts as a favourite of me.
export const FavouritesEditor = () => {
  const t = useTranslations("favourites.editor")
  const editing = useFavouritesStore((s) => s.editing)
  const closeEditor = useFavouritesStore((s) => s.closeEditor)
  const { data: dishes = [] } = useDishes()
  const { data: people = [] } = usePeople()
  const dish = editing && editing !== "new" ? dishes.find((d) => d.id === editing) : undefined
  const me = people.find((p) => p.isMe)

  const initial: DishInput = dish
    ? { name: dish.name, description: dish.description, proteins: dish.proteins, traits: dish.traits, tags: dish.tags, temp: dish.temp, lovedBy: dish.lovedBy, dislikedBy: dish.dislikedBy }
    : { name: "", description: null, proteins: [], traits: [], tags: [], temp: null, lovedBy: me ? [me.id] : [], dislikedBy: [] }

  return (
    <Modal isOpen={editing !== null} onClose={closeEditor} title={dish ? t("editTitle") : t("newTitle")}>
      <FavouritesDishForm key={editing ?? "closed"} dishId={dish?.id ?? null} initial={initial} onDone={closeEditor} />
    </Modal>
  )
}
