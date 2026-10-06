import { exactAge } from "../tools/format"
import { localDateValue } from "./time"

export function parseLocalDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function birthdayInYear(born: Date, year: number) {
  const month = born.getMonth()
  const day = born.getDate()
  if (month === 1 && day === 29 && !isLeap(year)) return new Date(year, 1, 28)
  return new Date(year, month, day)
}

export function nextBirthday(born: Date, asOf: Date) {
  const thisYear = birthdayInYear(born, asOf.getFullYear())
  if (thisYear >= startOfDay(asOf)) return thisYear
  return birthdayInYear(born, asOf.getFullYear() + 1)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export type AgeDetails = {
  years: number
  months: number
  days: number
  totalDays: number
  weekdayBorn: string
  nextBirthday: Date
  daysUntilBirthday: number
  nextBirthdayLabel: string
}

export function ageDetails(dob: string, asOf: string): AgeDetails | null {
  const from = parseLocalDate(dob)
  const to = parseLocalDate(asOf)
  if (!from || !to) return null
  const parts = exactAge(from, to)
  if (!parts) return null
  const next = nextBirthday(from, to)
  const daysUntil = Math.round((next.getTime() - startOfDay(to).getTime()) / 86_400_000)
  const weekdayBorn = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(from)
  const nextBirthdayLabel = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(next)
  return {
    ...parts,
    totalDays: Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000),
    weekdayBorn,
    nextBirthday: next,
    daysUntilBirthday: daysUntil,
    nextBirthdayLabel,
  }
}

export function formatAge(result: AgeDetails) {
  return `${result.years} years, ${result.months} months, ${result.days} days`
}

export { localDateValue }
