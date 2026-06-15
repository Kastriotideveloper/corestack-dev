(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealBlocks = document.querySelectorAll('.reveal-block');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealBlocks.forEach((block) => revealObserver.observe(block));
  } else {
    revealBlocks.forEach((block) => block.classList.add('is-visible'));
  }

  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count || 0);
    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slides = [...slider.querySelectorAll('[data-slide]')];
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const dotsWrap = slider.querySelector('.slider-dots');
    let active = 0;
    let timer;
    const autoplayDelay = 5000;

    const dots = slides.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.innerHTML = '<span></span>';
      dot.addEventListener('click', () => goTo(index, true));
      dotsWrap.appendChild(dot);
      return dot;
    });

    const paint = () => {
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === active));
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === active);
        const progress = dot.querySelector('span');
        progress.style.animation = 'none';
        progress.offsetHeight;
        if (index === active && !prefersReducedMotion) progress.style.animation = '';
      });
    };

    const goTo = (index, userAction = false) => {
      active = (index + slides.length) % slides.length;
      paint();
      if (userAction) restart();
    };

    const restart = () => {
      clearInterval(timer);
      if (!prefersReducedMotion) {
        timer = setInterval(() => goTo(active + 1), autoplayDelay);
      }
    };

    prev?.addEventListener('click', () => goTo(active - 1, true));
    next?.addEventListener('click', () => goTo(active + 1, true));

    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') goTo(active - 1, true);
      if (event.key === 'ArrowRight') goTo(active + 1, true);
    });

    let startX = 0;
    slider.addEventListener('pointerdown', (event) => { startX = event.clientX; });
    slider.addEventListener('pointerup', (event) => {
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 48) goTo(active + (distance < 0 ? 1 : -1), true);
    });

    paint();
    restart();
  }

  const flowLines = [...document.querySelectorAll('.flow-line')];
  const spawnPacket = () => {
    flowLines.forEach((line, index) => {
      const packet = document.createElement('span');
      packet.className = 'packet';
      packet.style.animationDelay = `${index * 130}ms`;
      line.appendChild(packet);
      packet.addEventListener('animationend', () => packet.remove());
    });
  };

  if (!prefersReducedMotion && flowLines.length) {
    spawnPacket();
    setInterval(spawnPacket, 1100);
  }

  const canvas = document.getElementById('networkCanvas');
  if (canvas && !prefersReducedMotion) {
    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let points = [];
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(90, Math.max(38, Math.floor(width / 14)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.7 + 0.8
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      points.forEach((p) => {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 150) {
          p.x -= dx * 0.002;
          p.y -= dy * 0.002;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = 'rgba(82, 103, 255, 0.52)';
        context.fill();
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 118) {
            const opacity = 1 - distance / 118;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle = `rgba(8, 201, 223, ${opacity * 0.2})`;
            context.lineWidth = 1;
            context.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    });
    window.addEventListener('pointerleave', () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    resize();
    draw();
  }
})();


// Google Analytics click tracking for important CoreStack Dev actions.
document.querySelectorAll("a[href^='mailto'], .button, .nav-cta").forEach((element) => {
  element.addEventListener("click", () => {
    if (typeof gtag === "function") {
      const label =
        element.getAttribute("data-track") ||
        element.textContent.trim() ||
        element.getAttribute("href") ||
        "website_click";

      gtag("event", "click", {
        event_category: "website_interaction",
        event_label: label
      });
    }
  });
});
