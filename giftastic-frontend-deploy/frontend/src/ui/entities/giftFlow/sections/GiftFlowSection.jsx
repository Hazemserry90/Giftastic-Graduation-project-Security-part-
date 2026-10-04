// Canonical Gift Flow presentation primitive.
export default function GiftFlowSection({ title, icon, children, action }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>}
          <h3 className="font-label-md text-sm font-bold uppercase tracking-[0.18em] text-primary">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
