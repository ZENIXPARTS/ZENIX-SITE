(function () {
  const mapElement = document.getElementById("live-world-map");
  if (!mapElement) return;

  let initialized = false;
  let leafletLoadPromise = null;
  const LEAFLET_CSS_ID = "leaflet-runtime-css";

  const cityLights = [
    { lat: 41.0082, lng: 28.9784, size: "xl" },
    { lat: 39.9334, lng: 32.8597, size: "xl" },
    { lat: 38.4237, lng: 27.1428, size: "lg" },
    { lat: 40.195, lng: 29.06, size: "lg" },
    { lat: 36.8969, lng: 30.7133, size: "lg" },
    { lat: 37.0, lng: 35.3213, size: "lg" },
    { lat: 37.0662, lng: 37.3833, size: "md" },
    { lat: 37.8714, lng: 32.4846, size: "md" },
    { lat: 38.7322, lng: 35.4853, size: "md" },
    { lat: 41.2867, lng: 36.33, size: "md" },
    { lat: 41.0015, lng: 39.7178, size: "md" },
    { lat: 37.8746, lng: 40.23, size: "md" },
    { lat: 38.3552, lng: 38.3095, size: "sm" },
    { lat: 38.627, lng: 34.714, size: "sm" },
    { lat: 40.8438, lng: 31.1565, size: "sm" },
    { lat: 40.978, lng: 27.511, size: "sm" },
    { lat: 40.65, lng: 35.8353, size: "sm" },
    { lat: 40.3167, lng: 36.55, size: "sm" },
    { lat: 39.75, lng: 37.0179, size: "sm" },
    { lat: 39.9, lng: 41.27, size: "sm" },
    { lat: 38.495, lng: 43.38, size: "sm" },
    { lat: 37.58, lng: 43.73, size: "sm" },
    { lat: 37.92, lng: 40.24, size: "sm" },
    { lat: 37.167, lng: 38.795, size: "sm" },
    { lat: 37.313, lng: 40.734, size: "sm" },
    { lat: 39.108, lng: 39.547, size: "sm" },
    { lat: 39.146, lng: 34.16, size: "sm" },
    { lat: 39.818, lng: 34.815, size: "sm" },
    { lat: 37.7648, lng: 30.5566, size: "sm" },
    { lat: 37.72, lng: 29.096, size: "sm" },
    { lat: 37.845, lng: 27.845, size: "sm" },
    { lat: 38.612, lng: 27.426, size: "sm" },
    { lat: 39.648, lng: 27.882, size: "sm" },
    { lat: 40.8533, lng: 26.6303, size: "sm" },
    { lat: 41.1828, lng: 41.8217, size: "sm" },
    { lat: 40.56, lng: 43.1, size: "sm" },
    { lat: 39.7191, lng: 43.0519, size: "sm" },
    { lat: 39.92, lng: 32.85, size: "md" },
    { lat: 41.03, lng: 29.0, size: "md" },
    { lat: 40.99, lng: 28.87, size: "md" },
    { lat: 41.06, lng: 28.94, size: "md" },
    { lat: 38.47, lng: 27.18, size: "md" }
  ];

  const loadLeaflet = () => {
    if (typeof L !== "undefined") return Promise.resolve();
    if (leafletLoadPromise) return leafletLoadPromise;

    leafletLoadPromise = new Promise((resolve, reject) => {
      if (!document.getElementById(LEAFLET_CSS_ID)) {
        const stylesheet = document.createElement("link");
        stylesheet.id = LEAFLET_CSS_ID;
        stylesheet.rel = "stylesheet";
        stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        stylesheet.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        stylesheet.crossOrigin = "";
        document.head.appendChild(stylesheet);
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("leaflet failed"));
      document.head.appendChild(script);
    });

    return leafletLoadPromise;
  };

  const initializeMap = () => {
    if (initialized) return;
    initialized = true;

    const worldMap = L.map(mapElement, {
      attributionControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      maxBounds: [
        [34.5, 24],
        [43.5, 46]
      ],
      maxBoundsViscosity: 1,
      maxZoom: 7,
      minZoom: 5,
      scrollWheelZoom: false,
      touchZoom: false,
      worldCopyJump: false,
      zoomControl: false
    }).setView([39.1, 35.0], 5.4);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      detectRetina: true,
      maxZoom: 20,
      subdomains: "abcd"
    }).addTo(worldMap);

    cityLights.forEach((city, index) => {
      const sizeClass = city.size ? ` city-star--${city.size}` : " city-star--sm";
      const twinkleClass = ` city-star--tw${(index % 3) + 1}`;
      const starIcon = L.divIcon({
        className: "",
        html: `<span class="city-star${sizeClass}${twinkleClass}"></span>`,
        iconAnchor: [10, 10],
        iconSize: [20, 20]
      });

      L.marker([city.lat, city.lng], {
        icon: starIcon,
        interactive: false,
        keyboard: false
      }).addTo(worldMap);
    });
  };

  const hydrateMap = () => {
    loadLeaflet()
      .then(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => initializeMap(), { timeout: 1200 });
        } else {
          window.setTimeout(initializeMap, 150);
        }
      })
      .catch(() => {
        initialized = false;
      });
  };

  if (!("IntersectionObserver" in window)) {
    hydrateMap();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        hydrateMap();
      });
    },
    {
      rootMargin: "220px 0px"
    }
  );

  observer.observe(mapElement);
})();
