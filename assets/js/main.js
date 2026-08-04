/* ============================================================
   CAFE AOKI — main.js（モーションエンジン）
   人格: 速いease-out・即応（アンカー実測 0.12〜0.5s）
   方針: RM無視・常時アニメ（確立済み裁定）／ネイティブスクロール（Lenis不使用）
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var SHOT = location.search.indexOf('shot=') !== -1;

  /* ---------- reveal (IntersectionObserver) ---------- */
  var revealTargets = document.querySelectorAll('.r, .r-media, [data-stagger]');
  if (SHOT || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealTargets.forEach(function (el) { io.observe(el); });

    /* 保険スイーパー: IOの取りこぼし（高速スクロール・iOS edge case）を回収 */
    var sweep = function () {
      revealTargets.forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight * 0.96) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    };
    var sweepTimer = null;
    window.addEventListener('scroll', function () {
      if (sweepTimer) { return; }
      sweepTimer = setTimeout(function () { sweep(); sweepTimer = null; }, 400);
    }, { passive: true });
    window.addEventListener('load', sweep);
  }

  /* ---------- 動画のIO play/pause（iOS安全: 同時再生を絞る） ---------- */
  var vids = document.querySelectorAll('video[data-io]');
  if ('IntersectionObserver' in window && !SHOT) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          var p = v.play();
          if (p && p.catch) { p.catch(function () {}); }
        } else {
          v.pause();
        }
      });
    }, { rootMargin: '12% 0px 12% 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  } else if (!SHOT) {
    vids.forEach(function (v) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } });
  }

  /* ---------- ヒーロー動画ローテーション（クロスフェード7s） ---------- */
  var rotator = document.querySelector('[data-hero-rotator]');
  if (rotator) {
    var slides = [].slice.call(rotator.querySelectorAll('video'));
    if (slides.length) {
      slides[0].classList.add('is-on');
      if (!SHOT && slides.length > 1) {
        var cur = 0;
        var heroInView = true;
        if ('IntersectionObserver' in window) {
          var hio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              heroInView = e.isIntersecting;
              if (heroInView) {
                var p = slides[cur].play();
                if (p && p.catch) { p.catch(function () {}); }
              } else {
                slides.forEach(function (v) { v.pause(); });
              }
            });
          }, { threshold: 0.05 });
          hio.observe(rotator);
        }
        setInterval(function () {
          if (!heroInView) { return; }
          var next = (cur + 1) % slides.length;
          var prev = cur;
          var p = slides[next].play();
          if (p && p.catch) { p.catch(function () {}); }
          slides[next].classList.add('is-on');
          slides[prev].classList.remove('is-on');
          cur = next;
          setTimeout(function () { if (cur !== prev) { slides[prev].pause(); } }, 1400);
        }, 7000);
      }
    }
  }

  /* ---------- scroller header（上スクロールで出現） ---------- */
  var scroller = document.querySelector('.site-header--scroller');
  if (scroller) {
    var lastY = window.scrollY;
    var ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      if (y < 140) {
        scroller.classList.remove('active');
      } else if (y < lastY - 4) {
        scroller.classList.add('active');
      } else if (y > lastY + 4) {
        scroller.classList.remove('active');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ---------- menu wipe ---------- */
  var menuButtons = document.querySelectorAll('[data-menu-toggle]');
  var closeBtn = document.querySelector('[data-menu-close]');
  var setMenu = function (open) {
    document.body.classList.toggle('menu-open', open);
    menuButtons.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  };
  menuButtons.forEach(function (b) {
    b.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  });
  if (closeBtn) { closeBtn.addEventListener('click', function () { setMenu(false); }); }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); }
  });
  document.querySelectorAll('.menu-wipe a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- 疑似送信フォーム（実送信なし） ---------- */
  document.querySelectorAll('form[data-pseudo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('.hp-field input');
      if (hp && hp.value) { return; } /* honeypot */
      var done = document.querySelector(form.getAttribute('data-done'));
      if (done) {
        form.style.display = 'none';
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* ---------- 撮影モード（?shot=1）: サムネ用フルページ撮影の安定化 ---------- */
  if (SHOT) {
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.style.minHeight = '0';
      hero.style.height = '860px';
    }
    document.querySelectorAll('video').forEach(function (v) { v.pause(); });
  }
})();
