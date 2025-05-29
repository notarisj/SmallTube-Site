export function setupNavbarBehavior() {
    let lastScrollPosition = 0;
    let navbarTimeout;
    const navbar = document.querySelector('.bottom-navbar');

    function handleNavbarVisibility() {
        const currentScrollPosition = window.scrollY;
        
        clearTimeout(navbarTimeout);
        
        if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 100) {
            navbar.style.bottom = '-30px';
        } else {
            navbar.style.bottom = '0';
            navbarTimeout = setTimeout(() => {
                if (window.scrollY > 100) {
                    navbar.style.bottom = '-30px';
                }
            }, 3000);
        }
        
        lastScrollPosition = currentScrollPosition;
    }

    document.addEventListener('mousemove', (e) => {
        const distanceFromBottom = window.innerHeight - e.clientY;
        if (distanceFromBottom < 50) {
            navbar.style.bottom = '0';
            clearTimeout(navbarTimeout);
        }
    });
    
    window.addEventListener('scroll', handleNavbarVisibility);
}