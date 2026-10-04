import { Link } from 'react-router-dom';
import { getVendorName } from './vendorSelectors';
import { hasLoadedVendorField } from './vendorModel';

export default function VendorSummary({ model, access, onPreview }) {
  const name = getVendorName(model);
  const href = model.supplierId ? `/vendors/${model.supplierId}` : null;
  return (
    <div className="group min-w-0 max-w-full overflow-hidden rounded-xl border border-surface-variant/30 bg-white shadow-plum transition-all hover:-translate-y-1 hover:shadow-xl">
      {href ? (
        <Link to={href} className="block max-w-full">
          <div className="relative h-32 max-w-full overflow-hidden bg-stone-100">
            {model.bannerUrl ? <img src={model.bannerUrl} alt="" className="block h-full w-full max-w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />}
          </div>
        </Link>
      ) : <div className="relative h-32 bg-stone-100" />}
      <div className="relative p-8 pt-12">
        <div className="absolute -top-10 left-8 h-20 w-20 overflow-hidden rounded-xl border border-surface-variant/20 bg-white p-1 shadow-lg">
          {model.logoUrl ? <img src={model.logoUrl} alt={name} className="h-full w-full max-w-full rounded-lg object-cover" /> : <div className="flex h-full w-full items-center justify-center rounded-lg bg-primary/5"><span className="material-symbols-outlined text-primary/40">storefront</span></div>}
        </div>
        <div className="mb-4 flex items-start justify-between gap-3">
          {href ? <Link to={href} className="min-w-0"><h2 className="break-words text-xl font-bold text-primary [overflow-wrap:anywhere]">{name}</h2></Link> : <h2 className="break-words text-xl font-bold text-primary [overflow-wrap:anywhere]">{name}</h2>}
          {hasLoadedVendorField(model, 'isVerified') && model.isVerified && <span className="material-symbols-outlined text-sm text-tertiary">verified</span>}
        </div>
        {hasLoadedVendorField(model, 'description') && <p className="mb-6 line-clamp-2 max-w-full whitespace-normal break-words text-sm text-on-surface-variant [overflow-wrap:anywhere]">{model.description || 'No store description provided.'}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {href && <Link to={href} className="inline-flex items-center font-bold text-primary">Explore Collection<span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span></Link>}
          {onPreview && <button type="button" onClick={() => onPreview(model)} className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary hover:bg-primary/5">Details</button>}
        </div>
      </div>
    </div>
  );
}
