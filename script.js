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
    const score = item.k.reduce((n, kw) => n + (text.includes(kw) ? kw.length : 0), 0);
    if (score > bestScore) { bestScore = score; best = item; }
  });
  if (best) return best.a;
  return "I don't have that one in my notes yet — but Maaz does. The quickest route is his <b>LinkedIn</b> (linkedin.com/in/maaz-khan-9124232bb) or Discord <b>@maazkhan-26796</b>. Try asking about his <b>skills</b>, <b>projects</b> or <b>goal</b>.";
}
function addMsg(html, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = html;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}
let greeted = false;
function openChat() {
  closePalette();
  chat.hidden = false;
  document.body.classList.add("locked");
  if (!greeted) {
    greeted = true;
    setTimeout(() => addMsg("Hi, I'm <b>Maaz's AI</b> ✦ Ask me anything — his stack, projects, the 2030 goal, or how to reach him.", "bot"), 160);
  }
  setTimeout(() => chatInput.focus(), 220);
}
function closeChat() {
  chat.hidden = true;
  document.body.classList.remove("locked");
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-ask-ai]")) openChat();
  if (e.target.closest("[data-close-chat]")) closeChat();
});
let busy = false;
const SYSTEM_PROMPT = [
  "You are 'Ask Maaz AI', the friendly assistant embedded in the portfolio of Maaz Khan.",
  "Answer as if you are Maaz's own assistant. Be warm, confident and specific.",
  "",
  "FACTS (use these, never invent others):",
  "- Name: Maaz Khan. B.Tech Applied AI student at Polaris School of Technology.",
  "- Goal: become a software engineer by 2030; open to internships and collaborations now.",
  "- Languages: Python, JavaScript, C++, Java.",
  "- Web: React, HTML5, CSS3, REST APIs, hand-built UI with motion design.",
  "- Applied AI: prompt engineering, LLM APIs, pandas/NumPy; learning TypeScript, Next.js, PyTorch, system design, DSA in C++, Postgres, Docker.",
  "- Projects: Prompt Playground (compare LLM prompts), StudyMate AI (notes to summaries/flashcards), DSA Drill (spaced repetition in C++), and this portfolio site itself.",
  "- Contact: LinkedIn linkedin.com/in/maaz-khan-9124232bb · GitHub github.com/Maazkhan96271 · Discord @maazkhan-26796 · Instagram & Threads @khan.maazasif5 · X @maazasifkhan5 · YouTube @MaazKhan-5.",
  "- He is based in India, studies full-time, and likes shipping side projects late at night.",
  "",
  "STYLE: 2-4 short sentences or a compact bullet list. Under 70 words. Plain text only, no markdown headers, no emoji unless the user uses one. If you truly don't know, say so in one line and point to his LinkedIn."
].join("\n");

const LLM_ENDPOINT = "https://text.pollinations.ai/openai";
const history = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function llmOnce(q, model, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-6),
          { role: "user", content: q }
        ],
        temperature: 0.7,
        max_tokens: 240
      }),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error("http " + res.status);
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message
      ? String(data.choices[0].message.content || "").trim()
      : "";
    if (!text) throw new Error("empty response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* two models, one retry each — then the local knowledge base takes over */
async function llmAnswer(q) {
  const plan = [
    { model: "openai", ms: 12000 },
    { model: "openai-fast", ms: 9000 }
  ];
  let err;
  for (let i = 0; i < plan.length; i++) {
    if (i) await sleep(1400);
    try { return await llmOnce(q, plan[i].model, plan[i].ms); }
    catch (e) { err = e; }
  }
  throw err;
}

/* progressive reveal, so a real LLM answer arrives like a stream */
function revealLive(el, text) {
  if (reduce || text.length < 90) { el.textContent = text; return; }
  let i = 0;
  const step = Math.max(2, Math.round(text.length / 120));
  const tick = () => {
    i = Math.min(text.length, i + step);
    el.textContent = text.slice(0, i);
    el.scrollTop = el.scrollHeight;
    chatLog.scrollTop = chatLog.scrollHeight;
    if (i < text.length) setTimeout(tick, 18);
  };
  tick();
}

async function ask(q) {
  if (!q || busy) return;
  busy = true;
  addMsg(q.replace(/</g, "&lt;"), "me");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = "<i></i><i></i><i></i>";
  chatLog.appendChild(typing);
  chatLog.scrollTop = chatLog.scrollHeight;

  let text, live = true;
  try {
    text = await Promise.race([
      llmAnswer(q),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 21000))
    ]);
  } catch (err) {
    live = false;
    text = answer(q);
  }
  typing.remove();

  if (live) {
    history.push({ role: "user", content: q }, { role: "assistant", content: text });
    if (history.length > 8) history.splice(0, history.length - 8);
    const el = addMsg("", "bot live");
    revealLive(el, text.replace(/\s+$/g, ""));
  } else {
    addMsg(text + '<em class="msg-fallback">local fallback — the live model was unreachable</em>', "bot");
  }
  busy = false;
}
$("#chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = chatInput.value.trim();
  chatInput.value = "";
  ask(q);
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
