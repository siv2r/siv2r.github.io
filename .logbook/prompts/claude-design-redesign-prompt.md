# Redesign brief: personal site for a cryptography engineer

## Context

I'm Sivaram, a cryptography engineer working on the protocols that secure Bitcoin (threshold Schnorr signatures: FROST, ChillDKG, adaptor signatures). My site siv2r.github.io is a small static site: home, work, contact, and a 404 page. My writing lives on Substack ("Nonce Sense") and the nav links out to it. The final implementation will be hand-written HTML and CSS on GitHub Pages, no framework, no build step. So every design must be achievable with plain HTML/CSS and at most two Google Font families.

## The ask

A complete structural redesign of the homepage. My current site is a classic quiet single column: small nav links top right, name with an italic tagline, a portrait photo sitting left of three bio paragraphs, then a numbered list of recent posts. I like its spirit, but I've already explored reskins of this skeleton (new fonts, new palette, same bones) and rejected them. I want page architectures I haven't seen on my own site: rethink the composition, the navigation pattern, the hierarchy, where the portrait lives, and how the writing list presents.

Give me 3 or 4 homepage directions that are structurally different from each other and from my current single column. Examples of the kind of divergence I mean (feel free to invent others):

- An asymmetric split screen: identity and portrait fixed on one side, content scrolling on the other.
- A margin-note or left-rail layout where navigation and metadata live in a rail or margin.
- An editorial index or grid treatment, the homepage as a table of contents.
- An oversized typographic hero where the name itself is the composition.

After I pick a direction, apply it to the work and contact pages.

## What must survive

- Light and easy on the eyes. No dark designs. The palette can change (current is warm cream with a sage green accent) but stay in the gentle, low-glare, paper-like family.
- Minimalist and aesthetic. Whitespace over decoration. Crafted, calm, a little personal, never corporate.
- The portrait photo stays prominent. On the current site it's grayscale and colorizes on hover. Keep or reinterpret that idea.
- The content below, unchanged in substance.

## What to avoid

- AI-startup landing page tropes: gradient blobs, glassmorphism, floating cards with heavy shadows, emoji bullets.
- Crypto or hacker costume: no terminal green, no hex strings, no monospace-everything. The design should express precision through craft (grid, rhythm, typography), not props.
- Soft rounded warm-white with terracotta accents (reads as Claude's own branding).
- Reproducing my current skeleton with different styling.

## Content (real, use as-is)

**Nav:** home · work · writing (external, siv2r.substack.com) · resume (downloads a PDF) · contact

### Home

**Name:** Sivaram Dhakshinamoorthy
**Tagline:** cryptography engineer · @siv2r

**Bio:**

Hi, I'm Sivaram. I work on the cryptography that secures Bitcoin. This site is where the writing lives, and where you can find me elsewhere online.

I did my M.Sc in Mathematics and Computing at IIT Kharagpur in 2023, and have been at this independently since, with a Spiral grant funding the work. Most of it lives on GitHub. Right now I'm deep in threshold signatures (FROST, ChillDKG) and adaptor signatures, and want to move into provable-security research next.

I write *Nonce Sense*, where I try to make cryptography and the math behind it feel less intimidating and a little fun. When I'm not at the keyboard, I'm at the gym, lost in a novel, playing FC25, or daydreaming about sinking the perfect jump shot. Based in India, on the internet as @siv2r.

**Recent from Nonce Sense** (this list is synced from Substack, 5 entries shown):

1. Quarterly Progress Report #4 · What I worked on: Feb, Mar & Apr (2025) · 2025-05-16
2. Quarterly Progress Report #3 · What I worked on: Nov '24 - Jan '25 · 2025-02-12
3. Quarterly Progress Report #2 · What I worked on: Aug, Sept & Oct (2024) · 2025-02-12
4. Quarterly Progress Report #1 · What I worked on: May, June & July (2024) · 2025-02-12
5. Unmasking the Birthday Attack: A Mathematical Analysis · 2023-01-05

Plus a "more on nonce sense" link to the Substack.

### Work

Intro: "Almost everything below is one project at heart: protocols built on top of Schnorr signatures. Threshold variants so a key can be split safely. Adaptor signatures for payments conditioned on a secret. Faster verification for the chain. I write the spec text, the reference Python, and the test vectors that go with them. It's careful, slow work, and I find it deeply satisfying."

Open Source (each has title, role/date line, short description, 1-2 GitHub links):

- BIP-445, FROST Signing. BIP author, 2024-present. Specification for threshold Schnorr signatures compatible with BIP340. Wrote the BIP text, Python reference implementation, and test vectors.
- ChillDKG BIP. Co-author, with Blockstream Research, 2024-present. Distributed key generation so a FROST group can set up a shared key without trusting a dealer.
- Schnorr batch verification, libsecp256k1. Module author, mentored by Jonas Nick, 2022-present. Batch verification for BIP340 signatures, approaching 2x speedup.
- Schnorr Adaptor Signatures. Contributor, 2024. Rebased and extended the adaptor signatures module in secp256k1-zkp, plus Rust bindings.

Talks & Press (numbered list, title · venue · date):

1. Builder Profile: Sivaram · Spiral AI Report · 2026-04
2. FROST Signing Workshop · Bitshala BOSS, Bangalore · 2025-11
3. Nerd of the Month: Frostpunk · Spiral Newsletter · 2025-06
4. Introduction to Schnorr Signatures · Bitshala BOSS, Bangalore · 2024-11
5. Newsletter #315 · Bitcoin Optech Podcast · 2024-08
6. The Summer of Bitcoin Experience · SoBE Podcast · 2022-12

Conferences (short prose): been to CryptoCamp (Lagos, Portugal, 2025) and Real World Crypto (Taipei, 2026). Wishlist: Asiacrypt 2026 in Hong Kong, PKC 2027 in Taipei.

### Contact

Intro: "Email's the best place to start. I'm always up for a thread on threshold signatures, Bitcoin cryptography, or provable-security research, but really anything in the neighborhood works. If you've got a paper I should read or a conference I should be at, send it over. For anything sensitive, use PGP."

Channels (label and value pairs): email siv2ram@gmail.com · github github.com/siv2r · x @siv2r · bluesky @siv2r.bsky.social · linkedin linkedin.com/in/siv2r · signal siv2r.34 · pgp (coming soon)

### 404

A small "page not found" with a link home, styled to match.
