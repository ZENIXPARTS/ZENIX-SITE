import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { getStore } from "@netlify/blobs";

const blobStore = getStore("zenix-site");
const STORE_KEY = "site-store";
const LOCAL_STORE_URL = new URL("../../data/store.json", import.meta.url);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto
    .createHash("sha256")
    .update(`netlify:${ADMIN_PASSWORD || "missing"}:zenix-admin`)
    .digest("hex");
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const DEFAULT_SETTINGS = {
  confidence_title: "Hala Emin Degil Misiniz?",
  confidence_description: "Bize dogrudan yazin, sorularinizi net sekilde yanitlayalim.",
  confidence_button_text: "Soru Sorun",
  contact_email: "zenix@zenixparts.com",
  contact_phone: "+90 533 277 62 06",
  contact_whatsapp: "+90 533 277 62 06",
  company_legal_name: "",
  company_type: "",
  company_tax_or_mersis: "",
  company_kep_address: "",
  company_address: "",
  company_city: "Ankara, Turkiye",
  social_instagram: "",
  social_linkedin: "",
  social_x: "",
  social_youtube: "",
  social_tiktok: ""
};

const DEFAULT_STORE = {
  settings: DEFAULT_SETTINGS,
  questions: []
};

const rateLimitBuckets = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeStore(parsed = {}) {
  return {
    ...DEFAULT_STORE,
    ...parsed,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {})
    },
    questions: Array.isArray(parsed.questions) ? parsed.questions : []
  };
}

async function readSeedStore() {
  try {
    const raw = await readFile(LOCAL_STORE_URL, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    return DEFAULT_STORE;
  }
}

async function readStoreData() {
  const existing = await blobStore.get(STORE_KEY, { type: "json" });
  if (existing) return normalizeStore(existing);

  const seed = await readSeedStore();
  await blobStore.setJSON(STORE_KEY, seed, { onlyIfNew: true });
  return seed;
}

async function writeStoreData(store) {
  await blobStore.setJSON(STORE_KEY, store);
}

function getClientIp(req) {
  const forwarded = String(req.headers.get("x-forwarded-for") || "")
    .split(",")[0]
    .trim();
  return forwarded || "unknown";
}

function getRateLimitState(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      expiresAt: now + windowMs
    });
    return { allowed: true, retryAfterMs: windowMs };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterMs: Math.max(bucket.expiresAt - now, 1000)
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    retryAfterMs: Math.max(bucket.expiresAt - now, 1000)
  };
}

function cleanupRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (bucket.expiresAt <= now) rateLimitBuckets.delete(key);
  }
}

function toBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function signSessionPayload(payload) {
  return crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

function createAdminSessionToken() {
  const payload = JSON.stringify({
    exp: Date.now() + ADMIN_SESSION_TTL_MS,
    nonce: crypto.randomBytes(18).toString("hex"),
    scope: "admin"
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signSessionPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function hasAdminCredentials() {
  return Boolean(ADMIN_PASSWORD || ADMIN_PASSWORD_HASH);
}

function verifyPassword(password) {
  if (ADMIN_PASSWORD_HASH) {
    const [scheme, iterationsText, salt, expectedHash] = ADMIN_PASSWORD_HASH.split("$");
    if (scheme === "pbkdf2_sha256" && iterationsText && salt && expectedHash) {
      const iterations = Number(iterationsText);
      if (Number.isFinite(iterations) && iterations > 0) {
        const derived = crypto
          .pbkdf2Sync(password, salt, iterations, 32, "sha256")
          .toString("base64url");
        return timingSafeEqualText(derived, expectedHash);
      }
    }
  }

  if (!ADMIN_PASSWORD) return false;
  return timingSafeEqualText(password, ADMIN_PASSWORD);
}

function readAdminSession(req) {
  const token = String(req.headers.get("x-admin-token") || "").trim();
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (!timingSafeEqualText(signSessionPayload(encodedPayload), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.scope !== "admin") return null;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function isAuthorized(req) {
  return Boolean(readAdminSession(req));
}

function getRequestOrigin(req) {
  const origin = String(req.headers.get("origin") || "").trim();
  const referer = String(req.headers.get("referer") || "").trim();

  if (origin) return origin;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch (error) {
      return "";
    }
  }

  return "";
}

function isTrustedOrigin(req) {
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) return true;

  try {
    const url = new URL(req.url);
    return requestOrigin === url.origin;
  } catch (error) {
    return false;
  }
}

function getHeaders(extraHeaders = {}) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.basemaps.cartocdn.com; connect-src 'self'; frame-src 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...extraHeaders
  };
}

function jsonResponse(status, payload, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: getHeaders({
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    })
  });
}

function errorResponse(status, message) {
  return jsonResponse(status, { error: message });
}

function rateLimitResponse(retryAfterMs, message) {
  return jsonResponse(
    429,
    { error: message },
    { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
  );
}

async function parseJsonBody(req, maxBytes = 16 * 1024) {
  const contentType = String(req.headers.get("content-type") || "");
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("invalid content type");
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new Error("payload too large");
  }

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("invalid json");
  }
}

function createPublicBootstrap(store) {
  return {
    questions: store.questions.filter((item) => item.status === "answered"),
    settings: store.settings
  };
}

function validateQuestionPayload(body) {
  const fullName = String(body.fullName || "").trim().slice(0, 120);
  const question = String(body.question || "").trim().slice(0, 1200);
  return { fullName, question };
}

function sanitizeSettingsInput(body, settings) {
  return {
    ...settings,
    confidence_title: String(body.confidence_title || settings.confidence_title || "").trim().slice(0, 160),
    confidence_description: String(body.confidence_description || settings.confidence_description || "").trim().slice(0, 400),
    confidence_button_text: String(body.confidence_button_text || settings.confidence_button_text || "").trim().slice(0, 80),
    contact_email: String(body.contact_email || settings.contact_email || "").trim().slice(0, 160),
    contact_phone: String(body.contact_phone || settings.contact_phone || "").trim().slice(0, 80),
    contact_whatsapp: String(body.contact_whatsapp || settings.contact_whatsapp || "").trim().slice(0, 80),
    company_legal_name: String(body.company_legal_name || settings.company_legal_name || "").trim().slice(0, 200),
    company_type: String(body.company_type || settings.company_type || "").trim().slice(0, 120),
    company_tax_or_mersis: String(body.company_tax_or_mersis || settings.company_tax_or_mersis || "").trim().slice(0, 160),
    company_kep_address: String(body.company_kep_address || settings.company_kep_address || "").trim().slice(0, 200),
    company_address: String(body.company_address || settings.company_address || "").trim().slice(0, 240),
    company_city: String(body.company_city || settings.company_city || "").trim().slice(0, 120),
    social_instagram: String(body.social_instagram || settings.social_instagram || "").trim().slice(0, 240),
    social_linkedin: String(body.social_linkedin || settings.social_linkedin || "").trim().slice(0, 240),
    social_x: String(body.social_x || settings.social_x || "").trim().slice(0, 240),
    social_youtube: String(body.social_youtube || settings.social_youtube || "").trim().slice(0, 240),
    social_tiktok: String(body.social_tiktok || settings.social_tiktok || "").trim().slice(0, 240)
  };
}

async function handleApi(req) {
  cleanupRateLimitBuckets();

  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method || "GET";
  const clientIp = getClientIp(req);

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !isTrustedOrigin(req)) {
    return errorResponse(403, "Guvenilmeyen istek kaynagi.");
  }

  const globalApiLimit = getRateLimitState(`api-global:${clientIp}`, 240, 60 * 1000);
  if (!globalApiLimit.allowed) {
    return rateLimitResponse(globalApiLimit.retryAfterMs, "Cok fazla istek gonderildi. Lutfen kisa sure sonra tekrar deneyin.");
  }

  if (pathname === "/api/bootstrap" && method === "GET") {
    const endpointLimit = getRateLimitState(`bootstrap:${clientIp}`, 90, 60 * 1000);
    if (!endpointLimit.allowed) {
      return rateLimitResponse(endpointLimit.retryAfterMs, "Cok fazla istek gonderildi. Lutfen kisa sure sonra tekrar deneyin.");
    }
    const store = await readStoreData();
    return jsonResponse(200, createPublicBootstrap(store));
  }

  if (pathname === "/api/site-settings" && method === "GET") {
    const store = await readStoreData();
    return jsonResponse(200, { settings: store.settings });
  }

  if (pathname === "/api/questions" && method === "GET") {
    const endpointLimit = getRateLimitState(`questions-read:${clientIp}`, 120, 60 * 1000);
    if (!endpointLimit.allowed) {
      return rateLimitResponse(endpointLimit.retryAfterMs, "Cok fazla istek gonderildi. Lutfen kisa sure sonra tekrar deneyin.");
    }

    const store = await readStoreData();
    const status = url.searchParams.get("status");
    let questions = [...store.questions];

    if (status === "answered") questions = questions.filter((item) => item.status === "answered");
    if (status === "pending") {
      if (!isAuthorized(req)) return errorResponse(401, "Yetkisiz istek.");
      questions = questions.filter((item) => item.status === "pending");
    }

    if (status === "all") {
      if (!isAuthorized(req)) return errorResponse(401, "Yetkisiz istek.");
    } else if (!status || status === "answered") {
      questions = questions.filter((item) => item.status === "answered");
    }

    return jsonResponse(200, { questions });
  }

  if (pathname === "/api/admin-login" && method === "POST") {
    if (!hasAdminCredentials()) {
      return errorResponse(500, "Admin sifresi Netlify ortam degiskenlerinde tanimli degil.");
    }

    const loginLimit = getRateLimitState(`admin-login:${clientIp}`, 8, 15 * 60 * 1000);
    if (!loginLimit.allowed) {
      return rateLimitResponse(loginLimit.retryAfterMs, "Cok fazla deneme yapildi. Lutfen daha sonra tekrar deneyin.");
    }

    let body;
    try {
      body = await parseJsonBody(req, 4 * 1024);
    } catch (error) {
      const message =
        error.message === "payload too large" ? "Istek boyutu cok buyuk." : "Gecersiz istek govdesi.";
      return errorResponse(400, message);
    }

    if (!verifyPassword(String(body.password || ""))) {
      await sleep(350);
      return errorResponse(401, "Sifre hatali.");
    }

    return jsonResponse(200, {
      ok: true,
      token: createAdminSessionToken()
    });
  }

  if (pathname === "/api/site-settings" && method === "PUT") {
    if (!isAuthorized(req)) return errorResponse(401, "Yetkisiz istek.");

    let body;
    try {
      body = await parseJsonBody(req, 8 * 1024);
    } catch (error) {
      const message =
        error.message === "payload too large" ? "Istek boyutu cok buyuk." : "Gecersiz istek govdesi.";
      return errorResponse(400, message);
    }

    const store = await readStoreData();
    store.settings = sanitizeSettingsInput(body, store.settings);
    await writeStoreData(store);
    return jsonResponse(200, { ok: true, settings: store.settings });
  }

  if (pathname === "/api/questions" && method === "POST") {
    const submitLimit = getRateLimitState(`question-submit:${clientIp}`, 10, 10 * 60 * 1000);
    if (!submitLimit.allowed) {
      return rateLimitResponse(submitLimit.retryAfterMs, "Cok fazla soru gonderildi. Lutfen daha sonra tekrar deneyin.");
    }

    let body;
    try {
      body = await parseJsonBody(req, 12 * 1024);
    } catch (error) {
      const message =
        error.message === "payload too large" ? "Istek boyutu cok buyuk." : "Gecersiz istek govdesi.";
      return errorResponse(400, message);
    }

    const { fullName, question } = validateQuestionPayload(body);
    if (!fullName || !question) {
      return errorResponse(400, "Ad soyad ve soru zorunludur.");
    }

    const store = await readStoreData();
    const item = {
      answer: "",
      answeredAt: null,
      createdAt: new Date().toISOString(),
      fullName,
      id: crypto.randomUUID(),
      question,
      status: "pending"
    };

    store.questions.unshift(item);
    await writeStoreData(store);
    return jsonResponse(201, { ok: true, question: item });
  }

  if (pathname.startsWith("/api/questions/") && method === "PATCH") {
    if (!isAuthorized(req)) return errorResponse(401, "Yetkisiz istek.");

    let body;
    try {
      body = await parseJsonBody(req, 16 * 1024);
    } catch (error) {
      const message =
        error.message === "payload too large" ? "Istek boyutu cok buyuk." : "Gecersiz istek govdesi.";
      return errorResponse(400, message);
    }

    const id = pathname.replace("/api/questions/", "").trim();
    const answer = String(body.answer || "").trim().slice(0, 4000);
    const store = await readStoreData();
    const item = store.questions.find((questionItem) => questionItem.id === id);

    if (!item) return errorResponse(404, "Soru bulunamadi.");

    item.answer = answer;
    item.status = answer ? "answered" : "pending";
    item.answeredAt = answer ? new Date().toISOString() : null;

    await writeStoreData(store);
    return jsonResponse(200, { ok: true, question: item });
  }

  if (pathname.startsWith("/api/questions/") && method === "DELETE") {
    if (!isAuthorized(req)) return errorResponse(401, "Yetkisiz istek.");

    const id = pathname.replace("/api/questions/", "").trim();
    const store = await readStoreData();
    const nextQuestions = store.questions.filter((questionItem) => questionItem.id !== id);

    if (nextQuestions.length === store.questions.length) {
      return errorResponse(404, "Soru bulunamadi.");
    }

    store.questions = nextQuestions;
    await writeStoreData(store);
    return jsonResponse(200, { ok: true });
  }

  return errorResponse(404, "API route bulunamadi.");
}

export default async (req) => {
  if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(req.method || "")) {
    return errorResponse(405, "Izin verilmeyen yontem.");
  }

  try {
    return await handleApi(req);
  } catch (error) {
    console.error("[netlify-api-error]", error);
    return errorResponse(500, "Sunucu hatasi.");
  }
};

export const config = {
  path: ["/api", "/api/*"]
};
