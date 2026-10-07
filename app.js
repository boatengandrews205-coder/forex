// ===== INSTRUMENTS BY MARKET =====
const instruments = {
  Forex: ["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","NZD/USD","EUR/GBP","EUR/JPY","GBP/JPY"],
  Metals: ["XAU/USD (Gold)","XAG/USD (Silver)","XPT/USD (Platinum)"],
  Commodities: ["USOIL (WTI)","UKOIL (Brent)","NATGAS"],
  Indices: ["US30","NAS100","SPX500","GER40","UK100","JP225"],
  Synthetics: ["Volatility 10","Volatility 25","Volatility 50","Volatility 75","Volatility 100","Boom 500","Crash 500"]
};

// Point value per instrument (approx. per 1.0 lot per 1 pip)
const pipValues = {
  default: 10,
  "USD/JPY": 9.1,
  "GBP/JPY": 9.1,
  "EUR/JPY": 9.1,
  "XAU/USD (Gold)": 10,
  "XAG/USD (Silver)": 50,
};

let trades = JSON.parse(localStorage.getItem("fxTrades") || "[]");

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const marketSelect = $("market");
const pairSelect = $("pair");

// ===== POPULATE INSTRUMENTS =====
function populatePairs() {
  const market = marketSelect.value;
  pairSelect.innerHTML = instruments[market]
    .map(p => `<option value="${p}">${p}</option>`)
    .join("");
}

marketSelect.addEventListener("change", populatePairs);
populatePairs();

// ===== ADD TRADE =====
$("addTrade").addEventListener("click", () => {
  const direction = $("direction").value;
  const entry = parseFloat($("entry").value);
  const exit = parseFloat($("exit").value);
  const lots = parseFloat($("lots").value);
  const pair = pairSelect.value;
  const market = marketSelect.value;

  if (isNaN(entry) || isNaN(exit) || isNaN(lots)) {
    alert("Please fill in entry, exit and lot size.");
    return;
  }

  // Calculate pips
  const rawMove = direction === "buy" ? exit - entry : entry - exit;
  const pipSize = pair.includes("JPY") ? 0.01 : pair.includes("XAU") || pair.includes("XAG") ? 0.1 : 0.0001;
  const pips = rawMove / pipSize;

  // P/L
  const pipValue = pipValues[pair] || pipValues.default;
  const pnl = pips * pipValue * lots;

  const trade = {
    id: Date.now(),
    market, pair, direction, entry, exit, lots,
    pips: parseFloat(pips.toFixed(1)),
    pnl: parseFloat(pnl.toFixed(2)),
    win: pnl > 0
  };

  trades.push(trade);
  saveAndRender();

  // Clear inputs
  $("entry").value = "";
  $("exit").value = "";
});

// ===== CLEAR ALL =====
$("clearAll").addEventListener("click", () => {
  if (confirm("Delete all trades?")) {
    trades = [];
    saveAndRender();
  }
});

// ===== SAVE + RENDER =====
function saveAndRender() {
  localStorage.setItem("fxTrades", JSON.stringify(trades));
  renderStats();
  renderLog();
}

function renderStats() {
  const total = trades.length;
  const wins = trades.filter(t => t.win).length;
  const winRate = total ? ((wins / total) * 100).toFixed(0) : 0;
  const totalPips = trades.reduce((s, t) => s + t.pips, 0).toFixed(1);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0).toFixed(2);

  $("totalTrades").textContent = total;
  $("winRate").textContent = winRate + "%";
  $("totalPips").textContent = totalPips;
  $("pnl").textContent = "$" + pnl;
}

function renderLog() {
  const log = $("tradeLog");
  if (!trades.length) {
    log.innerHTML = "<p style='color:#64748b;font-size:0.85rem'>No trades yet. Add one above.</p>";
    return;
  }
  log.innerHTML = trades
    .slice()
    .reverse()
    .map(t => `
      <div class="trade-item ${t.win ? "win" : "loss"}">
        <strong>${t.pair}</strong> • ${t.direction.toUpperCase()} • ${t.lots} lots<br/>
        ${t.entry} → ${t.exit} | <strong>${t.pips} pips</strong> | $${t.pnl}
      </div>
    `)
    .join("");
}

// ===== INITIAL RENDER =====
saveAndRender();
