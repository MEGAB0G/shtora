const navToggle = document.querySelector('[data-topm-toggle]');
const nav = document.querySelector('.topm-nav');

if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
        nav.classList.toggle('is-open');
    });
}

