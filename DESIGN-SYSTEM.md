# 🎨 THE FORGE - Design System

**Version:** 2.0 - Dark Industrial Premium
**Last Updated:** January 18, 2026

---

## 🎯 Design Philosophy

**"Industrial Luxury"** - Eine kraftvolle, charakterstarke visuelle Identität die den Namen "FORGE" (Schmiede) widerspiegelt:

- 🔥 **Dunkel & Kraftvoll:** Deep charcoal backgrounds mit subtilen Texturen
- ⚡ **Gold-Akzente:** Premium-Gefühl durch warmes Gold (#D4AF37)
- 🏭 **Industrial Elements:** Subtile Grid-Texturen, klare Linien, Metall-Feeling
- 💎 **Hochwertig:** Keine "Template-Ästhetik" - uniqu & seriös

---

## 🎨 Color Palette

### Primary Colors

```css
--color-background: #0A0E0D        /* Deep charcoal - industrial strength */
--color-foreground: #FAFAF9        /* Warm white - readable */
--color-accent: #D4AF37            /* Gold - premium brand */
--color-accent-foreground: #0A0E0D /* Dark text on gold */
```

### Surface Colors

```css
--color-surface: #141816          /* Card backgrounds */
--color-surface-muted: #1C2220    /* Darker sections */
--color-border: #2D3532           /* Subtle dark green borders */
```

### Semantic Colors

```css
--color-accent-glow: rgba(212, 175, 55, 0.1)  /* Gold glow effect */
--color-accent-soft: #B8935C                   /* Softer gold */
--color-forge-green: #0E2419                   /* Deep forest green */
--color-forge-ember: #FF6B35                   /* Hot ember orange */
```

### Grayscale

```css
--color-secondary: #78716C          /* Warm stone gray */
--color-muted: #1C2220              /* Dark muted green */
--color-muted-foreground: #A8A29E   /* Light stone */
```

---

## 🔤 Typography

### Font System

**Display Font (Headings):**
- Family: 'Inter' / System fonts with heavy weight
- Weight: 700-900
- Letter Spacing: -0.025em (tight)
- Line Height: 1.1 (compact for drama)

**Body Font:**
- Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter'
- Antialiasing: Enabled for crisp rendering

### Type Scale

```
Hero H1:    72px - 96px (mobile: 40-48px)
Section H2: 56px - 64px (mobile: 32-40px)
Card H3:    28px - 32px
Body:       16px - 20px
Small:      14px
Micro:      10-12px (uppercase, tracked)
```

### Best Practices

✅ **DO:**
- Use `gradient-gold` class for premium headings
- Apply wide letter-spacing (0.3-0.5em) for UPPERCASE labels
- Keep line-height tight (0.9-1.1) for display text

❌ **DON'T:**
- Mix too many font weights in one section
- Use pure white (#FFF) - always use --color-foreground (#FAFAF9)
- Forget to apply tracking on small uppercase text

---

## 🎭 Visual Effects

### Glow Effects

**Gold Glow (Buttons/Cards):**
```css
.ember-glow {
  position: relative;
}

.ember-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #FF6B35, #D4AF37);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
  filter: blur(8px);
}

.ember-glow:hover::before {
  opacity: 0.6;
}
```

**Usage:**
```html
<button class="ember-glow bg-[var(--accent)] ...">
  Call to Action
</button>
```

### Industrial Texture

```css
.industrial-texture {
  background-image:
    linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

**Usage:** Background für Hero-Sections

### Gradient Text

```css
.gradient-gold {
  background: linear-gradient(135deg, #D4AF37 0%, #F4E4B4 50%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Usage:** Für Premium-Headlines und Highlights

---

## 🎴 Component Patterns

### Premium Card

```html
<div class="group relative">
  <!-- Hover glow -->
  <div class="absolute -inset-2 bg-gradient-to-br from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-lg" />

  <!-- Card content -->
  <div class="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 hover:border-[var(--accent)] transition-all duration-300 card-hover">
    <h3 class="font-display text-xl mb-3">Title</h3>
    <p class="text-[var(--muted-foreground)]">Content</p>
  </div>
</div>
```

### CTA Button

```html
<button class="group ember-glow inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-foreground)] px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 text-base tracking-[0.15em] uppercase font-bold">
  <span>Action Label</span>
  <ArrowRight class="w-6 h-6 group-hover:translate-x-2 transition-transform" />
</button>
```

### Section Header

```html
<div class="text-center mb-16">
  <!-- Eyebrow -->
  <div class="flex items-center gap-4 justify-center mb-6">
    <span class="h-[2px] w-12 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
    <span class="text-[0.65rem] uppercase tracking-[0.5em] text-[var(--accent)] font-semibold gradient-gold">
      Eyebrow Text
    </span>
    <span class="h-[2px] w-12 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
  </div>

  <!-- Main headline -->
  <h2 class="text-5xl md:text-6xl font-display text-[var(--foreground)] mb-6 leading-[0.95] tracking-tight">
    Main Headline
    <span class="block gradient-gold mt-2">Sub Headline</span>
  </h2>

  <!-- Description -->
  <p class="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
    Section description text
  </p>
</div>
```

---

## 🌊 Animations

### Available Animations

```css
.animate-fade-in        /* Fade + slide up */
.animate-glow-pulse     /* Pulsing glow effect */
.animate-forge-shine    /* Shimmering shine effect */
```

### Transition Standards

```css
/* Fast interactions */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover effects */
transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Large movements */
transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📐 Spacing System

### Consistent Spacing

```
Section Padding:  py-20 sm:py-32 (80px - 128px)
Card Padding:     p-8 sm:p-12    (32px - 48px)
Element Gap:      gap-6 sm:gap-8 (24px - 32px)
Border Radius:    rounded-2xl     (16px)
Large Radius:     rounded-[2rem]  (32px)
```

### Layout Widths

```
Narrow:  max-w-4xl  (896px)
Default: max-w-5xl  (1024px)
Wide:    max-w-6xl  (1152px)
Full:    max-w-7xl  (1280px)
```

---

## ✨ Visual Hierarchy Rules

### 1. Contrast Hierarchy

```
Most Important:    Gold gradient text (#D4AF37)
Very Important:    White text (#FAFAF9)
Standard:          Light gray (#A8A29E)
De-emphasized:     Stone gray (#78716C)
```

### 2. Size Hierarchy

```
Hero Statement:     7xl - 8xl (72px - 96px)
Section Title:      5xl - 6xl (48px - 60px)
Sub-section:        3xl - 4xl (30px - 36px)
Card Title:         xl - 2xl  (20px - 24px)
```

### 3. Visual Weight

- **Heavy:** Gold accents, ember-glow effects
- **Medium:** White headings, icon containers
- **Light:** Gray body text, borders

---

## 🎪 Interaction States

### Button States

```css
Default:  bg-[var(--accent)] scale-100
Hover:    shadow-2xl scale-105
Active:   scale-95
Focus:    ring-2 ring-[var(--accent)]
Disabled: opacity-50 cursor-not-allowed
```

### Card States

```css
Default:  border-[var(--border)]
Hover:    border-[var(--accent)] -translate-y-1
```

### Link States

```css
Default:  text-[var(--accent)]
Hover:    brightness-110
Active:   brightness-90
```

---

## 📱 Responsive Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Small desktops */
xl:  1280px  /* Large desktops */
2xl: 1536px  /* Extra large */
```

### Mobile-First Approach

```html
<!-- Base: Mobile -->
<h1 class="text-4xl">

<!-- Tablet -->
<h1 class="text-4xl sm:text-5xl">

<!-- Desktop -->
<h1 class="text-4xl sm:text-5xl lg:text-7xl">
```

---

## 🚫 Common Mistakes to Avoid

### ❌ DON'T

1. **Don't use pure white backgrounds** - Use --color-surface instead
2. **Don't forget hover states** - Every interactive element needs one
3. **Don't mix light and dark modes** - This is a dark-only theme
4. **Don't use small text without tracking** - Uppercase needs 0.3em+ tracking
5. **Don't overuse gold** - It's an accent, not the base color

### ✅ DO

1. **Use gradient-gold sparingly** - Only for key highlights
2. **Add subtle textures** - industrial-texture for depth
3. **Layer glow effects** - Create depth with layered glows
4. **Maintain contrast** - Always test text readability
5. **Use ember-glow on CTAs** - Makes them pop

---

## 🎨 Color Usage Guide

### When to Use Gold

✅ **Use Gold For:**
- Primary CTAs
- Key headlines (as gradient)
- Icon containers
- Focus states
- Hover accents

❌ **Don't Use Gold For:**
- Body text
- Large backgrounds
- Every heading
- Navigation text

### When to Use Ember Orange

✅ **Use Ember For:**
- "Live" badges
- Hot opportunities
- Urgent CTAs
- Glow effects (combined with gold)

❌ **Don't Use Ember For:**
- Standard buttons
- Body text
- Large sections

---

## 🔧 Developer Tools

### CSS Custom Properties Access

```javascript
// Get color value
const accentColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-accent');

// Set color value (for themes)
document.documentElement.style.setProperty('--color-accent', '#D4AF37');
```

### Tailwind Extension

All colors are available as Tailwind utilities:

```html
<div class="bg-[var(--accent)]">...</div>
<div class="text-[var(--muted-foreground)]">...</div>
<div class="border-[var(--border)]">...</div>
```

---

## 📚 Resources

### Inspiration Sources
- Industrial design (metallurgy, foundries)
- Premium watch brands (IWC, Rolex)
- Luxury automotive (Porsche, Mercedes)
- High-end whiskey branding

### Typography Inspiration
- Inter (primary font)
- SF Pro Display (iOS system)
- Helvetica Neue Heavy

### Color Psychology
- **Gold:** Premium, success, achievement
- **Dark:** Power, sophistication, seriousness
- **Ember Orange:** Energy, urgency, heat

---

## 🎯 Brand Personality

**THE FORGE ist:**
- 💪 Kraftvoll & Entschlossen
- 🏆 Premium & Hochwertig
- 🔥 Dynamisch & Energetisch
- 🎯 Fokussiert & Klar
- 🤝 Seriös aber nicht steif

**THE FORGE ist NICHT:**
- ❌ Verspielt oder niedlich
- ❌ Minimal oder kalt
- ❌ Corporate oder langweilig
- ❌ Trendy oder kurzlebig

---

## 📝 Checklist für neue Komponenten

Beim Design neuer Komponenten beachten:

- [ ] Dark background (#0A0E0D) verwendet?
- [ ] Gold-Akzente (#D4AF37) sparsam eingesetzt?
- [ ] Hover-States definiert?
- [ ] Responsive breakpoints berücksichtigt?
- [ ] Accessibility (Kontrast) geprüft?
- [ ] Transitions smooth (400ms+)?
- [ ] Border-radius konsistent (rounded-2xl)?
- [ ] Typography-Hierarchy klar?
- [ ] Spacing-System (8px Grid) eingehalten?
- [ ] Component documented?

---

**Built with Industrial Precision.**
*THE FORGE Design System - Version 2.0*
