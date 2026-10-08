/* Maaz Khan — portfolio interactions
   1 helpers · 2 chrome · 3 reveals · 4 palette · 5 assistant */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

/* ---------- theme ---------- */
const root = document.documentElement;
const stored = localStorage.getItem("mk-theme");
if (stored) root.dataset.theme = stored;
else if (matchMedia("(prefers-color-scheme: light)").matches) root.dataset.theme = "light";
function toggleTheme() {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  localStorage.setItem("mk-theme", next);
  toast(next === "light" ? "Light mode on" : "Dark mode on");
}
$("#themeBtn").addEventListener("click", toggleTheme);
document.addEventListener("click", e => {
  if (e.target.closest("[data-toggle-theme]")) toggleTheme();
});

/* ---------- nav ---------- */
const nav = $("#nav");
const menuBtn = $("#menuBtn");
const navLinks = $("#navLinks");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
navLinks.addEventListener("click", e => {
  if (e.target.tagName === "A") {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

/* scroll: progress bar, sticky nav, active link, back to top */
const bar = $("#progressBar");
const sections = $$("main section[id]");
const links = $$(".nav-links a");
let ticking = false;
function onScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  nav.classList.toggle("stuck", y > 12);
  let current = "";
  sections.forEach(s => { if (y >= s.offsetTop - innerHeight * 0.35) current = s.id; });
  links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  ticking = false;
}
addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();
$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
$("#year").textContent = new Date().getFullYear();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    io.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
$$(".reveal").forEach((el, i) => {
  el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
  io.observe(el);
});

/* ---------- counters ---------- */
const cio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    cio.unobserve(el);
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduce || target > 1000) { el.textContent = target + suffix; return; }
    const dur = 1300, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach(el => cio.observe(el));

/* ---------- skill meters ---------- */
const sio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    sio.unobserve(el);
    const lvl = el.dataset.level;
    el.style.setProperty("--w", lvl + "%");
    requestAnimationFrame(() => el.classList.add("on"));
  });
}, { threshold: 0.5 });
$$(".skill").forEach(el => sio.observe(el));

/* ---------- copy buttons ---------- */
document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const value = btn.dataset.copy;
  try { await navigator.clipboard.writeText(value); }
  catch { 
    const ta = document.createElement("textarea");
    ta.value = value; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  toast(btn.dataset.toast || ("Copied " + value));
});

/* ---------- pointer glow + magnetic buttons ---------- */
const glow = $("#cursorGlow");
if (matchMedia("(pointer: fine)").matches && !reduce) {
  let gx = 0, gy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY;
    glow.classList.add("on");
  }, { passive: true });
  (function loop() {
    gx += (tx - gx) * 0.09; gy += (ty - gy) * 0.09;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(loop);
  })();

  $$(".btn").forEach(btn => {
    btn.addEventListener("pointermove", e => {
      const r = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width / 2) * 0.18;
      const my = (e.clientY - r.top - r.height / 2) * 0.28;
      btn.style.transform = `translate(${mx}px, ${my - 2}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });

  const frame = $("#photoFrame");
  if (frame) {
    const parent = frame.parentElement;
    parent.addEventListener("pointermove", e => {
      const r = parent.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = `rotate(${dx * 6}deg) translateY(${dy * -10}px)`;
    });
    parent.addEventListener("pointerleave", () => { frame.style.transform = ""; });
  }
}

/* ---------- command palette ---------- */
const palette = $("#palette");
const paletteInput = $("#paletteInput");
const paletteList = $("#paletteList");
const COMMANDS = [
  { icon: "⌂", label: "Home", hint: "page", run: () => go("#top") },
  { icon: "◍", label: "About Maaz", hint: "page", run: () => go("#about") },
  { icon: "▤", label: "Tech stack", hint: "page", run: () => go("#stack") },
  { icon: "▣", label: "Selected work", hint: "page", run: () => go("#work") },
  { icon: "✦", label: "AI features", hint: "page", run: () => go("#ai") },
  { icon: "⧉", label: "Social links", hint: "page", run: () => go("#socials") },
  { icon: "→", label: "Journey to 2030", hint: "page", run: () => go("#journey") },
  { icon: "✉", label: "Contact", hint: "page", run: () => go("#contact") },
  { icon: "✦", label: "Ask my AI", hint: "action", run: () => openChat() },
  { icon: "◐", label: "Toggle theme", hint: "action", run: () => toggleTheme() },
  { icon: "⧉", label: "Copy Discord handle", hint: "action", run: () => copyText("maazkhan-26796", "Discord handle copied") },
  { icon: "↗", label: "Open GitHub", hint: "social", run: () => window.open("https://github.com/Maazkhan96271", "_blank", "noopener") },
  { icon: "↗", label: "Open LinkedIn", hint: "social", run: () => window.open("https://www.linkedin.com/in/maaz-khan-9124232bb/", "_blank", "noopener") },
  { icon: "↗", label: "Open Instagram", hint: "social", run: () => window.open("https://www.instagram.com/khan.maazasif5/", "_blank", "noopener") },
  { icon: "↗", label: "Open X / Twitter", hint: "social", run: () => window.open("https://x.com/maazasifkhan5", "_blank", "noopener") },
  { icon: "↗", label: "Open Threads", hint: "social", run: () => window.open("https://www.threads.net/@khan.maazasif5", "_blank", "noopener") },
  { icon: "▶", label: "Open YouTube", hint: "social", run: () => window.open("https://www.youtube.com/@MaazKhan-5", "_blank", "noopener") }
];
function go(sel) {
  closePalette();
  const el = $(sel);
  if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
async function copyText(value, msg) {
  try { await navigator.clipboard.writeText(value); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = value; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  toast(msg);
}
let filtered = COMMANDS, activeIdx = 0;
function renderPalette(q = "") {
  const needle = q.trim().toLowerCase();
  filtered = needle
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(needle) || c.hint.includes(needle))
    : COMMANDS;
  if (!filtered.length) {
    paletteList.innerHTML = '<li class="palette-empty">No matches — try “AI”, “GitHub” or “theme”</li>';
    return;
  }
  activeIdx = 0;
  paletteList.innerHTML = filtered.map((c, i) => {
    let label = c.label;
    if (needle) {
      const at = label.toLowerCase().indexOf(needle);
      if (at > -1) label = label.slice(0, at) + "<mark>" + label.slice(at, at + needle.length) + "</mark>" + label.slice(at + needle.length);
    }
    return `<li role="option" aria-selected="${i === 0}" data-i="${i}"><span class="p-ico">${c.icon}</span>${label}<small>${c.hint}</small></li>`;
  }).join("");
}
function setActive(i) {
  const items = $$("li[data-i]", paletteList);
  if (!items.length) return;
  activeIdx = (i + items.length) % items.length;
  items.forEach((li, n) => li.setAttribute("aria-selected", String(n === activeIdx)));
  items[activeIdx].scrollIntoView({ block: "nearest" });
}
function openPalette() {
  palette.hidden = false;
  document.body.classList.add("locked");
  paletteInput.value = "";
  renderPalette();
  requestAnimationFrame(() => paletteInput.focus());
}
function closePalette() {
  palette.hidden = true;
  document.body.classList.remove("locked");
}
$("#searchBtn").addEventListener("click", openPalette);
document.addEventListener("click", e => {
  if (e.target.closest("[data-open-palette]")) openPalette();
  if (e.target.closest("[data-close-palette]")) closePalette();
  const item = e.target.closest("li[data-i]");
  if (item && palette.contains(item)) filtered[+item.dataset.i].run();
});
paletteInput.addEventListener("input", e => renderPalette(e.target.value));
paletteInput.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
  else if (e.key === "Enter") { e.preventDefault(); filtered[activeIdx]?.run(); }
});

/* ---------- assistant ---------- */
const chat = $("#chat");
const chatLog = $("#chatLog");
const chatInput = $("#chatInput");
const KNOWLEDGE = [
  { k: ["skill", "know", "stack", "technolog", "language", "tech"],
    a: "Maaz works across the full stack of an AI-minded builder:<ul><li><b>Languages</b> — Python, JavaScript, C++, Java</li><li><b>Web</b> — React, HTML5, CSS3, REST APIs</li><li><b>Applied AI</b> — prompt engineering, LLM APIs, pandas/NumPy</li><li><b>Learning now</b> — TypeScript, Next.js, PyTorch, system design</li></ul>" },
  { k: ["project", "built", "work", "portfolio", "made"],
    a: "A few things he's shipped:<ul><li><b>Prompt Playground</b> — compare LLM prompts side by side</li><li><b>StudyMate AI</b> — turns lecture notes into summaries and flashcards</li><li><b>DSA Drill</b> — spaced-repetition drilling for data structures in C++</li><li><b>This portfolio</b> — hand-built, no framework, with this assistant</li></ul>Everything lives on his GitHub: <b>github.com/Maazkhan96271</b>" },
  { k: ["contact", "reach", "email", "hire", "message", "talk", "dm"],
    a: "Fastest ways to reach Maaz:<ul><li><b>LinkedIn</b> — linkedin.com/in/maaz-khan-9124232bb</li><li><b>Discord</b> — @maazkhan-26796 (use the copy button in Socials)</li><li><b>Instagram / Threads</b> — @khan.maazasif5</li><li><b>X</b> — @maazasifkhan5</li></ul>" },
  { k: ["goal", "2030", "future", "plan", "aim", "dream"],
    a: "The 2030 goal: a <b>software engineer</b> role at a team that ships fast and cares about craft. Between now and then he's finishing a B.Tech in Applied AI, shipping AI-assisted products, and leveling up DSA and system design." },
  { k: ["education", "school", "college", "study", "degree", "polaris", "university"],
    a: "Maaz is pursuing a <b>B.Tech in Applied AI</b> at <b>Polaris School of Technology</b>, where he focuses on machine learning fundamentals, data structures and building products for real users." },
  { k: ["who", "about", "intro", "yourself", "maaz"],
    a: "I'm <b>Maaz Khan</b> — a B.Tech Applied AI student who started with HTML pages, moved into React and JavaScript, and now builds at the intersection of <b>AI and the web</b>. Curious, fast-moving, and partial to late-night side projects." },
  { k: ["c++", "cpp", "java", "javascript", "which of those", "which one", "language"],
    a: "Here's the language-to-project map:<ul><li><b>C++</b> — DSA Drill, his spaced-repetition trainer for data structures (and his DSA practice in general)</li><li><b>Python</b> — Prompt Playground, StudyMate AI, pandas/NumPy work</li><li><b>JavaScript</b> — the web side: React, motion design, and this very site</li><li><b>Java</b> — coursework and exercises</li></ul>" },
  { k: ["react", "frontend", "front end", "ui", "css", "html"],
    a: "Front-end is his home turf: <b>React</b> for components, <b>HTML5</b> and <b>CSS3</b> for structure and motion, plus a soft spot for scroll animation and detail work — like this page." },
  { k: ["python", "ai", "ml", "llm", "model", "data"],
    a: "Python is his AI workhorse — pandas and NumPy for data, LLM APIs and prompt engineering for features, with PyTorch next on the list." },
  { k: ["intern", "job", "opportun", "open to", "available"],
    a: "He's open to internships and collaborations from now through 2030 — especially anything at the AI × web intersection. LinkedIn is the best place to reach him." },
  { k: ["fun", "hobby", "outside", "free time"],
    a: "Outside coursework: shipping side projects, breaking them, and putting them back together better. Also a fan of good coffee and too many browser tabs." },
  { k: ["hi", "hello", "hey", "salam", "assalam"],
    a: "Hey! 👋 I'm Maaz's AI. Ask me about his skills, projects, education or how to get in touch." },
  { k: ["thank", "thanks", "nice", "cool", "awesome"],
    a: "Glad you liked it ✨ — anything else you want to know about Maaz?" }
];
function answer(q) {
  const text = q.toLowerCase();
  let best = null, bestScore = 0;
  KNOWLEDGE.forEach(item => {
    const score = item.k.reduce((n, kw) => {
      const re = new RegExp("\\b" + kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      return n + (re.test(text) ? kw.length : 0);
    }, 0);
    if (score > bestScore) { bestScore = score; best = item; }
  });
  return best ? best.a : null; /* null = not a profile question, try the live model */
}
/* a question is about Maaz when it names him or refers to him — otherwise it is an
   ordinary general-knowledge question and the profile notes must not answer it */
const isProfileQuestion = q => /\bmaaz|\bhis\b|\bhe\b|\bhim\b|polaris|\bstudents?\b|2030|internship|\bmentor\b|\bresume\b/i.test(q);
const isChatty = q => /^\s*(hi|hello|hey|yo|sup|salam|assalam|thanks|thank you|thx|ty|nice|cool|awesome|great|wow|bye|goodnight)\b/i.test(q);
/* a follow-up (“which of those uses C++?”) only makes sense with the earlier turn */
const isFollowup = q => /^(which|what|who|how|about|and|or|those|them|that|it|they|their|more|else)\b/i.test(String(q).trim()) &&
  history.some(h => isProfileQuestion(h.content));
function addMsg(html, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = html;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}
/* every assistant answer gets a copy action, like a proper chat UI */
function attachCopy(el) {
  if (el.querySelector(".msg-copy")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "msg-copy";
  b.textContent = "copy answer";
  b.addEventListener("click", () => {
    const c = el.cloneNode(true);
    c.querySelectorAll(".msg-copy,.msg-fallback").forEach(n => n.remove());
    const text = c.innerText.trim();
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => toast("Answer copied"))
      .catch(() => toast("Couldn't copy — select the text instead"));
  });
  el.appendChild(b);
}
/* one tap to try the live model again when it was down */
function attachRetry(el, q) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "msg-copy";
  b.textContent = "retry live";
  b.addEventListener("click", () => {
    if (busy) { toast("One sec \u2014 still working on your last question"); return; }
    b.remove();
    busy = true;
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    chatLog.appendChild(typing);
    chatLog.scrollTop = chatLog.scrollHeight;
    llmAnswer(q).then(text => {
      typing.remove();
      history.push({ role: "user", content: q }, { role: "assistant", content: text });
      if (history.length > 8) history.splice(0, history.length - 8);
      revealLive(addMsg("", "bot live"), text.replace(/\s+$/g, ""));
      busy = false;
    }).catch(() => {
      typing.remove();
      busy = false;
      toast("Still down \u2014 give it a minute");
      b.textContent = "retry live";
      el.appendChild(b);
    });
  });
  el.appendChild(b);
}
let greeted = false;
/* dock the panel under the site header on wide screens — a command surface, not a corner bubble */
function setHeadH() {
  const nav = document.getElementById("nav");
  document.documentElement.style.setProperty("--head-h", ((nav && nav.offsetHeight) || 72) + "px");
}
setHeadH();
window.addEventListener("resize", setHeadH);
function openChat() {
  closePalette();
  setHeadH();
  const pop = window.innerWidth > 900;
  chat.querySelector(".chat-panel").classList.toggle("popover", pop);
  chat.classList.toggle("pop", pop);
  chat.hidden = false;
  document.body.classList.add("locked");
  if (!greeted) {
    greeted = true;
    setTimeout(() => attachCopy(addMsg("Hi, I'm <b>Maaz's AI</b> ✦ I answer anything — Maaz's stack, projects and goals, <i>or</i> any question in science, code, maths or history. What do you want to know?", "bot")), 160);
  }
  setTimeout(() => chatInput.focus(), 220);
}
function closeChat() {
  chat.hidden = true;
  document.body.classList.remove("locked");
}
/* contextual follow-up chips, Gemini-style */
function suggestFollow(q) {
  const note = $("#chatNote");
  if (!note) return;
  const profile = isProfileQuestion(q) || isChatty(q);
  const picks = profile
    ? ["What has he actually built?", "What's he learning right now?", "How do I reach him?"]
    : ["Explain it more simply", "Give me a real example", "Why does that matter?"];
  note.innerHTML = "";
  picks.forEach(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t;
    note.appendChild(b);
  });
}
$("#chatNote").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) ask(b.textContent.trim());
});
document.addEventListener("click", e => {
  if (e.target.closest("[data-ask-ai]")) openChat();
  if (e.target.closest("[data-close-chat]")) closeChat();
});
let busy = false;
const SYSTEM_PROMPT = [
  "You are 'Ask Maaz AI', the friendly assistant embedded in the portfolio of Maaz Khan.",
  "You answer EVERYTHING: general knowledge, science, history, geography, coding help, math, step-by-step explanations, opinions, writing and advice \u2014 as well as everything about Maaz.",
  "Questions that are not about Maaz are ordinary questions: answer them directly, accurately and helpfully. Never redirect a general question to a link, and never say a question is outside your scope.",
  "Questions about Maaz use only the facts below \u2014 never invent others.",
  "",
  "FACTS (about Maaz; never invent beyond these):",
  "- Name: Maaz Khan. B.Tech Applied AI student at Polaris School of Technology.",
  "- Goal: become a software engineer by 2030; open to internships and collaborations now.",
  "- Languages: Python, JavaScript, C++, Java.",
  "- Web: React, HTML5, CSS3, REST APIs, hand-built UI with motion design.",
  "- Applied AI: prompt engineering, LLM APIs, pandas/NumPy; learning TypeScript, Next.js, PyTorch, system design, DSA in C++, Postgres, Docker.",
  "- Projects: Prompt Playground (compare LLM prompts), StudyMate AI (notes to summaries/flashcards), DSA Drill (spaced repetition in C++), and this portfolio site itself.",
  "- Contact: LinkedIn linkedin.com/in/maaz-khan-9124232bb · GitHub github.com/Maazkhan96271 · Discord @maazkhan-26796 · Instagram & Threads @khan.maazasif5 · X @maazasifkhan5 · YouTube @MaazKhan-5.",
  "- He is based in India, studies full-time, and likes shipping side projects late at night.",
  "",
  "",
  "STYLE: 2-5 short sentences or a compact bullet list. Under 90 words. Plain text only, no markdown headers, no emoji unless the user uses one; **bold** is fine. Give a real answer every time \u2014 only if a fact about Maaz specifically is missing, say so in one line and mention his LinkedIn."
].join("\n");

const REFERRER = encodeURIComponent(location.origin && location.origin !== "null" ? location.origin : "https://maazkhan96271.github.io");
const LLM_ENDPOINT = "https://text.pollinations.ai/openai?referrer=" + REFERRER;
const history = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* channel 1: OpenAI-compatible POST (full profile system prompt + history) */
async function llmPost(q, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai-fast",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-6),
          { role: "user", content: q }
        ],
        temperature: 0.7,
        max_tokens: 800 /* the model reasons first — a small budget truncated answers mid-sentence */
      }),
      signal: ctrl.signal
    });
    if (!res.ok) { const err = new Error("http " + res.status); err.http = res.status; throw err; }
    const data = await res.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const text = msg ? String(msg.content || "").trim() : "";
    if (!text) { const err = new Error("empty response"); err.empty = true; throw err; }
    return text;
  } finally { clearTimeout(timer); }
}

/* channel 2: plain-text GET — a different code path on the provider, used when POST fails */
async function llmGet(q, ms) {
  const brief = "You are Ask Maaz AI, the assistant on Maaz Khan's portfolio. Answer any question helpfully and accurately in under 70 words, plain text. Question: ";
  const url = "https://text.pollinations.ai/" + encodeURIComponent(brief + q) +
    "?model=openai-fast&referrer=" + REFERRER;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) { const err = new Error("http " + res.status); err.http = res.status; throw err; }
    const text = (await res.text()).trim();
    if (!text || text[0] === "<" || text[0] === "{" || /Moved Permanently/i.test(text)) {
      const err = new Error("unusable body"); err.empty = true; throw err;
    }
    return text;
  } finally { clearTimeout(timer); }
}

/* deadline-bounded retry ladder: alternate the two channels, back off between attempts */
async function llmAnswer(q) {
  const deadline = Date.now() + 9000;
  const plan = [llmPost, llmGet, llmPost, llmGet];
  let last, hard = 0;
  for (let i = 0; i < plan.length; i++) {
    if (i) await sleep(Math.min(250 * Math.pow(2, i - 1), 1200) + Math.random() * 150);
    const left = deadline - Date.now();
    if (left < 1200) break;
    try { return await plan[i](q, Math.min(left, 7000)); }
    catch (e) {
      last = e;
      if (e.http === 404 || e.http === 410) break; /* route is gone */
      if (e.http && e.http !== 429 && e.http !== 408) hard++; /* definitive provider failure */
      if (hard >= 2) break; /* two strikes — don't waste the user's time, fall back now */
    }
  }
  throw last || new Error("no channel");
}

/* answers we already earned stay answered — a flaky provider can't un-serve them */
const AI_CACHE_KEY = "askmaaz.cache.v1";
function loadAICache() { try { return JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}"); } catch (e) { return {}; } }
function rememberAnswer(q, text) {
  try {
    const c = loadAICache();
    c[q.trim().toLowerCase().slice(0, 160)] = text;
    const keys = Object.keys(c);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete c[k]);
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(c));
  } catch (e) { /* private mode — fine */ }
}

/* backstop: when the live model is unreachable, factual questions still get a real answer */
function wikiQuery(q) {
  return q.toLowerCase()
    .replace(/[?!.,:;"'\u2019]+/g, " ")
    .replace(/\b(what|what's|whats|who|whom|whose|which|when|where|why|how|is|are|was|were|do|does|did|can|could|would|the|a|an|of|in|on|at|to|for|and|or|explain|tell|please|give|write|create|make|show|list|define|mean|me|about|does|works|work|sentence|sentences|example|briefly|simply)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
async function wikiAnswer(q, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1" +
      "&generator=search&gsrlimit=5&gsrsearch=" + encodeURIComponent(wikiQuery(q) || q) +
      "&prop=extracts&exintro=1&explaintext=1";
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data && data.query && data.query.pages;
    if (!pages) return null;
    /* only trust a hit that actually relates to the question */
    const STOP = ["what", "when", "where", "which", "with", "from", "that", "this", "have", "been", "were", "will", "would", "about", "into", "over", "does", "tell", "give", "some", "most", "very", "their", "there", "than", "then", "them", "they", "your", "make", "made", "best", "like", "works", "work", "sentence", "sentences", "two", "using", "used"];
    const words = ((wikiQuery(q) || q).toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w => STOP.indexOf(w) === -1);
    if (!words.length) return null;
    let page = null, score = 0;
    Object.values(pages).forEach(p => {
      if (!p || !p.extract || p.missing !== undefined) return;
      const title = String(p.title).toLowerCase();
      const titleTokens = title.split(/[^a-z0-9]+/);
      const head = String(p.extract).slice(0, 420).toLowerCase();
      let s = 0;
      words.forEach(w => {
        if (titleTokens.indexOf(w) !== -1) s += 1;
        if (head.includes(w)) s += 2;
      });
      if (s > score) { score = s; page = p; }
    });
    if (!page || score < 2) return null;
    let extract = String(page.extract).replace(/\s+/g, " ").trim();
    if (extract.length > 420) {
      extract = extract.slice(0, 420);
      extract = extract.slice(0, extract.lastIndexOf(" ")) + "\u2026";
    }
    return "**" + page.title + "** \u2014 " + extract +
      "\n\n(Wikipedia, because my live model is unreachable \u2014 ask again in a few seconds for a fuller answer.)";
  } catch (e) { return null; }
  finally { clearTimeout(timer); }
}

/* exact answers for “capital of X” — Wikipedia's summary endpoint follows the redirect to the city */
async function capitalAnswer(q, ms) {
  if (!/\bcapitals?\b/i.test(q)) return null;
  const country = (wikiQuery(q) || "").replace(/capitals?/ig, "").replace(/\s+/g, " ").trim();
  if (!country || country.split(" ").length > 4) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const titles = ["Capital of " + country, "Capital of the " + country];
    for (const t of titles) {
      const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(t.replace(/ /g, "_")), { signal: ctrl.signal });
      if (!r.ok) continue;
      const d = await r.json();
      if (!d || !d.extract) continue;
      let ex = String(d.extract).replace(/\s+/g, " ").trim();
      if (ex.length > 420) ex = ex.slice(0, 420).replace(/\s+\S*$/, "") + "\u2026";
      return ex;
    }
    return null;
  } catch (e) { return null; }
  finally { clearTimeout(timer); }
}

/* backstop for code questions: the highest-voted answer on Stack Overflow (CORS-open) */
function looksCodey(q) {
  return /\b(python|javascript|typescript|java|cpp|code|function|error|exception|loop|regex|api|sql|css|html|react|node|bash|shell|debug|algorithm|stackoverflow|write a|program|compile|variable|array|string)\b|c\+\+/i.test(q);
}
function stripHTML(html) {
  return String(html)
    .replace(/<pre[\s\S]*?<\/pre>/g, m => "\n```\n" + m.replace(/<[^>]+>/g, "") + "\n```\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
async function seAnswer(q, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const s = "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&site=stackoverflow&pagesize=1&q=" +
      encodeURIComponent(wikiQuery(q) || q);
    const r1 = await fetch(s, { signal: ctrl.signal });
    if (!r1.ok) return null;
    const d = await r1.json();
    const item = d && d.items && d.items[0];
    if (!item) return null;
    const r2 = await fetch("https://api.stackexchange.com/2.3/questions/" + item.question_id +
      "/answers?order=desc&sort=votes&site=stackoverflow&pagesize=1&filter=withbody", { signal: ctrl.signal });
    if (!r2.ok) return null;
    const a = await r2.json();
    const ans = a && a.items && a.items[0];
    if (!ans || !ans.body) return null;
    let body = stripHTML(ans.body);
    if (body.length > 700) body = body.slice(0, 700).replace(/\s+\S*$/, "") + "\u2026";
    return "**" + String(item.title).replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&") + "**\n" + body +
      "\n\n(Top-voted answer on Stack Overflow \u2014 [full thread](" + ans.link + ") \u00b7 live model unreachable)";
  } catch (e) { return null; }
  finally { clearTimeout(timer); }
}

/* instant, exact answers for sums — no network needed at all */
function mathAnswer(q) {
  let s = String(q).toLowerCase()
    .replace(/^(what('s| is)|calculate|compute|solve|how much is|evaluate)\s+/, "")
    .replace(/[?=]+$/, "")
    .replace(/\u00d7|(?<=\d)\s*x\s*(?=\d)/g, "*")
    .replace(/\u00f7/g, "/")
    .trim();
  if (!/[\d]/.test(s) || !/[+\-*/^]/.test(s)) return null;
  if (!/^[\d\s+\-*/().^]+$/.test(s)) return null;
  if (/^\s*[\d.]+\s*$/.test(s)) return null; /* a bare number isn't a question */
  try {
    const val = Function('"use strict"; return (' + s.replace(/\^/g, "**") + ")")();
    if (typeof val !== "number" || !isFinite(val)) return null;
    const out = Math.round(val * 1e6) / 1e6;
    return "`" + String(q).trim().replace(/[?=]+$/, "") + "` = **" + out + "**";
  } catch (e) { return null; }
}

/* second backstop: DuckDuckGo's instant answers (CORS-open, no key) */
async function ddgAnswer(q, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch("https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" +
      encodeURIComponent(wikiQuery(q) || q), { signal: ctrl.signal });
    if (!res.ok) return null;
    const d = await res.json();
    let text = "";
    if (d.Answer) text = "**" + d.Answer + "**";
    else if (d.AbstractText) text = "**" + (d.AbstractSource || "Source") + "** \u2014 " + d.AbstractText;
    else if (d.Definition) text = "**" + (d.DefinitionSource || "Definition") + "** \u2014 " + d.Definition;
    if (!text) return null;
    /* relevance gate: at least one real word from the question must appear */
    const STOP = ["what", "when", "where", "which", "with", "from", "that", "this", "have", "been", "were", "will", "would", "about", "into", "over", "does", "tell", "give", "some", "most", "very", "their", "there", "than", "then", "them", "they", "your", "make", "made", "best", "like", "does"];
    const words = (q.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter(w => STOP.indexOf(w) === -1);
    const hay = ((d.Heading || "") + " " + text).toLowerCase();
    if (words.length && !words.some(w => hay.includes(w))) return null;
    if (text.length > 420) text = text.slice(0, 420).replace(/\s+\S*$/, "") + "\u2026";
    return text + "\n\n(DuckDuckGo, because my live model is unreachable \u2014 ask again in a few seconds for a fuller answer.)";
  } catch (e) { return null; }
  finally { clearTimeout(timer); }
}

/* progressive reveal, so a real LLM answer arrives like a stream */
function escapeHTML(s) {
  return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function inlineMD(s) {
  return s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
/* one markdown block: bold, links, code spans, bullet lines */
function mdBlock(s) {
  const lines = escapeHTML(String(s).trim()).split(/\n+/);
  const out = [];
  let inList = false;
  const close = () => { if (inList) { out.push("</ul>"); inList = false; } };
  lines.forEach(line => {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push("<li>" + inlineMD(m[1]) + "</li>");
    } else if (line.trim()) {
      close();
      const h = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
      out.push("<div>" + inlineMD(h ? "**" + h[1] + "**" : line) + "</div>");
    }
  });
  close();
  return out.join("");
}
/* fenced code blocks + everything above — enough for a real chat answer */
function md(s) {
  return String(s).trim().split(/```/).map((part, i) => {
    if (i % 2 === 0) return mdBlock(part);
    const nl = part.indexOf("\n");
    const body = escapeHTML((nl === -1 ? "" : part.slice(nl + 1)).trim());
    return body ? '<pre class="msg-pre"><code>' + body + "</code></pre>" : "";
  }).join("");
}
function revealLive(el, text) {
  const plain = text.replace(/\*\*/g, "").replace(/`/g, "");
  const done = () => { el.innerHTML = md(text); attachCopy(el); };
  if (reduce || plain.length < 90) { done(); return; }
  let i = 0;
  const step = Math.max(2, Math.round(plain.length / 120));
  const tick = () => {
    i = Math.min(plain.length, i + step);
    el.textContent = plain.slice(0, i);
    chatLog.scrollTop = chatLog.scrollHeight;
    if (i < plain.length) setTimeout(tick, 18);
    else done();
  };
  tick();
}

async function ask(q) {
  if (!q || busy) return;
  busy = true;
  addMsg(q.replace(/</g, "&lt;"), "me");
  const typing = document.createElement("div");
  typing.className = "typing live";
  typing.innerHTML = "<i></i><i></i><i></i>";
  chatLog.appendChild(typing);
  chatLog.scrollTop = chatLog.scrollHeight;

  let text = null, source = "live";
  const cached = loadAICache()[q.trim().toLowerCase().slice(0, 160)];
  if (cached) {
    text = cached; /* instant — we answered this before */
  } else try {
    text = await llmAnswer(q);
    rememberAnswer(q, text);
  } catch (err) {
    const kb = answer(q);
    const aboutMaaz = isProfileQuestion(q) || isChatty(q) || isFollowup(q);
    if (aboutMaaz && kb) {
      /* profile question: the built-in notes answer it instantly and correctly */
      source = "kb";
      text = kb;
    } else {
      /* general question: never answer from the profile notes — go to real sources */
      source = "offline";
      text = mathAnswer(q);
      if (text) source = "math";
      if (!text) { text = await capitalAnswer(q, 3500); if (text) source = "wiki"; }
      if (!text && looksCodey(q)) { text = await seAnswer(q, 5500); if (text) source = "so"; }
      if (!text) { text = await wikiAnswer(q, 4500); if (text) source = "wiki"; }
      if (!text) { text = await ddgAnswer(q, 3500); if (text) source = "ddg"; }
      if (!text && kb && aboutMaaz) { text = kb; source = "kb"; }
      if (!text) text = "I couldn't reach any live source this second, and that one isn't in my notes about Maaz. Ask again in a few seconds \u2014 I'll have it. Meanwhile I can tell you about his skills, projects, education or contact.";
    }
  }
  typing.remove();

  /* every exchange becomes context for the next question — even fallback answers */
  history.push({ role: "user", content: q },
    { role: "assistant", content: String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) });
  if (history.length > 8) history.splice(0, history.length - 8);

  if (source === "live") {
    const el = addMsg("", "bot live");
    revealLive(el, text.replace(/\s+$/g, ""));
  } else {
    const badge = {
      kb: "profile knowledge \u2014 live model unreachable",
      wiki: "from Wikipedia \u2014 live model unreachable",
      ddg: "from DuckDuckGo \u2014 live model unreachable",
      so: "from Stack Overflow \u2014 live model unreachable",
      math: "computed locally \u2014 live model unreachable",
      offline: "my live model is unreachable right now \u2014 ask again in a few seconds"
    }[source];
    const html = source === "kb" ? text : md(text);
    const bubble = addMsg(html + '<em class="msg-fallback">' + badge + "</em>", "bot");
    attachCopy(bubble);
    if (source === "offline") attachRetry(bubble, q);
  }
  busy = false;
  suggestFollow(q);
}
$("#chatForm").addEventListener("submit", e => {
  e.preventDefault();
  if (busy) { toast("One sec — still working on your last question"); return; }
  const q = chatInput.value.trim();
  chatInput.value = "";
  chatInput.style.height = "";
  ask(q);
});
/* multi-line composer: Enter sends, Shift+Enter makes a new line */
const growInput = () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 118) + "px";
};
chatInput.addEventListener("input", growInput);
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chatForm").requestSubmit(); }
});
$("#chatSuggest").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) ask(b.textContent.trim());
});

/* ---------- keyboard shortcuts ---------- */
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); }
  else if ((e.metaKey || e.ctrlKey) && k === "/") { e.preventDefault(); openChat(); }
  else if (e.key === "Escape") { closePalette(); closeChat(); }
  else if (k === "j" && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(e.target.tagName)) openChat();
});
})();
