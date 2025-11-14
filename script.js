const page = window.location.pathname.split("/").pop();

if (page === "laws.html") {
    const lawCards = document.querySelectorAll(".law-card.clickable");
    const overlay = document.getElementById("overlay");

    lawCards.forEach(card => {
        card.addEventListener("click", () => {
            const expanded = document.querySelector(".law-card.expanded");
            if (expanded && expanded !== card) expanded.classList.remove("expanded");

            card.classList.add("expanded");
            overlay.style.display = "block";
        });
    });

    overlay.addEventListener("click", () => {
        const expanded = document.querySelector(".law-card.expanded");
        if (expanded) expanded.classList.remove("expanded");
        overlay.style.display = "none";
    });
}

if (page === "economy.html") {
    window.addEventListener("DOMContentLoaded", () => {
        document.getElementById("reach-capital").textContent = "Fereldan City";
        document.getElementById("reach-population").textContent = "85,000";
        document.getElementById("reach-reputation").textContent = "Neutral";
        document.getElementById("reach-reputation-change").textContent = "+5";
    });
}

const fadeElements = document.querySelectorAll(".fade-in");

function handleScrollFade() {
    const triggerBottom = window.innerHeight * 0.85;
    fadeElements.forEach(el => {
        const elTop = el.getBoundingClientRect().top;
        if (elTop < triggerBottom) el.classList.add("visible");
    });
}

window.addEventListener("scroll", handleScrollFade);
window.addEventListener("DOMContentLoaded", handleScrollFade);

window.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".hero");
    const brand = document.querySelector(".brand");

    if (hero) setTimeout(() => hero.classList.add("visible"), 100);
    if (brand) setTimeout(() => brand.classList.add("visible"), 150);
});
