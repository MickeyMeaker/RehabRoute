/* RehabRoute prototype – member injury journey
   Static, no backend. State is kept in localStorage so the demo survives a refresh. */

const FEE = 49; // initial upfront fee in GBP (placeholder)

const AREAS = {
  shoulder:  { label: "Shoulder", emoji: "💪", keepTraining: "Lower-body strength, bike, walking, core work that doesn't load the shoulder" },
  knee:      { label: "Knee", emoji: "🦵", keepTraining: "Upper-body strength, seated core work, swimming (pull buoy), upper-body ergometer" },
  lowerback: { label: "Lower back", emoji: "🔙", keepTraining: "Walking, bike, supported upper-body machines, gentle mobility" },
  ankle:     { label: "Ankle / foot", emoji: "🦶", keepTraining: "Upper-body strength, seated core work, swimming" },
  hip:       { label: "Hip / groin", emoji: "🍑", keepTraining: "Upper-body strength, pain-free walking, swimming (arms only if needed)" },
  wrist:     { label: "Elbow / wrist", emoji: "✋", keepTraining: "Lower-body machines, bike, running, core work without gripping" },
  neck:      { label: "Neck", emoji: "🧣", keepTraining: "Lower-body machines, bike, walking" },
  hamstring: { label: "Hamstring / calf", emoji: "🏃", keepTraining: "Upper-body strength, swimming, pain-free bike" }
};

const EXERCISES = {
  shoulder:  ["Pendulum swings – 2 × 30s", "Isometric external rotation against wall – 5 × 20s hold", "Band rows – 3 × 12", "Wall slides – 2 × 10"],
  knee:      ["Quad sets – 3 × 10 (5s hold)", "Straight-leg raise – 3 × 10", "Box squat to bench – 3 × 8", "Low step-ups – 3 × 8 each side"],
  lowerback: ["Cat–cow – 2 × 10", "Bird dog – 3 × 8 each side", "Glute bridge – 3 × 12", "Dead bug – 3 × 8 each side"],
  ankle:     ["Ankle alphabet – 2 rounds", "Double-leg calf raises – 3 × 12", "Single-leg balance – 3 × 30s", "Band eversion – 3 × 12"],
  hip:       ["Clamshells – 3 × 12", "Glute bridge – 3 × 12", "Kneeling hip-flexor stretch – 3 × 30s", "Side-lying leg raise – 3 × 10"],
  wrist:     ["Wrist isometrics (flex/extend) – 5 × 20s", "Eccentric wrist extension – 3 × 12", "Grip squeezes – 3 × 15", "Forearm rotation with light dumbbell – 3 × 12"],
  neck:      ["Chin tucks – 3 × 10", "Scapular retraction – 3 × 12", "Gentle neck rotation – 2 × 10", "Upper-trap stretch – 3 × 30s"],
  hamstring: ["Isometric bridge hold – 5 × 20s", "Slider hamstring curls – 3 × 8", "Calf raises – 3 × 12", "Pain-free brisk walk – 15 min"]
};

const CAUSES = ["Lifting weights", "Running / sport", "Fall or impact", "Gradual – no clear cause", "Woke up with it", "Other"];
const DURATIONS = ["Less than 1 week", "1–6 weeks", "6–12 weeks", "More than 3 months"];
const AGGRAVATORS = ["Lifting overhead", "Bending / lifting", "Running or jumping", "Sitting for long periods", "Gripping", "Twisting", "Stairs", "Lying on it at night"];
const RED_FLAGS = [
  "Severe pain at night that stops you sleeping, whatever position you're in",
  "Numbness, tingling or weakness spreading into an arm or leg",
  "Loss of bladder or bowel control, or numbness around the groin",
  "Fever, feeling generally unwell, or unexplained weight loss",
  "A fall or impact and the area looks deformed, or you can't bear weight",
  "Chest pain, shortness of breath, or pain spreading into your jaw or arm"
];

const DEFAULT_STATE = {
  view: "home",
  area: null,
  side: "",
  bodyView: "front",
  pain: 4,
  cause: "",
  duration: "",
  aggravators: [],
  redFlags: [],
  slot: null,
  paid: false,
  stage: 0,          // 0 none, 1 physio consult booked, 2 in-gym assessment, 3 rehab plan
  completed: {},     // exercise completion for today
  painLog: []
};

let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem("rehabroute"));
    return s ? { ...DEFAULT_STATE, ...s } : { ...DEFAULT_STATE };
  } catch { return { ...DEFAULT_STATE }; }
}
function save() {
  try { localStorage.setItem("rehabroute", JSON.stringify(state)); } catch { /* storage unavailable */ }
}
function setKeep(patch) { state = { ...state, ...patch }; save(); render(); }
function set(patch) { state = { ...state, ...patch }; save(); render(); window.scrollTo(0, 0); }

const $app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Triage logic (rule-based stand-in for the AI) ---------- */
function triage() {
  const flags = state.redFlags.length;
  if (flags > 0) return { band: "red", label: "Needs medical review", pathway: "refer" };
  if (state.pain >= 8 || state.duration === "More than 3 months" || state.cause === "Fall or impact" && state.pain >= 6)
    return { band: "amber", label: "Moderate – physio-led", pathway: "physio-first" };
  return { band: "green", label: "Mild to moderate", pathway: "rehab" };
}

/* ---------- Views ---------- */
const views = {
  home() {
    return `
      <section class="card hero">
        <h1>Injured? Don't pause your membership.</h1>
        <p class="lead">Get a quick injury check, a video consultation with a physiotherapist, and a rehab plan delivered by your gym's personal trainer – while you wait for your NHS appointment.</p>
        <button class="btn accent" data-go="area">Start injury check</button>
        ${state.stage > 0 ? `<button class="btn ghost" style="background:#fff" data-go="journey">Continue my rehab</button>` : ""}
      </section>
      <section class="card">
        <h2>How it works</h2>
        <ol class="steps">
          <li><div class="num">1</div><div><strong>AI injury check</strong><br><span class="muted">Tell us where it hurts and how. We screen for anything that needs a doctor.</span></div></li>
          <li><div class="num">2</div><div><strong>Physio video consultation</strong><br><span class="muted">A registered physiotherapist reviews your report on a Teams call.</span></div></li>
          <li><div class="num">3</div><div><strong>In-gym assessment</strong><br><span class="muted">Your PT runs movement tests while the physio joins by video.</span></div></li>
          <li><div class="num">4</div><div><strong>Rehab plan with your PT</strong><br><span class="muted">Physio sets the protocol, your PT guides you through it, so you keep training safely.</span></div></li>
        </ol>
      </section>
      <section class="card">
        <h2>For gyms</h2>
        <p class="muted">Members with injuries usually freeze or cancel. RehabRoute keeps them engaged and gives your PTs new rehab clients.</p>
        <div class="stats">
          <div class="stat"><b>B2B</b><span class="small muted">Gym licence</span></div>
          <div class="stat"><b>£${FEE}</b><span class="small muted">Member upfront fee</span></div>
          <div class="stat"><b>PT</b><span class="small muted">Extra sessions sold</span></div>
        </div>
      </section>`;
  },

  area() {
    const v = state.bodyView;
    return `
      <section class="card">
        ${progress(1)}
        <h2>Where does it hurt?</h2>
        <p class="muted">Tap the area on the body. Turn the body round to see your back.</p>
        <div class="toggle">
          <button class="${v === "front" ? "on" : ""}" data-bodyview="front">Front</button>
          <button class="${v === "back" ? "on" : ""}" data-bodyview="back">Back</button>
        </div>
        <div class="body-wrap">
          ${bodySVG(v)}
          <div class="body-side-labels"><span>${v === "front" ? "Right" : "Left"}</span><span>${v === "front" ? "Left" : "Right"}</span></div>
        </div>
        <p class="selected-area">${state.area ? `Selected: <strong>${esc(areaLabel())}</strong>` : "Nothing selected yet"}</p>
        <details class="list-fallback">
          <summary>Or choose from a list</summary>
          <div class="grid">
            ${Object.entries(AREAS).map(([k, a]) => `
              <button class="choice ${state.area === k ? "selected" : ""}" data-area="${k}" data-side="">
                <span class="emoji">${a.emoji}</span>${a.label}
              </button>`).join("")}
          </div>
        </details>
        <div class="actions">
          <button class="btn ghost" data-go="home">Back</button>
          <button class="btn" data-go="details" ${state.area ? "" : "disabled"}>Next</button>
        </div>
      </section>`;
  },

  details() {
    return `
      <section class="card">
        ${progress(2)}
        <h2>Tell us about your ${esc(areaLabel().toLowerCase())} pain</h2>
        <div class="field">
          <span>How bad is the pain right now? (0 = none, 10 = worst imaginable)</span>
          <div class="pain-value" id="painValue">${state.pain}</div>
          <input type="range" min="0" max="10" value="${state.pain}" id="pain" />
        </div>
        <div class="field">
          <span>How did it happen?</span>
          <select id="cause"><option value="">Select…</option>${CAUSES.map(c => `<option ${state.cause === c ? "selected" : ""}>${c}</option>`).join("")}</select>
        </div>
        <div class="field">
          <span>How long have you had it?</span>
          <select id="duration"><option value="">Select…</option>${DURATIONS.map(c => `<option ${state.duration === c ? "selected" : ""}>${c}</option>`).join("")}</select>
        </div>
        <div class="field">
          <span>What makes it worse? (tick all that apply)</span>
          ${AGGRAVATORS.map(a => `<label class="check"><input type="checkbox" data-agg="${esc(a)}" ${state.aggravators.includes(a) ? "checked" : ""}/> ${a}</label>`).join("")}
        </div>
        <div class="actions">
          <button class="btn ghost" data-go="area">Back</button>
          <button class="btn" data-go="safety" ${state.cause && state.duration ? "" : "disabled"} id="detailsNext">Next</button>
        </div>
      </section>`;
  },

  safety() {
    return `
      <section class="card">
        ${progress(3)}
        <h2>Safety check</h2>
        <p class="muted">Do any of these apply to you? Tick all that apply. If none do, just continue.</p>
        ${RED_FLAGS.map((f, i) => `<label class="check"><input type="checkbox" data-flag="${i}" ${state.redFlags.includes(i) ? "checked" : ""}/> ${f}</label>`).join("")}
        <div class="actions">
          <button class="btn ghost" data-go="details">Back</button>
          <button class="btn" data-go="report">See my report</button>
        </div>
      </section>`;
  },

  report() {
    const t = triage();
    const a = AREAS[state.area];
    if (t.pathway === "refer") {
      return `
        <section class="card">
          ${progress(4)}
          <h2>Please get this checked by a doctor first</h2>
          <div class="alert red">
            <strong>Your answers suggest this needs medical review before any rehab.</strong><br>
            Contact your GP or NHS 111 today. If you have chest pain, sudden weakness, or loss of bladder or bowel control, call 999 or go to A&amp;E.
          </div>
          <p class="muted">Your gym membership doesn't need to be cancelled. Once a doctor has cleared you, come back and we'll build your rehab plan.</p>
          <div class="actions">
            <button class="btn ghost" data-go="safety">Back</button>
            <button class="btn" data-reset>Start again</button>
          </div>
        </section>`;
    }
    return `
      <section class="card report">
        ${progress(4)}
        <h2>Your injury report <span class="pill ${t.band}">${t.label}</span></h2>
        <dl>
          <dt>Area</dt><dd>${esc(areaLabel())}</dd>
          <dt>Pain</dt><dd>${state.pain}/10</dd>
          <dt>Cause</dt><dd>${esc(state.cause)}</dd>
          <dt>Duration</dt><dd>${esc(state.duration)}</dd>
          <dt>Worse with</dt><dd>${state.aggravators.length ? state.aggravators.map(esc).join(", ") : "Not specified"}</dd>
          <dt>Red flags</dt><dd>None reported</dd>
        </dl>
        <div class="alert green">
          <strong>Good news:</strong> nothing in your answers needs urgent medical attention. A physiotherapist will review this report before you start any rehab.
        </div>
        <h3>What you can keep doing meanwhile</h3>
        <p>${a.keepTraining}. Stop anything that increases your pain.</p>
        ${t.pathway === "physio-first" ? `<p class="small muted">Because of your pain level or how long you've had it, the physio will see you before your PT gets involved.</p>` : ""}
        <div class="actions">
          <button class="btn ghost" data-go="safety">Back</button>
          <button class="btn accent" data-go="book">Book physio consultation</button>
        </div>
      </section>`;
  },

  book() {
    const slots = nextSlots();
    return `
      <section class="card">
        ${progress(5)}
        <h2>Book your physio video consultation</h2>
        <p class="muted">A 30-minute Teams call with an HCPC-registered physiotherapist. Your gym PT will be added to your care team.</p>
        <h3>Choose a time</h3>
        <div class="slots">
          ${slots.map(s => `<button class="choice ${state.slot === s ? "selected" : ""}" data-slot="${esc(s)}">${esc(s)}</button>`).join("")}
        </div>
        <h3>Payment</h3>
        <div class="alert green">
          <strong>£${FEE} one-off fee</strong> – covers the physio consultation, the in-gym assessment with your PT, and your rehab plan.
        </div>
        <div class="field"><span>Email</span><input type="email" placeholder="you@example.com" /></div>
        <p class="small muted">Demo only – no payment is taken.</p>
        <div class="actions">
          <button class="btn ghost" data-go="report">Back</button>
          <button class="btn accent" data-pay ${state.slot ? "" : "disabled"}>Pay £${FEE} and book</button>
        </div>
      </section>`;
  },

  journey() {
    const a = AREAS[state.area] || AREAS.shoulder;
    const stageItems = [
      ["Injury check", "AI report completed"],
      ["Physio consultation", state.slot ? `Booked: ${esc(state.slot)} (Teams)` : "Book a time"],
      ["In-gym assessment", "Your PT runs tests, physio joins by video"],
      ["Rehab plan", "Physio sets protocol, PT guides you"]
    ];
    const current = Math.min(state.stage, 3);
    return `
      <section class="card">
        <h2>My recovery – ${esc(areaLabel() || a.label)}</h2>
        <div class="team">
          <div class="person"><div class="avatar">SP</div><div><strong>Sarah Patel</strong><br><span class="small muted">Physiotherapist</span></div></div>
          <div class="person"><div class="avatar pt">JM</div><div><strong>Jordan Mills</strong><br><span class="small muted">Personal trainer, Bristol City Gym</span></div></div>
        </div>
        <ol class="steps" style="margin-top:12px">
          ${stageItems.map(([t, d], i) => `
            <li class="${i < current ? "done" : i === current ? "current" : ""}">
              <div class="num">${i < current ? "✓" : i + 1}</div>
              <div><strong>${t}</strong><br><span class="muted small">${d}</span></div>
            </li>`).join("")}
        </ol>
        ${current < 3 ? `
          <div class="actions">
            <span class="small muted">Demo: move to the next stage</span>
            <button class="btn" data-advance>${current === 1 ? "Mark consultation done" : "Mark assessment done"}</button>
          </div>` : ""}
      </section>
      ${current >= 3 ? rehabPlan(a) : `
      <section class="card">
        <h3>Meanwhile</h3>
        <p>${a.keepTraining}.</p>
      </section>`}
      <div class="actions">
        <button class="btn ghost" data-go="home">Home</button>
        <button class="btn ghost" data-reset>Reset demo</button>
      </div>`;
  }
};

function rehabPlan(a) {
  const list = EXERCISES[state.area] || [];
  const doneCount = list.filter((_, i) => state.completed[i]).length;
  const log = state.painLog.slice(-7);
  return `
    <section class="card">
      <h2>Today's rehab <span class="pill green">${doneCount}/${list.length} done</span></h2>
      <p class="small muted">Set by your physio · delivered with your PT · stop if pain goes above 5/10</p>
      ${list.map((e, i) => `
        <label class="exercise ${state.completed[i] ? "done" : ""}">
          <input type="checkbox" data-ex="${i}" ${state.completed[i] ? "checked" : ""}/>
          <span>${e}</span>
        </label>`).join("")}
      <h3>Log today's pain</h3>
      <input type="range" min="0" max="10" value="${log.length ? log[log.length - 1] : state.pain}" id="logPain" />
      <div class="actions">
        <span class="small muted">Recent: ${log.length ? log.join(" → ") : "no entries yet"}</span>
        <button class="btn" data-log>Save pain score</button>
      </div>
      <h3>Want an in-person consultation?</h3>
      <p class="muted small">If you're not improving after 4–6 weeks, your physio can arrange a face-to-face appointment.</p>
    </section>`;
}

function areaLabel() {
  if (!state.area) return "";
  const l = AREAS[state.area].label;
  return state.side ? `${state.side} ${l.toLowerCase()}` : l;
}

/* Body map. Front view: viewer's left is the person's right. Back view: viewer's left is the person's left. */
function bodySVG(view) {
  const front = view === "front";
  const L = front ? "Right" : "Left";   // side shown on the viewer's left
  const R = front ? "Left" : "Right";
  const base = `
    <g class="body-base">
      <circle cx="100" cy="34" r="22"/>
      <rect x="90" y="52" width="20" height="20" rx="6"/>
      <rect x="62" y="70" width="76" height="140" rx="24"/>
      <rect x="38" y="76" width="22" height="92" rx="11"/>
      <rect x="140" y="76" width="22" height="92" rx="11"/>
      <rect x="34" y="164" width="20" height="82" rx="10"/>
      <rect x="146" y="164" width="20" height="82" rx="10"/>
      <circle cx="44" cy="256" r="10"/>
      <circle cx="156" cy="256" r="10"/>
      <rect x="66" y="196" width="68" height="44" rx="16"/>
      <rect x="68" y="226" width="28" height="104" rx="14"/>
      <rect x="104" y="226" width="28" height="104" rx="14"/>
      <rect x="70" y="326" width="24" height="88" rx="12"/>
      <rect x="106" y="326" width="24" height="88" rx="12"/>
      <ellipse cx="82" cy="420" rx="15" ry="8"/>
      <ellipse cx="118" cy="420" rx="15" ry="8"/>
      ${front ? "" : `<line x1="100" y1="78" x2="100" y2="200" class="spine"/>`}
    </g>`;
  const spot = (area, side, shape) => {
    const sel = state.area === area && state.side === side ? " selected" : "";
    const name = side ? `${side} ${AREAS[area].label.toLowerCase()}` : AREAS[area].label;
    return shape.replace("/>", ` class="spot${sel}" data-area="${area}" data-side="${side}" tabindex="0" role="button" aria-label="${name}"><title>${name}</title></${shape.match(/^<(\w+)/)[1]}>`);
  };
  const common = [
    spot("neck", "", `<ellipse cx="100" cy="62" rx="14" ry="10"/>`),
    spot("shoulder", L, `<circle cx="56" cy="84" r="15"/>`),
    spot("shoulder", R, `<circle cx="144" cy="84" r="15"/>`),
    spot("wrist", L, `<ellipse cx="44" cy="208" rx="15" ry="50"/>`),
    spot("wrist", R, `<ellipse cx="156" cy="208" rx="15" ry="50"/>`)
  ];
  const frontSpots = [
    spot("hip", L, `<circle cx="80" cy="220" r="16"/>`),
    spot("hip", R, `<circle cx="120" cy="220" r="16"/>`),
    spot("knee", L, `<circle cx="82" cy="328" r="14"/>`),
    spot("knee", R, `<circle cx="118" cy="328" r="14"/>`),
    spot("ankle", L, `<ellipse cx="82" cy="414" rx="17" ry="13"/>`),
    spot("ankle", R, `<ellipse cx="118" cy="414" rx="17" ry="13"/>`)
  ];
  const backSpots = [
    spot("lowerback", "", `<ellipse cx="100" cy="178" rx="30" ry="22"/>`),
    spot("hip", L, `<circle cx="80" cy="222" r="15"/>`),
    spot("hip", R, `<circle cx="120" cy="222" r="15"/>`),
    spot("hamstring", L, `<ellipse cx="82" cy="282" rx="14" ry="38"/>`),
    spot("hamstring", R, `<ellipse cx="118" cy="282" rx="14" ry="38"/>`),
    spot("hamstring", L, `<ellipse cx="82" cy="368" rx="12" ry="30"/>`),
    spot("hamstring", R, `<ellipse cx="118" cy="368" rx="12" ry="30"/>`),
    spot("ankle", L, `<ellipse cx="82" cy="414" rx="17" ry="13"/>`),
    spot("ankle", R, `<ellipse cx="118" cy="414" rx="17" ry="13"/>`)
  ];
  return `<svg class="body" viewBox="0 0 200 440" role="img" aria-label="Body map, ${view} view">
    ${base}${common.join("")}${(front ? frontSpots : backSpots).join("")}
  </svg>`;
}

function progress(n) {
  return `<div class="progress">${[1, 2, 3, 4, 5].map(i => `<div class="${i <= n ? "on" : ""}"></div>`).join("")}</div>`;
}

function nextSlots() {
  const out = [];
  const d = new Date();
  const times = ["09:00", "12:30", "17:30"];
  for (let i = 1; out.length < 6; i++) {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    if (day.getDay() === 0) continue;
    const label = day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    out.push(`${label} ${times[i % 3]}`);
    if (out.length < 6) out.push(`${label} ${times[(i + 1) % 3]}`);
  }
  return out;
}

/* ---------- Rendering & events ---------- */
function render() {
  $app.innerHTML = (views[state.view] || views.home)();
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-go],[data-area],[data-bodyview],[data-slot],[data-pay],[data-reset],[data-advance],[data-log]");
  if (!el || el.disabled) return;
  e.preventDefault();
  if (el.dataset.go) return set({ view: el.dataset.go });
  if (el.dataset.bodyview) return set({ bodyView: el.dataset.bodyview });
  if (el.dataset.area) {
    const side = el.dataset.side || "";
    const same = state.area === el.dataset.area && state.side === side;
    return setKeep(same ? { area: null, side: "" } : { area: el.dataset.area, side });
  }
  if (el.dataset.slot) return set({ slot: el.dataset.slot });
  if (el.hasAttribute("data-pay")) return set({ paid: true, stage: 1, view: "journey" });
  if (el.hasAttribute("data-advance")) return set({ stage: state.stage + 1 });
  if (el.hasAttribute("data-log")) {
    const v = Number(document.getElementById("logPain").value);
    return set({ painLog: [...state.painLog, v] });
  }
  if (el.hasAttribute("data-reset")) { state = { ...DEFAULT_STATE }; save(); render(); }
});

document.addEventListener("keydown", e => {
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t.classList && t.classList.contains("spot")) { e.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "pain") {
    state.pain = Number(t.value);
    document.getElementById("painValue").textContent = t.value;
    save();
  }
});

document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "cause" || t.id === "duration") {
    state[t.id] = t.value; save();
    document.getElementById("detailsNext").disabled = !(state.cause && state.duration);
  }
  if (t.dataset.agg !== undefined) {
    const v = t.dataset.agg;
    state.aggravators = t.checked ? [...state.aggravators, v] : state.aggravators.filter(x => x !== v);
    save();
  }
  if (t.dataset.flag !== undefined) {
    const i = Number(t.dataset.flag);
    state.redFlags = t.checked ? [...state.redFlags, i] : state.redFlags.filter(x => x !== i);
    save();
  }
  if (t.dataset.ex !== undefined) {
    set({ completed: { ...state.completed, [t.dataset.ex]: t.checked } });
  }
});

render();
