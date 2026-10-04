# Modular Monolith

Giftastic is a modular monolith: one deployable Spring Boot application organized into bounded business modules.

## Modules

All business code lives under:

- `src/main/java/com/giftastic/giftastic/modules/*`

Current modules include:

- `admin`
- `ai`
- `cart`
- `category`
- `commission`
- `common`
- `delivery`
- `flow`
- `identity`
- `notification`
- `order`
- `product`
- `reminder`
- `report`
- `review`
- `search`
- `user`
- `vendor`

## Boundaries

- **Put code where it belongs**: product logic goes in `product`, order logic goes in `order`, etc.
- **Don't leak internals**: avoid reaching into another module's internal classes unless it is intentionally part of its public surface.
- **No circular dependencies**: modules should not end up depending on each other in a loop.
- **Prefer clean boundaries**: when a module needs something from another module, use a clear service/contract rather than mixing responsibilities.
- **Keep shared code narrow**: place only genuinely cross-cutting concerns in `common`.
