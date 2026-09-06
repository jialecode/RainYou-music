# Music UI Patterns

Use this file for common component and layout patterns in an Apple Music-inspired music player frontend.

## 1. Now Playing Core Area

The main playback area should usually include:
- album art
- song title
- artist name
- playback state
- primary controls

This area should be the visual center of the page.

## 2. Album Art Region

Album art should:
- be large enough to anchor the scene
- use clean radius and premium shadow treatment
- influence the surrounding atmosphere when possible
- remain visually dominant over support UI

## 3. Playback Controls

Typical contents:
- play / pause
- previous / next
- progress bar
- current time / duration
- volume
- playback mode
- queue entry

Rules:
- primary action should be obvious
- secondary actions should stay lighter
- the cluster should read instantly at a glance

## 4. Lyrics View

Lyrics may be presented as:
- centered scrolling lyrics
- a dedicated side panel
- a mobile-only alternate pane

Good behavior:
- active line is clearly emphasized
- inactive lines recede softly
- seeking by lyric interaction stays readable and controlled
- the design never overwhelms lyric legibility

## 5. Playlist or Queue Panel

The queue panel is a support surface, not the main hero.

It may include:
- current queue
- playback order controls
- remove actions
- import actions
- currently playing highlight

It should feel accessible and integrated, but secondary to the now-playing experience.

## 6. Search Modal

A search modal should usually be:
- centered or softly floating
- translucent or glass-based
- fast to open and dismiss
- keyboard-friendly when applicable

It should feel like a system layer inside the player, not a separate page.

## 7. Top Bar

The top bar should stay lightweight.

Good responsibilities:
- search
- import
- about
- fullscreen
- a few utility actions

It should feel like a thin system control layer above the player, not like a website navigation bar.

## 8. Ambient Background Layer

The background should support the active song mood.

Good uses:
- cover-derived palette diffusion
- soft fluid motion
- subtle atmospheric depth
- dark contrast that improves focus on album art and lyrics

The background should never become the main subject.

## 9. Desktop and Mobile Differences

### Desktop
- can show controls and lyrics together
- can support side panels comfortably
- can stage larger album art and broader spacing

### Mobile
- should favor one focal region at a time
- can use swipe switching between controls and lyrics
- must keep touch targets easy to use
- should simplify layered complexity while preserving atmosphere
