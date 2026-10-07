# maazkhan-ai-portfolio

A hand-built, AI-native portfolio for **Maaz Khan** — B.Tech Applied AI student at
Polaris School of Technology, aiming for a software engineer role by 2030.

**Live:** https://maazkhan96271.github.io/maazkhan-ai-portfolio/

## What's inside

| Piece | Detail |
| --- | --- |
| Front-end | Vanilla HTML + CSS + JS — no framework, no build step |
| Design | Dark "keynote" theme with a light counterpart, glass panels, motion |
| Photo | Original portrait re-graded by `build_images.py` (white balance, split-tone, skin softening, bokeh backdrop) |
| AI agent | "Ask Maaz" — a live LLM chat agent with a profile system prompt, conversation history and an offline knowledge-base fallback |
| Command palette | <kbd>⌘</kbd><kbd>K</kbd> fuzzy search across pages, socials and actions |
| Extras | Scroll reveals, animated skill meters, counters, magnetic buttons, toast clipboard actions |

## Sections

Hero · tech marquee · about · stack · selected work · AI features · socials · journey to 2030 · contact

## Run it locally

```bash
python3 -m http.server 4321
open http://127.0.0.1:4321/
```

## Regenerate the photos

```bash
python3 -m pip install --user Pillow
python3 build_images.py
```

## Socials

GitHub · LinkedIn · Instagram · X · Threads · YouTube · Discord (`@maazkhan-26796`)

---

Built by hand with HTML, CSS, JS and too much coffee.
