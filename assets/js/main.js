console.log("Cafe Aoki — scripts loaded");

// Header: transparent -> solid
(() => {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

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
    // Fallback: show immediately
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
        setTimeout(() => el.classList.remove('is-section-exiting'), 400);
      }
    });
  }, { threshold: [0.2, 0.4, 0.8], rootMargin: '-20% 0px -40% 0px' });
  sections.forEach((s) => io.observe(s));
})();

// Hero background: video or parallax
(() => {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const video = hero.querySelector('.hero__video');
  const parallax = hero.querySelector('.hero__parallax');
  const indicator = hero.querySelector('.hero__scroll-indicator');

  indicator?.addEventListener('click', () => {
    const next = document.querySelector('[data-section="concept"]');
    next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (video instanceof HTMLVideoElement) {
    const playIfPossible = async () => { try { await video.play(); } catch (e) {} };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) playIfPossible(); else video.pause();
      });
    }, { threshold: 0.2 });
    io.observe(hero);
  }

  if (parallax) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const p = Math.min(1, Math.max(0, 1 - (rect.top / vh)));
      parallax.style.transform = `translateY(${(p * 18) - 9}%) scale(1.1)`;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
})();

// Menu page hero parallax
(() => {
  const wrap = document.querySelector('.menu-hero');
  const parallax = document.querySelector('.menu-hero__parallax');
  if (!wrap || !parallax) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const p = Math.min(1, Math.max(0, 1 - (rect.top / vh)));
    parallax.style.transform = `translateY(${(p * 10) - 5}%) scale(1.08)`;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
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

// Cursor soft glow
(() => {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const follow = () => { tx += (x - tx) * 0.2; ty += (y - ty) * 0.2; glow.style.transform = `translate3d(${tx}px, ${ty}px, 0)`; raf = requestAnimationFrame(follow); };
  const onMove = (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(follow); };
  document.addEventListener('mousemove', onMove);
})();

// Modal: open/close (Reserve)
(() => {
  const reserveModal = document.getElementById('modal');
  const openReserveBtns = document.querySelectorAll('.js-open-modal');
  const closeReserveBtn = document.getElementById('close-modal');
  const reserveBackdrop = reserveModal?.querySelector('.backdrop');
  if (!reserveModal) return;

  const openReserve = () => {
    reserveModal.classList.remove('hidden');
    reserveModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => reserveModal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
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

  openReserveBtns.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openReserve(); }));
  closeReserveBtn?.addEventListener('click', closeReserve);
  reserveBackdrop?.addEventListener('click', closeReserve);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeReserve(); });
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
    if (!name || !email || !people || !datetime) { alert('未入力の項目があります。ご確認ください。'); return; }

    const ok = confirm(`以下の内容で送信します。\n\nお名前: ${name}\nメール: ${email}\n人数: ${people}\n日時: ${datetime}\n\nよろしいですか？`);
    if (!ok) return;

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true; submitBtn.textContent = '送信中...';
    try {
      const resp = await fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const msg = document.createElement('p');
        msg.textContent = '送信しました。ありがとうございます。';
        msg.style.color = 'var(--gold)'; msg.style.marginTop = '10px'; msg.style.textAlign = 'center';
        msg.classList.add('fade-in');
        form.querySelectorAll('.fade-in').forEach(el => el.remove());
        form.appendChild(msg);
        form.reset();
      } else { alert('送信に失敗しました。もう一度お試しください。'); }
    } catch {
      alert('通信エラーが発生しました。');
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = '送信する';
    }
  });
})();

// Flatpickr (ja)
(() => {
  const datetimeInput = document.querySelector('#datetime');
  if (!datetimeInput || !window.flatpickr) return;
  const localeJa = {
    weekdays: { shorthand: ['日','月','火','水','木','金','土'], longhand: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'] },
    months: { shorthand: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], longhand: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'] },
    firstDayOfWeek: 1, rangeSeparator: ' 〜 ', weekAbbreviation: '週', scrollTitle: 'スクロールで変更', toggleTitle: 'クリックで切替', time_24hr: true
  };
  const fp = flatpickr('#datetime', {
    enableTime: true, time_24hr: true, minuteIncrement: 5, minDate: 'today', defaultHour: 12,
    dateFormat: 'Y-m-d\\TH:i', altInput: true, altFormat: 'Y-m-d H:i', locale: localeJa
  });
  document.querySelector('.calendar-icon')?.addEventListener('click', () => fp?.open());
})();

// Image modal for .zoomable
(() => {
  const imageModal = document.createElement('div');
  imageModal.classList.add('image-modal');
  imageModal.innerHTML = `
    <span class="close" aria-label="閉じる">&times;</span>
    <img class="modal-content" alt="拡大画像">
  `;
  document.body.appendChild(imageModal);

  const modalImg = imageModal.querySelector('.modal-content');
  const modalClose = imageModal.querySelector('.close');
  function showImageModal(img) { modalImg.src = img.src; modalImg.alt = img.alt || '拡大画像'; imageModal.classList.add('show'); imageModal.style.display = 'flex'; }
  function hideImageModal() { imageModal.classList.add('hide'); setTimeout(() => { imageModal.classList.remove('show','hide'); imageModal.style.display = 'none'; }, 400); }
  document.querySelectorAll('.zoomable').forEach((img) => img.addEventListener('click', () => showImageModal(img)));
  modalClose.addEventListener('click', hideImageModal);
  imageModal.addEventListener('click', (e) => { if (e.target === imageModal) hideImageModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideImageModal(); });
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
      title: '厳選した豆 — Curated Origins',
      lead: '産地とロットの個性を見極め、焙煎で魅力を引き出します。甘さ・酸・コクが調和する心地よい余韻を求めて。',
      points: [
        '旬の産地をローテーションし、鮮度管理を徹底',
        'ロットごとに最適な焙煎プロファイルを設計',
        '毎朝のカッピングで品質を検証・微調整'
      ]
    },
    brewing: {
      title: '抽出の美学 — Crafted Extraction',
      lead: '温度・蒸らし・粒度・流速。1杯ごとの静かな所作が、澄んだ味わいをつくります。',
      points: [
        '湯温は±1℃でコントロール',
        '秒単位でタイムと流速を最適化',
        '安定した抽出曲線で再現性を追求'
      ]
    },
    space: {
      title: '落ち着きの空間 — Poised Atmosphere',
      lead: '黒と鈍金を基調にした静謐なインテリア。光・音・香りのレイヤーが、思考の深呼吸を助けます。',
      points: [
        'グレアを抑えた照明設計と柔らかな陰影',
        '残響を整える音環境で会話や読書に最適',
        '香りの流れを意識した席配置と導線'
      ]
    }
  };

  const open = (key) => {
    const data = COPY[key];
    if (!data) return;
    const imgSrc = {
      beans: 'assets/img/features/beans.svg',
      brewing: 'assets/img/features/brewing.svg',
      space: 'assets/img/features/space.svg'
    }[key];
    const safeAlt = (typeof data.title === 'string') ? data.title.replace(/\"/g, '"') : 'Feature image';
    content.innerHTML = `
      ${imgSrc ? `<img class="feature-image" src="${imgSrc}" alt="${safeAlt}">` : ''}
      <h3 id="feature-title" class="feature-title glossy-gold">${data.title}</h3>
      <p class="feature-lead">${data.lead}</p>
      <ul class="feature-list">${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
    `;
    // Use photorealistic background image instead of inline <img>
    (function(){
      const panelEl = featureModal.querySelector('.panel');
      // Ensure background overlay is disabled when using inline media
      if (panelEl) panelEl.style.setProperty('--feature-bg', 'none');

      // Photorealistic images mapped per feature (inline display)
      const map = {
        beans: 'assets/img/beans-user.jpg',
        brewing: 'assets/img/brewing-user.jpg',
        space: 'assets/img/space-user.jpg'
      };
      const imgSrc = map[key];
      const safeAlt = (typeof data.title === 'string') ? `${data.title} の写真` : 'Feature photo';

      // Build content with inline figure + copy
      content.innerHTML = `
        ${imgSrc ? `<figure class=\"feature-media\"><img src=\"${imgSrc}\" alt=\"${safeAlt}\"></figure>` : ''}
        <div class=\"feature-copy\">
          <h3 id=\"feature-title\" class=\"feature-title glossy-gold\">${data.title}</h3>
          <p class=\"feature-lead\">${data.lead}</p>
          <ul class=\"feature-list\">${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
      `;
    })();
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
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  document.querySelectorAll('.features .card[data-feature]').forEach((card) => {
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.addEventListener('click', () => open(card.getAttribute('data-feature')));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card.getAttribute('data-feature')); }
    });
  });
})();
