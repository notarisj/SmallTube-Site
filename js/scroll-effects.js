// Declare navbar at the top so it's accessible globally
const navbar = document.querySelector('nav');
const backToTopBtn = document.querySelector('.back-to-top');

window.addEventListener('scroll', () => {
    // Show/hide back to top button
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }

    // Navbar scroll effect
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Back to top functionality
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Navbar opaque on scroll
document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector("nav");

    function updateNavBlur() {
        if (window.scrollY === 0) {
            nav.classList.add("no-blur");
        } else {
            nav.classList.remove("no-blur");
        }
    }

    window.addEventListener("scroll", updateNavBlur);
    updateNavBlur();
});