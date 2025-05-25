document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.screenshot-track');
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.screenshot-nav.prev');
    const nextBtn = document.querySelector('.screenshot-nav.next');
    const dotsContainer = document.querySelector('.screenshot-dots');
    
    let currentIndex = 0;
    const slideWidth = slides[0].offsetWidth - 1;
    
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('screenshot-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.screenshot-dot');
    
    function updateButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === slides.length - 1;
    }
    
    function goToSlide(index) {
        currentIndex = index;
        prevTranslate = currentIndex * -slideWidth;
        currentTranslate = prevTranslate;
        setSliderPosition();
        
        slides.forEach((slide, i) => {
            slide.querySelector('img').classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        updateButtons();
    }
    
    function setSliderPosition() {
        if (window.innerWidth > 768) {
            track.style.transform = `translateX(${currentTranslate + 149}px)`;
        } else {
            track.style.transform = `translateX(${currentTranslate}px)`;
        }
    }
    
    function animation() {
        setSliderPosition();
        if (isDragging) requestAnimationFrame(animation);
    }
    
    slides.forEach(slide => {
        slide.addEventListener('touchstart', touchStart);
        slide.addEventListener('touchend', touchEnd);
        slide.addEventListener('touchmove', touchMove);
        slide.addEventListener('mousedown', mouseDown);
        slide.addEventListener('mouseup', mouseUp);
        slide.addEventListener('mouseleave', mouseLeave);
        slide.addEventListener('mousemove', mouseMove);
        slide.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
    
    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }
    
    function touchStart(e) {
        startPos = getPositionX(e);
        isDragging = true;
        animationID = requestAnimationFrame(animation);
        track.classList.add('grabbing');
        e.preventDefault();
    }
    
    function touchEnd() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -100 && currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        } else if (movedBy > 100 && currentIndex > 0) {
            goToSlide(currentIndex - 1);
        } else {
            goToSlide(currentIndex);
        }
        
        track.classList.remove('grabbing');
    }
    
    function touchMove(e) {
        if (isDragging) {
            const currentPosition = getPositionX(e);
            currentTranslate = prevTranslate + currentPosition - startPos;
            e.preventDefault();
        }
    }
    
    function mouseDown(e) {
        startPos = getPositionX(e);
        isDragging = true;
        animationID = requestAnimationFrame(animation);
        track.classList.add('grabbing');
    }
    
    function mouseUp() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        track.classList.remove('grabbing');
        
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -100 && currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        } else if (movedBy > 100 && currentIndex > 0) {
            goToSlide(currentIndex - 1);
        } else {
            goToSlide(currentIndex);
        }
    }
    
    function mouseLeave() {
        if (isDragging) {
            isDragging = false;
            cancelAnimationFrame(animationID);
            track.classList.remove('grabbing');
            
            const movedBy = currentTranslate - prevTranslate;
            
            if (movedBy < -100 && currentIndex < slides.length - 1) {
                goToSlide(currentIndex + 1);
            } else if (movedBy > 100 && currentIndex > 0) {
                goToSlide(currentIndex - 1);
            } else {
                goToSlide(currentIndex);
            }
        }
    }
    
    function mouseMove(e) {
        if (isDragging) {
            const currentPosition = getPositionX(e);
            currentTranslate = prevTranslate + currentPosition - startPos;
        }
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    });
    
    updateButtons();
    goToSlide(0);
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newSlideWidth = slides[0].offsetWidth + 24;
            prevTranslate = currentIndex * -newSlideWidth;
            currentTranslate = prevTranslate;
            setSliderPosition();
        }, 100);
    });
});