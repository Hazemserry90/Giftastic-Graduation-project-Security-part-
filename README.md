# Giftastic

Giftastic is a full-stack marketplace for curated gifts and customizable gift experiences. Customers can discover products, assemble gift flows, place and track orders, and interact with vendors. Vendors can manage storefronts, products, delivery pricing, gift flows, and order fulfillment. Administrators can moderate the platform and operate its financial and support workflows.

This project was built by a student team, received incubation funding, and was used with real users. It is also my largest software project and my primary engineering portfolio project. I implemented the system end to end across the backend, frontend, data model, security model, deployment configuration, testing, and product workflows.

The project demonstrates backend-focused software engineering with Java, Spring Boot, Spring Security, PostgreSQL, JPA, JWT authentication, REST API design, authorization, domain modeling, and production-oriented operational tradeoffs. It also includes a React frontend because a backend product is only useful when its workflows work for real users.

## What the platform does

- Customer registration, login, profiles, addresses, favorites, reviews, reports, and notifications
- Product catalog, categories, search, recommendations, product moderation, and image storage
- Guest checkout, authenticated checkout, order history, guest order tracking, delivery zones, and delivery estimates
- Cash on delivery and manually confirmed Instapay payment workflows
- Vendor applications, storefronts, product management, inventory-aware ordering, analytics, delivery pricing, and order operations
- Configurable multi-step gift flows such as build-a-box experiences
- Administrative workflows for users, vendors, products, categories, reviews, reports, orders, commissions, payment proofs, and permissions
- Fine-grained administrative permissions with a `SUPER_ADMIN` capability

## Engineering scope

The repository contains:

- A Spring Boot backend organized into 18 modules
- A React 18 and Vite frontend with Tailwind CSS
- 29 JPA entities and a PostgreSQL persistence layer
- JWT-based stateless authentication with BCrypt password hashing
- Method-level authorization using roles, permissions, ownership checks, and a banned-user filter
- A REST API with OpenAPI and Swagger UI support
- Cloudflare R2 compatible object storage for product and profile media
- A heuristic recommendation engine based on purchase history, favorites, categories, ratings, and product popularity
- Frontend entity models, adapters, selectors, access policies, semantic views, command modules, and workflow modules
- Backend unit and service tests plus frontend model, architecture, regression, and workflow tests

## Architecture

### Backend

The backend is a modular monolith. Each business area owns its domain objects, repositories, services, controllers, and related policies where practical.

```text
Spring Boot application
├── Identity and authentication
├── User and profile management
├── Vendor and vendor applications
├── Product and category catalog
├── Cart and checkout
├── Orders and payment workflows
├── Delivery and gift flows
├── Reviews, reports, and notifications
├── Recommendations and search
├── Commissions and financial analytics
└── Administrative permissions and moderation
```

The main request path is:

```text
HTTP request
  -> controller and validation
  -> authorization and ownership policy
  -> application service
  -> domain model and repository
  -> PostgreSQL or object storage
```

### Frontend

The frontend is a React single-page application. It separates API services from reusable UI entity models and workflow-specific screens. The canonical entity layer adapts backend payloads before reusable views consume them, which keeps permissions, formatting, field availability, and actions from being reimplemented independently across pages.

### Deployment shape

- Backend: Spring Boot service with PostgreSQL and optional Cloudflare R2 object storage
- Frontend: Vite build deployable to Vercel, Netlify, or Railway
- Vercel deployments can use the edge proxy in `giftastic-frontend-deploy/api/railway-proxy.js`
- Runtime configuration is supplied through environment variables. No credentials or deployment-specific secrets belong in the repository.

See the [deployment guide](docs/operations/deployment.md), [modular monolith guide](docs/architecture/modular-monolith.md), and [architecture diagrams](docs/architecture/diagrams/README.md) for more detail.

## Architectural decisions

### Modular monolith instead of microservices

The product needed many connected workflows, but the team did not need the operational cost of distributed services. A modular monolith gave us one deployable application, transactional database access, simpler local development, and clear internal boundaries. The module boundaries leave room for future extraction if a real scaling or ownership need appears.

### Stateless JWT authentication

The API uses stateless JWT authentication so the frontend can call the backend across separate hosting environments. Passwords are stored as BCrypt hashes, sessions are not kept in server memory, and endpoint access is reinforced with method-level authorization.

### Roles plus fine-grained permissions

A single role hierarchy was not enough for a marketplace with vendors, moderators, administrators, and financial operations. The backend therefore combines roles with explicit permission flags and ownership checks. `SUPER_ADMIN` is treated as an explicit administrative capability rather than as an implicit assumption in every controller.

### JSON-driven gift flows

Gift flows are stored as configuration data rather than as a new relational table for every possible step or template. The frontend owns the presentation template, while the backend persists the vendor-owned flow configuration and carries grouping metadata through cart and order items. This makes new gift experiences possible without a backend schema change for every variation.

### Business rules live at the workflow boundary

Stock checks, payment confirmation, order status transitions, vendor ownership, commission calculations, review moderation, and delivery windows are enforced in backend services and domain methods. The frontend improves usability and prevents obviously invalid actions, but it is not the authority for sensitive decisions.

## Business decisions

- Start with a focused marketplace model: customers, vendors, products, gifts, orders, and platform administration
- Support guest checkout because first-time buyers should not need an account before making a purchase
- Use vendor applications and product moderation to protect marketplace quality
- Support manual Instapay confirmation because it matched the operating context and available payment methods
- Treat delivery zones and vendor delivery pricing as first-class business concepts rather than hard-coded frontend behavior
- Use commissions and payment-proof workflows to model the platform's relationship with vendors
- Keep recommendation behavior useful without requiring an external ML platform or a large training dataset

## Running locally

### Prerequisites

- Java 21
- Maven, or the included Maven wrapper
- Node.js and npm
- PostgreSQL
- A database and object-storage account for workflows that require them

### Backend

```bash
cd giftastic-deployment-env
cp .env.example .env
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run` instead. Fill in the values in `.env` before starting the application. The required configuration includes the PostgreSQL connection, a JWT secret of at least 64 characters, JWT expiry, Instapay settings, and Cloudflare R2 settings when media upload workflows are enabled.

The API is served under `/api/v1`. OpenAPI JSON is available at `/api-docs`, and the Swagger UI is available at `/swagger-ui.html` when the backend is running.

### Frontend

```bash
cd giftastic-frontend-deploy/frontend
npm ci
copy .env.example .env.local
npm run dev
```

On macOS or Linux, replace the `copy` command with:

```bash
cp .env.example .env.local
```

For local development, set `VITE_API_BASE_URL=http://localhost:8080/api/v1`, `VITE_DEV_BACKEND_ORIGIN=http://localhost:8080`, and `VITE_ALLOW_LOCAL_API_BASE_URL=true` in `.env.local`.

### Creating the first super administrator

The application deliberately does not seed a privileged administrator. Register a normal user through `POST /api/v1/auth/register`, then use a controlled database session to create the corresponding admin record and grant the sentinel permission:

```sql
INSERT INTO admins (user_id)
SELECT id FROM users WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_permissions (user_id, permission)
SELECT id, 'SUPER_ADMIN' FROM users WHERE email = 'admin@example.com'
ON CONFLICT DO NOTHING;
```

Replace the example email with the account you registered. Run this only against a database you control, then log in again so the new authorities are included in the JWT.

## Testing

Backend tests:

```bash
cd giftastic-deployment-env
./mvnw test
```

Frontend tests and checks:

```bash
cd giftastic-frontend-deploy/frontend
npm run lint
npm run build
npm run test:phase1
npm run test:phase1-semantic
```

The frontend test suite covers entity models, adapters, permissions, selectors, command boundaries, semantic views, workflow behavior, and regression cases. The backend suite covers domain rules, services, controllers, security, orders, commissions, and related business behavior.

## Security monitoring lab

The repository also contains a defense-in-depth security monitoring lab that connects the application to Wazuh (SIEM) and Cowrie (SSH/Telnet honeypot). It collects structured authentication and authorization events from the backend, host and file-integrity signals from a Wazuh agent, and attacker behavior against a decoy service, then correlates them into severity-ranked alerts.

- Application integration: `SecurityAuditLogger` emits JSON events to `logs/security-audit.log` through a dedicated Logback appender.
- Detection rules: `security-monitoring/wazuh/rules/` (Giftastic and Cowrie).
- Lab stack: `security-monitoring/docker-compose.yml` (Wazuh manager, indexer, dashboard, optional Cowrie).
- Documentation: `security-monitoring/docs/` (architecture, deployment, detection coverage, demonstration, residual risk).

See the [security monitoring lab](security-monitoring/README.md).

## Limitations

This is a real project, not a claim that every production concern is solved.

- Recommendations are deterministic and heuristic-based. The ML engine is an extension point, not an implemented machine-learning system.
- Instapay confirmation is an operational workflow, not a direct payment-provider integration.
- Notifications currently include an in-application and console-oriented provider model rather than a complete email or SMS delivery system.
- The application currently relies on Hibernate schema updates and a small number of SQL maintenance scripts. A production system should use versioned migrations such as Flyway or Liquibase.
- Rate limiting is process-local. A horizontally scaled deployment needs a shared store or gateway-level rate limiting.
- Automated coverage is strongest around backend rules and frontend contracts. Full browser, load, disaster-recovery, and third-party integration testing remain future work.
- The repository contains deployment configurations for several hosts, but it does not attempt to provide infrastructure-as-code for every hosting provider.

## Mistakes and lessons

The project became stronger after we confronted several early assumptions:

1. We initially allowed UI pages and modals to interpret backend entities independently. That created duplicated field and permission logic. We introduced canonical frontend entity models, adapters, access policies, and semantic views to restore a single interpretation boundary.
2. We designed a broad feature surface before every boundary was stable. The later modularization work showed why domain ownership and workflow contracts should be established before adding more screens.
3. `ddl-auto: update` and ad hoc SQL were convenient during an incubation project, but they are not a substitute for disciplined production migrations.
4. A local in-memory rate limiter is useful as a first safety layer, but it does not coordinate across multiple service instances.
5. Manual payment confirmation was a reasonable business decision for the initial operating model, but it also makes reconciliation, fraud controls, and automation more important as transaction volume grows.

## How we used AI

AI-assisted tools were used as development accelerators for scaffolding, repetitive refactoring, test-case drafting, code exploration, and documentation cleanup. They were not treated as an authority or as a production dependency.

The engineering process remained human-owned: requirements came from the product and team, architectural decisions were reviewed against the codebase, generated changes were inspected, and behavior was checked with tests and manual validation. The recommendation feature in the application is also worth distinguishing from AI-assisted development: its current production implementation is a transparent heuristic engine, not a generative model.

## Project process

The team managed the project with Jira for task tracking, Confluence for shared documentation, and recurring meetings for planning, design discussion, integration, and review. That process mattered because the project combined product decisions, frontend and backend work, deployment concerns, and operational workflows rather than being an isolated coding exercise.

## Future focus

- Introduce versioned database migrations and repeatable environment provisioning
- Replace process-local rate limiting with a shared or edge-based solution
- Add structured observability, tracing, alerting, and operational dashboards
- Integrate transactional email and reliable notification delivery
- Connect payment confirmation to a provider or reconciliation workflow where appropriate
- Add full end-to-end browser tests, contract tests between deployments, and load testing
- Evolve recommendations toward measured hybrid ranking with privacy-conscious analytics
- Extract services only where traffic, scaling, or team ownership justifies the operational cost

## Documentation

- [Product requirements](docs/product/requirements.txt)
- [User stories](docs/product/user-stories.txt)
- [Gift flow architecture](docs/architecture/gift-flow.md)
- [Modular monolith architecture](docs/architecture/modular-monolith.md)
- [Frontend deployment](docs/operations/deployment.md)
- [Security monitoring lab](security-monitoring/README.md)
- [Frontend design system](docs/design/design-system.md)
- [Canonical frontend entities](docs/frontend/canonical-ui-entities.md)
- [ERD and UML diagrams](docs/architecture/diagrams/README.md)

## License

This project is source available under the [PolyForm Noncommercial License 1.0.0](LICENSE). You may study, test, modify, and share the project for noncommercial purposes, subject to the license terms and required notices. Commercial use requires separate written permission from the copyright holders.

Required Notice: Copyright © 2026 Giftastic Contributors

## Team

Thank you to the team members who contributed to the project:

- [OmarAhmed770](https://github.com/OmarAhmed770)
- [Hazemserry90](https://github.com/Hazemserry90)
- [Ahmed-Mohamed-Atef](https://github.com/Ahmed-Mohamed-Atef)
- [FareedDehne](https://github.com/FareedDehne)
- [amjad639](https://github.com/amjad639)
