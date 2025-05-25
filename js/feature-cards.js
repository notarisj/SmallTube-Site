// Feature card expansion functionality
const featureCards = document.querySelectorAll('.feature-card');
let currentlyExpanded = null;

featureCards.forEach(card => {
    card.addEventListener('click', function () {
        // If this card is already expanded, collapse it
        if (this.classList.contains('expanded')) {
            this.classList.remove('expanded');
            document.body.classList.remove('card-expanded');
            currentlyExpanded = null;
            resetCardHeight(this);
            return;
        }

        // Collapse any currently expanded card
        if (currentlyExpanded) {
            currentlyExpanded.classList.remove('expanded');
            resetCardHeight(currentlyExpanded);
        }

        // Expand this card
        this.classList.add('expanded');
        document.body.classList.add('card-expanded');
        currentlyExpanded = this;
        this.style.height = ''; // Reset height to auto for recalculation
        this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});

function resetCardHeight(card) {
    card.style.height = '';
}

// Close expanded card when clicking outside
document.addEventListener('click', function (e) {
    if (!currentlyExpanded) return;

    const isClickInside = currentlyExpanded.contains(e.target);
    if (!isClickInside) {
        currentlyExpanded.classList.remove('expanded');
        resetCardHeight(currentlyExpanded);
        document.body.classList.remove('card-expanded');
        currentlyExpanded = null;
    }
});