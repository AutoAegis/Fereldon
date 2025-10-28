const API_URL = "https://5c87639f-a295-4f3c-a7fb-8b708ca9a201-00-nppk283jm0n8.worf.replit.dev";

async function updateFereldonStats() {
  try {
    const res = await fetch(API_URL);
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Error: API did not return JSON!", await res.text());
      return;
    }

    const data = await res.json();

    document.getElementById("fereldon-capital").textContent = data.capital;
    document.getElementById("fereldon-total").textContent = data.totalCoins.toLocaleString();
    document.getElementById("fereldon-average").textContent = data.averageIncome.toLocaleString();
    document.getElementById("fereldon-count").textContent = data.playerCount;
    document.getElementById("fereldon-updated").textContent = new Date(data.lastUpdated).toLocaleTimeString();

  } catch (err) {
    console.error("Failed to fetch Fereldon stats:", err);
  }
}

updateFereldonStats();
setInterval(updateFereldonStats, 30000);



