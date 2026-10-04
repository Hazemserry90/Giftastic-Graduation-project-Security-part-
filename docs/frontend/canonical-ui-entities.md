# Canonical UI entities

The backend domain classes define entity identity, fields, relationships, states, and operations.
Frontend payloads must be adapted into the matching entity model before protected or reusable
representations consume them.

Each entity domain owns:

- its canonical field shape and loaded-field metadata;
- API-shape adapters;
- viewer/context access calculation;
- legal action derivation;
- formatting and derived selectors;
- semantic presentation through entity-specific sections or the shared schema-driven views.

`shared/viewer.js` is the canonical account-capability projection. User, Vendor, Admin, and
Super Admin capabilities are additive. `shared/permissions.js` mirrors the backend permission
vocabulary, and `shared/entitySchemas.js` defines reusable semantic details for all entities.

Presentation containers such as modals, pages, drawers, and forms may control layout,
navigation, focus, loading, and submission. They must not redefine entity fields, normalize
DTOs, infer ownership, or interpret raw permissions.

## Intentional view exceptions

- Create/edit forms hold draft command data because incomplete form input is not yet a persisted
  entity. Their field vocabulary and defaults still come from the canonical entity domain.
- Vendor feedback submission is a command form; persisted feedback moderation uses the canonical
  Vendor Feedback entity.
- Modal shells remain under `components/modals` as overlay containers. Their entity sections now
  consume canonical models, selectors, access results, and actions.
- Embedded Product, Vendor, User, Gift Flow, and Order references use the corresponding canonical
  summary or a normalized snapshot when the backend intentionally stores historical order data.
