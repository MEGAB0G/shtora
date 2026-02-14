const STORAGE = {
  profiles: "skarta.profiles.v1",
  posts: "skarta.posts.v1",
  reviews: "skarta.reviews.v1",
  lastCountry: "skarta.lastCountry.v1",
};

const COUNTRIES = [
  "Австралия",
  "Бразилия",
  "Великобритания",
  "Германия",
  "Египет",
  "Индия",
  "Индонезия",
  "Италия",
  "Канада",
  "Китай",
  "Мексика",
  "Россия",
  "США",
  "Таиланд",
  "Турция",
  "Франция",
  "ЮАР",
  "Япония",
];

const DEFAULT_PROFILES = [
  {
    id: "p-fr-01",
    name: "Claire D.",
    country: "Франция",
    city: "Paris",
    languages: ["Français", "English", "Русский"],
    topics: ["Еда", "Безопасность", "Транспорт"],
    price: 18,
    about:
      "Живу в Париже 9 лет. Подскажу районы, где реально удобно жить туристу, как не попасть на туристические ловушки и где вкусно за разумные деньги.",
    avatar: "./assets/avatar-2.svg",
    rating: 4.8,
    reviewsCount: 146,
  },
  {
    id: "p-th-01",
    name: "Nok S.",
    country: "Таиланд",
    city: "Bangkok / Phuket",
    languages: ["ไทย", "English", "Русский"],
    topics: ["Пляжи", "Транспорт", "Ночная жизнь"],
    price: 12,
    about:
      "Помогаю составить маршрут, выбрать остров/пляж, объясню как с транспортом, симками и безопасностью. Без воды — только практика.",
    avatar: "./assets/avatar-1.svg",
    rating: 4.7,
    reviewsCount: 201,
  },
  {
    id: "p-jp-01",
    name: "Hiro K.",
    country: "Япония",
    city: "Tokyo",
    languages: ["日本語", "English"],
    topics: ["Транспорт", "Еда", "Семья"],
    price: 25,
    about:
      "Живу в Токио. Подскажу как пользоваться транспортом, какие районы выбирать и где поесть без очередей и переплат.",
    avatar: "./assets/avatar-3.svg",
    rating: 4.9,
    reviewsCount: 89,
  },
  {
    id: "p-us-01",
    name: "Sam R.",
    country: "США",
    city: "New York",
    languages: ["English", "Русский"],
    topics: ["Безопасность", "Отели", "Транспорт"],
    price: 20,
    about:
      "Нью‑Йорк без стресса: районы, как не потерять деньги на жилье, что реально стоит смотреть и как перемещаться эффективно.",
    avatar: "./assets/avatar-4.svg",
    rating: 4.6,
    reviewsCount: 122,
  },
];

function $(sel, root = document) {
  return root.querySelector(sel);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(ts) {
  const date = new Date(ts);
  return date.toLocaleString("ru-RU", { year: "numeric", month: "short", day: "2-digit" });
}

function parseQuery() {
  const url = new URL(window.location.href);
  return Object.fromEntries(url.searchParams.entries());
}

function setQueryParam(key, value) {
  const url = new URL(window.location.href);
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, "", url.toString());
}

function getAllProfiles() {
  const userProfiles = readJSON(STORAGE.profiles, []);
  const merged = [...DEFAULT_PROFILES, ...userProfiles];
  const uniq = new Map();
  for (const profile of merged) uniq.set(profile.id, profile);
  return [...uniq.values()];
}

function getProfileById(id) {
  return getAllProfiles().find((p) => p.id === id) || null;
}

function getPosts(profileId) {
  const allPosts = readJSON(STORAGE.posts, {});
  return Array.isArray(allPosts[profileId]) ? allPosts[profileId] : [];
}

function addPost(profileId, post) {
  const allPosts = readJSON(STORAGE.posts, {});
  const list = Array.isArray(allPosts[profileId]) ? allPosts[profileId] : [];
  list.unshift(post);
  allPosts[profileId] = list;
  writeJSON(STORAGE.posts, allPosts);
}

function deletePost(profileId, postId) {
  const allPosts = readJSON(STORAGE.posts, {});
  const list = Array.isArray(allPosts[profileId]) ? allPosts[profileId] : [];
  allPosts[profileId] = list.filter((p) => p.id !== postId);
  writeJSON(STORAGE.posts, allPosts);
}

function getReviews(profileId) {
  const allReviews = readJSON(STORAGE.reviews, {});
  return Array.isArray(allReviews[profileId]) ? allReviews[profileId] : [];
}

function addReview(profileId, review) {
  const allReviews = readJSON(STORAGE.reviews, {});
  const list = Array.isArray(allReviews[profileId]) ? allReviews[profileId] : [];
  list.unshift(review);
  allReviews[profileId] = list;
  writeJSON(STORAGE.reviews, allReviews);
}

function computeRating(profileId, baseRating = null, baseCount = 0) {
  const reviews = getReviews(profileId);
  if (reviews.length === 0) {
    if (typeof baseRating === "number") return { rating: baseRating, count: baseCount };
    return { rating: 0, count: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const rating = sum / reviews.length;
  return { rating, count: reviews.length };
}

function fillCountryDatalist(listId = "countries") {
  const dl = document.getElementById(listId);
  if (!dl) return;
  dl.innerHTML = COUNTRIES.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

function goToPeople(country) {
  const normalized = (country || "").trim();
  if (normalized) localStorage.setItem(STORAGE.lastCountry, normalized);
  const url = new URL("./people.html", window.location.href);
  if (normalized) url.searchParams.set("country", normalized);
  window.location.href = url.toString();
}

function initHome() {
  fillCountryDatalist("countries");
  const input = $("#countrySearch");
  const pill = $("#selectedCountryPill");
  const last = localStorage.getItem(STORAGE.lastCountry) || "";
  if (last && input && pill) {
    input.value = last;
    pill.textContent = `Страна: ${last}`;
  }

  $("#goToPeople")?.addEventListener("click", () => goToPeople(input?.value));
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToPeople(input.value);
    }
  });

  $("#worldMap")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button.pin");
    if (!btn) return;
    const country = btn.getAttribute("data-country") || "";
    if (input) input.value = country;
    if (pill) pill.textContent = `Страна: ${country}`;
  });
}

function tagHtml(text) {
  return `<span class="tag">${escapeHtml(text)}</span>`;
}

function renderPersonCard(profile) {
  const ratingInfo = computeRating(profile.id, profile.rating, profile.reviewsCount);
  const ratingText = ratingInfo.count > 0 ? ratingInfo.rating.toFixed(1) : "—";
  const reviewText = ratingInfo.count > 0 ? `${ratingInfo.count} отзыв(ов)` : "нет отзывов";

  return `
    <article class="card person">
      <div class="avatar">
        <img src="${escapeHtml(profile.avatar || "./assets/avatar-default.svg")}" alt="" loading="lazy" />
      </div>
      <div>
        <h3 class="person__name">${escapeHtml(profile.name)}</h3>
        <div class="person__meta">${escapeHtml(profile.country)} • ${escapeHtml(profile.city)}</div>

        <div class="kpi">
          <span class="pill">⭐ ${escapeHtml(ratingText)} • ${escapeHtml(reviewText)}</span>
          <span class="pill">$${escapeHtml(profile.price)} / вопрос</span>
        </div>

        <div class="tags">
          ${profile.topics.slice(0, 4).map(tagHtml).join("")}
          ${profile.languages.slice(0, 2).map(tagHtml).join("")}
        </div>

        <div class="person__actions">
          <a class="btn btn--primary" href="./profile.html?id=${encodeURIComponent(profile.id)}">Открыть</a>
          <button class="btn" type="button" data-action="ask" data-id="${escapeHtml(profile.id)}">Задать вопрос</button>
        </div>
      </div>
    </article>
  `;
}

function initPeople() {
  fillCountryDatalist("countries");
  const q = parseQuery();
  const fCountry = $("#fCountry");
  const fQuery = $("#fQuery");
  const fCategory = $("#fCategory");
  const fLanguage = $("#fLanguage");
  const fMinRating = $("#fMinRating");
  const fMaxPrice = $("#fMaxPrice");

  const hint = $("#countryHint");
  const pill = $("#resultPill");

  if (fCountry && q.country) fCountry.value = q.country;
  if (hint && q.country) hint.textContent = `Фильтр страны: ${q.country}`;

  function getFilters() {
    return {
      country: (fCountry?.value || "").trim(),
      query: (fQuery?.value || "").trim().toLowerCase(),
      category: (fCategory?.value || "").trim(),
      language: (fLanguage?.value || "").trim(),
      minRating: Number(fMinRating?.value || 0),
      maxPrice: Number(fMaxPrice?.value || 0),
    };
  }

  function applyFiltersToUrl(filters) {
    setQueryParam("country", filters.country);
    if (filters.country) localStorage.setItem(STORAGE.lastCountry, filters.country);
  }

  function matches(profile, filters) {
    if (filters.country && profile.country !== filters.country) return false;
    if (filters.category && !profile.topics.includes(filters.category)) return false;
    if (filters.language && !profile.languages.includes(filters.language)) return false;
    if (filters.maxPrice && profile.price > filters.maxPrice) return false;

    const ratingInfo = computeRating(profile.id, profile.rating, profile.reviewsCount);
    const ratingValue = ratingInfo.count > 0 ? ratingInfo.rating : profile.rating ?? 0;
    if (filters.minRating && ratingValue < filters.minRating) return false;

    if (filters.query) {
      const blob = [
        profile.name,
        profile.country,
        profile.city,
        ...(profile.topics || []),
        ...(profile.languages || []),
        profile.about || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!blob.includes(filters.query)) return false;
    }

    return true;
  }

  function render() {
    const filters = getFilters();
    applyFiltersToUrl(filters);

    const profiles = getAllProfiles()
      .filter((p) => matches(p, filters))
      .sort((a, b) => {
        const ar = computeRating(a.id, a.rating, a.reviewsCount).rating || a.rating || 0;
        const br = computeRating(b.id, b.rating, b.reviewsCount).rating || b.rating || 0;
        return br - ar;
      });

    if (pill) {
      const label = filters.country ? `Страна: ${filters.country}` : "Все страны";
      pill.textContent = `${label} • найдено: ${profiles.length}`;
    }

    const root = $("#peopleList");
    if (!root) return;

    if (profiles.length === 0) {
      root.innerHTML = `<div class="card card--padded"><div class="h2">Ничего не найдено</div><div class="muted">Попробуй изменить фильтры.</div></div>`;
      return;
    }
    root.innerHTML = profiles.map(renderPersonCard).join("");
  }

  $("#filters")?.addEventListener("submit", (e) => {
    e.preventDefault();
    render();
  });

  $("#resetFilters")?.addEventListener("click", () => {
    if (fCountry) fCountry.value = q.country || "";
    if (fQuery) fQuery.value = "";
    if (fCategory) fCategory.value = "";
    if (fLanguage) fLanguage.value = "";
    if (fMinRating) fMinRating.value = "0";
    if (fMaxPrice) fMaxPrice.value = "";
    render();
  });

  $("#peopleList")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-action='ask']");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const p = id ? getProfileById(id) : null;
    const who = p ? `${p.name} (${p.country}, ${p.city})` : "эксперта";
    alert(`Прототип оплаты/чата.\n\nЗдесь будет: покупка вопроса и диалог с ${who}.`);
  });

  render();
}

function profileHeroHtml(profile) {
  const ratingInfo = computeRating(profile.id, profile.rating, profile.reviewsCount);
  const ratingText =
    ratingInfo.count > 0
      ? ratingInfo.rating.toFixed(1)
      : profile.rating
        ? profile.rating.toFixed(1)
        : "—";
  const reviewText = ratingInfo.count > 0 ? `${ratingInfo.count} отзыв(ов)` : `${profile.reviewsCount || 0} отзыв(ов)`;

  return `
    <div class="profileHero__left">
      <div class="profileHero__avatar">
        <img src="${escapeHtml(profile.avatar || "./assets/avatar-default.svg")}" alt="" />
      </div>
      <div>
        <h1 class="profileHero__name">${escapeHtml(profile.name)}</h1>
        <div class="person__meta">${escapeHtml(profile.country)} • ${escapeHtml(profile.city)}</div>
        <div class="kpi">
          <span class="pill">⭐ ${escapeHtml(ratingText)} • ${escapeHtml(reviewText)}</span>
          <span class="pill">$${escapeHtml(profile.price)} / вопрос</span>
        </div>
        <div class="tags" style="margin-top: 12px">
          ${(profile.topics || []).slice(0, 6).map(tagHtml).join("")}
          ${(profile.languages || []).slice(0, 4).map(tagHtml).join("")}
        </div>
        <p class="profileHero__about">${escapeHtml(profile.about || "")}</p>
      </div>
    </div>
    <div class="profileHero__right">
      <div class="profileHero__cta">
        <a class="btn" href="./people.html?country=${encodeURIComponent(profile.country)}">К списку</a>
        <button class="btn btn--primary" type="button" id="buyQuestion">Купить вопрос</button>
      </div>
      <div class="pill">Деньги эксперту • отзывы • рейтинг</div>
    </div>
  `;
}

function renderPosts(profileId, container) {
  const list = getPosts(profileId);
  if (list.length === 0) {
    container.innerHTML = `<div class="muted" style="margin-top:10px">Пока нет постов.</div>`;
    return;
  }
  container.innerHTML = list
    .map(
      (p) => `
    <article class="post" data-id="${escapeHtml(p.id)}">
      <h3 class="post__title">${escapeHtml(p.title)}</h3>
      <div class="post__date">${escapeHtml(formatDate(p.createdAt))}</div>
      <div class="post__body">${escapeHtml(p.body)}</div>
      <div class="post__tools">
        <button class="btn" type="button" data-action="deletePost">Удалить</button>
      </div>
    </article>
  `
    )
    .join("");
}

function renderReviews(profileId, container) {
  const list = getReviews(profileId);
  if (list.length === 0) {
    container.innerHTML = `<div class="muted">Пока нет отзывов.</div>`;
    return;
  }
  container.innerHTML = list
    .map(
      (r) => `
    <article class="review">
      <div class="review__top">
        <div class="review__rating">⭐ ${escapeHtml(String(r.rating))}</div>
        <div class="review__date">${escapeHtml(formatDate(r.createdAt))}</div>
      </div>
      <div class="review__text">${escapeHtml(r.text)}</div>
    </article>
  `
    )
    .join("");
}

function initProfile() {
  const q = parseQuery();
  const id = q.id || "";
  const profile = getProfileById(id);
  const hero = $("#profileHero");
  if (!hero) return;

  if (!profile) {
    hero.innerHTML = `<div class="h2">Профиль не найден</div><div class="muted">Проверь ссылку или создай новый профиль.</div><div style="margin-top:12px"><a class="btn btn--primary" href="./create.html">Создать профиль</a></div>`;
    return;
  }

  hero.innerHTML = profileHeroHtml(profile);
  $("#buyQuestion")?.addEventListener("click", () => {
    alert(`Прототип оплаты.\n\nЗдесь будет покупка вопроса за $${profile.price} и чат с экспертом.`);
  });

  const postsRoot = $("#posts");
  const reviewsRoot = $("#reviews");
  if (postsRoot) renderPosts(profile.id, postsRoot);
  if (reviewsRoot) renderReviews(profile.id, reviewsRoot);

  $("#postForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#pTitle")?.value?.trim();
    const body = $("#pBody")?.value?.trim();
    if (!title || !body) return;
    addPost(profile.id, { id: `post-${Date.now()}`, title, body, createdAt: Date.now() });
    $("#pTitle").value = "";
    $("#pBody").value = "";
    if (postsRoot) renderPosts(profile.id, postsRoot);
  });

  $("#posts")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-action='deletePost']");
    if (!btn) return;
    const post = e.target.closest?.("article.post");
    const postId = post?.getAttribute?.("data-id");
    if (!postId) return;
    if (!confirm("Удалить пост?")) return;
    deletePost(profile.id, postId);
    if (postsRoot) renderPosts(profile.id, postsRoot);
  });

  $("#reviewForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const rating = Number($("#rRating")?.value || 0);
    const text = $("#rText")?.value?.trim();
    if (!rating || !text) return;
    addReview(profile.id, { id: `rev-${Date.now()}`, rating, text, createdAt: Date.now() });
    $("#rText").value = "";
    if (reviewsRoot) renderReviews(profile.id, reviewsRoot);
    hero.innerHTML = profileHeroHtml(profile);
  });
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function initCreate() {
  fillCountryDatalist("countries");

  $("#clearLocal")?.addEventListener("click", () => {
    if (!confirm("Очистить созданные профили/посты/отзывы в этом браузере?")) return;
    localStorage.removeItem(STORAGE.profiles);
    localStorage.removeItem(STORAGE.posts);
    localStorage.removeItem(STORAGE.reviews);
    alert("Очищено.");
  });

  $("#createProfileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#cName")?.value?.trim();
    const country = $("#cCountry")?.value?.trim();
    const city = $("#cCity")?.value?.trim();
    const languages =
      $("#cLanguages")?.value
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const topics =
      $("#cTopics")?.value
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const price = Number($("#cPrice")?.value || 0);
    const about = $("#cAbout")?.value?.trim();
    const file = $("#cPhoto")?.files?.[0] || null;

    if (!name || !country || !city || !about || !price) return;

    let avatar = "./assets/avatar-default.svg";
    if (file) {
      try {
        avatar = await readFileAsDataUrl(file);
      } catch {
        avatar = "./assets/avatar-default.svg";
      }
    }

    const profile = {
      id: `u-${Date.now()}`,
      name,
      country,
      city,
      languages,
      topics,
      price,
      about,
      avatar,
      rating: 0,
      reviewsCount: 0,
    };

    const list = readJSON(STORAGE.profiles, []);
    list.unshift(profile);
    writeJSON(STORAGE.profiles, list);
    localStorage.setItem(STORAGE.lastCountry, country);

    window.location.href = `./profile.html?id=${encodeURIComponent(profile.id)}`;
  });
}

function init() {
  const page = document.body?.getAttribute("data-page");
  if (page === "home") initHome();
  if (page === "people") initPeople();
  if (page === "profile") initProfile();
  if (page === "create") initCreate();
}

init();
