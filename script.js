const page = window.location.pathname.split("/").pop();

if (page === "economy.html") {
    window.addEventListener("DOMContentLoaded", () => {
        document.getElementById("reach-capital").textContent = "Fereldon";
        document.getElementById("reach-population").textContent = "0";
        document.getElementById("reach-reputation").textContent = "0";
        document.getElementById("reach-reputation-change").textContent = "0";
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

if (page === "contact.html") {
    console.log("Contact page loaded");
}

if (["index.html", "about.html", "lore.html", "links.html", "forum.html"].includes(page)) {
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
}

window.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".hero");
    const brand = document.querySelector(".brand");

    if (hero) setTimeout(() => { hero.classList.add("visible"); }, 100);
    if (brand) setTimeout(() => { brand.classList.add("visible"); }, 150);
});



