# SAARATHI

## Current State
- App.tsx defaults to LoginPage; Landing page is secondary (accessed via a link)
- LoginPage has a dark blue left panel + light right form panel
- LandingPage has caffeine.ai branding in footer and nav
- Footer on both pages credits caffeine.ai
- Public landing page is hidden behind login; users must visit login first

## Requested Changes (Diff)

### Add
- Tattva Innovation branding in footer, nav, and login page (replacing caffeine.ai)
- "Created by Tattva Innovation" credit on both pages
- More detailed sections on LandingPage: step-by-step how it works, stats/numbers section, deeper feature descriptions with benefits, testimonial/quote placeholders
- Back button / "Already have an account?" flow from LandingPage back to login

### Modify
- App.tsx: Landing page is now the default/primary page; after clicking Get Started or Sign In, user is taken to LoginPage
- LoginPage: Improved color palette — richer saffron/amber gradient on left panel, refined form styling on right; better typography, refined card UI
- LoginPage footer: Replace caffeine.ai with Tattva Innovation branding
- LandingPage footer and nav: Replace caffeine.ai with Tattva Innovation
- LandingPage: Improved hero section, add statistics row (e.g. businesses using it, modules, GST compliant), add "How it works" 3-step section, more detailed feature descriptions, stronger CTA

### Remove
- All caffeine.ai links and branding references

## Implementation Plan
1. Update App.tsx to show LandingPage by default, LoginPage as secondary
2. Rewrite LandingPage with Tattva Innovation branding, enhanced hero, stats row, how-it-works section, expanded features, use cases, better CTA
3. Update LoginPage with richer visual styling, improved colors, Tattva Innovation footer credit
