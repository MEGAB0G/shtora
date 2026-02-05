const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

reveals.forEach((el) => observer.observe(el));

const form = document.querySelector('.contact-form');
const submitBtn = document.querySelector('#submitBtn');

if (form && submitBtn) {
  form.addEventListener('submit', () => {
    submitBtn.textContent = 'Спасибо, заявка принята';
    submitBtn.disabled = true;
  });
}
