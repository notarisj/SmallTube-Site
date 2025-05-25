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
        if (["ArrowRight", "ArrowLeft", "Escape"].includes(e.key)) {
            e.preventDefault();
            e.stopImmediatePropagation(); // Critical: stops other listeners from firing
        }

        if (e.key === "ArrowRight") {
            next.click();
        } else if (e.key === "ArrowLeft") {
            prev.click();
        } else if (e.key === "Escape") {
            closeBtn.click();
        }
    }
}, true); // Use capture phase


    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    });

    function getCurrentCarouselIndex() {
        const slides = document.querySelectorAll('.slide img');
        return Array.from(slides).findIndex(img => img.classList.contains('active'));
    }

    const openSlideshowBtn = document.getElementById("openSlideshow");
    if (openSlideshowBtn) {
        openSlideshowBtn.addEventListener("click", () => {
            const activeSlideIndex = getCurrentCarouselIndex();
            showImage(activeSlideIndex);
        });
    }
});