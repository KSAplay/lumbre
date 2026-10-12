export type CategoryId = 'ENTRADAS' | 'PRINCIPALES' | 'POSTRES' | 'BEBIDAS'

export interface Category {
  id: CategoryId
  label: string
}

export interface DishOption {
  name: string
  choices: string[]
}

export interface Dish {
  id: number
  name: string
  price: number
  category: CategoryId
  description: string
  imageUrl: string
  isAvailable: boolean
  options?: DishOption[]
}
