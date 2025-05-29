export function setupStarfield() {
    const starfieldToggle = document.getElementById('starfield-toggle');
    const galaxy = document.querySelector('.galaxy');
    let starfieldEnabled = true;

    function loadStarfieldPreference() {
        const savedPreference = localStorage.getItem('smalltubeStarfieldEnabled');
        if (savedPreference !== null) {
            starfieldEnabled = savedPreference === 'true';
            updateStarfieldVisibility();
        }
    }

    function updateStarfieldVisibility() {
        if (starfieldEnabled) {
            galaxy.style.display = 'block';
            starfieldToggle.classList.add('active');
        } else {
            galaxy.style.display = 'none';
            starfieldToggle.classList.remove('active');
        }
    }

    starfieldToggle.addEventListener('click', () => {
        starfieldEnabled = !starfieldEnabled;
        localStorage.setItem('smalltubeStarfieldEnabled', starfieldEnabled.toString());
        updateStarfieldVisibility();
    });

    loadStarfieldPreference();
}