// spin-animation.js
document.addEventListener('DOMContentLoaded', function() {
    const appIcon = document.querySelector('.app-icon');
    let isSpinning = false;
    let spinVelocity = 0;
    let spinAngle = 0;
    let lastFrameTime = 0;
    let spinRequestId = null;

    // Add click event listener
    appIcon.addEventListener('click', function(e) {
        if (!isSpinning) {
            startSpin();
        } else {
            // If already spinning, add more spin
            spinVelocity += 30 + Math.random() * 20;
        }
    });

    function startSpin() {
        isSpinning = true;
        spinVelocity = 40 + Math.random() * 30; // Initial spin velocity
        lastFrameTime = performance.now();
        spinRequestId = requestAnimationFrame(spin);
    }

    function spin(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaTime = (timestamp - lastFrameTime) / 1000; // Convert to seconds
        lastFrameTime = timestamp;

        // Apply friction
        spinVelocity *= Math.pow(0.95, deltaTime * 60); // Adjust friction factor

        // Update angle
        spinAngle += spinVelocity * deltaTime;

        // Apply the transformation
        applySpinTransform();

        // Continue spinning or stop
        if (spinVelocity > 0.5) {
            spinRequestId = requestAnimationFrame(spin);
        } else {
            stopSpin();
        }
    }

    function applySpinTransform() {
        // Calculate the current frame of the spin (0-19)
        const frame = Math.floor(spinAngle % 20);
        
        // Calculate the scale based on the spin (for a slight 3D effect)
        const scale = 1 - Math.abs(Math.sin(spinAngle * Math.PI / 10)) * 0.1;
        
        // Apply the transform
        appIcon.style.transform = `perspective(500px) rotateY(${spinAngle * 18}deg) scale(${scale})`;
        
        // Change the image based on the spin frame to create the illusion of a 3D object
        // We'll use a simple approach that alternates between the icon and a slightly rotated version
        if (frame < 10) {
            appIcon.style.filter = 'brightness(1)';
        } else {
            appIcon.style.filter = 'brightness(0.7)';
        }
    }

    function stopSpin() {
        isSpinning = false;
        spinVelocity = 0;
        cancelAnimationFrame(spinRequestId);
        
        // Snap to nearest 360 degree for a clean stop
        const snapAngle = Math.round(spinAngle / 360) * 360;
        spinAngle = snapAngle;
        
        // Apply final transform
        appIcon.style.transform = `perspective(500px) rotateY(${spinAngle}deg)`;
        appIcon.style.filter = 'brightness(1)';
    }
});