const toggle = document.querySelector("[data-tm-toggle]");
const nav = document.querySelector(".tm-nav");

if (toggle && nav) {
    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });
}
