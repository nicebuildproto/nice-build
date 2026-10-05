export function FieldersIntroNotice() {
  return (
    <aside className="rounded-xl border border-black/[0.08] border-l-[3px] border-l-[var(--nb-primary)] bg-[var(--nb-accent)] px-5 py-4">
      <p className="text-sm font-medium text-[var(--nb-primary)]">Welcome, Fielders team</p>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-[var(--nb-secondary)]">
        <p>This is a working prototype of a flashing designer, built with your customers in mind.</p>
        <p>
          The idea is simple: give customers an easier way to configure their flashing, see their
          design and either request a quote or place an order — without the usual back-and-forth.
        </p>
        <p>Have a play with it and take it all the way through the process. We’d love to hear what you think.</p>
      </div>
      <p className="mt-4 text-sm text-[var(--nb-primary)]">— The Nice Tools team</p>
    </aside>
  )
}
