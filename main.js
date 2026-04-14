(() => {
  const askButton = document.getElementById("ask-question-button");
  const toggleQaButton = document.getElementById("toggle-qa-button");
  const navbar = document.querySelector(".navbar");
  const navbarToggle = document.getElementById("navbar-toggle");
  const navbarMenu = document.getElementById("navbar-menu");
  const modal = document.getElementById("question-modal");
  const form = document.getElementById("question-form");
  const formMessage = document.getElementById("question-form-message");
  const qaFeed = document.getElementById("qa-feed");
  const qaGrid = document.getElementById("qa-grid");
  const qaDetail = document.getElementById("qa-detail");
  const qaDetailQuestion = document.getElementById("qa-detail-question");
  const qaDetailAnswer = document.getElementById("qa-detail-answer");
  const faqList = document.getElementById("faq-list");
  const policyModal = document.getElementById("policy-modal");
  const policyModalTitle = document.getElementById("policy-modal-title");
  const policyModalBody = document.getElementById("policy-modal-body");
  const policyCloseButtons = document.querySelectorAll(".policy-close-btn");
  const legalLinks = document.querySelectorAll("[data-legal-panel]");
  const cookieBanner = document.getElementById("cookie-banner");
  const cookiePreferences = document.getElementById("cookie-preferences");
  const cookieManageButton = document.getElementById("cookie-manage");
  const cookieAcceptAllButton = document.getElementById("cookie-accept-all");
  const cookieRejectAllButton = document.getElementById("cookie-reject-all");
  const cookieSaveRejectedButton = document.getElementById("cookie-save-rejected");
  const cookieSavePreferencesButton = document.getElementById("cookie-save-preferences");
  const openCookiePolicyButton = document.getElementById("open-cookie-policy");
  const cookieFunctionalInput = document.getElementById("cookie-functional");
  const cookieAnalyticsInput = document.getElementById("cookie-analytics");
  const requestMessageField = document.getElementById("request-message");
  const requestSubmitButton = document.getElementById("request-submit");
  const requestResetButton = document.getElementById("request-reset");
  const requestFormMessage = document.getElementById("request-form-message");
  const COOKIE_PREFS_KEY = "zenix_cookie_preferences_v2";
  const WHATSAPP_PHONE = "905332776206";
  let policyScrollY = 0;
  const FALLBACK_QA_ITEMS = [
    {
      question: "Neden Zenix'e güvenmeliyim?",
      answer:
        "Zenix, resmi kayıtlara sahip kurumsal bir yapı içinde çalışır; süreçler şeffaf ilerler, ödeme sonrası fatura düzenlenir ve destek iletişimi açık tutulur."
    },
    {
      question: "Fiyatlandırmanız nasıl çalışıyor?",
      answer:
        "Teklif, ürün bedeli ve hizmet bedeliyle birlikte net şekilde paylaşılır. Amaç yalnızca ürün sunmak değil, doğrulanmış tedarik ve süreç yönetimi sağlamaktır."
    },
    {
      question: "Ödeme yaptıktan sonra fatura alıyor muyum?",
      answer:
        "Evet. Ödeme tamamlandıktan sonra işleme ait fatura düzenlenir ve sizinle paylaşılır."
    },
    {
      question: "Zenix tam olarak ne yapar?",
      answer:
        "İhtiyacınız olan parçayı güvenilir tedarik ağında araştırır, uygunluk ve fiyat karşılaştırması yapar, ardından en doğru seçeneği size sunar."
    },
    {
      question: "Kargodan önce parça bana gösteriliyor mu?",
      answer:
        "Evet. Uygun olduğunda ürün görseli paylaşılır ve ardından kargo süreci başlatılır."
    },
    {
      question: "Sipariş sonrasında sizinle iletişim devam ediyor mu?",
      answer:
        "Evet. Teslimat sonrasında da memnuniyet ve uyumluluk kontrolü için destek sürer."
    },
    {
      question: "Zenix gerçekten resmi bir şirket mi?",
      answer:
        "Evet. Zenix, Türkiye Cumhuriyeti mevzuatına uygun şekilde faaliyet gösteren resmi bir şirkettir; kurumsal ve iletişim bilgileri açık biçimde paylaşılır."
    },
    {
      question: "Zenix parça satıcısı mı, yoksa farklı bir hizmet mi sunuyor?",
      answer:
        "Zenix yalnızca ürün gösteren sıradan bir satıcı değildir; araştırma, doğrulama, karşılaştırma, tedarik koordinasyonu ve müşteri takibini yöneten bir hizmet modeli sunar."
    },
    {
      question: "Parçaları nereden buluyorsunuz?",
      answer:
        "Parçalar, güvenilirliği kontrol edilmiş ve onaylanmış tedarikçi ağı üzerinden temin edilir; kaynağı belirsiz ürün yönlendirmesi yapılmaz."
    },
    {
      question: "Neden %15 hizmet bedeli alıyorsunuz?",
      answer:
        "Bu bedel; araştırma, doğrulama, uygunluk kontrolü, tedarik koordinasyonu ve sipariş sonrası desteği kapsayan profesyonel hizmet sürecinin karşılığıdır."
    },
    {
      question: "Neden doğrudan web sitesinden, parçacıdan veya ustadan almak yerine Zenix'i tercih etmeliyim?",
      answer:
        "Çünkü Zenix'te süreç kontrol altında yürür; onaylanmış tedarikçilerden fiyat alınır, ürün uygunluğu doğrulanır ve her aşamada bilgilendirme sağlanır."
    },
    {
      question: "Zenix'te yanlış parça riski neden çok düşüktür?",
      answer:
        "Sipariş öncesinde şasi numarası, model ve gerekli teknik bilgiler detaylı biçimde kontrol edilir; ürün ancak uygunluk doğrulandıktan sonra yönlendirilir."
    },
    {
      question: "Kargo süreci nasıl ilerliyor?",
      answer:
        "Parça kargoya verildikten sonra takip numarası paylaşılır; teslimat sonrasına kadar süreç izlenir ve destek devam eder."
    },
    {
      question: "Orijinal parça mı gönderiyorsunuz?",
      answer:
        "İhtiyaca göre orijinal, muadil veya belirli kalite seviyesindeki alternatifler sunulur; hangi ürün tipinin teklif edildiği baştan açıkça belirtilir."
    },
    {
      question: "En ucuz parçayı mı buluyorsunuz?",
      answer:
        "Hayır. Her zaman en ucuz ürünü değil, en doğru fiyat-performans ve güven dengesine sahip seçeneği bulmaya odaklanıyoruz."
    },
    {
      question: "Parçanın aracıma uyumlu olduğunu nasıl anlıyorsunuz?",
      answer:
        "Araç bilgileri, şasi numarası ve teknik detaylar incelenir; uygunluk teyidi sonrası ürün yönlendirilir."
    },
    {
      question: "Yanlış parça, uyumsuzluk veya sorun olursa ne olur?",
      answer:
        "Bu gibi durumlarda süreç bizim tarafımızdan takip edilir; iletişim kanalları üzerinden hızlı çözüm desteği sağlanır."
    },
    {
      question: "Sipariş sonrası ulaşabileceğim biri var mı?",
      answer:
        "Evet. WhatsApp, sosyal medya hesapları ve telefon üzerinden mesai saatleri içinde destek sunulur."
    },
    {
      question: "Zenix'in farkı tam olarak nedir?",
      answer:
        "Sadece parça bulmakla kalmayıp araştırma, doğrulama, tedarik yönetimi, kargo bilgilendirmesi ve teslimat sonrası memnuniyet takibini tek akışta yönetiriz."
    },
    {
      question: "Tedarikçilerin iletişim bilgilerini neden paylaşmıyorsunuz?",
      answer:
        "Ticari anlaşmalar ve süreç güvenliği nedeniyle tedarik iletişimi Zenix üzerinden yürütülür; bu yapı daha kontrollü ve düzenli ilerleme sağlar."
    },
    {
      question: "Süreç boyunca iletişim açık mı?",
      answer:
        "Evet. Bilgi almak, durum sormak veya sorun bildirmek için mesai saatleri içinde bizimle her zaman iletişime geçebilirsiniz."
    },
    {
      question: "Sosyal medya hesabınızın ve web sitenizin olması güven için yeterli mi?",
      answer:
        "Tek başına yeterli değildir; bu yüzden güveni resmi şirket yapısı, doğrulanabilir bilgiler, kayıtlı süreçler ve şeffaf iletişimle destekliyoruz."
    },
    {
      question: "Şirket bilgilerinizi açıkça paylaşıyor musunuz?",
      answer:
        "Evet. Vergi numarası, MERSİS bilgileri ve iletişim detayları gibi kurumsal veriler şeffaf biçimde paylaşılır."
    }
  ];

  const setupScrollReveal = () => {
    const groups = [
      { selector: ".value-section__intro", delayStep: 0, soft: false },
      { selector: ".value-item", delayStep: 70, soft: true },
      { selector: ".process-section__header", delayStep: 0, soft: false },
      { selector: ".process-card", delayStep: 85, soft: true },
      { selector: ".stat-card", delayStep: 65, soft: true },
      { selector: ".request-card__content", delayStep: 0, soft: false },
      { selector: ".request-card__media", delayStep: 90, soft: false },
      { selector: ".confidence-section__title, .confidence-section__description, .confidence-section__actions", delayStep: 80, soft: false },
      { selector: ".qa-feed", delayStep: 0, soft: true },
      { selector: ".faq-section__eyebrow, .faq-section__title", delayStep: 80, soft: false },
      { selector: ".faq-item", delayStep: 55, soft: true },
      { selector: ".site-footer__brand, .site-footer__column", delayStep: 65, soft: true }
    ];

    const revealItems = [];

    groups.forEach(({ selector, delayStep, soft }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("reveal");
        if (soft) element.classList.add("reveal--soft");
        element.style.setProperty("--reveal-delay", `${index * delayStep}ms`);
        revealItems.push(element);
      });
    });

    document.body.classList.add("is-ready");

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  };

  const legalPanels = {
    privacy: {
      title: "Gizlilik Politikası",
      templateId: "legal-template-privacy"
    },
    preinfo: {
      title: "Ön Bilgilendirme",
      templateId: "legal-template-preinfo"
    },
    terms: {
      title: "Kullanım Şartları",
      templateId: "legal-template-terms"
    },
    company: {
      title: "Şirket Bilgileri",
      templateId: "legal-template-company"
    },
    support: {
      title: "Destek",
      templateId: "legal-template-support"
    },
    delivery: {
      title: "Teslimat Bilgisi",
      templateId: "legal-template-delivery"
    },
    returns: {
      title: "İade Süreci",
      templateId: "legal-template-returns"
    },
    security: {
      title: "Güven Politikası",
      templateId: "legal-template-security"
    },
    contact: {
      title: "İletişim",
      templateId: "legal-template-contact"
    },
    career: {
      title: "Kariyer",
      templateId: "legal-template-career"
    },
    cookies: {
      title: "Çerez Aydınlatma Metni",
      templateId: "legal-template-cookies"
    }
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const firstInput = document.getElementById("question-full-name");
    if (firstInput) firstInput.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  const saveCookiePreferences = (preferences) => {
    try {
      window.localStorage.setItem(
        COOKIE_PREFS_KEY,
        JSON.stringify({
          ...preferences,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      // no-op
    }
  };

  const readCookiePreferences = () => {
    try {
      const raw = window.localStorage.getItem(COOKIE_PREFS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const hasRequiredShape =
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.necessary === "boolean" &&
        typeof parsed.functional === "boolean" &&
        typeof parsed.analytics === "boolean";
      return hasRequiredShape ? parsed : null;
    } catch (error) {
      return null;
    }
  };

  const closeCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.hidden = true;
  };

  const openCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
  };

  const syncCookieInputs = (preferences) => {
    if (cookieFunctionalInput) cookieFunctionalInput.checked = Boolean(preferences?.functional);
    if (cookieAnalyticsInput) cookieAnalyticsInput.checked = Boolean(preferences?.analytics);
  };

  const openCookiePreferences = () => {
    if (!cookiePreferences) return;
    syncCookieInputs(readCookiePreferences());
    cookiePreferences.classList.add("is-open");
    cookiePreferences.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeCookiePreferences = () => {
    if (!cookiePreferences) return;
    cookiePreferences.classList.remove("is-open");
    cookiePreferences.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const applyCookieDecision = (preferences) => {
    saveCookiePreferences(preferences);
    closeCookiePreferences();
    closeCookieBanner();
  };

  const openQaFeed = () => {
    if (!qaFeed || !toggleQaButton) return;
    qaFeed.hidden = false;
    requestAnimationFrame(() => {
      qaFeed.classList.add("is-open");
      toggleQaButton.classList.add("is-active");
      toggleQaButton.setAttribute("aria-expanded", "true");
    });
  };

  const closeQaFeed = () => {
    if (!qaFeed || !toggleQaButton) return;
    qaFeed.classList.remove("is-open");
    toggleQaButton.classList.remove("is-active");
    toggleQaButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!qaFeed.classList.contains("is-open")) {
        qaFeed.hidden = true;
      }
    }, 280);
  };

  const closePolicyModal = () => {
    if (!policyModal) return;
    policyModal.classList.remove("is-open");
    policyModal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!policyModal.classList.contains("is-open")) {
        policyModal.style.display = "none";
        document.body.classList.remove("has-policy-modal-open");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, policyScrollY);
      }
    }, 450);
  };

  const openPolicyModal = (panelKey) => {
    if (!policyModal || !policyModalBody || !policyModalTitle) return;
    const panel = legalPanels[panelKey];
    if (!panel) return;

    const template = document.getElementById(panel.templateId);
    if (!(template instanceof HTMLTemplateElement)) return;

    policyModalTitle.textContent = panel.title;
    policyModalBody.innerHTML = template.innerHTML;
    policyModal.style.display = "block";
    policyModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      policyModal.classList.add("is-open");
    });
    policyScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add("has-policy-modal-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${policyScrollY}px`;
    document.body.style.width = "100%";
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const setRequestFormMessage = (message) => {
    if (!requestFormMessage) return;
    requestFormMessage.textContent = message;
  };

  const buildRequestWhatsappUrl = (message) => {
    const whatsappNumber = String(
      requestSubmitButton?.dataset.whatsappPhone ||
      requestMessageField?.dataset.whatsappPhone ||
      WHATSAPP_PHONE
    ).replace(/\D/g, "") || WHATSAPP_PHONE;

    const text = [
      "Merhaba ZENIX, parca talebi olusturmak istiyorum.",
      "",
      "Talep detayi:",
      message
    ].join("\n");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const applyTextSetting = (key, value) => {
    document.querySelectorAll(`[data-setting="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  };

  const applyLinkSetting = (key, value) => {
    document.querySelectorAll(`[data-link-setting="${key}"]`).forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      if (value) {
        node.href = value;
        node.removeAttribute("aria-disabled");
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noreferrer");
      } else {
        node.href = "#";
        node.setAttribute("aria-disabled", "true");
        node.removeAttribute("target");
        node.removeAttribute("rel");
      }
    });
  };

  const renderFeed = (items) => {
    if (!qaGrid) return;
    const source = items.length ? items : [];
    if (!source.length) {
      qaGrid.innerHTML = '<p class="qa-feed__empty">Şu anda görüntülenecek yanıtlanmış soru bulunmuyor.</p>';
      qaDetail?.classList.remove("is-open");
      if (qaDetailQuestion) qaDetailQuestion.textContent = "";
      if (qaDetailAnswer) qaDetailAnswer.innerHTML = "";
      return;
    }

    const cardMarkup = source
      .map(
        (item) => `
        <article class="qa-card" data-question="${escapeHtml(item.question)}" data-answer="${escapeHtml(item.answer || "")}">
          <button class="qa-card__question" type="button" aria-expanded="false">
            <span class="qa-card__question-text">${escapeHtml(item.question)}</span>
            <span class="qa-card__icon" aria-hidden="true"></span>
          </button>
        </article>
      `
      )
      .join("");

    qaGrid.innerHTML = cardMarkup;
  };

  const applyBootstrap = (payload) => {
    const settings = payload.settings || {};
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    const usableQuestions = questions.length ? questions : FALLBACK_QA_ITEMS;

    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value !== "string" || !value) return;
      applyTextSetting(key, value);
    });

    applyLinkSetting("social_instagram", settings.social_instagram || "");
    applyLinkSetting("social_linkedin", settings.social_linkedin || "");
    applyLinkSetting("social_x", settings.social_x || "");
    applyLinkSetting("social_youtube", settings.social_youtube || "");
    applyLinkSetting("social_tiktok", settings.social_tiktok || "");

    if (requestSubmitButton instanceof HTMLButtonElement && settings.contact_whatsapp) {
      requestSubmitButton.dataset.whatsappPhone = settings.contact_whatsapp;
    }

    renderFeed(usableQuestions);
  };

  const loadBootstrap = async () => {
    try {
      const response = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      applyBootstrap(data);
    } catch (error) {
      applyBootstrap({ questions: FALLBACK_QA_ITEMS, settings: {} });
    }
  };

  const closeNavbarMenu = () => {
    if (!navbar || !navbarToggle) return;
    navbar.classList.remove("is-open");
    navbarToggle.setAttribute("aria-expanded", "false");
    navbarToggle.setAttribute("aria-label", "Menüyü aç");
    document.body.classList.remove("has-nav-open");
  };

  const openNavbarMenu = () => {
    if (!navbar || !navbarToggle) return;
    navbar.classList.add("is-open");
    navbarToggle.setAttribute("aria-expanded", "true");
    navbarToggle.setAttribute("aria-label", "Menüyü kapat");
    document.body.classList.add("has-nav-open");
  };

  const syncNavbarForViewport = () => {
    if (!window.matchMedia("(max-width: 520px)").matches) {
      closeNavbarMenu();
    }
  };

  askButton?.addEventListener("click", openModal);

  navbarToggle?.addEventListener("click", () => {
    if (!navbar) return;
    if (navbar.classList.contains("is-open")) {
      closeNavbarMenu();
      return;
    }
    openNavbarMenu();
  });

  navbarMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNavbarMenu();
    });
  });

  toggleQaButton?.addEventListener("click", () => {
    if (!qaFeed) return;
    if (qaFeed.classList.contains("is-open")) {
      closeQaFeed();
      return;
    }
    openQaFeed();
  });

  openCookiePolicyButton?.addEventListener("click", () => openPolicyModal("cookies"));
  cookieManageButton?.addEventListener("click", openCookiePreferences);
  cookieAcceptAllButton?.addEventListener("click", () => applyCookieDecision({ necessary: true, functional: true, analytics: true }));
  cookieRejectAllButton?.addEventListener("click", () => applyCookieDecision({ necessary: true, functional: false, analytics: false }));
  cookieSaveRejectedButton?.addEventListener("click", () => applyCookieDecision({ necessary: true, functional: false, analytics: false }));
  cookieSavePreferencesButton?.addEventListener("click", () =>
    applyCookieDecision({
      necessary: true,
      functional: Boolean(cookieFunctionalInput?.checked),
      analytics: Boolean(cookieAnalyticsInput?.checked)
    })
  );

  requestResetButton?.addEventListener("click", () => {
    if (requestMessageField instanceof HTMLTextAreaElement) {
      requestMessageField.value = "";
      requestMessageField.focus();
    }
    setRequestFormMessage("");
  });

  requestSubmitButton?.addEventListener("click", () => {
    if (!(requestMessageField instanceof HTMLTextAreaElement)) return;

    const message = requestMessageField.value.trim();

    if (!message) {
      setRequestFormMessage("Lutfen sasi numarasi veya parca talebinizi yazin.");
      requestMessageField.focus();
      return;
    }

    setRequestFormMessage("WhatsApp talep akisi aciliyor...");
    window.location.href = buildRequestWhatsappUrl(message);
  });

  modal?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeModal === "true") closeModal();
  });

  policyModal?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("[data-close-policy='true']")) closePolicyModal();
  });

  policyCloseButtons.forEach((button) => {
    button.addEventListener("click", closePolicyModal);
  });

  cookiePreferences?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeCookiePreferences === "true") closeCookiePreferences();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navbar?.classList.contains("is-open")) closeNavbarMenu();
    if (event.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
    if (event.key === "Escape" && policyModal?.classList.contains("is-open")) closePolicyModal();
    if (event.key === "Escape" && cookiePreferences?.classList.contains("is-open")) closeCookiePreferences();
  });

  window.addEventListener("resize", syncNavbarForViewport);

  legalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const panelKey = link.getAttribute("data-legal-panel");
      if (!panelKey) return;
      openPolicyModal(panelKey);
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!formMessage) return;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      question: String(formData.get("question") || "").trim()
    };

    if (!payload.fullName || !payload.question) {
      formMessage.textContent = "Lütfen ad soyad ve soru alanını doldurun.";
      return;
    }

    try {
      formMessage.textContent = "Gönderiliyor...";
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("submit failed");
      form.reset();
      formMessage.textContent = "Sorunuz alındı. En kısa sürede yanıtlayacağız.";
      setTimeout(() => {
        formMessage.textContent = "";
        closeModal();
      }, 1000);
    } catch (error) {
      formMessage.textContent = "Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.";
    }
  });

  faqList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".faq-item__question");
    if (!(button instanceof HTMLButtonElement)) return;
    const item = button.closest(".faq-item");
    if (!(item instanceof HTMLElement)) return;

    const isOpen = item.classList.contains("is-open");
    const answer = item.querySelector(".faq-item__answer");

    faqList.querySelectorAll(".faq-item").forEach((faqItem) => {
      if (!(faqItem instanceof HTMLElement) || faqItem === item) return;
      faqItem.classList.remove("is-open");
      const faqButton = faqItem.querySelector(".faq-item__question");
      const faqAnswer = faqItem.querySelector(".faq-item__answer");
      if (faqButton instanceof HTMLButtonElement) {
        faqButton.setAttribute("aria-expanded", "false");
      }
      if (faqAnswer instanceof HTMLElement) {
        faqAnswer.style.maxHeight = "";
      }
    });

    item.classList.toggle("is-open", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));

    if (answer instanceof HTMLElement) {
      answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : "";
    }
  });

  qaGrid?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".qa-card__question");
    if (!(button instanceof HTMLButtonElement)) return;
    const card = button.closest(".qa-card");
    if (!(card instanceof HTMLElement)) return;

    const isActive = card.classList.contains("is-active");

    qaGrid.querySelectorAll(".qa-card").forEach((item) => {
      item.classList.remove("is-active");
      const itemButton = item.querySelector(".qa-card__question");
      if (itemButton instanceof HTMLButtonElement) {
        itemButton.setAttribute("aria-expanded", "false");
      }
    });

    if (isActive) {
      qaDetail?.classList.remove("is-open");
      if (qaDetailQuestion) qaDetailQuestion.textContent = "";
      if (qaDetailAnswer) qaDetailAnswer.innerHTML = "";
      return;
    }

    card.classList.add("is-active");
    button.setAttribute("aria-expanded", "true");

    const question = card.dataset.question || "";
    const answer = card.dataset.answer || "";

    if (qaDetailQuestion) qaDetailQuestion.textContent = question;
    if (qaDetailAnswer) {
      qaDetailAnswer.innerHTML = "";
      const paragraph = document.createElement("p");
      paragraph.textContent = answer;
      qaDetailAnswer.appendChild(paragraph);
    }
    qaDetail?.classList.add("is-open");
  });

  loadBootstrap();
  setupScrollReveal();
  syncNavbarForViewport();

  if (readCookiePreferences()) {
    closeCookieBanner();
  } else {
    openCookieBanner();
  }
})();
