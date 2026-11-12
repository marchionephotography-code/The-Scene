import {
  Beer, Brush, Clapperboard, Drama, Dumbbell, Film, Gamepad2, Leaf, Moon, Mountain, Music, ShoppingBasket, Smile,
  Trophy, Users, UtensilsCrossed, type LucideIcon,
} from 'lucide-react'
import type { InterestId } from '../lib/profile'

export const INTEREST_ICONS: Record<InterestId, LucideIcon> = {
  'live-music': Music, comedy: Smile, theater: Drama, sports: Trophy, art: Brush, food: UtensilsCrossed,
  drinks: Beer, trivia: Gamepad2, outdoors: Mountain, markets: ShoppingBasket, family: Users, classes: Clapperboard,
  nightlife: Moon, film: Film, chill: Leaf, active: Dumbbell,
}
