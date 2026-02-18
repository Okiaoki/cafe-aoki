console.log('Cafe Aoki scripts loaded');

// Perf: Detect environments where effects should be reduced aggressively.
const isLite = (() => {
  const mm = (query) => {
    try {
      return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const mobileViewport = mm('(max-width: 768px)');
  const reducedMotion = mm('(prefers-reduced-motion: reduce)');
  const reducedData = mm('(prefers-reduced-data: reduce)');

  return reducedMotion || reducedData || saveData || lowMemory || mobileViewport;
})();

if (isLite) {
  document.documentElement.setAttribute('data-lite', '1');
}

// Mobile navigation toggle
(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('.nav-list');
  if (!menuToggle || !navList) return;

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('show');
  });

  document.querySelectorAll('.nav-list a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        navList.classList.remove('show');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();

// Reveal on scroll (IO) + safe fallback
(() => {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add('is-visible'));
  }
})();

// Section transitions (page-like)
(() => {
  const sections = Array.from(document.querySelectorAll('[data-section]'));
  if (!sections.length || !('IntersectionObserver' in window)) return;

  let current = null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
        if (current && current !== el) current.classList.remove('is-section-active');
        el.classList.add('is-section-active');
        current = el;
      } else if (!entry.isIntersecting && el.classList.contains('is-section-active')) {
        el.classList.remove('is-section-active');
        el.classList.add('is-section-exiting');
        setTimeout(() => el.classList.remove('is-section-exiting'), 320);
      }
    });
  }, { threshold: [0.2, 0.4, 0.8], rootMargin: '-20% 0px -40% 0px' });

  sections.forEach((s) => io.observe(s));
})();

// Perf: one scroll loop for header + parallax (disabled entirely in lite mode).
(() => {
  const header = document.getElementById('header');
  const hero = document.getElementById('hero');
  const heroParallax = hero?.querySelector('.hero__parallax');
  const menuHero = document.querySelector('.menu-hero');
  const menuParallax = menuHero?.querySelector('.menu-hero__parallax');

  const indicator = hero?.querySelector('.hero__scroll-indicator');
  indicator?.addEventListener('click', () => {
    const next = document.querySelector('[data-section="concept"]');
    next?.scrollIntoView({ behavior: isLite ? 'auto' : 'smooth', block: 'start' });
  });

  if (!header && !heroParallax && !menuParallax) return;

  if (isLite) {
    // No scroll listeners in lite mode.
    if ('IntersectionObserver' in window && header) {
      const anchor = document.querySelector('#hero, .menu-hero, main');
      if (anchor) {
        const io = new IntersectionObserver((entries) => {
          const entry = entries[0];
          header.classList.toggle('scrolled', !entry.isIntersecting);
        }, { threshold: 0, rootMargin: '-60px 0px 0px 0px' });
        io.observe(anchor);
      }
    } else if (header) {
      header.classList.toggle('scrolled', false);
    }
    return;
  }

  let heroInView = Boolean(heroParallax);
  let menuInView = Boolean(menuParallax);
  let rafId = 0;

  const computeTransform = (sectionEl, rangePercent, scale) => {
    const rect = sectionEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    const shift = (progress - 0.5) * rangePercent;
    return `translateY(${shift.toFixed(2)}%) scale(${scale})`;
  };

  const update = () => {
    rafId = 0;

    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }

    if (heroParallax && hero && heroInView) {
      heroParallax.style.transform = computeTransform(hero, 18, 1.1);
    }

    if (menuParallax && menuHero && menuInView) {
      menuParallax.style.transform = computeTransform(menuHero, 10, 1.08);
    }
  };

  const requestUpdate = () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const activityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroInView = entry.isIntersecting;
        if (entry.target === menuHero) menuInView = entry.isIntersecting;
      });
      if (heroInView || menuInView) requestUpdate();
    }, { threshold: 0, rootMargin: '120px 0px 120px 0px' });

    if (hero) activityObserver.observe(hero);
    if (menuHero) activityObserver.observe(menuHero);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
})();

// Keyboard support for clickable teaser cards
(() => {
  document.querySelectorAll('.menu-card[role="link"]').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const href = (el.getAttribute('onclick') || '').match(/'(.*?)'/)?.[1];
        if (href) window.location.href = href;
      }
    });
  });
})();

// Cursor glow
(() => {
  const supportsFinePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
  if (isLite || !supportsFinePointer) return;

  // Perf: skip DOM and rAF entirely in lite mode.
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;

  const follow = () => {
    tx += (x - tx) * 0.2;
    ty += (y - ty) * 0.2;
    glow.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    raf = requestAnimationFrame(follow);
  };

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(follow);
  };

  document.addEventListener('mousemove', onMove);
})();

// Modal: open/close (Reserve) + lazy-load flatpickr
(() => {
  const reserveModal = document.getElementById('modal');
  const openReserveBtns = document.querySelectorAll('.js-open-modal');
  const closeReserveBtn = document.getElementById('close-modal');
  const reserveBackdrop = reserveModal?.querySelector('.backdrop');
  const datetimeInput = document.getElementById('datetime');

  if (!reserveModal) return;

  let flatpickrLoader = null;
  let flatpickrInstance = null;

  const initFlatpickr = () => {
    if (!datetimeInput || !window.flatpickr || flatpickrInstance) return;

    flatpickrInstance = window.flatpickr(datetimeInput, {
      enableTime: true,
      time_24hr: true,
      minuteIncrement: 5,
      minDate: 'today',
      defaultHour: 12,
      dateFormat: 'Y-m-d\\TH:i',
      altInput: true,
      altFormat: 'Y-m-d H:i'
    });

    document.querySelector('.calendar-icon')?.addEventListener('click', () => flatpickrInstance?.open());
  };

  const ensureFlatpickr = () => {
    if (!datetimeInput) return Promise.resolve();
    if (window.flatpickr) {
      initFlatpickr();
      return Promise.resolve();
    }

    if (flatpickrLoader) return flatpickrLoader;

    // Perf: defer external calendar assets until user intent (modal open).
    flatpickrLoader = new Promise((resolve, reject) => {
      if (!document.getElementById('flatpickr-css')) {
        const link = document.createElement('link');
        link.id = 'flatpickr-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
        document.head.appendChild(link);
      }

      const existingScript = document.getElementById('flatpickr-js');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          initFlatpickr();
          resolve();
        }, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'flatpickr-js';
      script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      script.async = true;
      script.onload = () => {
        initFlatpickr();
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return flatpickrLoader;
  };

  const openReserve = () => {
    reserveModal.classList.remove('hidden');
    reserveModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => reserveModal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    ensureFlatpickr().catch(() => {});
  };

  const closeReserve = () => {
    const onEnd = (ev) => {
      if (!(ev.target instanceof HTMLElement)) return;
      if (!ev.target.closest || !ev.target.closest('.panel')) return;
      reserveModal.classList.add('hidden');
      reserveModal.setAttribute('aria-hidden', 'true');
      reserveModal.removeEventListener('transitionend', onEnd);
    };

    reserveModal.addEventListener('transitionend', onEnd);
    reserveModal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  openReserveBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openReserve();
    });
  });

  closeReserveBtn?.addEventListener('click', closeReserve);
  reserveBackdrop?.addEventListener('click', closeReserve);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReserve();
  });
})();

// Reserve form: async submit
(() => {
  const form = document.getElementById('reserve-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const people = (data.get('people') || '').toString().trim();
    const datetime = (data.get('datetime') || '').toString().trim();

    if (!name || !email || !people || !datetime) {
      alert('必須項目を入力してください。');
      return;
    }

    const ok = confirm(
      `以下の内容で送信します。\n\n名前: ${name}\nメール: ${email}\n人数: ${people}\n日時: ${datetime}`
    );
    if (!ok) return;

    const submitBtn = form.querySelector("button[type='submit']");
    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (resp.ok) {
        const msg = document.createElement('p');
        msg.textContent = '送信しました。ありがとうございます。';
        msg.style.color = 'var(--gold)';
        msg.style.marginTop = '10px';
        msg.style.textAlign = 'center';
        msg.classList.add('fade-in');
        form.querySelectorAll('.fade-in').forEach((el) => el.remove());
        form.appendChild(msg);
        form.reset();
      } else {
        alert('送信に失敗しました。時間をおいて再度お試しください。');
      }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送信する';
    }
  });
})();

// Image modal for .zoomable
(() => {
  const zoomables = document.querySelectorAll('.zoomable');
  if (!zoomables.length) return;

  const imageModal = document.createElement('div');
  imageModal.classList.add('image-modal');
  imageModal.innerHTML = `
    <span class="close" aria-label="閉じる">&times;</span>
    <img class="modal-content" alt="拡大画像">
  `;
  document.body.appendChild(imageModal);

  const modalImg = imageModal.querySelector('.modal-content');
  const modalClose = imageModal.querySelector('.close');

  const showImageModal = (img) => {
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt || '拡大画像';
    imageModal.classList.add('show');
    imageModal.style.display = 'flex';
  };

  const hideImageModal = () => {
    imageModal.classList.add('hide');
    setTimeout(() => {
      imageModal.classList.remove('show', 'hide');
      imageModal.style.display = 'none';
    }, 280);
  };

  zoomables.forEach((img) => img.addEventListener('click', () => showImageModal(img)));
  modalClose?.addEventListener('click', hideImageModal);
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) hideImageModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideImageModal();
  });
})();

// Feature modals (Our Features)
(() => {
  const featureModal = document.getElementById('feature-modal');
  if (!featureModal) return;

  const backdrop = featureModal.querySelector('.backdrop');
  const closeBtn = featureModal.querySelector('#feature-close');
  const content = featureModal.querySelector('#feature-content');

  const COPY = {
    beans: {
      title: '厳選した豆',
      lead: '産地ごとの個性を引き出す焙煎で、香りと余韻を丁寧に整えています。',
      points: ['産地とロットを継続評価', '焙煎プロファイルを定期更新', '抽出との相性を重視']
    },
    brewing: {
      title: '抽出の美学',
      lead: '湯温・挽き目・時間を最適化し、毎杯の再現性を高めています。',
      points: ['秒単位での抽出管理', '豆ごとのレシピ設計', '提供直前の最終調整']
    },
    space: {
      title: '落ち着く空間',
      lead: '照明と音、素材感を整え、会話にも読書にも合う空気を作っています。',
      points: ['明るさのゾーニング', '反響を抑えた音環境', '長居しやすい席設計']
    }
  };

  const PHOTO = {
    beans: 'assets/img/beans-user.jpg',
    brewing: 'assets/img/brewing-user.jpg',
    space: 'assets/img/space-user.jpg'
  };

  const open = (key) => {
    const data = COPY[key];
    if (!data) return;

    const imgSrc = PHOTO[key];
    content.innerHTML = `
      ${imgSrc ? `<figure class="feature-media"><img src="${imgSrc}" alt="${data.title}"></figure>` : ''}
      <div class="feature-copy">
        <h3 id="feature-title" class="feature-title glossy-gold">${data.title}</h3>
        <p class="feature-lead">${data.lead}</p>
        <ul class="feature-list">${data.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      </div>
    `;

    featureModal.classList.remove('hidden');
    featureModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => featureModal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    const onEnd = (ev) => {
      if (!(ev.target instanceof HTMLElement)) return;
      if (!ev.target.closest || !ev.target.closest('.panel')) return;
      featureModal.classList.add('hidden');
      featureModal.setAttribute('aria-hidden', 'true');
      featureModal.removeEventListener('transitionend', onEnd);
    };

    featureModal.addEventListener('transitionend', onEnd);
    featureModal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  document.querySelectorAll('.features .card[data-feature]').forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const openCard = () => open(card.getAttribute('data-feature'));
    card.addEventListener('click', openCard);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCard();
      }
    });
  });
})();
