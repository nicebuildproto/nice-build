export const postingPlatforms = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["x", "X"],
  ["linkedin", "LinkedIn"],
  ["threads", "Threads"],
] as const

export const postingWindows: Record<string, { when: string; hours: string }> = {
  instagram: { when: "Weekday late morning to early afternoon", hours: "10:00–13:00" },
  tiktok: { when: "Early evening, especially mid-week", hours: "18:00–21:00" },
  youtube: { when: "Early afternoon, or early evening", hours: "14:00–16:00 or 18:00–20:00" },
  x: { when: "Weekday late morning", hours: "09:00–12:00" },
  linkedin: { when: "Tuesday, Wednesday, or Thursday mid-morning", hours: "09:00–11:00" },
  threads: { when: "Late morning, close to a typical Instagram window", hours: "10:00–13:00" },
}
