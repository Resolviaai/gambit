import { VIDEO_PROJECTS, EDIT_SUITE_SPECS } from './videos.js';

document.addEventListener('DOMContentLoaded', () => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // =========================================================================
  // 1. STATE & DOM ELEMENTS
  // =========================================================================
  let activeFilter = 'all';

  const projectsGrid = document.getElementById('projects-grid');
  const filterButtons = document.querySelectorAll('.filter-pill');

  const cinemaModal = document.getElementById('cinema-modal');
  const cinemaCloseBtn = document.getElementById('cinema-close-btn');
  const cinemaVideoContainer = document.getElementById('cinema-video-container');
  const cinemaTitle = document.getElementById('cinema-modal-title');
  const cinemaMeta = document.getElementById('cinema-modal-meta');

  const toastElement = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');

  const themeToggle = document.getElementById('theme-toggle-btn');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const floatingCursor = document.getElementById('floating-video-cursor');

  // =========================================================================
  // 2. TOAST NOTIFICATIONS
  // =========================================================================
  let toastTimer;
  window.showToast = function(msg) {
    if (!toastElement) return;
    toastMessage.textContent = msg;
    toastElement.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastElement.classList.remove('show');
    }, 2400);
  };

  // =========================================================================
  // 3. CLIPBOARD ACTIONS (Email & Discord ID Only)
  // =========================================================================
  window.copyEmail = function() {
    navigator.clipboard.writeText(EDIT_SUITE_SPECS.email).then(() => {
      window.showToast(`✓ Copied Email: ${EDIT_SUITE_SPECS.email}`);
    }).catch(() => {
      window.showToast(`Email: ${EDIT_SUITE_SPECS.email}`);
    });
  };

  window.copyDiscord = function() {
    navigator.clipboard.writeText(EDIT_SUITE_SPECS.discordTag).then(() => {
      window.showToast(`✓ Copied Discord: ${EDIT_SUITE_SPECS.discordTag}`);
    }).catch(() => {
      window.showToast(`Discord: ${EDIT_SUITE_SPECS.discordTag}`);
    });
  };

  // =========================================================================
  // 4. LIVE HERO TIMECODE TICKER (24 FPS HUD)
  // =========================================================================
  const timecodeTicker = document.getElementById('hero-timecode-ticker');
  if (timecodeTicker) {
    let frame = 14;
    let sec = 28;
    let min = 1;
    setInterval(() => {
      frame++;
      if (frame >= 24) {
        frame = 0;
        sec++;
        if (sec >= 60) {
          sec = 0;
          min = (min + 1) % 60;
        }
      }
      const pad = (n) => String(n).padStart(2, '0');
      timecodeTicker.textContent = `00:${pad(min)}:${pad(sec)}:${pad(frame)}`;
    }, 42); // 24 FPS
  }

  // =========================================================================
  // 5. STREAMLINED, COLORFUL PORTFOLIO WORKS (Zero Text Bloat)
  // =========================================================================
  function renderProjects(filter = 'all') {
    if (!projectsGrid) return;

    const filtered = filter === 'all'
      ? VIDEO_PROJECTS
      : VIDEO_PROJECTS.filter(v => v.category === filter);

    projectsGrid.innerHTML = filtered.map(v => `
      <div class="clean-card flex flex-col group overflow-hidden" data-category="${v.category}">
        
        <!-- Video Thumbnail Container -->
        <div class="relative aspect-video w-full bg-black cursor-pointer overflow-hidden project-card-media video-cursor-target" data-video-id="${v.id}">
          <img src="${v.thumbnail}" alt="${v.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          
          <!-- Hover Play Disc -->
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-white text-black shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95 border-2 border-border">
              <svg class="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>

          <!-- Nuclear-Style Category Badge -->
          <div class="absolute bottom-2.5 left-2.5 ${v.pillClass} px-2 py-0.5 rounded font-mono text-[11px] font-bold shadow-[1.5px_1.5px_0px_#121214]">
            ${v.categoryLabel}
          </div>

          <!-- Duration Badge -->
          <div class="absolute top-2.5 right-2.5 bg-black/85 text-white font-mono text-xs font-bold px-2 py-0.5 rounded border border-white/20">
            ${v.duration}
          </div>
        </div>

        <!-- Clean, Concise Meta -->
        <div class="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <h3 class="font-heading font-black text-base uppercase leading-snug group-hover:text-primary transition-colors">
              ${v.title}
            </h3>
            <p class="font-mono text-xs text-muted-foreground mt-1 truncate">
              ${v.subline}
            </p>
          </div>

          <!-- Action Bar with Watch Cut Trigger -->
          <div class="pt-2.5 border-t border-border/10 flex items-center justify-between">
            <span class="font-mono text-[11px] text-muted-foreground font-bold">4K UHD</span>
            <button class="btn-action btn-action-sm watch-cut-btn flex items-center gap-1.5" data-video-id="${v.id}">
              <span>Watch Cut</span>
              <span class="text-xs">↗</span>
            </button>
          </div>
        </div>

      </div>
    `).join('');

    // Attach click events
    projectsGrid.querySelectorAll('.project-card-media, .watch-cut-btn').forEach(el => {
      el.addEventListener('click', () => {
        const vid = VIDEO_PROJECTS.find(v => v.id === el.dataset.videoId);
        if (vid) openCinemaModal(vid);
      });
    });

    // Rebind micro-interactions for newly rendered elements
    setupCursorHover();
    setupMagneticButtons();
    setupCardTilt();

    // GSAP Entrance
    if (gsap) {
      gsap.fromTo('#projects-grid .clean-card',
        { autoAlpha: 0, y: 16, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }

  // Filter Buttons Handler
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('bg-foreground', 'text-background', 'btn-action-primary');
        b.classList.add('bg-card', 'text-foreground');
      });
      btn.classList.add('bg-foreground', 'text-background', 'btn-action-primary');
      btn.classList.remove('bg-card', 'text-foreground');
      activeFilter = btn.dataset.filter;
      renderProjects(activeFilter);
    });
  });

  renderProjects('all');

  // =========================================================================
  // 6. CINEMA LIGHTBOX MODAL (GSAP Animated)
  // =========================================================================
  function openCinemaModal(video) {
    if (!cinemaModal) return;
    cinemaTitle.textContent = `${video.title} [${video.duration}]`;
    cinemaMeta.textContent = `${video.categoryLabel} • ${video.subline} • 4K UHD MASTER`;

    if (cinemaVideoContainer) {
      cinemaVideoContainer.innerHTML = `
        <div class="relative w-full aspect-video bg-black overflow-hidden">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1" 
            title="${video.title}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            class="w-full h-full border-0">
          </iframe>
        </div>
      `;
    }

    cinemaModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (gsap) {
      gsap.fromTo('.modal-content',
        { scale: 0.92, autoAlpha: 0, y: 20 },
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
    }
  }

  function closeCinemaModal() {
    if (!cinemaModal) return;
    if (gsap) {
      gsap.to('.modal-content', {
        scale: 0.94,
        autoAlpha: 0,
        y: 15,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          cinemaModal.classList.remove('open');
          if (cinemaVideoContainer) cinemaVideoContainer.innerHTML = '';
          document.body.style.overflow = '';
        }
      });
    } else {
      cinemaModal.classList.remove('open');
      if (cinemaVideoContainer) cinemaVideoContainer.innerHTML = '';
      document.body.style.overflow = '';
    }
  }

  if (cinemaCloseBtn) cinemaCloseBtn.addEventListener('click', closeCinemaModal);
  if (cinemaModal) {
    cinemaModal.addEventListener('click', (e) => {
      if (e.target === cinemaModal) closeCinemaModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCinemaModal();
  });

  // =========================================================================
  // 7. GSAP MICRO-INTERACTIONS & ADVANCED MOTION
  // =========================================================================

  // A. Floating Video Cursor Badge
  let xTo, yTo;
  if (gsap && floatingCursor && window.innerWidth > 768) {
    xTo = gsap.quickTo(floatingCursor, "x", { duration: 0.22, ease: "power3" });
    yTo = gsap.quickTo(floatingCursor, "y", { duration: 0.22, ease: "power3" });

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
  }

  function setupCursorHover() {
    if (!gsap || !floatingCursor || window.innerWidth <= 768) return;
    document.querySelectorAll('.video-cursor-target').forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';

      el.addEventListener('mouseenter', () => {
        gsap.to(floatingCursor, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.2,
          ease: "back.out(2)",
          overwrite: "auto"
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(floatingCursor, {
          scale: 0,
          autoAlpha: 0,
          duration: 0.15,
          ease: "power2.in",
          overwrite: "auto"
        });
      });
    });
  }

  // B. Magnetic Buttons
  function setupMagneticButtons() {
    if (!gsap || window.innerWidth <= 768) return;
    document.querySelectorAll('.btn-action').forEach(btn => {
      if (btn.dataset.magneticBound) return;
      btn.dataset.magneticBound = 'true';

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const deltaX = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
        const deltaY = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
        gsap.to(btn, { x: deltaX, y: deltaY, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
      });
    });
  }

  // C. Subtle 3D Card Hover Perspective
  function setupCardTilt() {
    if (!gsap || window.innerWidth <= 768) return;
    document.querySelectorAll('.clean-card').forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        gsap.to(card, {
          rotationY: normX * 3,
          rotationX: -normY * 3,
          transformPerspective: 900,
          duration: 0.3,
          ease: "power1.out",
          overwrite: "auto"
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    });
  }

  // Initialize interactive micro-interactions
  setupCursorHover();
  setupMagneticButtons();
  setupCardTilt();

  // D. Hero Coordinated Entrance Timeline
  if (gsap) {
    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTl
      .from("#hero-brand-badge", { y: -20, autoAlpha: 0, scale: 0.9, duration: 0.6 })
      .from("#hero-headline", { y: 24, autoAlpha: 0, duration: 0.65 }, "-=0.35")
      .from("#hero-subhead", { y: 16, autoAlpha: 0, duration: 0.5 }, "-=0.35")
      .from("#hero-micro-hud", { y: 18, autoAlpha: 0, duration: 0.5 }, "-=0.2");

    // E. ScrollTrigger batch reveals on sections
    if (ScrollTrigger) {
      document.querySelectorAll('#craft, #faq, #contact').forEach(sec => {
        gsap.from(sec, {
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          autoAlpha: 0,
          y: 28,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    }
  }

  // =========================================================================
  // 8. FAQ ACCORDION
  // =========================================================================
  document.querySelectorAll('.faq-row').forEach(row => {
    const q = row.querySelector('.faq-question');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = row.classList.contains('active');
        document.querySelectorAll('.faq-row').forEach(r => r.classList.remove('active'));
        if (!isOpen) row.classList.add('active');
      });
    }
  });

  // =========================================================================
  // 9. THEME SWITCHER
  // =========================================================================
  const themes = ['light', 'dark'];
  let currentThemeIdx = 0;
  const saved = localStorage.getItem('gambit-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    currentThemeIdx = themes.indexOf(saved) !== -1 ? themes.indexOf(saved) : 0;
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      const th = themes[currentThemeIdx];
      document.documentElement.setAttribute('data-theme', th);
      localStorage.setItem('gambit-theme', th);
      window.showToast(`${th.toUpperCase()} MODE`);
    });
  }

  // =========================================================================
  // 10. MOBILE NAVIGATION DRAWER
  // =========================================================================
  if (mobileMenuToggle && mobileMenuDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuDrawer.classList.toggle('hidden');
    });

    mobileMenuDrawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenuDrawer.classList.add('hidden');
      });
    });
  }
});
