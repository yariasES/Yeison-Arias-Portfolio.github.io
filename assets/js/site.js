const themeFab = document.querySelector('#theme-fab');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const header = document.querySelector('header');

function applyPageTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    themeFab.setAttribute('aria-pressed', String(isDark));
    themeFab.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    themeFab.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    themeFab.querySelector('.material-symbols-rounded').textContent = isDark ? 'light_mode' : 'dark_mode';
    document.dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: { dark: isDark } }));
}

applyPageTheme(localStorage.getItem('portfolio-theme') === 'dark');

themeFab.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
    applyPageTheme(isDark);
});

menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú');
    });
});

window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 50 ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none';
});
