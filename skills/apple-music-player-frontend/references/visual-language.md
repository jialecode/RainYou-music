# Visual Language

Use this file when choosing palette, background treatment, material system, typography, and composition for an Apple Music-inspired music player frontend.

## Tone

Aim for:
- premium
- soft
- modern
- immersive
- refined
- restrained

Avoid:
- cyberpunk overload
- cheap neon glow
- game UI excess
- enterprise marketing page styling
- exaggerated sci-fi showpiece design

## Palette Direction

Apple Music-inspired UI is not just black with purple glow. It should feel like color is diffusing from the album art into the surrounding space.

Start from:
- dark or charcoal-black base layers
- colors derived from current album art when possible
- softened pink, violet, blue, warm gray, or muted accent tones
- low-noise, low-clutter color fields

Suggested anchors:
- main background: `#0b0b0f`
- dark surface: `#121218`
- primary text: `#f5f5f7`
- secondary text: `rgba(255,255,255,0.68)`
- tertiary text: `rgba(255,255,255,0.45)`
- glass fill: `rgba(255,255,255,0.08)`
- glass border: `rgba(255,255,255,0.10)`

Accent colors should usually come from:
- extracted album-art palette
- soft atmospheric background gradients
- the current playback context

## Background Treatment

The background should feel like the music's visual mood expanding into the room.

Prefer:
- blurred color fields derived from cover art
- soft flowing gradients
- large low-contrast glows
- subtle vignettes
- layered atmospheric depth

Good patterns:
- blurred cover-based backdrop
- soft radial or fluid color blooms
- dimmed gradient fields behind the main player shell
- low-detail motion in the far background

Avoid:
- sharp geometric sci-fi graphics
- visible tech grids
- noisy grain-heavy textures
- hard-edged neon effects

## Material System

Use premium translucent surfaces.

Recommended traits:
- larger border radii
- semi-transparent fills
- meaningful blur
- very fine borders
- soft shadows instead of hard drop shadows
- clear depth between foreground and support layers

Common surface types:
- playback shell
- floating top bar
- playlist drawer
- search modal
- settings panel
- lyrics overlay or side panel

## Typography

Typography should feel like a modern music app, not a product pitch deck.

Prioritize:
- clear song title hierarchy
- softer artist and support metadata
- readable lyric presentation
- short, precise control labels

Use:
- stronger weights for primary playback information
- softer contrast for secondary metadata
- compact, clean section titles
- no bloated marketing copy blocks unless the user explicitly wants them

## Composition

The active music experience should be the center of the frame.

Reliable composition patterns:
- centered album art with transport controls below
- split layout with player content on one side and lyrics on the other
- lightweight top bar over an immersive central player region
- side panel for queue or playlist management
- layered focus around one dominant cover image

Avoid:
- all modules having equal visual weight
- site-navigation-heavy layouts
- generic portal or dashboard composition
- heavy separators and rigid grids

## Iconography

Use icons as system controls, not as decoration.

Prioritize:
- play / pause
- previous / next
- search
- queue
- volume
- settings
- info
- fullscreen

Keep icon count low and the language consistent.

## Mobile Adaptation

Mobile should preserve immersion, not become a cramped desktop compression.

On mobile:
- keep one clear focal point at a time
- preserve the album art, now playing info, and core controls
- reduce layered complexity
- keep swipe transitions readable and low-friction
- simplify background motion instead of removing atmosphere entirely
