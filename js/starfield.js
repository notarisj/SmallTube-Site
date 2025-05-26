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
        const isGlowingStar = Math.random() > 0.7;
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
    let isCtrlPressed = false;

    function updateBaseSpeed() {
        baseSpeed = (isHovering || isCtrlPressed) ? 1 : 0.15;
    }
    
    if (featuresBtn) {
        // Button hover effects
        featuresBtn.addEventListener('mouseenter', function() {
            isHovering = true;
            updateBaseSpeed();
        });

        featuresBtn.addEventListener('mouseleave', function() {
            isHovering = false;
            updateBaseSpeed();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Control' && !isCtrlPressed) {
            isCtrlPressed = true;
            updateBaseSpeed();
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.key === 'Control') {
            isCtrlPressed = false;
            updateBaseSpeed();
        }
    });
    
    let mouseX = 0;
    let mouseY = 0;
    const mouseDeadZone = 0.1;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - width/2) / (width/2);
        mouseY = (e.clientY - height/2) / (height/2);
    });

    // Main animation loop
    function animate(time) {
        if (!lastTime) lastTime = time;
        const deltaTime = Math.min(time - lastTime, 100) / 16;
        lastTime = time;
        
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            
            star.pulsePhase += star.pulseSpeed;
            const pulseFactor = 0.5 + Math.sin(star.pulsePhase) * 0.5;
            const currentBrightness = star.baseBrightness * (0.7 + 0.3 * pulseFactor);
            
            star.z -= deltaTime * 50 * (baseSpeed + star.speed);
            
            if (Math.abs(mouseX) > mouseDeadZone) {
                star.x += mouseX * star.speed * 40 * deltaTime;
            }
            if (Math.abs(mouseY) > mouseDeadZone) {
                star.y += mouseY * star.speed * 40 * deltaTime;
            }
            
            if (star.z <= -1500) {
                star.z = 4000;
                star.x = (Math.random() * 4000 - 2000) - (mouseX * 500);
                star.y = (Math.random() * 4000 - 2000) - (mouseY * 500);
                star.trail = [];
            }
            
            const scale = 1500 / (1500 + star.z);
            const x = star.x * scale + width / 2;
            const y = star.y * scale + height / 2;
            const size = star.size * scale;
            const alpha = Math.min(scale * 2, currentBrightness);
            
            if (isHovering || isCtrlPressed) {
                star.trail.push({x, y, size, alpha});
                if (star.trail.length > 8) {
                    star.trail.shift();
                }
            } else {
                star.trail = [];
            }
            
            if ((isHovering || isCtrlPressed) && star.trail.length > 1) {
                for (let j = 0; j < star.trail.length - 1; j++) {
                    const point = star.trail[j];
                    const trailAlpha = point.alpha * (j / star.trail.length) * 0.7;
                    ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha})`;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
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
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
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
    handleVisibilityChange();
    handleScroll();
});