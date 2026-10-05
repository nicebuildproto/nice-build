const COMMON = new Set([
  "password",
  "password1",
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "abc123",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "monkey",
  "dragon",
  "login",
  "princess",
  "football",
  "baseball",
  "starwars",
  "passw0rd",
  "master",
])

export type StrengthBand = "empty" | "very-weak" | "weak" | "fair" | "strong" | "very-strong"

export type PasswordReport = {
  length: number
  charset: number
  entropy: number
  score: number
  band: StrengthBand
  label: string
  hints: string[]
  classes: { lower: boolean; upper: boolean; digit: boolean; symbol: boolean }
}

export function analysePassword(password: string): PasswordReport {
  const length = password.length
  if (!length) {
    return {
      length: 0,
      charset: 0,
      entropy: 0,
      score: 0,
      band: "empty",
      label: "Enter a password",
      hints: ["Type a password to see a local estimate. Nothing is sent anywhere."],
      classes: { lower: false, upper: false, digit: false, symbol: false },
    }
  }

  const classes = {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  let charset = 0
  if (classes.lower) charset += 26
  if (classes.upper) charset += 26
  if (classes.digit) charset += 10
  if (classes.symbol) charset += 33
  if (!charset) charset = 1

  let entropy = length * Math.log2(charset)
  const hints: string[] = []
  const lower = password.toLowerCase()

  if (COMMON.has(lower)) {
    entropy = Math.min(entropy, 12)
    hints.push("This matches a commonly used password, so the estimate is capped.")
  }
  if (/^[a-z]+$/.test(password) || /^[A-Z]+$/.test(password)) {
    entropy *= 0.7
    hints.push("Mix upper and lower case if the site allows it.")
  }
  if (/^\d+$/.test(password)) {
    entropy *= 0.45
    hints.push("Digits on their own are easy to try in order.")
  }
  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.85
    hints.push("Repeated characters add less than unique ones.")
  }
  if (hasSequence(lower)) {
    entropy *= 0.8
    hints.push("Keyboard or alphabet runs are easier to guess than they look.")
  }
  if (length < 12) hints.push("Longer is usually more useful than a few extra symbol types.")
  if (!classes.digit && !classes.symbol) hints.push("A number or a symbol raises the search space.")
  if (length >= 16 && charset >= 36) hints.push("Length is doing most of the work here — that’s a good sign.")

  entropy = Math.max(0, entropy)
  const score = Math.max(0, Math.min(100, Math.round((entropy / 80) * 100)))
  const band = bandFor(score, length, COMMON.has(lower))
  if (!hints.length) hints.push("This is a rough local estimate, not a guarantee that a password is safe to reuse.")

  return {
    length,
    charset,
    entropy,
    score,
    band,
    label: labelFor(band),
    hints,
    classes,
  }
}

function bandFor(score: number, length: number, common: boolean): StrengthBand {
  if (common || length < 6 || score < 20) return "very-weak"
  if (score < 40) return "weak"
  if (score < 60) return "fair"
  if (score < 80) return "strong"
  return "very-strong"
}

function labelFor(band: StrengthBand) {
  if (band === "very-weak") return "Very weak"
  if (band === "weak") return "Weak"
  if (band === "fair") return "Fair"
  if (band === "strong") return "Strong"
  if (band === "very-strong") return "Very strong"
  return "Enter a password"
}

function hasSequence(value: string) {
  const rows = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"]
  for (const row of rows) {
    for (let i = 0; i < value.length - 2; i++) {
      const slice = value.slice(i, i + 3)
      if (row.includes(slice) || row.includes([...slice].reverse().join(""))) return true
    }
  }
  return false
}
