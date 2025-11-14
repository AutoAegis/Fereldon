const API_URL = "https://5c87639f-a295-4f3c-a7fb-8b708ca9a201-00-nppk283jm0n8.worf.replit.dev/fereldon";

const fields = {
  capital: document.getElementById("reach-capital"),
  population: document.getElementById("reach-population"),
  reputation: document.getElementById("reach-reputation"),
  reputationChange: document.getElementById("reach-reputation-change"),
  totalWealth: document.getElementById("reach-total-wealth"),
  averageWealth: document.getElementById("reach-average-wealth")
};

document.addEventListener("DOMContentLoaded", () => {
  Object.values(fields).forEach(el => {
    if (el) el.textContent = "Loading...";
  });

  updateFereldonStats();
});

function showLoading() {
  Object.values(fields).forEach(el => {
    if (el) el.textContent = "Loading...";
  });
}

async function updateFereldonStats() {
  showLoading();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(API_URL, { cache: "no-cache", signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    fields.capital.textContent = data.capital;
    fields.population.textContent = data.population.toLocaleString();
    fields.reputation.textContent = data.reputation;
    fields.reputationChange.textContent = data.reputationChange >= 0 ? "+" + data.reputationChange : data.reputationChange;
    fields.totalWealth.textContent = data.totalWealth.toLocaleString();
    fields.averageWealth.textContent = data.averageWealth.toLocaleString();

  } catch (err) {
    console.warn("API unreachable or timeout, showing Loading...", err);
    showLoading();
  }
}

setInterval(updateFereldonStats, 30000);
