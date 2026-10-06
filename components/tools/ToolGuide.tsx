import { registry, type ToolEntry } from "@/lib/registry"
import { toolGuides } from "@/lib/tools/guides"
import Link from "next/link"

const heading = "text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase"

export function ToolGuide({ slug }: { slug: string }) {
  const tool = registry.find((item) => item.slug === slug)
  const guide = toolGuides[slug]
  if (!tool || !guide) return null
  const related = relatedTools(tool)

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <section className="mt-16 flex max-w-2xl flex-col gap-3" aria-labelledby={`${slug}-example`}>
        <h2 id={`${slug}-example`} className={heading}>
          Worked example
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{guide.example}</p>
      </section>
      <section className="mt-12 flex max-w-2xl flex-col gap-5" aria-labelledby={`${slug}-faq`}>
        <h2 id={`${slug}-faq`} className={heading}>
          FAQ
        </h2>
        <dl className="flex flex-col gap-5">
          {guide.faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-1.5">
              <dt className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">{faq.question}</dt>
              <dd className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
      {related.length > 0 ? (
        <aside className="mt-16 flex flex-col gap-4" aria-labelledby={`${slug}-related`}>
          <h2 id={`${slug}-related`} className={heading}>
            {tool.category === "calculators" ? "Related calculators" : "Related tools"}
          </h2>
          <ul className="flex flex-col gap-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={item.route} className="text-[13px] text-[var(--nb-primary)] underline-offset-4 hover:underline">
                  {item.title}
                </Link>
                <p className="text-[13px] text-[var(--nb-secondary)]">{item.description}</p>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </>
  )
}

function relatedTools(tool: ToolEntry) {
  const live = registry.filter((item) => item.status === "live" && item.slug !== tool.slug)
  if (tool.cluster) return live.filter((item) => item.cluster === tool.cluster)
  const sameCategory = registry.filter(
    (item) => item.status === "live" && item.category === tool.category && item.slug !== tool.slug,
  )
  const index = registry.findIndex((item) => item.slug === tool.slug)
  const later = sameCategory.filter((item) => registry.indexOf(item) > index)
  const earlier = sameCategory.filter((item) => registry.indexOf(item) < index)
  return [...later, ...earlier].slice(0, 4)
}
