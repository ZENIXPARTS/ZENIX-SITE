# AGENTS.md — Premium SaaS Startup Website Guidelines for Codex

## Mission
Build a premium, conversion-focused SaaS-style startup website that feels polished, modern, and trustworthy.

The site should begin in **plain HTML + CSS**, but every structural decision must make the project easy to migrate to **React** later without major rewrites.

The output should feel comparable to high-end startup marketing sites: clean hierarchy, strong visual rhythm, crisp typography, measured motion, and disciplined spacing.

---

## Core Build Strategy
- Start with **HTML and CSS only**.
- Keep `index.html` and `styles.css` separate.
- Do **not** use inline styles unless strictly necessary.
- Use **semantic HTML**.
- Write code so each major section can later be converted into a React component with minimal friction.
- Prefer maintainable structure over quick hacks.
- Avoid unnecessary libraries at the HTML/CSS stage.

---

## Project Structure
Use this structure unless the repository already defines something better:

```text
project-root/
  index.html
  styles.css
  assets/
  AGENTS.md
```

If the project grows, organize sections with clean naming and reusable patterns.

---

## React Migration Rules
Write HTML/CSS as if these will later become React components:
- Navbar
- Hero
- Social Proof / Trust
- Features
- How It Works
- Benefits / Comparison
- CTA
- Footer

Rules for migration readiness:
- Wrap each major block in a clearly named section.
- Use predictable, reusable class names.
- Avoid deep selector chains.
- Avoid styling by raw tags alone when a reusable class makes more sense.
- Keep layout classes and content styling logically separated.
- Repeated card patterns should share a consistent internal structure.
- Keep button patterns reusable.
- Avoid one-off exceptions unless absolutely required.

---

## Design Direction
Target aesthetic:
- Premium
- Minimal
- Modern
- SaaS / startup-grade
- Trustworthy
- Enterprise-ready but visually sharp

The design should communicate:
- clarity
- speed
- confidence
- process control
- product maturity

Do not make the site feel generic, bulky, outdated, or template-like.

---

## Visual System Rules

### Color
- Default background should be white or near-white.
- Primary brand color should be **custom dark navy**, not a default framework blue.
- Use a restrained palette.
- Add depth using subtle neutrals, soft borders, and delicate tinted backgrounds.
- Do not over-saturate the interface.
- Avoid visually noisy gradients.

### Typography
- Use a strong hierarchy.
- Headings should feel decisive and premium.
- Body text should be highly readable.
- Large headings should use tighter tracking.
- Paragraphs should have comfortable line-height.
- Avoid typography that feels playful unless the product explicitly needs it.
- If custom fonts are introduced later, pair a strong display heading font with a clean sans-serif body font.

### Spacing
- Use a deliberate spacing system.
- Sections should breathe.
- Avoid cramped cards and uneven gaps.
- Keep consistent vertical rhythm between headings, body copy, and actions.
- Prefer generous whitespace over crowded layouts.

### Depth
- Use layered surfaces.
- Cards and floating elements should not all sit on the same visual plane.
- Use soft shadows, subtle borders, and tonal contrast.
- Avoid heavy muddy shadows.

### Motion
- Keep motion minimal and premium.
- Animate only when it adds clarity.
- Prefer `transform` and `opacity` transitions.
- Do not use `transition: all`.
- Hover states should feel crisp, not flashy.

---

## HTML Rules
- Use semantic tags: `header`, `nav`, `main`, `section`, `footer`, etc.
- Structure the document cleanly.
- Keep heading order logical.
- Use accessible button and link patterns.
- Avoid unnecessary wrappers.
- Use descriptive class names.
- Keep markup readable.

Example naming style:
- `site-header`
- `hero`
- `hero__content`
- `hero__actions`
- `feature-card`
- `section-heading`

---

## CSS Rules
- Organize CSS by section.
- Keep tokens and base rules near the top.
- Prefer reusable utility-like patterns only when they improve clarity.
- Avoid messy duplication.
- Use variables when helpful for colors, spacing, radius, and shadows.
- Use modern layout systems: Flexbox and Grid.
- Mobile-first responsive structure is preferred.

Recommended CSS organization:
1. CSS variables / tokens
2. Reset / base
3. Typography
4. Layout helpers
5. Shared components
6. Section-specific blocks
7. Responsive rules

---

## Conversion-Focused SaaS Structure
Unless the user asks otherwise, the site can be built from these sections:

1. **Navbar**
   - logo
   - key navigation links
   - primary CTA

2. **Hero**
   - strong headline
   - concise value proposition
   - supporting paragraph
   - primary and secondary CTA
   - optional product visual or interface mock area

3. **Trust / Credibility**
   - client logos, proof points, metrics, or credibility statements

4. **Features**
   - 3 to 6 clear benefit blocks
   - focus on outcomes, not only features

5. **How It Works**
   - simple 3-step or 4-step explanation

6. **Why Choose Us / Comparison**
   - differentiation against old/manual alternatives

7. **CTA Section**
   - one sharp message
   - one clear action

8. **Footer**
   - brand
   - navigation
   - legal / contact / social links

Do not force all sections if the project scope is smaller.

---

## Prompting / Execution Rules for Codex
When asked to design or update the website:
- Read the existing project structure first.
- Respect `AGENTS.md` before changing files. Codex reads `AGENTS.md` files before doing work, and project-level config can also be scoped via `.codex/config.toml`.citeturn484259search0turn484259search5
- Edit existing files when possible instead of creating unnecessary duplicates.
- Keep the output implementation-focused.
- Prefer complete, production-style section implementations over placeholder skeletons.
- If the user asks for premium styling, apply it across typography, spacing, layout, buttons, cards, and section transitions—not only colors.
- Do not bloat the markup.
- Do not invent backend logic for a static page.
- Keep the design coherent from top to bottom.

---

## Quality Bar
Every output should aim for:
- visual consistency
- premium feel
- strong hierarchy
- responsive behavior
- clean structure
- maintainability
- easy future migration to React

Before finishing any major page update, mentally check:
- Does this look premium?
- Does this look like a credible startup?
- Is the spacing consistent?
- Are the buttons, cards, and headings stylistically aligned?
- Is the section order logical?
- Would this be easy to refactor into React components?

If not, improve before stopping.

---

## Hard Rules
- Do not use inline styles unless necessary.
- Do not use `transition: all`.
- Do not use default generic framework blue as the primary brand color.
- Do not make the page feel like a low-effort template.
- Do not overcomplicate the codebase at the HTML/CSS phase.
- Do not break separation between structure and styling.
- Do not produce inconsistent section styling.

---

## If Reference Sites Are Provided
If the user shares reference sites:
- absorb their visual direction
- capture the level of polish
- borrow layout rhythm and design language
- do **not** clone them literally unless explicitly asked
- adapt the inspiration to the user’s own brand and startup identity

---

## If Brand Assets Exist
If logos, colors, icons, or brand assets exist in `assets/`:
- use them
- prioritize real brand materials over placeholders
- keep the design aligned with those assets

---

## Working Preference
Default behavior when asked to update the site:
1. inspect current structure
2. improve hierarchy
3. improve layout rhythm
4. improve typography
5. improve CTA clarity
6. improve responsiveness
7. keep the code migration-friendly

---

## Recommended First Deliverable
If starting from scratch, begin with:
- Navbar
- Hero
- Trust strip
- Features section
- CTA section
- Footer

Implement them in a cohesive premium style.
