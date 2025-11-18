const page = window.location.pathname.split("/").pop();

window.addEventListener("DOMContentLoaded", () => {

    const hero = document.querySelector(".hero");
    if (hero) {
        hero.offsetHeight; 
        setTimeout(() => {
            hero.classList.add("visible");
        }, 50);
    }


    const brand = document.querySelector(".brand");
    if (brand) {
        setTimeout(() => {
            brand.classList.add("visible");
        }, 100);
    }

    if (page === "economy.html") {
        const capital = document.getElementById("reach-capital");
        const population = document.getElementById("reach-population");
        const reputation = document.getElementById("reach-reputation");
        const reputationChange = document.getElementById("reach-reputation-change");

        if (capital) capital.textContent = "Fereldon";
        if (population) population.textContent = "0";
        if (reputation) reputation.textContent = "0";
        if (reputationChange) reputationChange.textContent = "0";
    }

    if (page === "contact.html") {
        console.log("Contact page loaded");
    }

    if (["index.html","about.html","lore.html","links.html"].includes(page)) {
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

    const fadeElements = document.querySelectorAll(".fade-in");
    if (fadeElements.length > 0) {
        const handleScrollFade = () => {
            const triggerBottom = window.innerHeight * 0.85;
            fadeElements.forEach(el => {
                const elTop = el.getBoundingClientRect().top;
                if (elTop < triggerBottom) el.classList.add("visible");
            });
        };
        handleScrollFade();
        window.addEventListener("scroll", handleScrollFade);
    }
});

