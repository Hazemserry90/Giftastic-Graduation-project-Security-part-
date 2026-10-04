# Gift Flow Architecture

This document describes the architecture of the **Gift Flow** feature, which allows vendors to create multi-step, customizable gift experiences (e.g., "Build-a-Box") without requiring backend code changes for each new variation.

## Core Philosophy: JSON-Driven UI

To adhere to the KISS principle and prevent backend bloat, the backend does **not** model individual steps, options, or UI templates relationally. Instead, it acts as a secure storage engine for a JSON schema.

### Templates are a UI Concern
Archetypes or "Templates" for flows (e.g., standard "3-Step Gift Box") live entirely in the Frontend/UI layer. The backend does not store generic templates.

### Vendor Persistence
When a vendor uses the UI to configure a template (e.g., locking a step to a specific product category), the UI sends the finalized JSON schema to the backend. The backend stores this schema in the `GiftFlow` entity, securely associating it with the vendor's `supplierId`.

---

## 1. Domain Model: `GiftFlow`

The `flow` module contains a single entity:

```java
@Entity
@Table(name = "gift_flows")
public class GiftFlow {
    @Id
    private UUID id;
    
    private UUID supplierId; // The vendor who owns this flow
    
    private String name;
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String configuration; // The JSON schema of the flow
    
    // timestamps...
}
```

### Purpose

* **`supplierId`**: Identifies the owning vendor and scopes flow management and listing.
* **`configuration`**: Stores the flow definition as JSON text. The frontend interprets the definition while the backend persists and serves it.

---

## 2. Integration with Cart and Order

When a user completes a custom gift flow, they have essentially selected a bundle of products and perhaps provided some text (e.g., a Gift Note).

We adapt our cart and order item models to support grouping:

### Modified `CartItem` and `OrderItem`
Instead of just `productId` and `quantity`, we add:
* **`groupId` (UUID/String, nullable):** Acts as a correlation ID. All items selected during a single execution of a `GiftFlow` share the same `groupId`.
* **`metadata` (String/JSON, nullable):** Stores flat key-value pairs (e.g., `{"gift_note": "Happy Bday!"}`) attached to an item. Often attached to the primary/parent item of the group.

### The Checkout Process
1. The user completes the flow on the UI.
2. The UI translates the JSON definition and user selections into a flat list of `CartItem`s.
   * Example: 1 Box (`groupId=XYZ`), 3 Chocolates (`groupId=XYZ`).
3. The UI submits these items to the standard `POST /api/v1/cart` endpoint.
4. The backend treats them as normal items but persists the `groupId` through checkout into the `OrderItem`.

## 3. Workflow Summary

1. **Vendor Creation:** Vendor logs in, UI shows hardcoded templates. Vendor selects one, adjusts settings, UI posts to `POST /api/v1/flows`. Backend saves JSON to `GiftFlow`.
2. **Customer Browsing:** Customer visits Vendor's page. UI fetches `GET /api/v1/flows/vendor/{supplierId}`. Customer clicks a flow.
3. **Execution:** UI parses the `configuration` JSON to render exactly 3 steps. Customer picks products.
4. **Add to Cart:** UI posts a list of items with the same `groupId`. Backend totals price standardly. Backend never knows they came from a "GiftFlow".
