export type ShoppingItem = {
  id: string
  item: string
  quantity: string
  dishId: string | null
  dishName: string | null
  checked: boolean
}

// What the list shows: the same ingredient from several recipes on one line, amounts added up
export type ShoppingLine = {
  key: string
  item: string
  quantity: string
  ids: string[]          // the rows behind this line (ticking it ticks them all)
  dishNames: string[]
  checked: boolean
}
