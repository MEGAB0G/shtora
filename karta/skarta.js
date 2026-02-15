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
  "Испания",
];

const STORAGE = {
  lastCountry: "skarta.lastCountry.v1",
  lang: "skarta.lang.v1",
};

function $(sel, root = document) {
  return root.querySelector(sel);
}

let langMemory = null;

function getLangFromDom() {
  try {
    const select = $("#langSelect");
    if (!select) return null;
    const raw = String(select.value || "").toLowerCase();
    return LANGS.some((l) => l.code === raw) ? raw : null;
  } catch {
    return null;
  }
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const TOPIC_KEY_BY_RU = {
  "Еда": "topic.food",
  "Безопасность": "topic.safety",
  "Транспорт": "topic.transport",
  "Отели": "topic.hotels",
  "Виза": "topic.visa",
  "Пляжи": "topic.beaches",
  "Ночная жизнь": "topic.nightlife",
  "Семья": "topic.family",
};

const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "tr", label: "Türkçe" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "th", label: "ไทย" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
];

const I18N = {
  ru: {
    "nav.experts": "Эксперты",
    "nav.createExpert": "Создать профиль",
    "nav.becomeExpert": "Стать экспертом",
    "nav.login": "Войти",
    "nav.account": "Аккаунт",
    "nav.feed": "Лента",
    "nav.chats": "Чаты",

    "home.subtitle": "Находи людей на месте — получай честные ответы про районы, безопасность, цены и лучшие места.",
    "home.countrySearchLabel": "Поиск страны",
    "home.countrySearchPlaceholder": "Например: Япония, Франция, Таиланд…",
    "home.showExperts": "Показать экспертов",
    "home.hint": "Можно выбрать на карте или через поиск — страна станет фильтром для страницы экспертов.",
    "home.mapTitle": "Карта мира",
    "home.mapHint": "Выбери страну",
    "home.countryNotSelected": "Страна: не выбрана",
    "home.countrySelected": "Страна: {country}",
    "home.howTitle": "Как это будет работать",
    "home.how1": "Эксперты (местные) ведут профиль: описание, фото, посты.",
    "home.how2": "Пользователи задают вопросы и оставляют отзывы.",
    "home.how3": "У экспертов рейтинг и доход за консультации.",
    "home.quickTitle": "Быстрый старт",
    "home.openExperts": "Открыть экспертов",
    "home.createProfileCta": "Создать профиль",
    "home.prototypeNote": "Сейчас всё хранится на сервере (файлы JSON) — как прототип.",

    "people.title": "Эксперты",
    "people.subtitle": "Фильтруй по стране, теме, языку, рейтингу и цене.",
    "people.back": "Назад",
    "people.becomeExpert": "Стать экспертом",
    "people.filtersTitle": "Фильтры",
    "people.country": "Страна",
    "people.search": "Поиск",
    "people.topic": "Тема",
    "people.language": "Язык",
    "people.rating": "Рейтинг",
    "people.priceMax": "Цена за вопрос (до)",
    "people.apply": "Применить",
    "people.reset": "Сбросить",
    "people.loading": "Загрузка…",
    "people.any": "Любая",
    "people.searchPlaceholder": "Имя, город, теги…",
    "people.pricePlaceholder": "Напр. 25",
    "people.allCountries": "Все страны",
    "people.found": "{label} • найдено: {n}",
    "people.nothingTitle": "Ничего не найдено",
    "people.nothingText": "Попробуй изменить фильтры или создай первый профиль эксперта.",
    "people.countryFilter": "Фильтр страны: {country}",

    "topic.food": "Еда",
    "topic.safety": "Безопасность",
    "topic.transport": "Транспорт",
    "topic.hotels": "Отели",
    "topic.visa": "Виза",
    "topic.beaches": "Пляжи",
    "topic.nightlife": "Ночная жизнь",
    "topic.family": "Семья",

    "profile.postsTitle": "Посты",
    "profile.postsHint": "Эксперт может выкладывать контент. В прототипе всё сохраняется на сервере.",
    "profile.addPostTitle": "Добавить пост",
    "profile.postTitleLabel": "Заголовок",
    "profile.postTitlePlaceholder": "Напр.: Как не переплатить в центре",
    "profile.postBodyLabel": "Текст",
    "profile.postBodyPlaceholder": "Коротко и по делу…",
    "profile.mediaLabel": "Медиа (фото/видео)",
    "profile.mediaHint": "До 6 файлов. Видео — небольшие.",
    "profile.mediaCaption": "Подпись",
    "profile.publish": "Опубликовать",
    "profile.reviewsTitle": "Отзывы",
    "profile.ratingLabel": "Оценка",
    "profile.rate5": "5 — отлично",
    "profile.rate4": "4 — хорошо",
    "profile.rate3": "3 — нормально",
    "profile.rate2": "2 — плохо",
    "profile.rate1": "1 — ужасно",
    "profile.commentLabel": "Комментарий",
    "profile.commentPlaceholder": "Что было полезно?",
    "profile.leaveReview": "Оставить отзыв",
    "profile.loginToReview": "Чтобы оставить отзыв — нужно войти.",
    "profile.buyQuestion": "Купить вопрос",
    "profile.ownerPill": "Ты владелец профиля",
    "profile.metaPill": "Отзывы • рейтинг • деньги эксперту",
    "profile.toList": "К списку",
    "profile.noPosts": "Пока нет постов.",
    "post.delete": "Удалить",

    "create.title": "Создать профиль",
    "create.subtitle": "Таблица создания профиля (прототип).",
    "create.toExperts": "К экспертам",
    "create.loading": "Загрузка…",
    "create.name": "Имя",
    "create.namePlaceholder": "Напр.: Roman",
    "create.country": "Страна",
    "create.countryPlaceholder": "Выбери страну",
    "create.city": "Город/район",
    "create.cityPlaceholder": "Напр.: Paris / 11e",
    "create.languages": "Языки",
    "create.languagesPlaceholder": "Напр.: Русский, English",
    "create.topics": "Темы (через запятую)",
    "create.topicsPlaceholder": "Еда, Безопасность, Транспорт",
    "create.price": "Цена за вопрос",
    "create.pricePlaceholder": "Напр. 15",
    "create.about": "Описание",
    "create.aboutPlaceholder": "Кто ты, чем поможешь туристам, почему тебе можно доверять…",
    "create.photo": "Фото профиля",
    "create.photoHint": "Можно пропустить — будет дефолтный аватар.",
    "create.submit": "Создать профиль",
    "create.clearLocal": "Очистить прототип-данные",
    "create.needLogin": "Нужно войти, чтобы создать экспертный профиль.",
    "create.fillHint": "Заполни данные — профиль сохранится на сервере.",

    "auth.title": "Вход / Регистрация",
    "auth.subtitle": "Обычный пользователь нужен, чтобы писать отзывы и покупать вопросы.",
    "auth.home": "Главная",
    "auth.registerTitle": "Регистрация",
    "auth.loginTitle": "Вход",
    "auth.name": "Имя",
    "auth.namePlaceholder": "Напр.: Alex",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.passwordPlaceholder": "Минимум 8 символов",
    "auth.passwordHint": "Пароль хранится на сервере только в виде хеша.",
    "auth.createAccount": "Создать аккаунт",
    "auth.signIn": "Войти",
    "auth.statusIdle": "—",

    "me.title": "Аккаунт",
    "me.subtitle": "Профиль обычного пользователя + управление экспертным профилем.",
    "me.logout": "Выйти",
    "me.youAre": "Ты вошёл как",
    "me.loading": "Загрузка…",
    "me.hint": "Отсюда будет: покупки, вопросы, история диалогов.",
    "me.expertTitle": "Эксперт",
    "me.expertHint": "Если хочешь зарабатывать — создай экспертный профиль по своей стране/району.",
    "me.createOrUpdate": "Создать / обновить профиль",
    "me.viewTop": "Смотреть топ",
    "me.noExpert": "Экспертного профиля пока нет.",
    "me.expertProfile": "Экспертный профиль: {id}",
    "me.editTitle": "Профиль пользователя",
    "me.name": "Имя",
    "me.save": "Сохранить",
    "me.passTitle": "Пароль",
    "me.oldPass": "Старый пароль",
    "me.newPass": "Новый пароль",
    "me.changePass": "Сменить пароль",
    "me.saved": "Сохранено",
    "me.passChanged": "Пароль изменён",
    "me.passInvalid": "Неверный пароль",

    "alert.chat": "Прототип оплаты/чата.\n\nЗдесь будет: покупка вопроса и диалог с экспертом.",
    "alert.pay": "Прототип оплаты.\n\nЗдесь будет покупка вопроса за ${price} и чат с экспертом.",
    "alert.postFail": "Не получилось добавить пост. Проверь вход и попробуй ещё раз.",
    "alert.postDeleteFail": "Не получилось удалить пост.",
    "alert.reviewFail": "Не получилось оставить отзыв.",
    "alert.photoTooBig": "Фото слишком большое для прототипа. Выбери картинку поменьше.",
    "alert.uploadFail": "Не получилось загрузить файл.",
    "alert.mediaTooMany": "Слишком много файлов (макс. 6).",
    "alert.messageFail": "Не получилось отправить сообщение.",
    "alert.expertSaveFail": "Не получилось сохранить профиль. Проверь поля и попробуй ещё раз.",
    "alert.clearNotNeeded": "Теперь данные сохраняются на сервере. Очистка прототип-данных в браузере не требуется.",

    "card.open": "Открыть",
    "card.ask": "Задать вопрос",
    "card.perQuestion": "/ вопрос",
    "card.noReviews": "нет отзывов",
    "card.reviews": "{n} отзыв(ов)",

    "feed.title": "Лента",
    "feed.subtitle": "Записи экспертов — по странам.",
    "feed.back": "Назад",
    "feed.filtersTitle": "Фильтры",
    "feed.country": "Страна",
    "feed.search": "Поиск",
    "feed.searchPlaceholder": "Заголовок, текст, эксперт…",
    "feed.apply": "Применить",
    "feed.reset": "Сбросить",
    "feed.loading": "Загрузка…",
    "feed.pillAll": "Все страны • постов: {n}",
    "feed.pillCountry": "Страна: {country} • постов: {n}",
    "feed.openExpert": "Открыть эксперта",
    "feed.noneTitle": "Постов пока нет",
    "feed.noneText": "Эксперты начнут публиковать — и тут появится лента.",

    "chats.title": "Чаты",
    "chats.subtitle": "Твои диалоги с экспертами.",
    "chats.toExperts": "К экспертам",
    "chats.loading": "Загрузка…",
    "chats.noneTitle": "Чатов пока нет",
    "chats.noneText": "Открой эксперта и нажми «Задать вопрос», чтобы начать диалог.",
    "chats.open": "Открыть чат",

    "chat.title": "Чат",
    "chat.subtitle": "Диалог с экспертом.",
    "chat.back": "Назад",
    "chat.loading": "Загрузка…",
    "chat.placeholder": "Напиши сообщение…",
    "chat.send": "Отправить",
  },
  en: {
    "nav.experts": "Experts",
    "nav.createExpert": "Create profile",
    "nav.becomeExpert": "Become an expert",
    "nav.login": "Sign in",
    "nav.account": "Account",
    "nav.feed": "Feed",
    "nav.chats": "Chats",

    "home.subtitle": "Find locals — get honest answers about neighborhoods, safety, costs, and the best places.",
    "home.countrySearchLabel": "Country search",
    "home.countrySearchPlaceholder": "For example: Japan, France, Thailand…",
    "home.showExperts": "Show experts",
    "home.hint": "Pick a country on the map or via search — it becomes a filter for the experts page.",
    "home.mapTitle": "World map",
    "home.mapHint": "Choose a country",
    "home.countryNotSelected": "Country: not selected",
    "home.countrySelected": "Country: {country}",
    "home.howTitle": "How it works",
    "home.how1": "Experts (locals) maintain a profile: bio, photo, posts.",
    "home.how2": "Users ask questions and leave reviews.",
    "home.how3": "Experts earn income with ratings and feedback.",
    "home.quickTitle": "Quick start",
    "home.openExperts": "Open experts",
    "home.createProfileCta": "Create profile",
    "home.prototypeNote": "Data is stored on the server (JSON files) — prototype stage.",

    "people.title": "Experts",
    "people.subtitle": "Filter by country, topic, language, rating, and price.",
    "people.back": "Back",
    "people.becomeExpert": "Become an expert",
    "people.filtersTitle": "Filters",
    "people.country": "Country",
    "people.search": "Search",
    "people.topic": "Topic",
    "people.language": "Language",
    "people.rating": "Rating",
    "people.priceMax": "Price per question (max)",
    "people.apply": "Apply",
    "people.reset": "Reset",
    "people.loading": "Loading…",
    "people.any": "Any",
    "people.searchPlaceholder": "Name, city, tags…",
    "people.pricePlaceholder": "e.g. 25",
    "people.allCountries": "All countries",
    "people.found": "{label} • found: {n}",
    "people.nothingTitle": "Nothing found",
    "people.nothingText": "Try adjusting filters or create the first expert profile.",
    "people.countryFilter": "Country filter: {country}",

    "topic.food": "Food",
    "topic.safety": "Safety",
    "topic.transport": "Transport",
    "topic.hotels": "Hotels",
    "topic.visa": "Visa",
    "topic.beaches": "Beaches",
    "topic.nightlife": "Nightlife",
    "topic.family": "Family",

    "profile.postsTitle": "Posts",
    "profile.postsHint": "Experts can publish content. In this prototype, everything is saved on the server.",
    "profile.addPostTitle": "Add a post",
    "profile.postTitleLabel": "Title",
    "profile.postTitlePlaceholder": "e.g. How to avoid overpaying downtown",
    "profile.postBodyLabel": "Text",
    "profile.postBodyPlaceholder": "Short and to the point…",
    "profile.mediaLabel": "Media (photo/video)",
    "profile.mediaHint": "Up to 6 files. Keep videos small.",
    "profile.mediaCaption": "Caption",
    "profile.publish": "Publish",
    "profile.reviewsTitle": "Reviews",
    "profile.ratingLabel": "Rating",
    "profile.rate5": "5 — excellent",
    "profile.rate4": "4 — good",
    "profile.rate3": "3 — okay",
    "profile.rate2": "2 — bad",
    "profile.rate1": "1 — awful",
    "profile.commentLabel": "Comment",
    "profile.commentPlaceholder": "What was helpful?",
    "profile.leaveReview": "Leave a review",
    "profile.loginToReview": "To leave a review — please sign in.",
    "profile.buyQuestion": "Buy a question",
    "profile.ownerPill": "You own this profile",
    "profile.metaPill": "Reviews • rating • payout",
    "profile.toList": "Back to list",
    "profile.noPosts": "No posts yet.",
    "post.delete": "Delete",

    "create.title": "Create profile",
    "create.subtitle": "Profile creation table (prototype).",
    "create.toExperts": "To experts",
    "create.loading": "Loading…",
    "create.name": "Name",
    "create.namePlaceholder": "e.g. Roman",
    "create.country": "Country",
    "create.countryPlaceholder": "Choose a country",
    "create.city": "City / area",
    "create.cityPlaceholder": "e.g. Paris / 11e",
    "create.languages": "Languages",
    "create.languagesPlaceholder": "e.g. English, Español",
    "create.topics": "Topics (comma-separated)",
    "create.topicsPlaceholder": "Food, Safety, Transport",
    "create.price": "Price per question",
    "create.pricePlaceholder": "e.g. 15",
    "create.about": "About",
    "create.aboutPlaceholder": "Who you are and how you can help travelers…",
    "create.photo": "Profile photo",
    "create.photoHint": "Optional — a default avatar will be used.",
    "create.submit": "Save profile",
    "create.clearLocal": "Clear prototype data",
    "create.needLogin": "Sign in to create an expert profile.",
    "create.fillHint": "Fill the form — the profile will be saved on the server.",

    "auth.title": "Sign in / Register",
    "auth.subtitle": "A regular user is needed to leave reviews and buy questions.",
    "auth.home": "Home",
    "auth.registerTitle": "Register",
    "auth.loginTitle": "Sign in",
    "auth.name": "Name",
    "auth.namePlaceholder": "e.g. Alex",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "At least 8 characters",
    "auth.passwordHint": "Password is stored only as a secure hash.",
    "auth.createAccount": "Create account",
    "auth.signIn": "Sign in",
    "auth.statusIdle": "—",

    "me.title": "Account",
    "me.subtitle": "Regular user profile + expert profile management.",
    "me.logout": "Sign out",
    "me.youAre": "Signed in as",
    "me.loading": "Loading…",
    "me.hint": "Here will be: purchases, questions, chat history.",
    "me.expertTitle": "Expert",
    "me.expertHint": "If you want to earn — create an expert profile for your country/area.",
    "me.createOrUpdate": "Create / update profile",
    "me.viewTop": "View top",
    "me.noExpert": "No expert profile yet.",
    "me.expertProfile": "Expert profile: {id}",
    "me.editTitle": "User profile",
    "me.name": "Name",
    "me.save": "Save",
    "me.passTitle": "Password",
    "me.oldPass": "Old password",
    "me.newPass": "New password",
    "me.changePass": "Change password",
    "me.saved": "Saved",
    "me.passChanged": "Password updated",
    "me.passInvalid": "Wrong password",

    "alert.chat": "Prototype payments/chat.\n\nHere will be: purchase a question and chat with the expert.",
    "alert.pay": "Prototype payment.\n\nHere will be: buy a question for ${price} and chat with the expert.",
    "alert.postFail": "Couldn't add the post. Check your login and try again.",
    "alert.postDeleteFail": "Couldn't delete the post.",
    "alert.reviewFail": "Couldn't submit the review.",
    "alert.photoTooBig": "Photo is too large for this prototype. Pick a smaller image.",
    "alert.uploadFail": "Couldn't upload the file.",
    "alert.mediaTooMany": "Too many files (max 6).",
    "alert.messageFail": "Couldn't send the message.",
    "alert.expertSaveFail": "Couldn't save the profile. Check fields and try again.",
    "alert.clearNotNeeded": "Data is stored on the server now. Browser cleanup is not needed.",

    "card.open": "Open",
    "card.ask": "Ask a question",
    "card.perQuestion": "/ question",
    "card.noReviews": "no reviews",
    "card.reviews": "{n} reviews",

    "feed.title": "Feed",
    "feed.subtitle": "Expert posts — by country.",
    "feed.back": "Back",
    "feed.filtersTitle": "Filters",
    "feed.country": "Country",
    "feed.search": "Search",
    "feed.searchPlaceholder": "Title, text, expert…",
    "feed.apply": "Apply",
    "feed.reset": "Reset",
    "feed.loading": "Loading…",
    "feed.pillAll": "All countries • posts: {n}",
    "feed.pillCountry": "Country: {country} • posts: {n}",
    "feed.openExpert": "Open expert",
    "feed.noneTitle": "No posts yet",
    "feed.noneText": "Once experts publish, the feed will show up here.",

    "chats.title": "Chats",
    "chats.subtitle": "Your conversations with experts.",
    "chats.toExperts": "To experts",
    "chats.loading": "Loading…",
    "chats.noneTitle": "No chats yet",
    "chats.noneText": "Open an expert and click “Ask a question” to start.",
    "chats.open": "Open chat",

    "chat.title": "Chat",
    "chat.subtitle": "Conversation with an expert.",
    "chat.back": "Back",
    "chat.loading": "Loading…",
    "chat.placeholder": "Type a message…",
    "chat.send": "Send",
  },
  es: {
    "nav.experts": "Expertos",
    "nav.createExpert": "Crear perfil",
    "nav.becomeExpert": "Ser experto",
    "nav.login": "Iniciar sesión",
    "nav.account": "Cuenta",
    "nav.feed": "Feed",
    "home.subtitle": "Encuentra locales: respuestas honestas sobre zonas, seguridad, precios y mejores lugares.",
    "home.countrySearchLabel": "Búsqueda por país",
    "home.countrySearchPlaceholder": "Por ejemplo: Japón, Francia, Tailandia…",
    "home.showExperts": "Ver expertos",
    "home.mapTitle": "Mapa del mundo",
    "home.mapHint": "Elige un país",
    "home.countryNotSelected": "País: no seleccionado",
    "home.countrySelected": "País: {country}",
    "people.title": "Expertos",
    "people.filtersTitle": "Filtros",
    "people.country": "País",
    "people.search": "Buscar",
    "people.topic": "Tema",
    "people.language": "Idioma",
    "people.rating": "Valoración",
    "people.apply": "Aplicar",
    "people.reset": "Restablecer",
    "profile.postsTitle": "Publicaciones",
    "profile.reviewsTitle": "Reseñas",
    "profile.leaveReview": "Dejar reseña",
    "profile.loginToReview": "Para dejar una reseña, inicia sesión.",
    "create.title": "Crear perfil",
    "auth.title": "Entrar / Registro",
    "me.title": "Cuenta",
  },
  fr: {
    "nav.experts": "Experts",
    "nav.createExpert": "Créer un profil",
    "nav.becomeExpert": "Devenir expert",
    "nav.login": "Connexion",
    "nav.account": "Compte",
    "home.subtitle": "Trouvez des locaux — des réponses honnêtes sur les quartiers, la sécurité, les coûts et les meilleurs endroits.",
    "home.countrySearchLabel": "Recherche de pays",
    "home.countrySearchPlaceholder": "Ex.: Japon, France, Thaïlande…",
    "home.showExperts": "Voir les experts",
    "home.mapTitle": "Carte du monde",
    "home.mapHint": "Choisissez un pays",
    "home.countryNotSelected": "Pays : non sélectionné",
    "home.countrySelected": "Pays : {country}",
    "people.title": "Experts",
    "people.filtersTitle": "Filtres",
    "people.country": "Pays",
    "people.search": "Recherche",
    "people.topic": "Thème",
    "people.language": "Langue",
    "people.rating": "Note",
    "people.apply": "Appliquer",
    "people.reset": "Réinitialiser",
    "profile.postsTitle": "Posts",
    "profile.reviewsTitle": "Avis",
    "profile.leaveReview": "Laisser un avis",
    "profile.loginToReview": "Pour laisser un avis, connectez-vous.",
    "create.title": "Créer un profil",
    "auth.title": "Connexion / Inscription",
    "me.title": "Compte",
  },
  de: {
    "nav.experts": "Experten",
    "nav.createExpert": "Profil erstellen",
    "nav.becomeExpert": "Experte werden",
    "nav.login": "Anmelden",
    "nav.account": "Konto",
    "home.subtitle": "Finde Locals — ehrliche Antworten zu Vierteln, Sicherheit, Kosten und den besten Orten.",
    "home.countrySearchLabel": "Ländersuche",
    "home.countrySearchPlaceholder": "Z.B.: Japan, Frankreich, Thailand…",
    "home.showExperts": "Experten anzeigen",
    "home.mapTitle": "Weltkarte",
    "home.mapHint": "Land auswählen",
    "home.countryNotSelected": "Land: nicht ausgewählt",
    "home.countrySelected": "Land: {country}",
    "people.title": "Experten",
    "people.filtersTitle": "Filter",
    "people.country": "Land",
    "people.search": "Suche",
    "people.topic": "Thema",
    "people.language": "Sprache",
    "people.rating": "Bewertung",
    "people.apply": "Anwenden",
    "people.reset": "Zurücksetzen",
    "profile.postsTitle": "Beiträge",
    "profile.reviewsTitle": "Bewertungen",
    "profile.leaveReview": "Bewertung schreiben",
    "profile.loginToReview": "Zum Bewerten bitte anmelden.",
    "create.title": "Profil erstellen",
    "auth.title": "Anmelden / Registrieren",
    "me.title": "Konto",
  },
  it: {
    "nav.experts": "Esperti",
    "nav.createExpert": "Crea profilo",
    "nav.becomeExpert": "Diventa esperto",
    "nav.login": "Accedi",
    "nav.account": "Account",
    "home.subtitle": "Trova persone del posto — risposte oneste su quartieri, sicurezza, costi e posti migliori.",
    "home.countrySearchLabel": "Ricerca paese",
    "home.countrySearchPlaceholder": "Es.: Giappone, Francia, Thailandia…",
    "home.showExperts": "Mostra esperti",
    "home.mapTitle": "Mappa del mondo",
    "home.mapHint": "Scegli un paese",
    "home.countryNotSelected": "Paese: non selezionato",
    "home.countrySelected": "Paese: {country}",
    "people.title": "Esperti",
    "people.filtersTitle": "Filtri",
    "people.country": "Paese",
    "people.search": "Cerca",
    "people.topic": "Tema",
    "people.language": "Lingua",
    "people.rating": "Valutazione",
    "people.apply": "Applica",
    "people.reset": "Reimposta",
    "profile.postsTitle": "Post",
    "profile.reviewsTitle": "Recensioni",
    "profile.leaveReview": "Lascia recensione",
    "profile.loginToReview": "Per lasciare una recensione, accedi.",
    "create.title": "Crea profilo",
    "auth.title": "Accesso / Registrazione",
    "me.title": "Account",
  },
  pt: {
    "nav.experts": "Especialistas",
    "nav.createExpert": "Criar perfil",
    "nav.becomeExpert": "Virar especialista",
    "nav.login": "Entrar",
    "nav.account": "Conta",
    "home.subtitle": "Encontre locais — respostas honestas sobre bairros, segurança, custos e melhores lugares.",
    "home.countrySearchLabel": "Buscar país",
    "home.countrySearchPlaceholder": "Ex.: Japão, França, Tailândia…",
    "home.showExperts": "Ver especialistas",
    "home.mapTitle": "Mapa-múndi",
    "home.mapHint": "Escolha um país",
    "home.countryNotSelected": "País: não selecionado",
    "home.countrySelected": "País: {country}",
    "people.title": "Especialistas",
    "people.filtersTitle": "Filtros",
    "people.country": "País",
    "people.search": "Buscar",
    "people.topic": "Tema",
    "people.language": "Idioma",
    "people.rating": "Nota",
    "people.apply": "Aplicar",
    "people.reset": "Redefinir",
    "profile.postsTitle": "Posts",
    "profile.reviewsTitle": "Avaliações",
    "profile.leaveReview": "Deixar avaliação",
    "profile.loginToReview": "Para avaliar, faça login.",
    "create.title": "Criar perfil",
    "auth.title": "Entrar / Registrar",
    "me.title": "Conta",
  },
  tr: {
    "nav.experts": "Uzmanlar",
    "nav.createExpert": "Profil oluştur",
    "nav.becomeExpert": "Uzman ol",
    "nav.login": "Giriş yap",
    "nav.account": "Hesap",
    "home.subtitle": "Yerelleri bul — semtler, güvenlik, maliyetler ve en iyi yerler hakkında dürüst cevaplar al.",
    "home.countrySearchLabel": "Ülke arama",
    "home.countrySearchPlaceholder": "Örn.: Japonya, Fransa, Tayland…",
    "home.showExperts": "Uzmanları göster",
    "home.mapTitle": "Dünya haritası",
    "home.mapHint": "Ülke seç",
    "home.countryNotSelected": "Ülke: seçilmedi",
    "home.countrySelected": "Ülke: {country}",
    "people.title": "Uzmanlar",
    "people.filtersTitle": "Filtreler",
    "people.country": "Ülke",
    "people.search": "Ara",
    "people.topic": "Konu",
    "people.language": "Dil",
    "people.rating": "Puan",
    "people.apply": "Uygula",
    "people.reset": "Sıfırla",
    "profile.postsTitle": "Gönderiler",
    "profile.reviewsTitle": "Yorumlar",
    "profile.leaveReview": "Yorum yaz",
    "profile.loginToReview": "Yorum yazmak için giriş yap.",
    "create.title": "Profil oluştur",
    "auth.title": "Giriş / Kayıt",
    "me.title": "Hesap",
  },
  zh: {
    "nav.experts": "达人",
    "nav.createExpert": "创建资料",
    "nav.becomeExpert": "成为达人",
    "nav.login": "登录",
    "nav.account": "账户",
    "home.subtitle": "找到当地人——获得关于区域、安全、花费和最佳地点的真实建议。",
    "home.countrySearchLabel": "搜索国家",
    "home.countrySearchPlaceholder": "例如：日本、法国、泰国…",
    "home.showExperts": "查看达人",
    "home.mapTitle": "世界地图",
    "home.mapHint": "选择国家",
    "home.countryNotSelected": "国家：未选择",
    "home.countrySelected": "国家：{country}",
    "people.title": "达人",
    "people.filtersTitle": "筛选",
    "people.country": "国家",
    "people.search": "搜索",
    "people.topic": "主题",
    "people.language": "语言",
    "people.rating": "评分",
    "people.apply": "应用",
    "people.reset": "重置",
    "profile.postsTitle": "帖子",
    "profile.reviewsTitle": "评价",
    "profile.leaveReview": "写评价",
    "profile.loginToReview": "写评价需要先登录。",
    "create.title": "创建资料",
    "auth.title": "登录 / 注册",
    "me.title": "账户",
  },
  ja: {
    "nav.experts": "エキスパート",
    "nav.createExpert": "プロフィール作成",
    "nav.becomeExpert": "エキスパートになる",
    "nav.login": "ログイン",
    "nav.account": "アカウント",
    "home.subtitle": "現地の人を見つけて、エリア・安全・費用・おすすめを正直に聞こう。",
    "home.countrySearchLabel": "国を検索",
    "home.countrySearchPlaceholder": "例：日本、フランス、タイ…",
    "home.showExperts": "エキスパートを見る",
    "home.mapTitle": "世界地図",
    "home.mapHint": "国を選ぶ",
    "home.countryNotSelected": "国：未選択",
    "home.countrySelected": "国：{country}",
    "people.title": "エキスパート",
    "people.filtersTitle": "フィルター",
    "people.country": "国",
    "people.search": "検索",
    "people.topic": "テーマ",
    "people.language": "言語",
    "people.rating": "評価",
    "people.apply": "適用",
    "people.reset": "リセット",
    "profile.postsTitle": "投稿",
    "profile.reviewsTitle": "レビュー",
    "profile.leaveReview": "レビューを書く",
    "profile.loginToReview": "レビューにはログインが必要です。",
    "create.title": "プロフィール作成",
    "auth.title": "ログイン / 登録",
    "me.title": "アカウント",
  },
  ko: {
    "nav.experts": "전문가",
    "nav.createExpert": "프로필 만들기",
    "nav.becomeExpert": "전문가 되기",
    "nav.login": "로그인",
    "nav.account": "계정",
    "home.subtitle": "현지인을 찾아 동네, 안전, 비용, 추천 장소에 대한 솔직한 정보를 얻으세요.",
    "home.countrySearchLabel": "국가 검색",
    "home.countrySearchPlaceholder": "예: 일본, 프랑스, 태국…",
    "home.showExperts": "전문가 보기",
    "home.mapTitle": "세계 지도",
    "home.mapHint": "국가 선택",
    "home.countryNotSelected": "국가: 선택 안 함",
    "home.countrySelected": "국가: {country}",
    "people.title": "전문가",
    "people.filtersTitle": "필터",
    "people.country": "국가",
    "people.search": "검색",
    "people.topic": "주제",
    "people.language": "언어",
    "people.rating": "평점",
    "people.apply": "적용",
    "people.reset": "초기화",
    "profile.postsTitle": "게시글",
    "profile.reviewsTitle": "리뷰",
    "profile.leaveReview": "리뷰 남기기",
    "profile.loginToReview": "리뷰를 남기려면 로그인하세요.",
    "create.title": "프로필 만들기",
    "auth.title": "로그인 / 가입",
    "me.title": "계정",
  },
  th: {
    "nav.experts": "ผู้เชี่ยวชาญ",
    "nav.createExpert": "สร้างโปรไฟล์",
    "nav.becomeExpert": "เป็นผู้เชี่ยวชาญ",
    "nav.login": "เข้าสู่ระบบ",
    "nav.account": "บัญชี",
    "home.subtitle": "ค้นหาคนท้องถิ่น — รับคำตอบจริงเกี่ยวกับย่าน ความปลอดภัย ค่าใช้จ่าย และที่เที่ยวที่ดีที่สุด",
    "home.countrySearchLabel": "ค้นหาประเทศ",
    "home.countrySearchPlaceholder": "เช่น: ญี่ปุ่น ฝรั่งเศส ไทย…",
    "home.showExperts": "ดูผู้เชี่ยวชาญ",
    "home.mapTitle": "แผนที่โลก",
    "home.mapHint": "เลือกประเทศ",
    "home.countryNotSelected": "ประเทศ: ยังไม่เลือก",
    "home.countrySelected": "ประเทศ: {country}",
    "people.title": "ผู้เชี่ยวชาญ",
    "people.filtersTitle": "ตัวกรอง",
    "people.country": "ประเทศ",
    "people.search": "ค้นหา",
    "people.topic": "หัวข้อ",
    "people.language": "ภาษา",
    "people.rating": "เรตติ้ง",
    "people.apply": "ใช้",
    "people.reset": "รีเซ็ต",
    "profile.postsTitle": "โพสต์",
    "profile.reviewsTitle": "รีวิว",
    "profile.leaveReview": "เขียนรีวิว",
    "profile.loginToReview": "ต้องเข้าสู่ระบบเพื่อเขียนรีวิว",
    "create.title": "สร้างโปรไฟล์",
    "auth.title": "เข้าสู่ระบบ / สมัครสมาชิก",
    "me.title": "บัญชี",
  },
  ar: {
    "nav.experts": "خبراء",
    "nav.createExpert": "إنشاء ملف",
    "nav.becomeExpert": "كن خبيرًا",
    "nav.login": "تسجيل الدخول",
    "nav.account": "الحساب",
    "home.subtitle": "اعثر على أشخاص محليين — إجابات صادقة عن الأحياء والأمان والتكاليف وأفضل الأماكن.",
    "home.countrySearchLabel": "بحث عن دولة",
    "home.countrySearchPlaceholder": "مثال: اليابان، فرنسا، تايلاند…",
    "home.showExperts": "عرض الخبراء",
    "home.mapTitle": "خريطة العالم",
    "home.mapHint": "اختر دولة",
    "home.countryNotSelected": "الدولة: غير محددة",
    "home.countrySelected": "الدولة: {country}",
    "people.title": "خبراء",
    "people.filtersTitle": "فلاتر",
    "people.country": "الدولة",
    "people.search": "بحث",
    "people.topic": "الموضوع",
    "people.language": "اللغة",
    "people.rating": "التقييم",
    "people.apply": "تطبيق",
    "people.reset": "إعادة ضبط",
    "profile.postsTitle": "منشورات",
    "profile.reviewsTitle": "مراجعات",
    "profile.leaveReview": "إضافة مراجعة",
    "profile.loginToReview": "لإضافة مراجعة، سجّل الدخول.",
    "create.title": "إنشاء ملف",
    "auth.title": "تسجيل الدخول / إنشاء حساب",
    "me.title": "الحساب",
  },
  hi: {
    "nav.experts": "विशेषज्ञ",
    "nav.createExpert": "प्रोफ़ाइल बनाएँ",
    "nav.becomeExpert": "विशेषज्ञ बनें",
    "nav.login": "लॉगिन",
    "nav.account": "खाता",
    "home.subtitle": "स्थानीय लोगों को खोजें — इलाकों, सुरक्षा, खर्च और बेहतरीन जगहों पर ईमानदार जवाब पाएं।",
    "home.countrySearchLabel": "देश खोजें",
    "home.countrySearchPlaceholder": "उदाहरण: जापान, फ्रांस, थाईलैंड…",
    "home.showExperts": "विशेषज्ञ देखें",
    "home.mapTitle": "विश्व मानचित्र",
    "home.mapHint": "देश चुनें",
    "home.countryNotSelected": "देश: चयनित नहीं",
    "home.countrySelected": "देश: {country}",
    "people.title": "विशेषज्ञ",
    "people.filtersTitle": "फ़िल्टर",
    "people.country": "देश",
    "people.search": "खोज",
    "people.topic": "विषय",
    "people.language": "भाषा",
    "people.rating": "रेटिंग",
    "people.apply": "लागू करें",
    "people.reset": "रीसेट",
    "profile.postsTitle": "पोस्ट",
    "profile.reviewsTitle": "समीक्षाएँ",
    "profile.leaveReview": "समीक्षा लिखें",
    "profile.loginToReview": "समीक्षा के लिए लॉगिन करें।",
    "create.title": "प्रोफ़ाइल बनाएँ",
    "auth.title": "लॉगिन / रजिस्टर",
    "me.title": "खाता",
  },
  id: {
    "nav.experts": "Pakar",
    "nav.createExpert": "Buat profil",
    "nav.becomeExpert": "Jadi pakar",
    "nav.login": "Masuk",
    "nav.account": "Akun",
    "home.subtitle": "Temukan warga lokal — jawaban jujur tentang area, keamanan, biaya, dan tempat terbaik.",
    "home.countrySearchLabel": "Cari negara",
    "home.countrySearchPlaceholder": "Contoh: Jepang, Prancis, Thailand…",
    "home.showExperts": "Lihat pakar",
    "home.mapTitle": "Peta dunia",
    "home.mapHint": "Pilih negara",
    "home.countryNotSelected": "Negara: belum dipilih",
    "home.countrySelected": "Negara: {country}",
    "people.title": "Pakar",
    "people.filtersTitle": "Filter",
    "people.country": "Negara",
    "people.search": "Cari",
    "people.topic": "Topik",
    "people.language": "Bahasa",
    "people.rating": "Rating",
    "people.apply": "Terapkan",
    "people.reset": "Reset",
    "profile.postsTitle": "Posting",
    "profile.reviewsTitle": "Ulasan",
    "profile.leaveReview": "Tulis ulasan",
    "profile.loginToReview": "Untuk menulis ulasan, silakan masuk.",
    "create.title": "Buat profil",
    "auth.title": "Masuk / Daftar",
    "me.title": "Akun",
    "nav.feed": "Feed",
  },
};

function getLang() {
  const dom = getLangFromDom();
  if (dom) return dom;
  const raw = storageGet(STORAGE.lang) || langMemory;
  const lang = (raw || "ru").toLowerCase();
  return LANGS.some((l) => l.code === lang) ? lang : "ru";
}

function setLang(lang) {
  const safe = LANGS.some((l) => l.code === lang) ? lang : "ru";
  langMemory = safe;
  storageSet(STORAGE.lang, safe);
  document.documentElement.setAttribute("lang", safe);
  if (safe === "ar") document.documentElement.setAttribute("dir", "rtl");
  else document.documentElement.removeAttribute("dir");
  try {
    const select = $("#langSelect");
    if (select) select.value = safe;
  } catch {}
}

function tr(key, params = {}) {
  const lang = getLang();
  const table = I18N[lang] || I18N.en || {};
  const fallback = (I18N.en || {})[key] || (I18N.ru || {})[key] || key;
  let text = table[key] || fallback;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

function translateTopic(label) {
  const key = TOPIC_KEY_BY_RU[label];
  return key ? tr(key) : label;
}

function reviewsText(count) {
  const n = Number(count || 0);
  if (n <= 0) return tr("card.noReviews");
  return tr("card.reviews", { n });
}

function applyI18n() {
  document.documentElement.setAttribute("data-lang", getLang());
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = tr(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    el.setAttribute("placeholder", tr(key));
  });
}

function initLangSelect() {
  try {
    const select = $("#langSelect");
    if (!select) return;
    const current = getLang();
    // Keep server-rendered options as a reliable fallback (in case JS MIME/caching issues happen).
    if (select.options.length === 0) {
      select.innerHTML = LANGS.map((l) => `<option value="${escapeHtml(l.code)}">${escapeHtml(l.label)}</option>`).join("");
    }
    select.value = current;
    const handle = () => {
      try {
        setLang(String(select.value || "").toLowerCase());
      } catch {}
      try {
        applyI18n();
      } catch {}
      try {
        void updateNavAuth();
      } catch {}
      try {
        window.dispatchEvent(new Event("skarta:langchange"));
      } catch {}
      if (document.body?.getAttribute("data-page") === "home") {
        const input = $("#countrySearch");
        const pill = $("#selectedCountryPill");
        const v = (input?.value || "").trim();
        if (pill) pill.textContent = v ? tr("home.countrySelected", { country: v }) : tr("home.countryNotSelected");
      }
    };

    select.addEventListener("change", handle);
    select.addEventListener("input", handle);

    // Expose a hook for hard fallback (inline/onchange) and debugging.
    window.skartaSetLang = (lang) => {
      try {
        select.value = String(lang || "").toLowerCase();
      } catch {}
      handle();
    };

    setLang(current);
    applyI18n();
    setTimeout(() => {
      try {
        applyI18n();
      } catch {}
    }, 0);
  } catch (e) {
    console.error(e);
  }
}

window.addEventListener("pageshow", () => {
  try {
    setLang(getLang());
    applyI18n();
  } catch {}
});

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

function currentRelativePath() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  const search = window.location.search || "";
  return `./${file}${search}`;
}

function safeNextFromUrl(defaultNext = "./me.html") {
  const sp = new URLSearchParams(window.location.search);
  const raw = (sp.get("next") || "").trim();
  if (!raw) return defaultNext;
  if (raw.startsWith("./")) return raw;
  if (raw.startsWith("/karta/")) return raw;
  return defaultNext;
}

function registerUrl(nextPath) {
  const next = nextPath || "./me.html";
  return `./register.html?next=${encodeURIComponent(next)}`;
}

function setQueryParam(key, value) {
  const url = new URL(window.location.href);
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, "", url.toString());
}

function fillCountryDatalist(listId = "countries") {
  const dl = document.getElementById(listId);
  if (!dl) return;
  dl.innerHTML = COUNTRIES.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

async function apiJson(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error("API error");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function ensureAuthOrRedirect(nextPath) {
  const me = await getMeOrNull();
  if (!me?.ok) {
    window.location.href = registerUrl(nextPath || currentRelativePath());
    return null;
  }
  return me;
}

async function startChat(expertId) {
  const safeId = String(expertId || "").trim();
  if (!safeId) return;

  const me = await ensureAuthOrRedirect(`./chat.html?expertId=${encodeURIComponent(safeId)}`);
  if (!me?.ok) return;

  try {
    const data = await apiJson("/api/skarta/chats", {
      method: "POST",
      body: JSON.stringify({ expertId: safeId }),
    });
    if (data?.chatId) {
      window.location.href = `./chat.html?id=${encodeURIComponent(data.chatId)}`;
    }
  } catch {
    alert("error");
  }
}

async function getMeOrNull() {
  try {
    const data = await apiJson("/api/skarta/me", { method: "GET" });
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

async function updateNavAuth() {
  const link = $("#navAuth");
  const chats = $("#navChats");
  if (!link) {
    if (chats) chats.setAttribute("href", registerUrl("./chats.html"));
    return;
  }
  const me = await getMeOrNull();
  if (me?.ok) {
    link.textContent = me.me?.name ? me.me.name : tr("nav.account");
    link.setAttribute("href", "./me.html");
    link.removeAttribute("data-i18n");
    if (chats) chats.setAttribute("href", "./chats.html");
  } else {
    link.textContent = tr("nav.login");
    link.setAttribute("href", registerUrl(currentRelativePath()));
    link.setAttribute("data-i18n", "nav.login");
    if (chats) chats.setAttribute("href", registerUrl("./chats.html"));
  }
}

function goToPeople(country) {
  const normalized = (country || "").trim();
  if (normalized) localStorage.setItem(STORAGE.lastCountry, normalized);
  const url = new URL("./people.html", window.location.href);
  if (normalized) url.searchParams.set("country", normalized);
  window.location.href = url.toString();
}

function tagHtml(text) {
  return `<span class="tag">${escapeHtml(text)}</span>`;
}

function renderPersonCard(expert) {
  const ratingText = expert.reviewsCount > 0 ? Number(expert.rating || 0).toFixed(1) : "—";
  const reviewText = reviewsText(expert.reviewsCount);

  return `
    <article class="card person">
      <div class="avatar">
        <img src="${escapeHtml(expert.avatar || "./assets/avatar-default.svg")}" alt="" loading="lazy" />
      </div>
      <div>
        <h3 class="person__name">${escapeHtml(expert.name)}</h3>
        <div class="person__meta">${escapeHtml(expert.country)} • ${escapeHtml(expert.city)}</div>

        <div class="kpi">
          <span class="pill">⭐ ${escapeHtml(ratingText)} • ${escapeHtml(reviewText)}</span>
          <span class="pill">$${escapeHtml(expert.price)} ${escapeHtml(tr("card.perQuestion"))}</span>
        </div>

        <div class="tags">
          ${(expert.topics || []).slice(0, 4).map((t) => tagHtml(translateTopic(t))).join("")}
          ${(expert.languages || []).slice(0, 2).map(tagHtml).join("")}
        </div>

        <div class="person__actions">
          <a class="btn btn--primary" href="./profile.html?id=${encodeURIComponent(expert.id)}">${escapeHtml(
            tr("card.open")
          )}</a>
          <button class="btn" type="button" data-action="ask" data-id="${escapeHtml(expert.id)}">${escapeHtml(
            tr("card.ask")
          )}</button>
        </div>
      </div>
    </article>
  `;
}

function initHome() {
  fillCountryDatalist("countries");
  const input = $("#countrySearch");
  const pill = $("#selectedCountryPill");

  const last = localStorage.getItem(STORAGE.lastCountry) || "";
  if (last && input && pill) {
    input.value = last;
    pill.textContent = tr("home.countrySelected", { country: last });
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
    if (pill) pill.textContent = tr("home.countrySelected", { country });
  });
}

function matchesClientFilters(expert, filters) {
  if (filters.category && !(expert.topics || []).includes(filters.category)) return false;
  if (filters.language && !(expert.languages || []).includes(filters.language)) return false;
  if (filters.maxPrice && Number(expert.price || 0) > filters.maxPrice) return false;
  if (filters.minRating && Number(expert.rating || 0) < filters.minRating) return false;
  return true;
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
  if (hint && q.country) hint.textContent = tr("people.countryFilter", { country: q.country });

  function getFilters() {
    return {
      country: (fCountry?.value || "").trim(),
      query: (fQuery?.value || "").trim(),
      category: (fCategory?.value || "").trim(),
      language: (fLanguage?.value || "").trim(),
      minRating: Number(fMinRating?.value || 0),
      maxPrice: Number(fMaxPrice?.value || 0),
    };
  }

  async function render() {
    const filters = getFilters();
    setQueryParam("country", filters.country);
    if (filters.country) localStorage.setItem(STORAGE.lastCountry, filters.country);

    const url = new URL("/api/skarta/experts", window.location.origin);
    if (filters.country) url.searchParams.set("country", filters.country);
    if (filters.query) url.searchParams.set("q", filters.query);

    let experts = [];
    try {
      const data = await apiJson(url.toString(), { method: "GET" });
      experts = Array.isArray(data.experts) ? data.experts : [];
    } catch {
      experts = [];
    }

    experts = experts.filter((e) => matchesClientFilters(e, filters));
    experts.sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)) || 0);

    if (pill) {
      const labelText = filters.country ? tr("home.countrySelected", { country: filters.country }) : tr("people.allCountries");
      pill.textContent = tr("people.found", { label: labelText, n: experts.length });
    }

    const root = $("#peopleList");
    if (!root) return;
    if (experts.length === 0) {
      root.innerHTML = `<div class="card card--padded"><div class="h2">${escapeHtml(
        tr("people.nothingTitle")
      )}</div><div class="muted">${escapeHtml(tr("people.nothingText"))}</div></div>`;
      return;
    }
    root.innerHTML = experts.map(renderPersonCard).join("");
  }

  $("#filters")?.addEventListener("submit", (e) => {
    e.preventDefault();
    void render();
  });

  $("#resetFilters")?.addEventListener("click", () => {
    if (fCountry) fCountry.value = q.country || "";
    if (fQuery) fQuery.value = "";
    if (fCategory) fCategory.value = "";
    if (fLanguage) fLanguage.value = "";
    if (fMinRating) fMinRating.value = "0";
    if (fMaxPrice) fMaxPrice.value = "";
    void render();
  });

  $("#peopleList")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-action='ask']");
    if (!btn) return;
    const expertId = btn.getAttribute("data-id") || "";
    void startChat(expertId);
  });

  void render();

  window.addEventListener("skarta:langchange", () => {
    if (hint && q.country) hint.textContent = tr("people.countryFilter", { country: q.country });
    void render();
  });
}

function profileHeroHtml(expert, isOwner) {
  const ratingText = expert.reviewsCount > 0 ? Number(expert.rating || 0).toFixed(1) : "—";
  const reviewText = reviewsText(expert.reviewsCount);

  return `
    <div class="profileHero__left">
      <div class="profileHero__avatar">
        <img src="${escapeHtml(expert.avatar || "./assets/avatar-default.svg")}" alt="" />
      </div>
      <div>
        <h1 class="profileHero__name">${escapeHtml(expert.name)}</h1>
        <div class="person__meta">${escapeHtml(expert.country)} • ${escapeHtml(expert.city)}</div>
        <div class="kpi">
          <span class="pill">⭐ ${escapeHtml(ratingText)} • ${escapeHtml(reviewText)}</span>
          <span class="pill">$${escapeHtml(expert.price)} ${escapeHtml(tr("card.perQuestion"))}</span>
        </div>
        <div class="tags" style="margin-top: 12px">
          ${(expert.topics || []).slice(0, 6).map((t) => tagHtml(translateTopic(t))).join("")}
          ${(expert.languages || []).slice(0, 4).map(tagHtml).join("")}
        </div>
        <p class="profileHero__about">${escapeHtml(expert.about || "")}</p>
      </div>
    </div>
    <div class="profileHero__right">
      <div class="profileHero__cta">
        <a class="btn" href="./people.html?country=${encodeURIComponent(expert.country)}">${escapeHtml(tr("profile.toList"))}</a>
        <button class="btn btn--primary" type="button" id="buyQuestion">${escapeHtml(tr("profile.buyQuestion"))}</button>
      </div>
      <div class="pill">${escapeHtml(isOwner ? tr("profile.ownerPill") : tr("profile.metaPill"))}</div>
    </div>
  `;
}

function renderPosts(posts, isOwner) {
  if (!posts || posts.length === 0)
    return `<div class="muted" style="margin-top:10px">${escapeHtml(tr("profile.noPosts"))}</div>`;
  return posts
    .map(
      (p) => `
    <article class="post" data-id="${escapeHtml(p.id)}">
      <h3 class="post__title">${escapeHtml(p.title)}</h3>
      <div class="post__date">${escapeHtml(formatDate(p.createdAt))}</div>
      <div class="post__body">${escapeHtml(p.body)}</div>
      ${renderMediaGrid(p.attachments)}
      ${
        isOwner
          ? `<div class="post__tools"><button class="btn" type="button" data-action="deletePost">${escapeHtml(
              tr("post.delete")
            )}</button></div>`
          : ""
      }
    </article>
  `
    )
    .join("");
}

function renderReviews(reviews) {
  if (!reviews || reviews.length === 0) return `<div class="muted">Пока нет отзывов.</div>`;
  return reviews
    .map(
      (r) => `
    <article class="review">
      <div class="review__top">
        <div class="review__rating">⭐ ${escapeHtml(String(r.rating))}</div>
        <div class="review__date">${escapeHtml(formatDate(r.updatedAt || r.createdAt))}</div>
      </div>
      <div class="muted">${escapeHtml(r.authorName || "Пользователь")}</div>
      <div class="review__text">${escapeHtml(r.text)}</div>
    </article>
  `
    )
    .join("");
}

function initProfile() {
  const q = parseQuery();
  const id = q.id || "";
  const hero = $("#profileHero");
  const postsRoot = $("#posts");
  const reviewsRoot = $("#reviews");

  async function load() {
    if (!hero) return;

    let expert = null;
    try {
      const data = await apiJson(`/api/skarta/experts/${encodeURIComponent(id)}`, { method: "GET" });
      expert = data.expert || null;
    } catch {
      expert = null;
    }

    if (!expert) {
      hero.innerHTML = `<div class="h2">Профиль не найден</div><div class="muted">Проверь ссылку или создай новый профиль.</div><div style="margin-top:12px"><a class="btn btn--primary" href="./create.html">Создать профиль</a></div>`;
      return;
    }

    const me = await getMeOrNull();
    const isOwner = Boolean(me?.ok && me.me?.id && expert.ownerUserId === me.me.id);

    hero.innerHTML = profileHeroHtml(expert, isOwner);
    $("#buyQuestion")?.addEventListener("click", () => {
      void startChat(expert.id);
    });

    // posts + reviews
    let posts = [];
    let reviews = [];
    try {
      const p = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/posts`, { method: "GET" });
      posts = Array.isArray(p.posts) ? p.posts : [];
    } catch {
      posts = [];
    }
    try {
      const r = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/reviews`, { method: "GET" });
      reviews = Array.isArray(r.reviews) ? r.reviews : [];
    } catch {
      reviews = [];
    }

    if (postsRoot) postsRoot.innerHTML = renderPosts(posts, isOwner);
    if (reviewsRoot) reviewsRoot.innerHTML = renderReviews(reviews);

    // post form gate
    const postForm = $("#postForm");
    if (postForm) {
      postForm.style.display = isOwner ? "" : "none";
    }

    // review form gate
    const reviewForm = $("#reviewForm");
    if (reviewForm) {
      reviewForm.style.display = me?.ok ? "" : "none";
      if (!me?.ok) {
        $("#reviewForm")?.insertAdjacentHTML(
          "beforebegin",
          `<div class="pill" style="margin-top:12px">${escapeHtml(
            tr("profile.loginToReview")
          )} <a href="./register.html">${escapeHtml(tr("nav.login"))}</a>.</div>`
        );
      }
    }

    const postMedia = $("#pMedia");
    const postMediaList = $("#pMediaList");
    postMedia?.addEventListener("change", () => {
      const files = Array.from(postMedia?.files || []);
      if (!postMediaList) return;
      if (files.length === 0) {
        postMediaList.innerHTML = "";
        return;
      }
      postMediaList.innerHTML = files
        .slice(0, 6)
        .map(
          (f, idx) => `
            <div class="mediaPickRow">
              <div class="mediaPickRow__name">${escapeHtml(String(f.name || "file"))}</div>
              <input class="input" data-idx="${escapeHtml(String(idx))}" placeholder="${escapeHtml(tr("profile.mediaCaption"))}" />
            </div>
          `
        )
        .join("");
    });

    $("#postForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = $("#pTitle")?.value?.trim();
      const body = $("#pBody")?.value?.trim();
      const files = Array.from(postMedia?.files || []);
      if (!title || !body) return;
      if (files.length > 6) {
        alert(tr("alert.mediaTooMany"));
        return;
      }

      const captions = new Map();
      postMediaList?.querySelectorAll("input[data-idx]")?.forEach((input) => {
        const idx = Number(input.getAttribute("data-idx") || -1);
        if (!Number.isFinite(idx) || idx < 0) return;
        captions.set(idx, String(input.value || "").trim());
      });

      const attachments = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          let uploadFile = f;
          let filename = f.name || "file";
          if (String(f.type || "").startsWith("image/")) {
            const blob = await resizeImageToJpegBlob(f, 1600, 0.86);
            if (blob) {
              uploadFile = blob;
              filename = "image.jpg";
            }
          }
          const media = await uploadMedia(uploadFile, { scope: "public", filename });
          attachments.push({ url: media.url, caption: captions.get(i) || "" });
        } catch {
          alert(tr("alert.uploadFail"));
          return;
        }
      }

      try {
        await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/posts`, {
          method: "POST",
          body: JSON.stringify({ title, body, attachments }),
        });
        $("#pTitle").value = "";
        $("#pBody").value = "";
        if (postMedia) postMedia.value = "";
        if (postMediaList) postMediaList.innerHTML = "";
        const p = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/posts`, { method: "GET" });
        posts = Array.isArray(p.posts) ? p.posts : [];
        if (postsRoot) postsRoot.innerHTML = renderPosts(posts, isOwner);
      } catch (err) {
        alert(tr("alert.postFail"));
      }
    });

    $("#posts")?.addEventListener("click", async (e) => {
      const btn = e.target.closest?.("button[data-action='deletePost']");
      if (!btn) return;
      const post = e.target.closest?.("article.post");
      const postId = post?.getAttribute?.("data-id");
      if (!postId) return;
      if (!confirm("Удалить пост?")) return;
      try {
        await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/posts/${encodeURIComponent(postId)}`, {
          method: "DELETE",
        });
        const p = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/posts`, { method: "GET" });
        posts = Array.isArray(p.posts) ? p.posts : [];
        if (postsRoot) postsRoot.innerHTML = renderPosts(posts, isOwner);
      } catch {
        alert(tr("alert.postDeleteFail"));
      }
    });

    $("#reviewForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rating = Number($("#rRating")?.value || 0);
      const text = $("#rText")?.value?.trim();
      if (!rating || !text) return;
      try {
        await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/reviews`, {
          method: "POST",
          body: JSON.stringify({ rating, text }),
        });
        $("#rText").value = "";
        const r = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}/reviews`, { method: "GET" });
        reviews = Array.isArray(r.reviews) ? r.reviews : [];
        if (reviewsRoot) reviewsRoot.innerHTML = renderReviews(reviews);
        // refresh hero rating
        const fresh = await apiJson(`/api/skarta/experts/${encodeURIComponent(expert.id)}`, { method: "GET" });
        expert = fresh.expert || expert;
        hero.innerHTML = profileHeroHtml(expert, isOwner);
      } catch (err) {
        if (err?.status === 401) {
          window.location.href = "./register.html";
          return;
        }
        alert(tr("alert.reviewFail"));
      }
    });
  }

  void load();
  window.addEventListener("skarta:langchange", () => void load());
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function resizeImageToJpegBlob(file, maxDim = 1600, quality = 0.86) {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = new Image();
    const loaded = new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error("Image load failed"));
    });
    img.src = dataUrl;
    await loaded;

    const w = Number(img.naturalWidth || img.width || 0);
    const h = Number(img.naturalHeight || img.height || 0);
    if (!w || !h) return null;

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, cw, ch);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return null;
    return blob;
  } catch {
    return null;
  }
}

async function uploadMedia(fileOrBlob, opts = {}) {
  const scope = String(opts.scope || "public");
  const chatId = String(opts.chatId || "");

  const url = new URL("/api/skarta/media", window.location.origin);
  if (scope === "chat") {
    url.searchParams.set("scope", "chat");
    url.searchParams.set("chatId", chatId);
  }

  const fd = new FormData();
  const filename = String(opts.filename || (fileOrBlob?.name || "file"));
  fd.append("file", fileOrBlob, filename);

  const res = await fetch(url.toString(), { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) {
    let err = null;
    try {
      err = await res.json();
    } catch {}
    const e = new Error(err?.error || "upload_failed");
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  if (!data?.ok || !data?.media?.url) {
    const e = new Error("upload_failed");
    e.status = 400;
    throw e;
  }
  return data.media;
}

function renderMediaGrid(attachments, wrapperClass = "post__media") {
  const list = Array.isArray(attachments) ? attachments : [];
  if (list.length === 0) return "";
  const items = list
    .slice(0, 6)
    .map((a) => {
      const kind = String(a?.kind || "");
      const url = String(a?.url || "");
      const caption = String(a?.caption || "");
      const media =
        kind === "video"
          ? `<video src="${escapeHtml(url)}" controls preload="metadata"></video>`
          : `<img src="${escapeHtml(url)}" alt="" loading="lazy" />`;
      return `<div class="mediaItem">${media}${caption ? `<div class="mediaCaption">${escapeHtml(caption)}</div>` : ""}</div>`;
    })
    .join("");
  return `<div class="${escapeHtml(wrapperClass)}"><div class="mediaGrid">${items}</div></div>`;
}

function initCreate() {
  fillCountryDatalist("countries");
  const msg = $("#createMsg");

  async function gate() {
    const me = await getMeOrNull();
    if (!me?.ok) {
      window.location.href = registerUrl("./create.html");
      return null;
    }
    if (msg) msg.textContent = tr("create.fillHint");
    return me;
  }

  async function prefillIfExists() {
    const me = await gate();
    if (!me?.ok) return;
    try {
      const data = await apiJson("/api/skarta/experts-mine", { method: "GET" });
      const expert = data?.expert || null;
      if (!expert) return;
      $("#cName").value = expert.name || "";
      $("#cCountry").value = expert.country || "";
      $("#cCity").value = expert.city || "";
      $("#cLanguages").value = (expert.languages || []).join(", ");
      $("#cTopics").value = (expert.topics || []).join(", ");
      $("#cPrice").value = String(expert.price || "");
      $("#cAbout").value = expert.about || "";
    } catch {}
  }

  void prefillIfExists();

  $("#createProfileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("#cName")?.value?.trim();
    const country = $("#cCountry")?.value?.trim();
    const city = $("#cCity")?.value?.trim();
    const languages = $("#cLanguages")?.value || "";
    const topics = $("#cTopics")?.value || "";
    const price = Number($("#cPrice")?.value || 0);
    const about = $("#cAbout")?.value?.trim();
    const file = $("#cPhoto")?.files?.[0] || null;

    if (!name || !country || !city || !about || !price) return;

    let avatar = "";
    if (file) {
      try {
        let uploadFile = file;
        let filename = file.name || "avatar";
        if (String(file.type || "").startsWith("image/")) {
          const blob = await resizeImageToJpegBlob(file, 512, 0.86);
          if (blob) {
            uploadFile = blob;
            filename = "avatar.jpg";
          }
        }
        const media = await uploadMedia(uploadFile, { scope: "public", filename });
        avatar = String(media.url || "");
      } catch {
        alert(tr("alert.uploadFail"));
        return;
      }
    }

    try {
      const data = await apiJson("/api/skarta/experts", {
        method: "POST",
        body: JSON.stringify({ name, country, city, languages, topics, price, about, avatar }),
      });
      localStorage.setItem(STORAGE.lastCountry, country);
      window.location.href = `./profile.html?id=${encodeURIComponent(data.expert.id)}`;
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = "./register.html";
        return;
      }
      alert(tr("alert.expertSaveFail"));
    }
  });

  $("#clearLocal")?.addEventListener("click", () => {
    alert(tr("alert.clearNotNeeded"));
  });
}

function initAuth() {
  const regMsg = $("#registerMsg");
  const loginMsg = $("#loginMsg");
  const next = safeNextFromUrl("./me.html");

  $("#registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (regMsg) regMsg.textContent = "Создаю аккаунт…";
    const name = $("#rName")?.value?.trim();
    const email = $("#rEmail")?.value?.trim();
    const password = $("#rPass")?.value || "";
    try {
      await apiJson("/api/skarta/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      window.location.href = next;
    } catch (err) {
      const code = err?.data?.error || "error";
      if (regMsg) regMsg.textContent = `Ошибка: ${code}`;
    }
  });

  $("#loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginMsg) loginMsg.textContent = "Вхожу…";
    const email = $("#lEmail")?.value?.trim();
    const password = $("#lPass")?.value || "";
    try {
      await apiJson("/api/skarta/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.href = next;
    } catch (err) {
      const code = err?.data?.error || "error";
      if (loginMsg) loginMsg.textContent = `Ошибка: ${code}`;
    }
  });
}

function initMe() {
  const mePill = $("#mePill");
  const expertPill = $("#expertPill");
  const meMsg = $("#meMsg");
  const passMsg = $("#passMsg");

  async function load() {
    const me = await getMeOrNull();
    if (!me?.ok) {
      window.location.href = "./register.html";
      return;
    }
    if (mePill) mePill.textContent = `${me.me.name} • ${me.me.email}`;
    if ($("#meName")) $("#meName").value = me.me.name || "";
    if (expertPill) {
      expertPill.innerHTML = me.expertId
        ? `Экспертный профиль: <a href="./profile.html?id=${encodeURIComponent(me.expertId)}">${escapeHtml(
            me.expertId
          )}</a>`
        : "Экспертного профиля пока нет.";
    }
  }

  $("#logoutBtn")?.addEventListener("click", async () => {
    try {
      await apiJson("/api/skarta/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {}
    window.location.href = "./index.html";
  });

  $("#meForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (meMsg) meMsg.textContent = "…";
    const name = $("#meName")?.value?.trim();
    if (!name) return;
    try {
      const data = await apiJson("/api/skarta/me", { method: "POST", body: JSON.stringify({ name }) });
      if (meMsg) meMsg.textContent = tr("me.saved");
      if (data?.me?.name) {
        $("#navAuth") && ($("#navAuth").textContent = data.me.name);
        if (mePill) mePill.textContent = `${data.me.name} • ${data.me.email}`;
      }
    } catch {
      if (meMsg) meMsg.textContent = "error";
    }
  });

  $("#passForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (passMsg) passMsg.textContent = "…";
    const oldPassword = $("#oldPass")?.value || "";
    const newPassword = $("#newPass")?.value || "";
    try {
      await apiJson("/api/skarta/me/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      $("#oldPass").value = "";
      $("#newPass").value = "";
      if (passMsg) passMsg.textContent = tr("me.passChanged");
    } catch (err) {
      if (passMsg) passMsg.textContent = err?.status === 401 ? tr("me.passInvalid") : "error";
    }
  });

  void load();
  window.addEventListener("skarta:langchange", () => void load());
}

function renderFeedItem(item) {
  const expert = item.expert || {};
  return `
    <article class="card feedItem">
      <div class="avatar">
        <img src="${escapeHtml(expert.avatar || "./assets/avatar-default.svg")}" alt="" loading="lazy" />
      </div>
      <div class="feedItem__main">
        <h3 class="feedItem__title">${escapeHtml(item.title || "")}</h3>
        <div class="feedItem__meta">${escapeHtml(expert.country || "")} • ${escapeHtml(expert.city || "")} • ${escapeHtml(
    expert.name || ""
  )} • ${escapeHtml(formatDate(item.createdAt || 0))}</div>
        <div class="feedItem__body">${escapeHtml(item.body || "")}</div>
        ${renderMediaGrid(item.attachments)}
        <div class="feedItem__actions">
          <a class="btn btn--primary" href="./profile.html?id=${encodeURIComponent(expert.id || "")}">${escapeHtml(
    tr("feed.openExpert")
  )}</a>
        </div>
      </div>
    </article>
  `;
}

function initFeed() {
  fillCountryDatalist("countries");
  const q = parseQuery();
  const fCountry = $("#feedCountry");
  const fQuery = $("#feedQuery");
  const pill = $("#feedPill");
  const hint = $("#feedHint");

  if (fCountry && q.country) fCountry.value = q.country;
  if (fQuery && q.q) fQuery.value = q.q;

  async function render() {
    const country = (fCountry?.value || "").trim();
    const query = (fQuery?.value || "").trim();
    setQueryParam("country", country);
    setQueryParam("q", query);

    const url = new URL("/api/skarta/feed", window.location.origin);
    if (country) url.searchParams.set("country", country);
    if (query) url.searchParams.set("q", query);

    let items = [];
    try {
      const data = await apiJson(url.toString(), { method: "GET" });
      items = Array.isArray(data.items) ? data.items : [];
    } catch {
      items = [];
    }

    if (pill) {
      pill.textContent = country
        ? tr("feed.pillCountry", { country, n: items.length })
        : tr("feed.pillAll", { n: items.length });
    }
    if (hint) hint.textContent = country ? tr("people.countryFilter", { country }) : "";

    const root = $("#feedList");
    if (!root) return;
    if (items.length === 0) {
      root.innerHTML = `<div class="card card--padded"><div class="h2">${escapeHtml(
        tr("feed.noneTitle")
      )}</div><div class="muted">${escapeHtml(tr("feed.noneText"))}</div></div>`;
      return;
    }
    root.innerHTML = items.map(renderFeedItem).join("");
  }

  $("#feedFilters")?.addEventListener("submit", (e) => {
    e.preventDefault();
    void render();
  });
  $("#feedReset")?.addEventListener("click", () => {
    if (fCountry) fCountry.value = "";
    if (fQuery) fQuery.value = "";
    void render();
  });

  void render();
  window.addEventListener("skarta:langchange", () => void render());
}

function chatRowHtml(chat) {
  const expert = chat.expert || {};
  const title = `${expert.name || "—"} • ${expert.country || ""} • ${expert.city || ""}`;
  const last = chat.lastMessage?.text ? String(chat.lastMessage.text).slice(0, 140) : "";
  const meta = chat.lastMessage?.createdAt ? formatDate(chat.lastMessage.createdAt) : "";
  return `
    <div class="chatRow">
      <div class="chatRow__left">
        <h3 class="chatRow__title">${escapeHtml(title)}</h3>
        <div class="chatRow__meta">${escapeHtml(last)} ${last && meta ? "•" : ""} ${escapeHtml(meta)}</div>
      </div>
      <div class="chatRow__right">
        <a class="btn btn--primary" href="./chat.html?id=${encodeURIComponent(chat.id)}">${escapeHtml(tr("chats.open"))}</a>
      </div>
    </div>
  `;
}

function initChats() {
  async function load() {
    const me = await ensureAuthOrRedirect("./chats.html");
    if (!me?.ok) return;

    const pill = $("#chatsPill");
    const root = $("#chatsList");
    if (pill) pill.textContent = tr("chats.loading");

    let chats = [];
    try {
      const data = await apiJson("/api/skarta/chats", { method: "GET" });
      chats = Array.isArray(data.chats) ? data.chats : [];
    } catch {
      chats = [];
    }

    if (!root) return;
    if (pill) pill.textContent = `${tr("chats.title")} • ${chats.length}`;

    if (chats.length === 0) {
      root.innerHTML = `<div class="card card--padded"><div class="h2">${escapeHtml(
        tr("chats.noneTitle")
      )}</div><div class="muted">${escapeHtml(tr("chats.noneText"))}</div></div>`;
      return;
    }
    root.innerHTML = chats.map(chatRowHtml).join("");
  }

  void load();
  window.addEventListener("skarta:langchange", () => void load());
}

function msgHtml(msg, meta, isMe) {
  const text = String(msg?.text || "");
  const media = renderMediaGrid(msg?.attachments, "msg__media");
  const textHtml = text ? `<div>${escapeHtml(text)}</div>` : "";
  return `
    <div class="msg ${isMe ? "msg--me" : ""}">
      ${textHtml}
      ${media}
      <div class="msg__meta">${escapeHtml(meta)}</div>
    </div>
  `;
}

function initChat() {
  async function load(chatId) {
    const me = await ensureAuthOrRedirect(currentRelativePath());
    if (!me?.ok) return null;

    const pill = $("#chatPill");
    if (pill) pill.textContent = tr("chat.loading");

    try {
      const data = await apiJson(`/api/skarta/chats/${encodeURIComponent(chatId)}`, { method: "GET" });
      const chat = data.chat;
      const messages = Array.isArray(data.messages) ? data.messages : [];

      const expert = chat?.expert || {};
      const subtitle = $("#chatSubtitle");
      if (subtitle && expert?.name) {
        subtitle.textContent = `${tr("chat.subtitle")} ${expert.name} • ${expert.country || ""} • ${expert.city || ""}`;
      }

      const mineFrom = me.me?.id && expert?.ownerUserId === me.me.id ? "expert" : "user";
      const chronological = messages.slice().reverse();
      const root = $("#chatBox");
      if (root) {
        root.innerHTML = chronological.map((m) => msgHtml(m, formatDate(m.createdAt || 0), m.from === mineFrom)).join("");
        root.scrollTop = root.scrollHeight;
      }

      if (pill) pill.textContent = `${expert.name || tr("chat.title")}`;
      return { chat, me };
    } catch {
      if (pill) pill.textContent = "error";
      return null;
    }
  }

  async function boot() {
    const q = parseQuery();
    const id = q.id || "";
    const expertId = q.expertId || "";

    if (!id && expertId) {
      const me = await ensureAuthOrRedirect(`./chat.html?expertId=${encodeURIComponent(expertId)}`);
      if (!me?.ok) return;
      try {
        const data = await apiJson("/api/skarta/chats", { method: "POST", body: JSON.stringify({ expertId }) });
        if (data?.chatId) {
          window.location.replace(`./chat.html?id=${encodeURIComponent(data.chatId)}`);
          return;
        }
      } catch {
        $("#chatPill") && ($("#chatPill").textContent = "error");
        return;
      }
    }

    if (!id) {
      window.location.href = "./chats.html";
      return;
    }

    let state = await load(id);
    const chatMedia = $("#chatMedia");
    const chatMediaList = $("#chatMediaList");
    chatMedia?.addEventListener("change", () => {
      const files = Array.from(chatMedia?.files || []);
      if (!chatMediaList) return;
      if (files.length === 0) {
        chatMediaList.innerHTML = "";
        return;
      }
      chatMediaList.innerHTML = files
        .slice(0, 6)
        .map(
          (f, idx) => `
            <div class="mediaPickRow">
              <div class="mediaPickRow__name">${escapeHtml(String(f.name || "file"))}</div>
              <input class="input" data-idx="${escapeHtml(String(idx))}" placeholder="${escapeHtml(tr("profile.mediaCaption"))}" />
            </div>
          `
        )
        .join("");
    });
    $("#chatForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = $("#chatInput");
      const text = input?.value?.trim() || "";
      const files = Array.from(chatMedia?.files || []);
      if (!text && files.length === 0) return;
      if (files.length > 6) {
        alert(tr("alert.mediaTooMany"));
        return;
      }
      try {
        const captions = new Map();
        chatMediaList?.querySelectorAll("input[data-idx]")?.forEach((el) => {
          const idx = Number(el.getAttribute("data-idx") || -1);
          if (!Number.isFinite(idx) || idx < 0) return;
          captions.set(idx, String(el.value || "").trim());
        });

        const attachments = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          let uploadFile = f;
          let filename = f.name || "file";
          if (String(f.type || "").startsWith("image/")) {
            const blob = await resizeImageToJpegBlob(f, 1600, 0.86);
            if (blob) {
              uploadFile = blob;
              filename = "image.jpg";
            }
          }
          const media = await uploadMedia(uploadFile, { scope: "chat", chatId: id, filename });
          attachments.push({ url: media.url, caption: captions.get(i) || "" });
        }

        await apiJson(`/api/skarta/chats/${encodeURIComponent(id)}/messages`, {
          method: "POST",
          body: JSON.stringify({ text, attachments }),
        });
        if (input) input.value = "";
        if (chatMedia) chatMedia.value = "";
        if (chatMediaList) chatMediaList.innerHTML = "";
        state = await load(id);
      } catch (err) {
        if (err?.status === 401) {
          window.location.href = registerUrl(currentRelativePath());
          return;
        }
        alert(tr("alert.messageFail"));
      }
    });

    window.addEventListener("skarta:langchange", () => void load(id));
  }

  void boot();
}

async function init() {
  initLangSelect();
  void updateNavAuth();
  const page = document.body?.getAttribute("data-page");
  if (page === "home") initHome();
  if (page === "people") initPeople();
  if (page === "profile") initProfile();
  if (page === "create") initCreate();
  if (page === "auth") initAuth();
  if (page === "me") initMe();
  if (page === "feed") initFeed();
  if (page === "chats") initChats();
  if (page === "chat") initChat();
}

void init();

