export type SensGame = {
  id: string
  name: string
  yaw: number
}

/** Games listed here use a documented yaw. Others are omitted rather than guessed. */
export const sensitivityGames: SensGame[] = [
  { id: "cs2", name: "Counter-Strike 2", yaw: 0.022 },
  { id: "csgo", name: "CS:GO", yaw: 0.022 },
  { id: "source", name: "Source (TF2, CSS)", yaw: 0.022 },
  { id: "apex", name: "Apex Legends", yaw: 0.022 },
  { id: "valorant", name: "Valorant", yaw: 0.07 },
  { id: "overwatch2", name: "Overwatch 2", yaw: 0.0066 },
  { id: "cod", name: "Call of Duty", yaw: 0.0066 },
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
