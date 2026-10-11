/** Preserve arbitrary-size exact rationals; algebraic values retain Z3 notation. */
export const format_exact_value = (value: string): string => {
  const rational = /^\(\/ ([0-9]+)(?:\.0+)? ([0-9]+)(?:\.0+)?\)$/.exec(value)
  if (rational) return `${rational[1]}/${rational[2]}`
  const negative = /^\(- (.*)\)$/.exec(value)
  if (negative) return `-${format_exact_value(negative[1])}`
  return value.replace(/^([0-9]+)\.0+$/, '$1')
}

