// Declare navbar at the top so it's accessible globally
const navbar = document.querySelector('nav');

// Fade-in on scroll
const fadeElements = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(el => observer.observe(el));

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
        // allow auto height adjustment
        this.style.height = ''; // Reset height to auto for recalculation

        // Scroll to make sure the expanded card is visible
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

// Lightbox functionality
document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".close");
    const images = document.querySelectorAll(".lightbox-img");
    const prev = document.getElementById("lightboxPrev");
    const next = document.getElementById("lightboxNext");

    let currentIndex = 0;

    function showImage(index) {
        lightbox.style.display = "flex";
        lightboxImg.src = images[index].src;
        currentIndex = index;
    }

    images.forEach((img, i) => {
        img.addEventListener("click", () => showImage(i));
    });

    closeBtn.onclick = () => {
        lightbox.style.display = "none";
    };

    prev.onclick = () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        lightboxImg.src = images[currentIndex].src;
    };

    next.onclick = () => {
        currentIndex = (currentIndex + 1) % images.length;
        lightboxImg.src = images[currentIndex].src;
    };

    window.addEventListener("keydown", (e) => {
        if (lightbox.style.display === "flex") {
            if (e.key === "ArrowRight") next.click();
            else if (e.key === "ArrowLeft") prev.click();
            else if (e.key === "Escape") closeBtn.click();
        }
    });

    // Close lightbox when clicking outside the image
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });
});

// Back to top button
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

document.addEventListener('DOMContentLoaded', function() {
  const galaxy = document.querySelector('.galaxy');
  const featuresBtn = document.querySelector('.btn');
  
  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  galaxy.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  
  // Resize handler
  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // Star data structure
  const stars = [];
  const starCount = 200;
  
  // Initialize stars with pulse and glow properties
  for (let i = 0; i < starCount; i++) {
    const isGlowingStar = Math.random() > 0.7; // 30% chance to be a glowing star
    stars.push({
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      z: Math.random() * 3000,
      size: 0.5 + Math.random() * 1.5,
      speed: 0.1 + Math.random() * 0.2,
      baseBrightness: 0.5 + Math.random() * 0.5,
      pulseSpeed: 0.01 + Math.random() * 0.03,
      pulsePhase: Math.random() * Math.PI * 2,
      isGlowing: isGlowingStar,
      glowIntensity: isGlowingStar ? 0.3 + Math.random() * 0.7 : 0,
      trail: []
    });
  }
  
  // Animation variables
  let lastTime = 0;
  let baseSpeed = 0.15;
  let animationId = null;
  let isHovering = false;
  
  // Button hover effects
  featuresBtn.addEventListener('mouseenter', function() {
    isHovering = true;
    baseSpeed = 1; // Faster speed when hovering
  });
  
  featuresBtn.addEventListener('mouseleave', function() {
    isHovering = false;
    baseSpeed = 0.15; // Normal speed
  });
  
  // Main animation loop
  function animate(time) {
    if (!lastTime) lastTime = time;
    const deltaTime = Math.min(time - lastTime, 100) / 16;
    lastTime = time;
    
    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);
    
    // Draw stars
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      
      // Update pulse phase
      star.pulsePhase += star.pulseSpeed;
      const pulseFactor = 0.5 + Math.sin(star.pulsePhase) * 0.5;
      const currentBrightness = star.baseBrightness * (0.7 + 0.3 * pulseFactor);
      
      // Move star toward viewer
      star.z -= deltaTime * 50 * (baseSpeed + star.speed);
      
      // Reset star if it passes the viewer
      if (star.z <= 0) {
        star.z = 4000;
        star.x = Math.random() * 4000 - 2000;
        star.y = Math.random() * 4000 - 2000;
        star.trail = [];
      }
      
      // Calculate current position
      const scale = 1500 / (1500 + star.z);
      const x = star.x * scale + width / 2;
      const y = star.y * scale + height / 2;
      const size = star.size * scale;
      const alpha = Math.min(scale * 2, currentBrightness);
      
      // Store current position for trail if hovering
      if (isHovering) {
        star.trail.push({x, y, size, alpha});
        // Limit trail length
        if (star.trail.length > 8) {
          star.trail.shift();
        }
      } else {
        star.trail = [];
      }
      
      // Draw trail (only when hovering)
      if (isHovering && star.trail.length > 1) {
        for (let j = 0; j < star.trail.length - 1; j++) {
          const point = star.trail[j];
          const trailAlpha = point.alpha * (j / star.trail.length) * 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw glow for glowing stars
      if (star.isGlowing && alpha > 0.1) {
        const glowSize = size * (3 + pulseFactor * 2);
        const glowAlpha = alpha * star.glowIntensity * 0.3;
        
        const gradient = ctx.createRadialGradient(
          x, y, size,
          x, y, glowSize
        );
        gradient.addColorStop(0, `rgba(255, 77, 77, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(255, 77, 77, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw star
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Visibility change handler
  function handleVisibilityChange() {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (!animationId) {
      lastTime = 0;
      animationId = requestAnimationFrame(animate);
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Scroll handler
  let lastScrollY = 0;
  let scrollTimeout = null;
  
  function handleScroll() {
    const scrollY = window.scrollY;
    lastScrollY = scrollY;
    
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        galaxy.classList.toggle('scrolled', lastScrollY > 50);
        scrollTimeout = null;
      }, 50);
    }
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Start animation
  handleVisibilityChange();
  handleScroll();
});


document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.screenshot-track');
    const screenshots = document.querySelectorAll('.screenshot-track img');
    const prevBtn = document.querySelector('.screenshot-nav.prev');
    const nextBtn = document.querySelector('.screenshot-nav.next');
    const dotsContainer = document.querySelector('.screenshot-dots');
    
    let currentIndex = 0;
    const screenshotWidth = screenshots[0].offsetWidth + 24; // width + gap
    
    // Draggable variables
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    
    // Create dots
    screenshots.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('screenshot-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.screenshot-dot');
    
    function updateButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === screenshots.length - 1;
    }
    
    function goToSlide(index) {
        currentIndex = index;
        prevTranslate = currentIndex * -screenshotWidth;
        currentTranslate = prevTranslate;
        setSliderPosition();
        
        // Update active classes
        screenshots.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        updateButtons();
    }
    
    function setSliderPosition() {
        track.style.transform = `translateX(${currentTranslate}px)`;
    }
    
    function animation() {
        setSliderPosition();
        if (isDragging) requestAnimationFrame(animation);
    }
    
    // Touch events
    track.addEventListener('touchstart', touchStart);
    track.addEventListener('touchend', touchEnd);
    track.addEventListener('touchmove', touchMove);
    
    // Mouse events
    track.addEventListener('mousedown', mouseDown);
    track.addEventListener('mouseup', mouseUp);
    track.addEventListener('mouseleave', mouseLeave);
    track.addEventListener('mousemove', mouseMove);
    
    // Disable context menu on track
    track.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }
    
    function touchStart(e) {
        startPos = getPositionX(e);
        isDragging = true;
        animationID = requestAnimationFrame(animation);
        track.classList.add('grabbing');
    }
    
    function touchEnd() {
        isDragging = false;
        cancelAnimationFrame(animationID);
        
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -100 && currentIndex < screenshots.length - 1) {
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
        }
    }
    
    function mouseDown(e) {
        startPos = getPositionX(e);
        isDragging = true;
        animationID = requestAnimationFrame(animation);
        track.classList.add('grabbing');
    }
    
    function mouseUp() {
        isDragging = false;
        cancelAnimationFrame(animationID);
        track.classList.remove('grabbing');
        
        const movedBy = currentTranslate - prevTranslate;
        
        if (movedBy < -100 && currentIndex < screenshots.length - 1) {
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
            
            if (movedBy < -100 && currentIndex < screenshots.length - 1) {
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
            if (document.getElementById("lightbox") && document.getElementById("lightbox").style.display === "flex") {
                return;
            } else {
                goToSlide(currentIndex - 1);
            }
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < screenshots.length - 1) {
            if (document.getElementById("lightbox") && document.getElementById("lightbox").style.display === "flex") {
                return;
            } else {
                goToSlide(currentIndex + 1);
            }
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        }
    });
    
    // Initialize
    updateButtons();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            goToSlide(currentIndex);
        }, 100);
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
    updateNavBlur(); // Run on load in case page is not at top
});