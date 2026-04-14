(() => {
  const loginSection = document.getElementById("admin-login");
  const loginForm = document.getElementById("admin-login-form");
  const loginMessage = document.getElementById("admin-login-message");
  const passwordInput = document.getElementById("admin-password");
  const adminLayout = document.getElementById("admin-layout");
  const logoutButton = document.getElementById("logout-admin");

  const settingsForm = document.getElementById("settings-form");
  const settingsMessage = document.getElementById("settings-message");
  const questionsList = document.getElementById("questions-list");
  const refreshQuestionsBtn = document.getElementById("refresh-questions");

  const getToken = () => sessionStorage.getItem("zenix_admin_token") || "";
  const setToken = (token) => sessionStorage.setItem("zenix_admin_token", token);
  const clearToken = () => {
    sessionStorage.removeItem("zenix_admin_token");
    localStorage.removeItem("zenix_admin_token");
  };

  const showLogin = () => {
    loginSection.style.display = "grid";
    adminLayout.classList.add("is-hidden");
  };

  const showPanel = () => {
    loginSection.style.display = "none";
    adminLayout.classList.remove("is-hidden");
  };

  const api = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      ...(options.headers || {})
    };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (token) headers["x-admin-token"] = token;

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "İstek başarısız");
    }
    return data;
  };

  const loadSettings = async () => {
    const data = await api("/api/site-settings", { method: "GET" });
    const settings = data.settings || {};
    [
      "confidence_title",
      "confidence_description",
      "confidence_button_text",
      "contact_email",
      "contact_phone",
      "contact_whatsapp",
      "company_legal_name",
      "company_type",
      "company_tax_or_mersis",
      "company_kep_address",
      "company_address",
      "company_city",
      "social_instagram",
      "social_linkedin",
      "social_x",
      "social_youtube",
      "social_tiktok"
    ].forEach((key) => {
      if (settingsForm[key]) settingsForm[key].value = settings[key] || "";
    });
  };

  const renderQuestions = (items) => {
    if (!items.length) {
      questionsList.innerHTML = '<p class="admin-message">Henüz soru yok.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    questionsList.innerHTML = "";

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "question-item";
      article.dataset.id = item.id;

      const title = document.createElement("h3");
      title.textContent = item.fullName;

      const question = document.createElement("p");
      question.textContent = `Soru: ${item.question}`;

      const status = document.createElement("p");
      status.textContent = `Durum: ${item.status}`;

      const createdAt = document.createElement("p");
      createdAt.textContent = `Tarih: ${new Date(item.createdAt).toLocaleString("tr-TR")}`;

      const textarea = document.createElement("textarea");
      textarea.placeholder = "Cevabınızı yazın...";
      textarea.value = item.answer || "";

      const actions = document.createElement("div");
      actions.className = "question-item__actions";

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = "save";
      button.textContent = "Cevabı Kaydet";

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.dataset.action = "delete";
      deleteButton.className = "question-item__button question-item__button--danger";
      deleteButton.textContent = "Soruyu Sil";

      actions.append(button, deleteButton);

      article.append(title, question, status, createdAt, textarea, actions);
      fragment.appendChild(article);
    });

    questionsList.appendChild(fragment);
  };

  const loadQuestions = async () => {
    const data = await api("/api/questions?status=all", { method: "GET" });
    renderQuestions(data.questions || []);
  };

  const initPanel = async () => {
    try {
      await loadSettings();
      await loadQuestions();
      showPanel();
    } catch (error) {
      clearToken();
      showLogin();
      if (settingsMessage) settingsMessage.textContent = "";
    }
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = String(passwordInput.value || "").trim();
    if (!password) {
      loginMessage.textContent = "Lütfen şifre girin.";
      return;
    }
    try {
      loginMessage.textContent = "Giriş yapılıyor...";
      const data = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Giriş başarısız");
        return payload;
      });
      setToken(data.token);
      passwordInput.value = "";
      loginMessage.textContent = "";
      await initPanel();
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });

  logoutButton?.addEventListener("click", () => {
    clearToken();
    showLogin();
  });

  settingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      confidence_title: settingsForm.confidence_title.value.trim(),
      confidence_description: settingsForm.confidence_description.value.trim(),
      confidence_button_text: settingsForm.confidence_button_text.value.trim(),
      contact_email: settingsForm.contact_email.value.trim(),
      contact_phone: settingsForm.contact_phone.value.trim(),
      contact_whatsapp: settingsForm.contact_whatsapp.value.trim(),
      company_legal_name: settingsForm.company_legal_name.value.trim(),
      company_type: settingsForm.company_type.value.trim(),
      company_tax_or_mersis: settingsForm.company_tax_or_mersis.value.trim(),
      company_kep_address: settingsForm.company_kep_address.value.trim(),
      company_address: settingsForm.company_address.value.trim(),
      company_city: settingsForm.company_city.value.trim(),
      social_instagram: settingsForm.social_instagram.value.trim(),
      social_linkedin: settingsForm.social_linkedin.value.trim(),
      social_x: settingsForm.social_x.value.trim(),
      social_youtube: settingsForm.social_youtube.value.trim(),
      social_tiktok: settingsForm.social_tiktok.value.trim()
    };
    try {
      await api("/api/site-settings", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      settingsMessage.textContent = "Ayarlar kaydedildi.";
    } catch (error) {
      settingsMessage.textContent = error.message;
    }
  });

  refreshQuestionsBtn?.addEventListener("click", async () => {
    try {
      await loadQuestions();
    } catch (error) {
      questionsList.innerHTML = `<p class="admin-message">${error.message}</p>`;
    }
  });

  questionsList?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const card = target.closest(".question-item");
    if (!card) return;
    const id = card.getAttribute("data-id");
    const textarea = card.querySelector("textarea");
    const action = target.dataset.action || "save";
    if (!id) return;

    try {
      if (action === "delete") {
        await api(`/api/questions/${id}`, {
          method: "DELETE"
        });
      } else {
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        await api(`/api/questions/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ answer: textarea.value.trim() })
        });
      }
      await loadQuestions();
    } catch (error) {
      const errorNode = document.createElement("p");
      errorNode.className = "admin-message";
      errorNode.textContent = error.message;
      questionsList.prepend(errorNode);
    }
  });

  if (getToken()) {
    initPanel();
  } else {
    showLogin();
  }
})();

