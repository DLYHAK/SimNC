const I18N = {
  fr: {
    title: "QA Search",
    inputSection: "Entrée non-conformité",
    issueLabel: "Description de la non-conformité",
    partLabel: "Part Number (optionnel)",
    examplesLabel: "Exemples:",
    runButton: "Run Pipeline",
    similarTitle: "Top résultats similaires",
    colRank: "Rang",
    colId: "ID",
    colScore: "Score",
    colComment: "Commentaire",
    colCurative: "Action curative",
    loadingText: "Analyse en cours...",
    statusReady: "Sélectionnez un exemple ou saisissez une non-conformité puis lancez le pipeline.",
    statusNoMatch: "Aucun résultat pour cette saisie. Utilisez l'un des 2 exemples supportés.",
    statusResult: "Résultats générés.",
    example1: "Epaisseur de peinture non conforme",
    example2: "longueur hors tolérance",
  },
  en: {
    title: "QA Search",
    inputSection: "Non-conformity input",
    issueLabel: "Non-conformity description",
    partLabel: "Part Number (optional)",
    examplesLabel: "Examples:",
    runButton: "Run Pipeline",
    similarTitle: "Top similar results",
    colRank: "Rank",
    colId: "ID",
    colScore: "Score",
    colComment: "Comment",
    colCurative: "Curative action",
    loadingText: "Analyzing...",
    statusReady: "Select an example or type a non-conformity, then run the pipeline.",
    statusNoMatch: "No result for this input. Use one of the 2 supported examples.",
    statusResult: "Results generated.",
    example1: "Paint thickness out of specification",
    example2: "Length out of tolerance",
  },
};

const DEMO_CASES = {
  paint: {
    partNumber: "FJVNA01",
    input: {
      fr: "Epaisseur de peinture non conforme",
      en: "Paint thickness out of specification",
    },
    similar: {
      fr: [
        {
          record_id: "51234",
          score: 0.93,
          text: "Sur-épaisseur peinture constatée après retouche locale",
          curative: "Retouche contrôlée puis validation épaisseur avant libération.",
        },
        {
          record_id: "49811",
          score: 0.88,
          text: "Epaisseur coating hors tol sur zone de fixation",
          curative: "Décapage local et reprise peinture avec re-contrôle dimensionnel.",
        },
        {
          record_id: "47602",
          score: 0.84,
          text: "Variation d'épaisseur liée au réglage de buse",
          curative: "Correction des réglages buse et nouvelle application sur la zone impactée.",
        },
      ],
      en: [
        {
          record_id: "51234",
          score: 0.93,
          text: "Paint over-thickness detected after local rework",
          curative: "Controlled touch-up then thickness validation before release.",
        },
        {
          record_id: "49811",
          score: 0.88,
          text: "Coating thickness out of tolerance on fastening area",
          curative: "Local stripping and repaint with dimensional re-check.",
        },
        {
          record_id: "47602",
          score: 0.84,
          text: "Thickness variation linked to nozzle setting",
          curative: "Adjust nozzle settings and re-apply coating on impacted area.",
        },
      ],
    },
  },
  length: {
    partNumber: "FJVNA02",
    input: {
      fr: "longueur hors tolérance",
      en: "Length out of tolerance",
    },
    similar: {
      fr: [
        {
          record_id: "53319",
          score: 0.91,
          text: "Cote de longueur finale dépassée après changement d'outil",
          curative: "Reprise usinage contrôlée avec correction offset avant clôture.",
        },
        {
          record_id: "50567",
          score: 0.87,
          text: "Longueur non conforme en sortie usinage CN",
          curative: "Tri 100% du lot puis ajustement du programme CN.",
        },
        {
          record_id: "48902",
          score: 0.83,
          text: "Dérive progressive de cote sur série longue",
          curative: "Recalage machine périodique et contrôle intermédiaire renforcé.",
        },
      ],
      en: [
        {
          record_id: "53319",
          score: 0.91,
          text: "Final length characteristic exceeded after tool change",
          curative: "Controlled machining rework with offset correction before closure.",
        },
        {
          record_id: "50567",
          score: 0.87,
          text: "Length non-conformity at CNC machining output",
          curative: "100% batch sorting then CNC program adjustment.",
        },
        {
          record_id: "48902",
          score: 0.83,
          text: "Progressive dimensional drift over long production run",
          curative: "Periodic machine re-baselining and reinforced in-process checks.",
        },
      ],
    },
  },
};

const state = {
  lang: "fr",
  selectedCase: null,
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatScore(value) {
  const fixed = Number(value).toFixed(2);
  return state.lang === "fr" ? fixed.replace(".", ",") : fixed;
}

function applyUiText() {
  const t = I18N[state.lang];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t[key] || "";
  });

  const example1Btn = document.getElementById("example1Btn");
  const example2Btn = document.getElementById("example2Btn");
  if (example1Btn) example1Btn.textContent = t.example1;
  if (example2Btn) example2Btn.textContent = t.example2;

  if (!state.selectedCase) {
    setStatus(t.statusReady);
  }
}

function setStatus(text) {
  const statusLine = document.getElementById("statusLine");
  statusLine.textContent = text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderList(targetId, items) {
  const el = document.getElementById(targetId);
  el.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderSimilarRows(rows) {
  const body = document.getElementById("similarTableBody");
  body.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.record_id}</td>
      <td class="score">${formatScore(row.score)}</td>
      <td>${row.text}</td>
      <td>${row.curative}</td>
    `;
    body.appendChild(tr);
  });
}

function renderCase(caseData) {
  const lang = state.lang;
  document.getElementById("loading").hidden = true;
  document.getElementById("results").hidden = false;
  renderSimilarRows(caseData.similar[lang]);
}

function detectCase(inputText) {
  const normalized = normalizeText(inputText);
  if (!normalized) return null;

  const paintHints = ["peinture", "epaisseur", "paint", "thickness"];
  const lengthHints = ["longueur", "tolerance", "tolerance", "length"];

  const hasPaint = paintHints.some((hint) => normalized.includes(hint));
  const hasLength = lengthHints.some((hint) => normalized.includes(hint));

  if (hasPaint && !hasLength) return "paint";
  if (hasLength && !hasPaint) return "length";

  if (normalized === normalizeText(DEMO_CASES.paint.input.fr)) return "paint";
  if (normalized === normalizeText(DEMO_CASES.length.input.fr)) return "length";
  if (normalized === normalizeText(DEMO_CASES.paint.input.en)) return "paint";
  if (normalized === normalizeText(DEMO_CASES.length.input.en)) return "length";

  return null;
}

async function runPipeline() {
  const t = I18N[state.lang];
  const issueInput = document.getElementById("issueInput").value;
  const caseKey = detectCase(issueInput);
  const runBtn = document.getElementById("runBtn");
  const loading = document.getElementById("loading");

  if (!caseKey) {
    document.getElementById("results").hidden = true;
    loading.hidden = true;
    runBtn.disabled = false;
    state.selectedCase = null;
    setStatus(t.statusNoMatch);
    return;
  }

  document.getElementById("results").hidden = true;
  loading.hidden = false;
  runBtn.disabled = true;

  await sleep(1000);

  state.selectedCase = caseKey;
  renderCase(DEMO_CASES[caseKey]);
  loading.hidden = true;
  runBtn.disabled = false;
  setStatus(t.statusResult);
}

function bindExamples() {
  const issueInput = document.getElementById("issueInput");
  const partInput = document.getElementById("partInput");
  const t = I18N[state.lang];

  document.getElementById("example1Btn").addEventListener("click", () => {
    issueInput.value = DEMO_CASES.paint.input[state.lang];
    partInput.value = DEMO_CASES.paint.partNumber;
    state.selectedCase = null;
    document.getElementById("loading").hidden = true;
    document.getElementById("results").hidden = true;
    setStatus(t.statusReady);
  });

  document.getElementById("example2Btn").addEventListener("click", () => {
    issueInput.value = DEMO_CASES.length.input[state.lang];
    partInput.value = DEMO_CASES.length.partNumber;
    state.selectedCase = null;
    document.getElementById("loading").hidden = true;
    document.getElementById("results").hidden = true;
    setStatus(t.statusReady);
  });
}

function bindLanguageButtons() {
  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextLang = button.dataset.lang;
      if (!nextLang || nextLang === state.lang) return;

      state.lang = nextLang;
      buttons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.lang === state.lang);
      });

      applyUiText();

      if (state.selectedCase) {
        document.getElementById("issueInput").value = DEMO_CASES[state.selectedCase].input[state.lang];
        renderCase(DEMO_CASES[state.selectedCase]);
      }
    });
  });
}

function boot() {
  document.getElementById("loading").hidden = true;
  document.getElementById("results").hidden = true;
  applyUiText();
  bindLanguageButtons();
  bindExamples();
  document.getElementById("runBtn").addEventListener("click", runPipeline);
}

boot();
