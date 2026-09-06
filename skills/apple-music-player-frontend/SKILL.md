---
name: apple-music-player-frontend
description: Build or refactor React + Vite + TypeScript music player frontends, lyrics views, playback control areas, playlist panels, search modals, and immersive playback pages in an Apple Music-inspired style. Use when the user wants premium dark UI, iOS-like glassmorphism, soft gradient or fluid backgrounds, album-art-led composition, lyrics-first layouts, player-focused interfaces, subtle @react-spring/web motion, or a refined music app experience rather than a generic website.
---

# Apple Music Player Frontend

Build interfaces that feel like a polished Apple Music-style music player, not a generic SaaS dashboard, cyberpunk landing page, or ordinary content site. Match the host project's structure first, then align visuals, interaction, and motion with a premium music app language.

## Workflow

### 1. Inspect the real stack and existing structure first

Confirm the actual project setup before changing UI:
- React + Vite + TypeScript structure
- whether `@react-spring/web` is already used
- whether the app already has background rendering, lyrics, playback controls, playlist panels, or search modals
- how state and props already flow between major components

Do not replace architecture just to make the project look more modern.
Preserve:
- the existing `App.tsx` layout and state ownership
- existing hooks
- playback logic
- current component responsibilities

Focus changes on:
- visual language
- layout hierarchy
- interaction feedback
- Apple Music-style consistency

### 2. Lock the Apple Music direction, not a generic sci-fi one

The overall feeling should be:
- premium
- clean
- immersive
- soft
- modern
- precise
- emotional but restrained

Not:
- cyberpunk overload
- neon-heavy sci-fi
- cinematic PV promo styling
- enterprise product marketing language

Default visual traits:
- dark or dim canvas
- strong blur and glass layering
- album art as the main visual anchor
- soft flowing or blurred gradient backgrounds
- limited but high-quality highlights
- refined layering rather than hard outlines everywhere

For palette, surfaces, typography, and composition, read:
[references/visual-language.md](references/visual-language.md)

### 3. Prefer react-spring motion and keep it gentle

If the project already uses `@react-spring/web`, keep using it. Do not switch to another motion library just for stylistic consistency.

Apple Music-style motion should feel:
- soft
- light
- tactile
- responsive
- non-distracting

Good targets for motion:
- album hover states
- control button feedback
- panel reveals
- search modal transitions
- top bar visibility
- playlist drawer movement
- lyrics and controls view switching on mobile

Bad targets for motion:
- huge travel distances
- loud bounce
- constant attention-seeking loops
- heavy showpiece animation that competes with the music UI

Before implementing motion, read:
[references/motion-system.md](references/motion-system.md)

### 4. Organize the page around playback, not around marketing

Treat the interface as a music player app first.

Core structure usually revolves around:
- current album art
- song title and artist
- transport controls
- lyrics area
- playlist panel
- search entry
- top utility bar
- atmospheric background layer

Reliable layout patterns:
- centered cover art with controls below
- split layout with controls on one side and lyrics on the other
- desktop dual-pane layout with mobile swipe switching between controls and lyrics
- lightweight floating top bar above a centered immersive playback area

Avoid:
- homepage-style feature sections
- three-column enterprise blocks
- dashboard-style grids
- flat layouts with no playback focal point

### 5. Keep components music-player-native

Prioritize these components:
- playback controls
- progress bar
- album art presentation
- scrolling lyrics view
- playlist panel
- search modal
- top bar
- about/settings dialogs
- ambient background component
- volume and playback mode controls

These parts should feel like one coherent music application, not disconnected website sections.

For component-level patterns, read:
[references/music-ui-patterns.md](references/music-ui-patterns.md)

### 6. Make the visual hierarchy obvious

The page must have a clear primary focus, usually one of:
- current album art
- now playing metadata
- lyrics view
- central player controls

Everything else should support that focus:
- the top bar stays light
- buttons stay restrained
- the playlist panel remains secondary
- the background never overpowers the cover or the lyrics

### 7. Run an Apple Music quality pass before shipping

Before finishing, verify:
- the interface reads as a music player immediately
- background, album art, lyrics, and controls have clear hierarchy
- glass and blur feel refined rather than cheap
- motion feels smooth and tactile, not templated
- mobile keeps the same immersive tone instead of becoming a collapsed desktop clone
- control feedback is consistent across the app
- the UI feels elegant and soft rather than loud or gimmicky

## Non-Negotiables

Do not compromise on these unless the user explicitly overrides them:
- Match the existing React + Vite + TypeScript structure first.
- If the project already uses `@react-spring/web`, keep it.
- Use Apple Music-inspired visual language as the baseline.
- Keep the UI dark, layered, premium, and playback-focused.
- Organize layouts around music consumption and playback state.
- Keep controls tactile, subtle, and visually consistent.

## Execution Notes

When repeated patterns appear, such as:
- glass panels
- playback buttons
- rounded control treatments
- panel transitions
- shared shadows and highlights
- section title structures

extract local constants, helper styles, or small reusable components, but do not over-abstract just to look more engineered.

Prefer quality through:
- album art
- blur and transparency
- soft shadows and highlights
- gentle gradients
- controlled whitespace
- consistent radii
- consistent motion response
