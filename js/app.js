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
    for (let day = 1; day <= lastDay; day += 1) {
      const isWedding = day === d;
      const time = isWedding ? `<em>${data.ceremony.timeLabel.replace("오후 ", "")}</em>` : "";
      cells.push(
        `<span class="calendar__day${isWedding ? " is-wedding" : ""}">${day}${time}</span>`
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
    $("#hero-venue").textContent = data.ceremony.verticalVenue;
    $("#hero-date").textContent = data.ceremony.verticalDate;
    $("#hero-names").innerHTML = `
      <span>${data.couple.groom.ko} <i>${data.couple.groom.en}</i></span>
      <span class="hero__amp">&amp;</span>
      <span>${data.couple.bride.ko} <i>${data.couple.bride.en}</i></span>
    `;
  }

  function renderInvite() {
    $("#invite-heading").textContent = data.invite.heading;
    $("#invite-eyebrow").textContent = data.invite.storyEyebrow;
    $("#invite-body").innerHTML = data.invite.paragraphs
      .map((p) => `<p>${p}</p>`)
      .join("");
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
          <img src="${item.src}" alt="${item.alt}" loading="lazy" />
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
    const list = getVisibleGallery();
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
    const list = getVisibleGallery();
    if (!list.length) return;
    state.lightboxIndex = (state.lightboxIndex + delta + list.length) % list.length;
    const item = list[state.lightboxIndex];
    $("#lightbox-image").src = item.src;
    $("#lightbox-image").alt = item.alt;
  }

  function loadKakaoMapSdk(appKey) {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(resolve);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
      script.onload = () => window.kakao.maps.load(resolve);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function renderKakaoRoughMap(container, mapConfig) {
    const { roughMap, height } = mapConfig;
    const containerId = `daumRoughmapContainer${roughMap.timestamp}`;
    container.innerHTML = `<div id="${containerId}" class="root_daum_roughmap root_daum_roughmap_landing location__map-rough"></div>`;

    const render = () => {
      if (!window.daum || !window.daum.roughmap) return;
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = "";
      new window.daum.roughmap.Lander({
        timestamp: String(roughMap.timestamp),
        key: String(roughMap.key),
        mapWidth: "100%",
        mapHeight: String(height),
      }).render();
    };

    if (window.daum && window.daum.roughmap) {
      render();
      return;
    }

    const loader = document.querySelector(".daum_roughmap_loader_script");
    if (loader) {
      loader.addEventListener("load", render, { once: true });
    }
    window.setTimeout(render, 300);
  }

  function renderKakaoSdkMap(container, mapConfig) {
    container.innerHTML = `<div id="kakao-map-canvas" class="location__map-canvas" role="application" aria-label="${mapConfig.markerTitle} 위치"></div>`;

    const createMap = (center, title) => {
      const mapEl = $("#kakao-map-canvas");
      if (!mapEl) return;

      const map = new window.kakao.maps.Map(mapEl, {
        center,
        level: mapConfig.level,
      });
      const marker = new window.kakao.maps.Marker({ map, position: center });
      const info = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;">${title}</div>`,
      });
      info.open(map, marker);
    };

    const fallbackCenter = () => {
      const center = new window.kakao.maps.LatLng(mapConfig.lat, mapConfig.lng);
      createMap(center, mapConfig.markerTitle);
    };

    loadKakaoMapSdk(mapConfig.appKey)
      .then(() => {
        const places = new window.kakao.maps.services.Places();
        places.keywordSearch(mapConfig.searchKeyword, (results, status) => {
          if (status === window.kakao.maps.services.Status.OK && results.length) {
            const place = results[0];
            const center = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
            createMap(center, place.place_name || mapConfig.markerTitle);
            return;
          }
          fallbackCenter();
        });
      })
      .catch(() => renderKakaoEmbedMap(container, mapConfig));
  }

  function renderKakaoEmbedMap(container, mapConfig) {
    container.innerHTML = `
      <div class="location__map-embed" style="height:${mapConfig.height}px">
        <iframe
          class="location__map-iframe"
          title="${mapConfig.markerTitle} 위치"
          src="${mapConfig.embedUrl}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>`;
  }

  function renderKakaoMap() {
    const mapConfig = data.transport.kakaoMap;
    const container = $("#location-map");
    if (!mapConfig || !container) return;

    const { roughMap, appKey } = mapConfig;

    if (roughMap?.timestamp && roughMap?.key) {
      renderKakaoRoughMap(container, mapConfig);
      return;
    }
    if (appKey) {
      renderKakaoSdkMap(container, mapConfig);
      return;
    }
    renderKakaoEmbedMap(container, mapConfig);
  }

  function renderLocation() {
    const c = data.ceremony;
    const t = data.transport;
    $("#location-name").textContent = c.venueName;
    $("#location-hall").textContent = c.venueHall;
    $("#location-address").innerHTML = c.addressLines.map((line) => `${line}<br />`).join("");
    renderKakaoMap();

    $("#location-transit").innerHTML = `
      <article class="transit">
        <h3>${t.bus.title}</h3>
        ${t.bus.lines.map((line) => `<p>${line}</p>`).join("")}
        <p class="transit__note">${t.bus.note}</p>
      </article>
      <article class="transit">
        <h3>${t.subway.title}</h3>
        <p>${t.subway.note}</p>
      </article>
      <article class="transit">
        <h3>${t.car.title}</h3>
        ${t.car.notes.map((n) => `<p>${n}</p>`).join("")}
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

  function renderAccounts() {
    $("#accounts-heading").textContent = data.accounts.heading;
    const g = data.accounts.groomSide;
    const b = data.accounts.brideSide;
    $("#accounts-block").innerHTML = `
      <div class="accounts__col">
        <h3>${g.label}</h3>
        <ul>${g.items.map(accountItemHtml).join("")}</ul>
      </div>
      <div class="accounts__col">
        <h3>${b.label}</h3>
        <ul>${b.items.map(accountItemHtml).join("")}</ul>
      </div>
    `;

    $("#accounts-block").addEventListener("click", (event) => {
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
