export type YawBasis = "engine default" | "community convention"

export type SensGame = {
  id: string
  name: string
  yaw: number
  basis: YawBasis
}

/**
 * Source-family games use the engine default m_yaw of 0.022.
 * Valorant and Overwatch use yaw figures widely used to match cm/360; they are community conventions.
 * Games without one reliable yaw, including Call of Duty, are omitted.
 */
export const sensitivityGames: SensGame[] = [
  { id: "cs2", name: "Counter-Strike 2", yaw: 0.022, basis: "engine default" },
  { id: "csgo", name: "CS:GO", yaw: 0.022, basis: "engine default" },
  { id: "source", name: "Source (TF2, CSS)", yaw: 0.022, basis: "engine default" },
  { id: "apex", name: "Apex Legends", yaw: 0.022, basis: "engine default" },
  { id: "valorant", name: "Valorant", yaw: 0.07, basis: "community convention" },
  { id: "overwatch2", name: "Overwatch 2", yaw: 0.0066, basis: "community convention" },
]

export function edpi(dpi: number, sensitivity: number) {
  return dpi * sensitivity
}

export function cmPer360(dpi: number, sensitivity: number, yaw: number) {
  return (2.54 * 360) / (dpi * sensitivity * yaw)
}

export function sensitivityFromCm360(dpi: number, cm: number, yaw: number) {
  return (2.54 * 360) / (dpi * cm * yaw)
}

export function convertSensitivity(sourceSens: number, sourceYaw: number, destYaw: number) {
  return (sourceSens * sourceYaw) / destYaw
}
