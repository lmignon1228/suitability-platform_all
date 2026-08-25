import { markRaw } from 'vue'
import {
  User, DataAnalysis, Warning, CircleCheck,
  TrendCharts, Operation, Reading, Monitor,
  Money, CreditCard, Histogram, Suitcase, Coin,
  ShoppingCart, Timer, Ticket,
  ShoppingBag, Document, EditPen,
} from '@element-plus/icons-vue'

const ICON_MAP = {
  User: markRaw(User),
  DataAnalysis: markRaw(DataAnalysis),
  Warning: markRaw(Warning),
  CircleCheck: markRaw(CircleCheck),
  TrendCharts: markRaw(TrendCharts),
  Operation: markRaw(Operation),
  Reading: markRaw(Reading),
  Monitor: markRaw(Monitor),
  Money: markRaw(Money),
  CreditCard: markRaw(CreditCard),
  Histogram: markRaw(Histogram),
  Suitcase: markRaw(Suitcase),
  Coin: markRaw(Coin),
  ShoppingCart: markRaw(ShoppingCart),
  Timer: markRaw(Timer),
  Ticket: markRaw(Ticket),
  ShoppingBag: markRaw(ShoppingBag),
  Document: markRaw(Document),
  EditPen: markRaw(EditPen),
}

export function resolveIcon(name) {
  return ICON_MAP[name] || null
}

/**
 * 给含 iconName 的数组项注入 icon (markRaw)
 */
export function resolveIcons(items) {
  if (!Array.isArray(items)) return items
  return items.map((item) => {
    if (item.iconName) {
      const { iconName, ...rest } = item
      return { ...rest, icon: resolveIcon(iconName) }
    }
    return item
  })
}
