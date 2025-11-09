const API_URL = "https://5c87639f-a295-4f3c-a7fb-8b708ca9a201-00-nppk283jm0n8.worf.replit.dev/fereldon";

async function updateFereldonStats() {
  try {
    const res = await fetch(API_URL);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error("API did not return JSON:\n" + text);
    }

    const data = await res.json();

    document.getElementById("reach-capital").textContent = data.capital || "Fereldon City";
    document.getElementById("reach-population").textContent = (data.playerCount || 0).toLocaleString();
    document.getElementById("reach-reputation").textContent = (data.totalCoins || 0).toLocaleString();
    document.getElementById("reach-reputation-change").textContent = (data.averageIncome || 0).toLocaleString();

  } catch (err) {
    console.error("Failed to fetch Fereldon stats:", err);
  }
}

updateFereldonStats();
setInterval(updateFereldonStats, 30000);
