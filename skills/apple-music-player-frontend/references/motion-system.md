# Motion System

Use this file when implementing motion behavior for an Apple Music-inspired player frontend built around `@react-spring/web`.

## Motion Goal

Motion should feel:
- smooth
- soft
- tactile
- layered
- non-intrusive

The target is a premium music-player experience, not an animation demo.

## Package Preference

If the project already uses `@react-spring/web`, keep it.
Do not switch libraries unless the user explicitly asks.

## Best Motion Targets

Motion is most useful for:
- panel reveal and dismissal
- top bar visibility
- album hover states
- playback button feedback
- playlist drawer transitions
- search modal transitions
- mobile switching between lyrics and controls
- volume and settings popups

Avoid using motion as a blanket effect on every visible element.

## Style Rules

Prefer:
- short travel distances
- light scale adjustments
- soft opacity changes
- low-amplitude spring response
- quick but non-harsh settling

Avoid:
- long theatrical timings
- exaggerated bounce
- huge slide distances
- looping motion that constantly demands attention
- effects that compete with reading lyrics or using controls

## Spring Direction

Use medium-high tension with moderate friction so motion feels responsive but refined.

The motion should feel like:
- floating in gently
- settling quickly
- responding to touch with confidence
- never wobbling too long

## Control Feedback

### Playback Buttons

Buttons should have clear but restrained tactile response:
- slight grow on hover
- soft press on active state
- smooth icon/state transitions

### Album Art

Album presentation can support:
- slight lift on hover
- deeper shadow on focus
- very subtle image scale or emphasis increase

### Panels and Popups

Use combinations of:
- opacity
- small `y` movement
- slight scale changes

The result should feel like the panel is gently surfacing, not flying in.

## Playback-State Motion

Allowed motion patterns include:
- faint breathing background behavior
- subtle playback emphasis around the active song
- low-key visualizer motion
- restrained dynamic layering near the album art

Avoid:
- full-screen pulsing
- aggressive beat-synced shaking
- oversized spectrum effects dominating the page
- constant motion with no hierarchy

## Mobile Motion

When switching between controls and lyrics on mobile:
- movement should feel touch-linked
- settling should be fast and clean
- drag behavior should be understandable immediately
- the user should never feel motion-induced clutter

## QA Checklist

Before finishing, check:
- major interactions feel smooth and tactile
- motion supports playback rather than distracting from it
- panels appear and disappear cleanly
- buttons, popups, and drawers share a consistent feel
- mobile keeps the same emotional tone with lower complexity
