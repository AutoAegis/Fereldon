const page = window.location.pathname.split("/").pop();

if (page === "laws.html") {
    const panels = document.querySelectorAll(".content");

    panels.forEach(panel => {
        panel.addEventListener("click", () => {
            const expanded = document.querySelector(".content.expanded");
            if (expanded && expanded !== panel) {
                expanded.classList.remove("expanded");
            }

            panel.classList.add("expanded");
            document.getElementById("overlay").style.display = "block";
        });
    });

    document.getElementById("overlay").addEventListener("click", () => {
        const expanded = document.querySelector(".content.expanded");
        if (expanded) expanded.classList.remove("expanded");
        document.getElementById("overlay").style.display = "none";
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

        if (elTop < triggerBottom) {
            el.classList.add("visible");
        }
    });
}

window.addEventListener("scroll", handleScrollFade);
window.addEventListener("DOMContentLoaded", handleScrollFade);

if (page === "contact.html") {
    console.log("Contact page loaded");
}

const cards = document.querySelectorAll(".card.clickable");

cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 20px 50px rgba(0,0,0,0.7)';
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = '0 18px 40px rgba(0,0,0,0.7)';
    });
});
