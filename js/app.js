/**
 * 렌더 / 인터랙션
 * - 데이터: window.WEDDING_DATA (data.js)
 * - DOM 바인딩과 상태(갤러리·팝업·복사)만 담당
 */
(function () {
  const data = window.WEDDING_DATA;
  if (!data) {
    console.error("WEDDING_DATA missing");
    return;
  }

  const state = {
    galleryExpanded: false,
    lightboxIndex: 0,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /** 그리드용 썸네일 경로 (원본은 lightbox에서 사용) */
  function galleryThumbSrc(src) {
    const marker = "/gallery/";
    const index = src.indexOf(marker);
    if (index === -1) return src;
    return `${src.slice(0, index + marker.length)}thumbs/${src.slice(index + marker.length)}`;
  }

  function showToast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.hidden = false;
    el.classList.add("is-visible");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      el.classList.remove("is-visible");
      el.hidden = true;
    }, 1800);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => el.classList.add("is-open"));
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(() => {
      el.hidden = true;
    }, 220);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("계좌번호가 복사되었습니다");
    } catch (err) {
      console.error(err);
      showToast("복사에 실패했습니다");
    }
  }

  function formatParentLine(side) {
    return `아버지 ${side.father.name} · 어머니 ${side.mother.name} 의 ${side.relation} ${side.childName}`;
  }

  function buildCalendar(dateISO) {
    const [y, m, d] = dateISO.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0).getDate();
    const startWeekday = first.getDay(); // 0 Sun
    const monthLabel = `${m}월`;

    const head = ["일", "월", "화", "수", "목", "금", "토"]
      .map((w) => `<span class="calendar__dow">${w}</span>`)
      .join("");

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push('<span class="calendar__day is-empty"></span>');
    }
    const heart = `
      <svg class="calendar__heart" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20.4S4.2 15.2 2.2 10.6C.7 7.2 2.6 3.8 6.3 3.8c2 0 3.7 1.2 5.2 3 1.5-1.8 3.2-3 5.2-3 3.7 0 5.6 3.4 4.1 6.8C19.8 15.2 12 20.4 12 20.4z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>`;

    for (let day = 1; day <= lastDay; day += 1) {
      const isWedding = day === d;
      cells.push(
        `<span class="calendar__day${isWedding ? " is-wedding" : ""}">${day}${
          isWedding ? heart : ""
        }</span>`
      );
    }

    return `
      <p class="calendar__month">${monthLabel}</p>
      <div class="calendar__grid">${head}${cells.join("")}</div>
    `;
  }

  function renderHero() {
    const img = $("#hero-image");
    img.src = data.images.hero.src;
    img.alt = data.images.hero.alt;
    const heroScript = $("#hero-script");
    if (heroScript) heroScript.textContent = data.invite.heroScript || "";
    $("#hero-names").innerHTML = `
      <span>${data.couple.groom.ko} <i>${data.couple.groom.en}</i></span>
      <span class="hero__amp">&amp;</span>
      <span>${data.couple.bride.ko} <i>${data.couple.bride.en}</i></span>
    `;
  }

  function renderInvite() {
    $("#invite-heading").textContent = data.invite.heading;
    $("#invite-eyebrow").textContent = data.invite.storyEyebrow;
    const story = data.images.story;
    const photo = $("#invite-photo");
    if (photo && story) {
      photo.src = story.src;
      photo.alt = story.alt;
    }
    $("#invite-body").innerHTML = data.invite.paragraphs
      .map((p) => `<p>${p}</p>`)
      .join("");
    const tape = $("#invite-tape");
    if (tape) tape.textContent = data.invite.tapeLabel || "Kaunas 2019";
  }

  function renderParents() {
    const { groomSide, brideSide } = data.parents;
    $("#parents-block").innerHTML = `
      <p class="parents__line">${formatParentLine(groomSide)}</p>
      <p class="parents__line">${formatParentLine(brideSide)}</p>
    `;

    const sideHtml = (side) => {
      const rows = [
        { label: "아버지", person: side.father },
        { label: "어머니", person: side.mother },
      ]
        .map(({ label, person }) => {
          const phone = person.phone
            ? `<a class="parents__phone" href="tel:${person.phone}">${person.phone}</a>`
            : `<span class="parents__phone is-empty">연락처 미등록</span>`;
          return `<div class="parents__row"><span>${label}</span><strong>${person.name}</strong>${phone}</div>`;
        })
        .join("");
      return `<div class="parents__side"><h3>${side.label}</h3>${rows}</div>`;
    };

    $("#parents-modal-body").innerHTML = sideHtml(groomSide) + sideHtml(brideSide);
  }

  function renderCeremony() {
    $("#ceremony-datetime").textContent = data.ceremony.fullDateLabel;
    $("#ceremony-venue").textContent =
      `${data.ceremony.venueName} ${data.ceremony.venueHall}`;
    $("#calendar").innerHTML = buildCalendar(data.ceremony.dateISO);
  }

  function getVisibleGallery() {
    const all = data.images.gallery;
    if (state.galleryExpanded) return all;
    return all.slice(0, data.gallery.initialCount);
  }

  function renderGallery() {
    $("#gallery-heading").textContent = data.gallery.heading;
    const items = getVisibleGallery();
    const grid = $("#gallery-grid");
    grid.innerHTML = items
      .map(
        (item, index) => `
        <button type="button" class="gallery__item reveal" data-index="${index}" aria-label="${item.alt}">
          <img src="${galleryThumbSrc(item.src)}" alt="${item.alt}" loading="lazy" decoding="async" />
        </button>`
      )
      .join("");

    const moreBtn = $("#gallery-more");
    const hasMore = data.images.gallery.length > data.gallery.initialCount;
    moreBtn.hidden = !hasMore || state.galleryExpanded;
    moreBtn.textContent = data.gallery.moreLabel;

    grid.onclick = (event) => {
      const btn = event.target.closest("[data-index]");
      if (!btn) return;
      openLightbox(Number(btn.dataset.index));
    };
  }

  function openLightbox(index) {
    const list = data.images.gallery;
    state.lightboxIndex = index;
    const item = list[index];
    if (!item) return;
    const box = $("#lightbox");
    const img = $("#lightbox-image");
    img.src = item.src;
    img.alt = item.alt;
    box.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => box.classList.add("is-open"));
  }

  function closeLightbox() {
    const box = $("#lightbox");
    box.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(() => {
      box.hidden = true;
    }, 220);
  }

  function stepLightbox(delta) {
    const list = data.images.gallery;
    if (!list.length) return;
    state.lightboxIndex = (state.lightboxIndex + delta + list.length) % list.length;
    const item = list[state.lightboxIndex];
    $("#lightbox-image").src = item.src;
    $("#lightbox-image").alt = item.alt;
  }

  function renderLocationMap() {
    const container = $("#location-map");
    const mapImage = data.images.locationMap;
    if (!container || !mapImage) return;

    container.innerHTML = `
      <img
        class="location__map-image"
        src="${mapImage.src}"
        alt="${mapImage.alt}"
        loading="lazy"
      />`;
  }

  function renderLocation() {
    const c = data.ceremony;
    const t = data.transport;
    $("#location-name").textContent = c.venueName;
    $("#location-hall").textContent = c.venueHall;
    $("#location-address").innerHTML = c.addressLines.map((line) => `${line}<br />`).join("");
    renderLocationMap();

    const iconBus = `<span class="transit__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 20h1M15 20h1M7 17v3M17 17v3"/></svg></span>`;
    const iconSubway = `<span class="transit__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="12" rx="2"/><path d="M8 15l-2 5M16 15l2 5M9 8h6M8 11h8"/></svg></span>`;
    const iconCar = `<span class="transit__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><path d="M5 16h14v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg></span>`;

    $("#location-transit").innerHTML = `
      <article class="transit">
        ${iconBus}
        <div class="transit__body">
          <h3>${t.bus.title}</h3>
          ${t.bus.lines.map((line) => `<p>${line}</p>`).join("")}
          <p class="transit__note">${t.bus.note}</p>
        </div>
      </article>
      <article class="transit">
        ${iconSubway}
        <div class="transit__body">
          <h3>${t.subway.title}</h3>
          <p>${t.subway.note}</p>
        </div>
      </article>
      <article class="transit">
        ${iconCar}
        <div class="transit__body">
          <h3>${t.car.title}</h3>
          ${t.car.notes.map((n) => `<p>${n}</p>`).join("")}
        </div>
      </article>
    `;

    $$("[data-map]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.map;
        const url = t.mapLinks[key];
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });
  }

  function accountItemHtml(item) {
    return `
      <li class="account">
        <h4>${item.role}</h4>
        <p class="account__number">${item.number}</p>
        <p class="account__meta">${item.bank} ${item.holder}</p>
        <button type="button" class="btn btn--tiny" data-copy="${item.number}">복사</button>
      </li>`;
  }

  function accountPanelHtml(side, key) {
    return `
      <div class="accounts__col" data-account-panel="${key}">
        <button
          type="button"
          class="accounts__toggle"
          data-account-toggle="${key}"
          aria-expanded="false"
          aria-controls="accounts-list-${key}"
        >
          <span>${side.label}</span>
          <span class="accounts__toggle-icon" aria-hidden="true">+</span>
        </button>
        <ul id="accounts-list-${key}" class="accounts__list" hidden>
          ${side.items.map(accountItemHtml).join("")}
        </ul>
      </div>`;
  }

  function renderAccounts() {
    $("#accounts-heading").textContent = data.accounts.heading;
    const g = data.accounts.groomSide;
    const b = data.accounts.brideSide;
    const block = $("#accounts-block");
    block.innerHTML = `
      ${accountPanelHtml(g, "groom")}
      ${accountPanelHtml(b, "bride")}
    `;

    block.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-account-toggle]");
      if (toggle) {
        const key = toggle.dataset.accountToggle;
        const panel = block.querySelector(`[data-account-panel="${key}"]`);
        const list = panel?.querySelector(".accounts__list");
        if (!panel || !list) return;

        const willOpen = list.hidden;
        list.hidden = !willOpen;
        toggle.setAttribute("aria-expanded", String(willOpen));
        panel.classList.toggle("is-open", willOpen);
        return;
      }

      const btn = event.target.closest("[data-copy]");
      if (!btn) return;
      copyText(btn.dataset.copy);
    });
  }

  function bindModals() {
    document.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-close]");
      if (!closer) return;
      const id = closer.getAttribute("data-close");
      if (id === "lightbox") closeLightbox();
      else closeModal(id);
    });

    $("#btn-contact-parents").addEventListener("click", () => openModal("modal-parents"));
    $("#gallery-more").addEventListener("click", () => {
      state.galleryExpanded = true;
      renderGallery();
      observeReveals();
    });
    $("#lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    $("#lightbox-next").addEventListener("click", () => stepLightbox(1));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal("modal-parents");
        closeLightbox();
      }
      if (!$("#lightbox").hidden) {
        if (event.key === "ArrowLeft") stepLightbox(-1);
        if (event.key === "ArrowRight") stepLightbox(1);
      }
    });
  }

  function observeReveals() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    $$(".reveal, .section").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  function init() {
    document.title = data.meta.documentTitle;
    renderHero();
    renderInvite();
    renderParents();
    renderCeremony();
    renderGallery();
    renderLocation();
    renderAccounts();
    bindModals();
    observeReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
