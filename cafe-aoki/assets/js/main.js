console.log("Cafe Aoki initialized");

// ========== ヘッダー縮小 ========== 
window.addEventListener("scroll", () => {
  const header = document.getElementById("header");
  if (!header) return;
  if (window.scrollY > 60) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

// ========== スマホメニュー ========== 
const menuToggle = document.querySelector(".menu-toggle");
const navList = document.querySelector(".nav-list");
menuToggle?.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  navList?.classList.toggle("show");
});

// ナビゲーションのリンククリックでメニューを閉じる（SP時）
document.querySelectorAll(".nav-list a").forEach(a => {
  a.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      navList?.classList.remove("show");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// ========== スクロールリビール ========== 
const revealTargets = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
revealTargets.forEach(el => observer.observe(el));

// ========== 予約モーダル ========== 
const reserveModal = document.getElementById("modal");
const openReserveBtns = document.querySelectorAll(".js-open-modal");
const closeReserveBtn = document.getElementById("close-modal");
const reserveBackdrop = reserveModal?.querySelector(".backdrop");

function openReserve() {
  reserveModal?.classList.remove("hidden");
  reserveModal?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // スクロール固定
}
function closeReserve() {
  reserveModal?.classList.add("hidden");
  reserveModal?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // スクロール解除
}

openReserveBtns.forEach(btn => btn.addEventListener("click", (e) => {
  e.preventDefault();
  openReserve();
}));
closeReserveBtn?.addEventListener("click", closeReserve);
reserveBackdrop?.addEventListener("click", closeReserve);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeReserve();
});

// ========== フォーム送信（非同期） ========== 
const reserveForm = document.getElementById("reserve-form");
if (reserveForm) {
  reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // 入力チェック（最低限）
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const people = (data.get("people") || "").toString().trim();
    const datetime = (data.get("datetime") || "").toString().trim();
    if (!name || !email || !people || !datetime) {
      alert("未入力の必須項目があります。ご確認ください。");
      return;
    }

    const summary = `\nお名前：${name}\nメール：${email}\n人数：${people}\n日時：${datetime}\n`;
    const ok = confirm(`以下の内容で送信します。\n${summary}\nよろしいですか？`);
    if (!ok) return;

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "送信中...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        const msg = document.createElement("p");
        msg.textContent = "送信しました。ありがとうございます。";
        msg.style.color = "var(--gold)";
        msg.style.marginTop = "10px";
        msg.style.textAlign = "center";
        msg.classList.add("fade-in");
        form.querySelectorAll(".fade-in").forEach(el => el.remove());
        form.appendChild(msg);
        form.reset();
      } else {
        alert("送信に失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "送信する";
    }
  });
}

// ========== Flatpickr カレンダー設定 ========== 
const localeJa = {
  weekdays: {
    shorthand: ["日", "月", "火", "水", "木", "金", "土"],
    longhand: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"]
  },
  months: {
    shorthand: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    longhand: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
  },
  firstDayOfWeek: 1,
  rangeSeparator: " 〜 ",
  weekAbbreviation: "週",
  scrollTitle: "スクロールで増減",
  toggleTitle: "クリックで切替",
  time_24hr: true
};

const datetimeInput = document.querySelector("#datetime");
if (datetimeInput && window.flatpickr) {
  const fp = flatpickr("#datetime", {
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 5,
    minDate: "today",
    defaultHour: 12,
    dateFormat: "Y-m-d\\TH:i",
    altInput: true,
    altFormat: "Y-m-d H:i",
    locale: localeJa
  });

  // アイコンでカレンダーを開く
  const calendarIcon = document.querySelector(".calendar-icon");
  calendarIcon?.addEventListener("click", () => fp?.open());
}

// ========== 画像モーダル ========== 
const imageModal = document.createElement("div");
imageModal.classList.add("image-modal");
imageModal.innerHTML = `
  <span class="close" aria-label="閉じる">&times;</span>
  <img class="modal-content" alt="拡大画像">
`;
document.body.appendChild(imageModal);

const modalImg = imageModal.querySelector(".modal-content");
const modalClose = imageModal.querySelector(".close");

function showImageModal(img) {
  modalImg.src = img.src;
  modalImg.alt = img.alt || "拡大画像";
  imageModal.classList.add("show");
  imageModal.style.display = "flex";
}
function hideImageModal() {
  imageModal.classList.add("hide");
  setTimeout(() => {
    imageModal.classList.remove("show", "hide");
    imageModal.style.display = "none";
  }, 400);
}

document.querySelectorAll(".zoomable").forEach(img => {
  img.addEventListener("click", () => showImageModal(img));
});
modalClose.addEventListener("click", hideImageModal);
imageModal.addEventListener("click", e => { if (e.target === imageModal) hideImageModal(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") hideImageModal(); });

