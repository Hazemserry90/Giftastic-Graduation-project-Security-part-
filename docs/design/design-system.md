---
name: Giftastic Design System
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#4b444d'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#7d747e'
  outline-variant: '#cec3ce'
  surface-tint: '#735186'
  primary: '#341547'
  on-primary: '#ffffff'
  primary-container: '#4b2c5e'
  on-primary-container: '#bb95cf'
  inverse-primary: '#e0b8f4'
  secondary: '#705a49'
  on-secondary: '#ffffff'
  secondary-container: '#f8dac5'
  on-secondary-container: '#755e4d'
  tertiary: '#3a1240'
  on-tertiary: '#ffffff'
  tertiary-container: '#522957'
  on-tertiary-container: '#c591c7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4d9ff'
  primary-fixed-dim: '#e0b8f4'
  on-primary-fixed: '#2b0c3e'
  on-primary-fixed-variant: '#593a6d'
  secondary-fixed: '#fbddc7'
  secondary-fixed-dim: '#dec1ac'
  on-secondary-fixed: '#28180b'
  on-secondary-fixed-variant: '#574333'
  tertiary-fixed: '#ffd6fe'
  tertiary-fixed-dim: '#ebb5ed'
  on-tertiary-fixed: '#310937'
  on-tertiary-fixed-variant: '#613766'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-xl:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

This design system is built to evoke the feeling of a high-end boutique experience, specifically tailored for the discerning market of Alexandria, Egypt. The brand personality is **Joyful, Premium, and Trustworthy**, balancing the excitement of gift-giving with the reliability of a luxury service.

The chosen style is **Modern Premium with Tactile accents**. It leverages heavy whitespace and sophisticated typography (Minimalism) while incorporating soft, organic depth through ambient shadows and delicate celebratory motifs. The interface should feel airy and celebratory, using subtle "sparkle" iconography and "ribbon" inspired dividers to reinforce the gifting narrative without cluttering the user journey.

## Colors

The palette is anchored by **Royal Plum (Primary)** and **Warm Chocolate (Secondary)**, creating a deep, regal foundation that signals quality. These are contrasted against an **Elegant Cream (Neutral)** background, which provides a warmer, more inviting canvas than pure white. 

**Amethyst (Tertiary)** is used for interactive accents and secondary actions, while a soft **Champagne Gold (Accent)** is reserved for celebratory elements like badges, "Premium" tags, and micro-interactions. All neutrals should lean warm to maintain the "chocolate and cream" aesthetic, avoiding cold grays.

## Typography

The typographic scale uses a high-contrast pairing to reflect the brand's dual nature. **Noto Serif** is the voice of the brand, used for headings to convey tradition, authority, and the "ceremony" of gifting. It should be typeset with generous leading to feel editorial.

**Manrope** provides a highly legible, modern contrast for all functional body text, ensuring a smooth shopping experience across mobile and desktop. For navigational elements and small labels, **Plus Jakarta Sans** is used to add a touch of approachability and modern flair to the functional UI.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop to maintain a premium, curated feel, centering the content with wide outer margins. A 12-column system is utilized for the product catalog, while a more focused 8-column grid is preferred for checkout and gift-customization flows to reduce cognitive load.

The spacing rhythm is strictly based on an 8px scale. Generous vertical padding (64px+) between sections is encouraged to create a "luxury catalog" feel, allowing product photography to breathe.

## Elevation & Depth

This design system avoids harsh shadows. Instead, it utilizes **Ambient, Tinted Shadows** to create a soft, tactile depth. Shadows should be feathered and include a tiny percentage of the Primary Plum color in the hex code to keep the depth feeling "warm."

Layering is achieved through **Tonal Tiers**: 
1. The base layer is the Cream neutral. 
2. Raised cards use a white surface with a soft plum-tinted shadow.
3. Floating elements (like the "Add to Cart" sticky bar) use a subtle glassmorphism effect-a semi-transparent white with a high-density background blur-to maintain a sense of lightness and modernity.

## Shapes

The shape language is defined by **Soft Roundedness (Level 2)**. This removes the clinical feel of sharp corners, replacing them with a more organic, "gift-wrapped" aesthetic. 

Primary buttons and input fields use a standard 0.5rem radius, while featured product cards and promotional banners utilize a more pronounced `rounded-xl` (1.5rem) to make them feel special and inviting. Ribbon motifs-used as decorative separators-should feature soft, flowing curves rather than jagged edges.

## Components

### Buttons
Primary buttons are solid Plum with Cream text, using a subtle "press" animation that scales the button down slightly (98%). Secondary buttons use the Chocolate Brown as an outline (Ghost style) with a subtle cream hover state.

### Cards
Product cards should have no visible border. Instead, they use a soft ambient shadow on hover. The product title always uses Noto Serif, while the price uses Manrope Bold for clarity.

### Inputs & Selects
Input fields use a thin (1px) Chocolate Brown border that thickens and changes to Plum on focus. Labels sit just above the field in Plus Jakarta Sans (Label-sm).

### Celebratory Elements
*   **The Sparkle:** A small 4-point star icon used sparingly next to "New Arrivals" or "Personalized" tags.
*   **The Ribbon:** A thin, horizontal divider that has a slight curve in the center, used to separate major sections of the homepage.
*   **Gift Progress Bar:** A custom progress tracker for the checkout flow that uses a ribbon-end motif for the active state indicator.

### Chips & Tags
Tags for "Best Seller" or "Gift Wrapped" use the Champagne Gold accent background with dark Chocolate text to ensure high visibility without looking like a "sale" discount.