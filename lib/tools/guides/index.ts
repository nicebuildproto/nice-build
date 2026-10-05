import { batchGuides } from "@/lib/tools/guides/batch"
import { addedGuides } from "@/lib/tools/guides/added"
import { businessGuides } from "@/lib/tools/guides/business"
import { calculatorGuides } from "@/lib/tools/guides/calculators"
import { developerGuides } from "@/lib/tools/guides/developer"
import { filesDesignVizGuides } from "@/lib/tools/guides/files-design-viz"
import { homePeopleTextGuides } from "@/lib/tools/guides/home-people-text"
import { playGuides } from "@/lib/tools/guides/play"
import type { ToolGuideCopy } from "@/lib/tools/guides/types"

export const toolGuides: Record<string, ToolGuideCopy> = {
  ...addedGuides,
  ...calculatorGuides,
  ...developerGuides,
  ...filesDesignVizGuides,
  ...businessGuides,
  ...homePeopleTextGuides,
  ...playGuides,
  ...batchGuides,
}
