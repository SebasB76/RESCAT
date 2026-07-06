export type BoxTipo = "solo" | "duo" | "familia"

const KG_BY_TIPO: Record<BoxTipo, number> = {
  solo: 1.0,
  duo: 2.0,
  familia: 3.5,
}

const CO2_KG_PER_FOOD_KG = 2.5

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function foodKgSaved(tipo: BoxTipo) {
  return KG_BY_TIPO[tipo] ?? KG_BY_TIPO.duo
}

export function co2KgSaved(tipo: BoxTipo) {
  return round1(foodKgSaved(tipo) * CO2_KG_PER_FOOD_KG)
}

export function totalKgSaved(tipos: BoxTipo[]) {
  return round1(tipos.reduce((sum, tipo) => sum + foodKgSaved(tipo), 0))
}

export function totalCo2Saved(tipos: BoxTipo[]) {
  return round1(tipos.reduce((sum, tipo) => sum + co2KgSaved(tipo), 0))
}
