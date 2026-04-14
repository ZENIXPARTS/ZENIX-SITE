const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const zlib = require("zlib");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "lfkjlprp7gmA";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto
    .createHash("sha256")
    .update(`${ROOT}:${ADMIN_PASSWORD}:zenix-admin`)
    .digest("hex");
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jfif": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const DEFAULT_SETTINGS = {
  confidence_title: "Hâlâ Emin Değil Misiniz?",
  confidence_description: "Bize doğrudan yazın, sorularınızı net şekilde yanıtlayalım.",
  confidence_button_text: "Soru Sorun",
  contact_email: "zenix@zenixparts.com",
  contact_phone: "+90 533 277 62 06",
  contact_whatsapp: "+90 533 277 62 06",
  company_legal_name: "",
  company_type: "",
  company_tax_or_mersis: "",
  company_kep_address: "",
  company_address: "",
  company_city: "Ankara, Türkiye",
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
const activeSocketsByIp = new Map();
const MAX_CONNECTIONS_PER_IP = Number(process.env.MAX_CONNECTIONS_PER_IP || 40);
const MAX_TOTAL_CONNECTIONS = Number(process.env.MAX_TOTAL_CONNECTIONS || 250);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

function readStore() {
  ensureDataStore();
  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
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

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      expiresAt: now + windowMs
    });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
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

  return timingSafeEqualText(password, ADMIN_PASSWORD);
}

function readAdminSession(req) {
  const token = String(req.headers["x-admin-token"] || "").trim();
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

function getStaticCacheControl(ext) {
  if (ext === ".html") return "no-cache";
  if (ext === ".css" || ext === ".js") return "public, max-age=3600, stale-while-revalidate=86400";
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".jfif" || ext === ".svg" || ext === ".ico") {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }
  return "public, max-age=300, stale-while-revalidate=86400";
}

function getRequestOrigin(req) {
  const origin = String(req.headers.origin || "").trim();
  const referer = String(req.headers.referer || "").trim();

  if (origin) return origin;
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch (error) {
      return "";
    }
  }

  return "";
}

function isTrustedOrigin(req) {
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) return true;

  const host = String(req.headers.host || "").trim();
  if (!host) return false;

  try {
    const expected = new URL(`http://${host}`).origin;
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").trim();
    const expectedHttps = `https://${host}`;
    if (requestOrigin === expected) return true;
    if (forwardedProto === "https" && requestOrigin === expectedHttps) return true;
    return false;
  } catch (error) {
    return false;
  }
}

function getCspValue() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https://*.basemaps.cartocdn.com",
    "connect-src 'self'",
    "frame-src 'none'"
  ].join("; ");
}

function applySecurityHeaders(req, res) {
  res.setHeader("Content-Security-Policy", getCspValue());
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  const forwardedProto = String(req.headers["x-forwarded-proto"] || "");
  if (req.socket.encrypted || forwardedProto === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function sendJson(req, res, statusCode, payload) {
  applySecurityHeaders(req, res);
  const body = Buffer.from(JSON.stringify(payload));
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Accept-Encoding"
  };
  const acceptedEncoding = String(req.headers["accept-encoding"] || "");

  if (acceptedEncoding.includes("br")) {
    headers["Content-Encoding"] = "br";
    res.writeHead(statusCode, headers);
    res.end(zlib.brotliCompressSync(body));
    return;
  }

  if (acceptedEncoding.includes("gzip")) {
    headers["Content-Encoding"] = "gzip";
    res.writeHead(statusCode, headers);
    res.end(zlib.gzipSync(body));
    return;
  }

  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendError(req, res, statusCode, message) {
  sendJson(req, res, statusCode, { error: message });
}

function sendRateLimitError(req, res, retryAfterMs, message) {
  applySecurityHeaders(req, res);
  res.writeHead(429, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Retry-After": String(Math.ceil(retryAfterMs / 1000))
  });
  res.end(JSON.stringify({ error: message }));
}

function parseJsonBody(req, options = {}) {
  const { maxBytes = 16 * 1024 } = options;

  return new Promise((resolve, reject) => {
    const contentType = String(req.headers["content-type"] || "");
    const contentLength = Number(req.headers["content-length"] || 0);
    if (!contentType.toLowerCase().includes("application/json")) {
      reject(new Error("invalid content type"));
      return;
    }
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      reject(new Error("payload too large"));
      return;
    }

    let raw = "";
    let finished = false;

    req.on("data", (chunk) => {
      if (finished) return;
      raw += chunk;
      if (Buffer.byteLength(raw, "utf8") > maxBytes) {
        finished = true;
        reject(new Error("payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (finished) return;
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("invalid json"));
      }
    });

    req.on("error", reject);
  });
}

function sanitizeRelativePath(inputPath) {
  const decoded = decodeURIComponent(inputPath);
  const normalized = path.normalize(decoded);
  return normalized === "\\" || normalized === "/" ? "index.html" : normalized.replace(/^[\\/]+/, "");
}

function isForbiddenPath(relativePath) {
  const lowered = relativePath.toLowerCase();
  return (
    lowered.startsWith("data" + path.sep) ||
    lowered === "data" ||
    lowered.startsWith(".") ||
    lowered.includes(path.sep + ".")
  );
}

function shouldReturnNotModified(req, etag, lastModified) {
  const noneMatch = String(req.headers["if-none-match"] || "");
  const ifModifiedSince = String(req.headers["if-modified-since"] || "");

  if (noneMatch && noneMatch === etag) return true;
  if (ifModifiedSince && Date.parse(ifModifiedSince) >= Date.parse(lastModified)) return true;
  return false;
}

function isCompressibleContentType(contentType) {
  return /(?:text\/|javascript|json|svg\+xml|xml)/i.test(contentType);
}

function createCompressionStream(req) {
  const acceptedEncoding = String(req.headers["accept-encoding"] || "");

  if (acceptedEncoding.includes("br")) {
    return {
      encoding: "br",
      stream: zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5
        }
      })
    };
  }

  if (acceptedEncoding.includes("gzip")) {
    return {
      encoding: "gzip",
      stream: zlib.createGzip({ level: 6 })
    };
  }

  return null;
}

function serveStatic(req, res, pathname) {
  const relativePath = pathname === "/" ? "index.html" : sanitizeRelativePath(pathname);
  if (isForbiddenPath(relativePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, "index.html")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const etag = `W/"${stats.size}-${stats.mtimeMs}"`;
    const lastModified = stats.mtime.toUTCString();
    const isAdminAsset = relativePath === "admin.html" || relativePath === "admin.js" || relativePath === "admin.css";

    applySecurityHeaders(req, res);
    res.setHeader("Cache-Control", isAdminAsset ? "no-store" : getStaticCacheControl(ext));
    res.setHeader("Content-Type", contentType);
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", lastModified);
    res.setHeader("Vary", "Accept-Encoding");

    if (shouldReturnNotModified(req, etag, lastModified)) {
      res.writeHead(304);
      res.end();
      return;
    }

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      res.writeHead(500);
      res.end("Server Error");
    });

    const compression = stats.size > 1024 && isCompressibleContentType(contentType) ? createCompressionStream(req) : null;

    if (compression) {
      res.setHeader("Content-Encoding", compression.encoding);
    }

    res.writeHead(200);
    if (compression) {
      stream.pipe(compression.stream).pipe(res);
      return;
    }

    stream.pipe(res);
  });
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

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;
  const method = req.method || "GET";
  const clientIp = getClientIp(req);

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !isTrustedOrigin(req)) {
    sendError(req, res, 403, "Güvenilmeyen istek kaynağı.");
    return true;
  }

  const globalApiLimit = getRateLimitState(`api-global:${clientIp}`, 240, 60 * 1000);
  if (!globalApiLimit.allowed) {
    sendRateLimitError(req, res, globalApiLimit.retryAfterMs, "Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin.");
    return true;
  }

  if (pathname === "/api/bootstrap" && method === "GET") {
    const endpointLimit = getRateLimitState(`bootstrap:${clientIp}`, 90, 60 * 1000);
    if (!endpointLimit.allowed) {
      sendRateLimitError(req, res, endpointLimit.retryAfterMs, "Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin.");
      return true;
    }
    const store = readStore();
    sendJson(req, res, 200, createPublicBootstrap(store));
    return true;
  }

  if (pathname === "/api/site-settings" && method === "GET") {
    const store = readStore();
    sendJson(req, res, 200, { settings: store.settings });
    return true;
  }

  if (pathname === "/api/questions" && method === "GET") {
    const endpointLimit = getRateLimitState(`questions-read:${clientIp}`, 120, 60 * 1000);
    if (!endpointLimit.allowed) {
      sendRateLimitError(req, res, endpointLimit.retryAfterMs, "Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin.");
      return true;
    }
    const store = readStore();
    const status = urlObj.searchParams.get("status");
    let questions = [...store.questions];

    if (status === "answered") questions = questions.filter((item) => item.status === "answered");
    if (status === "pending") {
      if (!isAuthorized(req)) {
        sendError(req, res, 401, "Yetkisiz istek.");
        return true;
      }
      questions = questions.filter((item) => item.status === "pending");
    }

    if (status === "all") {
      if (!isAuthorized(req)) {
        sendError(req, res, 401, "Yetkisiz istek.");
        return true;
      }
    } else if (!status || status === "answered") {
      questions = questions.filter((item) => item.status === "answered");
    }

    sendJson(req, res, 200, { questions });
    return true;
  }

  if (pathname === "/api/admin-login" && method === "POST") {
    const loginLimit = getRateLimitState(`admin-login:${clientIp}`, 8, 15 * 60 * 1000);
    if (!loginLimit.allowed) {
      sendRateLimitError(req, res, loginLimit.retryAfterMs, "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.");
      return true;
    }

    let body;
    try {
      body = await parseJsonBody(req, { maxBytes: 4 * 1024 });
    } catch (error) {
      const message =
        error.message === "payload too large"
          ? "İstek boyutu çok büyük."
          : "Geçersiz istek gövdesi.";
      sendError(req, res, 400, message);
      return true;
    }

    const password = String(body.password || "");
    if (!verifyPassword(password)) {
      await sleep(350);
      sendError(req, res, 401, "Şifre hatalı.");
      return true;
    }

    sendJson(req, res, 200, {
      ok: true,
      token: createAdminSessionToken()
    });
    return true;
  }

  if (pathname === "/api/site-settings" && method === "PUT") {
    if (!isAuthorized(req)) {
      sendError(req, res, 401, "Yetkisiz istek.");
      return true;
    }

    let body;
    try {
      body = await parseJsonBody(req, { maxBytes: 8 * 1024 });
    } catch (error) {
      const message =
        error.message === "payload too large"
          ? "İstek boyutu çok büyük."
          : "Geçersiz istek gövdesi.";
      sendError(req, res, 400, message);
      return true;
    }

    const store = readStore();
    store.settings = {
      ...store.settings,
      confidence_title: String(body.confidence_title || store.settings.confidence_title || "").trim().slice(0, 160),
      confidence_description: String(body.confidence_description || store.settings.confidence_description || "").trim().slice(0, 400),
      confidence_button_text: String(body.confidence_button_text || store.settings.confidence_button_text || "").trim().slice(0, 80),
      contact_email: String(body.contact_email || store.settings.contact_email || "").trim().slice(0, 160),
      contact_phone: String(body.contact_phone || store.settings.contact_phone || "").trim().slice(0, 80),
      contact_whatsapp: String(body.contact_whatsapp || store.settings.contact_whatsapp || "").trim().slice(0, 80),
      company_legal_name: String(body.company_legal_name || store.settings.company_legal_name || "").trim().slice(0, 200),
      company_type: String(body.company_type || store.settings.company_type || "").trim().slice(0, 120),
      company_tax_or_mersis: String(body.company_tax_or_mersis || store.settings.company_tax_or_mersis || "").trim().slice(0, 160),
      company_kep_address: String(body.company_kep_address || store.settings.company_kep_address || "").trim().slice(0, 200),
      company_address: String(body.company_address || store.settings.company_address || "").trim().slice(0, 240),
      company_city: String(body.company_city || store.settings.company_city || "").trim().slice(0, 120),
      social_instagram: String(body.social_instagram || store.settings.social_instagram || "").trim().slice(0, 240),
      social_linkedin: String(body.social_linkedin || store.settings.social_linkedin || "").trim().slice(0, 240),
      social_x: String(body.social_x || store.settings.social_x || "").trim().slice(0, 240),
      social_youtube: String(body.social_youtube || store.settings.social_youtube || "").trim().slice(0, 240),
      social_tiktok: String(body.social_tiktok || store.settings.social_tiktok || "").trim().slice(0, 240)
    };
    writeStore(store);
    sendJson(req, res, 200, { ok: true, settings: store.settings });
    return true;
  }

  if (pathname === "/api/questions" && method === "POST") {
    const submitLimit = getRateLimitState(`question-submit:${clientIp}`, 10, 10 * 60 * 1000);
    if (!submitLimit.allowed) {
      sendRateLimitError(req, res, submitLimit.retryAfterMs, "Çok fazla soru gönderildi. Lütfen daha sonra tekrar deneyin.");
      return true;
    }

    let body;
    try {
      body = await parseJsonBody(req, { maxBytes: 12 * 1024 });
    } catch (error) {
      const message =
        error.message === "payload too large"
          ? "İstek boyutu çok büyük."
          : "Geçersiz istek gövdesi.";
      sendError(req, res, 400, message);
      return true;
    }

    const { fullName, question } = validateQuestionPayload(body);
    if (!fullName || !question) {
      sendError(req, res, 400, "Ad soyad ve soru zorunludur.");
      return true;
    }

    const store = readStore();
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
    writeStore(store);
    sendJson(req, res, 201, { ok: true, question: item });
    return true;
  }

  if (pathname.startsWith("/api/questions/") && method === "PATCH") {
    if (!isAuthorized(req)) {
      sendError(req, res, 401, "Yetkisiz istek.");
      return true;
    }

    let body;
    try {
      body = await parseJsonBody(req, { maxBytes: 16 * 1024 });
    } catch (error) {
      const message =
        error.message === "payload too large"
          ? "İstek boyutu çok büyük."
          : "Geçersiz istek gövdesi.";
      sendError(req, res, 400, message);
      return true;
    }

    const id = pathname.replace("/api/questions/", "").trim();
    const answer = String(body.answer || "").trim().slice(0, 4000);
    const store = readStore();
    const item = store.questions.find((questionItem) => questionItem.id === id);

    if (!item) {
      sendError(req, res, 404, "Soru bulunamadı.");
      return true;
    }

    item.answer = answer;
    item.status = answer ? "answered" : "pending";
    item.answeredAt = answer ? new Date().toISOString() : null;

    writeStore(store);
    sendJson(req, res, 200, { ok: true, question: item });
    return true;
  }

  if (pathname.startsWith("/api/questions/") && method === "DELETE") {
    if (!isAuthorized(req)) {
      sendError(req, res, 401, "Yetkisiz istek.");
      return true;
    }

    const id = pathname.replace("/api/questions/", "").trim();
    const store = readStore();
    const nextQuestions = store.questions.filter((questionItem) => questionItem.id !== id);

    if (nextQuestions.length === store.questions.length) {
      sendError(req, res, 404, "Soru bulunamadı.");
      return true;
    }

    store.questions = nextQuestions;
    writeStore(store);
    sendJson(req, res, 200, { ok: true });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  cleanupRateLimitBuckets();

  try {
    const expectHeader = String(req.headers.expect || "").trim().toLowerCase();
    if (expectHeader && expectHeader !== "100-continue") {
      sendError(req, res, 417, "Beklenmeyen Expect başlığı.");
      return;
    }

    const originHost = req.headers.host || `${HOST}:${PORT}`;
    const urlObj = new URL(req.url || "/", `http://${originHost}`);

    if (!["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"].includes(req.method || "")) {
      sendError(req, res, 405, "İzin verilmeyen yöntem.");
      return;
    }

    if (urlObj.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, urlObj);
      if (!handled) sendError(req, res, 404, "API route bulunamadı.");
      return;
    }

    if (urlObj.pathname === "/admin") {
      serveStatic(req, res, "/admin.html");
      return;
    }

    serveStatic(req, res, urlObj.pathname);
  } catch (error) {
    console.error("[server-error]", error);
    sendError(req, res, 500, "Sunucu hatası.");
  }
});

server.maxConnections = MAX_TOTAL_CONNECTIONS;
server.requestTimeout = 15 * 1000;
server.headersTimeout = 10 * 1000;
server.keepAliveTimeout = 5 * 1000;
server.maxRequestsPerSocket = 50;
server.timeout = 15 * 1000;

server.on("connection", (socket) => {
  const clientIp = socket.remoteAddress || "unknown";
  const currentCount = activeSocketsByIp.get(clientIp) || 0;

  if (currentCount >= MAX_CONNECTIONS_PER_IP) {
    socket.destroy();
    return;
  }

  activeSocketsByIp.set(clientIp, currentCount + 1);
  socket.setNoDelay(true);
  socket.setTimeout(15 * 1000);

  socket.on("timeout", () => {
    socket.destroy();
  });

  socket.on("close", () => {
    const nextCount = (activeSocketsByIp.get(clientIp) || 1) - 1;
    if (nextCount <= 0) {
      activeSocketsByIp.delete(clientIp);
      return;
    }
    activeSocketsByIp.set(clientIp, nextCount);
  });
});

server.on("clientError", (error, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  } else {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  ensureDataStore();
  console.log(`Zenix server running at http://${HOST}:${PORT}`);
  console.log(`Admin panel: http://${HOST}:${PORT}/admin`);
});
