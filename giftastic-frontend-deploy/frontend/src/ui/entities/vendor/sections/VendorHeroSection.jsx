import { getVendorName } from '../vendorSelectors';
import { hasLoadedVendorField } from '../vendorModel';

export default function VendorHeroSection({ model, access, headerAction }) {
  const name = getVendorName(model);
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="relative isolate h-40 overflow-hidden bg-stone-100 sm:h-48 md:h-56 lg:h-64">
        {hasLoadedVendorField(model, 'bannerUrl') && model.bannerUrl ? (
          <img
            src={model.bannerUrl}
            alt=""
            className="absolute inset-0 block h-full w-full object-cover object-center"
          />
        ) : <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-white to-secondary/10" />}
      </div>
      <div className="relative z-10 px-5 pb-6 sm:px-6">
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative z-20 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white p-1.5 shadow-lg sm:h-28 sm:w-28 sm:p-2">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-primary/5">
                {hasLoadedVendorField(model, 'logoUrl') && model.logoUrl
                  ? <img src={model.logoUrl} alt={name} className="h-full w-full object-cover" />
                  : <span className="material-symbols-outlined text-4xl text-primary/50">storefront</span>}
              </div>
            </div>
            <div className="min-w-0 pb-1 sm:pt-16">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="break-words text-2xl font-bold text-primary sm:text-3xl">{name}</h2>
                {hasLoadedVendorField(model, 'isVerified') && model.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-sm">verified</span> Verified
                  </span>
                )}
              </div>
              {hasLoadedVendorField(model, 'description') && (
                <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                  {model.description || 'No store description provided.'}
                </p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="relative z-20 flex shrink-0 self-start sm:mt-16">
              {headerAction}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
