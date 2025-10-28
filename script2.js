async function updateEconomy() {
  const statusEl = document.getElementById('loading-status'); // optional loading message
  if (statusEl) statusEl.textContent = "Loading...";

  try {
    const res = await fetch("https://5c87639f-a295-4f3c-a7fb-8b708ca9a201-00-nppk283jm0n8.worf.replit.dev");

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error("API did not return JSON:\n" + text);
    }

    const data = await res.json();

    const capital = document.getElementById('reach-capital');
    const population = document.getElementById('reach-population');
    const reputation = document.getElementById('reach-reputation');
    const average = document.getElementById('reach-reputation-change');

    if (capital) capital.textContent = data.capital || "Fereldon City";
    if (population) population.textContent = (data.playerCount || 0).toLocaleString();
    if (reputation) reputation.textContent = (data.totalCoins || 0).toLocaleString();
    if (average) average.textContent = (data.averageIncome || 0).toLocaleString();

    if (statusEl) statusEl.textContent = "";
  } catch (err) {
    console.error("Failed to load Fereldon stats:", err);
    if (statusEl) statusEl.textContent = "Failed to load stats";
  }
}

updateEconomy();
setInterval(updateEconomy, 30000);
