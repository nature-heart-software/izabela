import type { ValueIteratee } from 'lodash'
import groupBy from 'lodash/groupBy'

export const groupOptions = <L extends any[]>(
  options: L,
  iteratee: ValueIteratee<L[number]>,
) => {
  const groups = groupBy(options, iteratee)
  return Object.keys(groups).map((category) => ({
    label: category,
    children: groups[category],
  }))
}
