# Giftastic ERD and UML Class Diagram

This directory contains the project diagrams for the Giftastic system.

## Files

1. `giftastic_erd.mmd`
   - Entity Relationship Diagram for the main persisted backend entities.
   - Covers users, vendors, products, cart, orders, delivery, gift flows, reviews, reports, notifications, reminders, commissions, and administration.
   - Exported versions: `giftastic_erd.svg` and `giftastic_erd.png`.

2. `giftastic_uml_class_diagram.mmd`
   - UML class diagram for the main domain classes.
   - Includes important attributes, key methods, and class relationships.
   - Exported versions: `giftastic_uml_class_diagram.svg` and `giftastic_uml_class_diagram.png`.

## Rendering

The diagrams are written in Mermaid format. They can be rendered by:

1. Open the `.mmd` files in a Mermaid-compatible editor.
2. Paste the contents into a Markdown document that supports Mermaid diagrams.
3. Use Mermaid CLI if available:

```bash
mmdc -i giftastic_erd.mmd -o giftastic_erd.svg
mmdc -i giftastic_uml_class_diagram.mmd -o giftastic_uml_class_diagram.svg
```

## Notes

Some relationships in the backend are stored as UUID references rather than direct JPA object associations. The diagrams represent those UUID-based relationships as logical relationships because they are part of the actual data model and business flow.
