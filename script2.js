const API_URL = "https://5c87639f-a295-4f3c-a7fb-8b708ca9a201-00-nppk283jm0n8.worf.replit.dev/fereldon";

async function updateFereldonStats() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    document.getElementById("reach-capital").textContent = data.capital;
    document.getElementById("reach-population").textContent = data.population;
    document.getElementById("reach-reputation").textContent = data.reputation;
    document.getElementById("reach-reputation-change").textContent = data.reputationChange;
    document.getElementById("reach-total-wealth").textContent = data.totalWealth.toLocaleString();
    document.getElementById("reach-average-wealth").textContent = data.averageWealth.toLocaleString();

  } catch(err) {
    console.error("Failed to fetch:", err);
  }
}

updateFereldonStats();
setInterval(updateFereldonStats, 30000);
