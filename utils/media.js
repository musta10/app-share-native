/**
 * Detección y validación de enlaces de medios (YouTube, Instagram, TikTok, Facebook).
 * Validación estricta por hostname para evitar falsos positivos
 * (URLs externas que contengan el nombre de la plataforma en su path o query).
 *
 * No usa `new URL()` porque su implementación en React Native (Hermes) es
 * inconsistente con la del navegador. En su lugar, usa regex para extraer
 * los componentes de la URL — funciona igual en web, iOS y Android.
 */

import {
  extractVideoId,
  fetchVideoMetadata,
  getThumbnailUrl,
  getYouTubeUrl,
} from "./youtube";

export const PLATFORMS = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    color: "#FF0000",
    icon: "logo-youtube",
    placeholder: "https://youtube.com/watch?v=...",
    homeUrl: "https://www.youtube.com/",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: "logo-instagram",
    placeholder: "https://instagram.com/reel/...",
    homeUrl: "https://www.instagram.com/",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    color: "#111111",
    icon: "logo-tiktok",
    placeholder: "https://tiktok.com/@usuario/video/...",
    homeUrl: "https://www.tiktok.com/",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: "logo-facebook",
    placeholder: "https://facebook.com/watch?v=...",
    homeUrl: "https://www.facebook.com/",
  },
};

export const PLATFORM_ORDER = ["youtube", "instagram", "tiktok", "facebook"];

const HOST_ALLOWLIST = {
  youtube: ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"],
  instagram: ["instagram.com", "instagr.am"],
  tiktok: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  facebook: ["facebook.com", "fb.watch", "fb.com", "m.facebook.com"],
};

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(s)) return `https://${s}`;
  return s;
}

/**
 * Parser de URL portable. Devuelve { hostname, pathname, search, query }
 * o null si la URL no es parseable.
 */
function parseUrlParts(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;
  // protocolo://[userinfo@]host[:puerto]/path?search#hash
  const match = url.match(
    /^https?:\/\/(?:[^@/]*@)?([^/:?#]+)(?::\d+)?([/?#].*)?$/i
  );
  if (!match) return null;
  const hostname = match[1].toLowerCase();
  const rest = match[2] || "/";
  // separar path / search / hash
  const hashIdx = rest.indexOf("#");
  const beforeHash = hashIdx >= 0 ? rest.slice(0, hashIdx) : rest;
  const qIdx = beforeHash.indexOf("?");
  const pathname = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
  const search = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : "";
  // parsear query a objeto (clave -> valor decodificado)
  const query = {};
  if (search) {
    for (const pair of search.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const key = eq >= 0 ? pair.slice(0, eq) : pair;
      const val = eq >= 0 ? pair.slice(eq + 1) : "";
      try {
        query[decodeURIComponent(key)] = decodeURIComponent(val.replace(/\+/g, " "));
      } catch (e) {
        query[key] = val;
      }
    }
  }
  return { hostname, pathname: pathname || "/", search, query };
}

function bareHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function hostMatches(hostname, allowed) {
  const h = bareHost(hostname);
  return allowed.some((a) => h === a || h.endsWith("." + a));
}

function detectByHost(parts) {
  if (!parts) return null;
  for (const platform of PLATFORM_ORDER) {
    if (hostMatches(parts.hostname, HOST_ALLOWLIST[platform])) return platform;
  }
  return null;
}

function rebuildUrl(parts) {
  const search = parts.search ? `?${parts.search}` : "";
  return `https://${parts.hostname}${parts.pathname}${search}`;
}

function validateYoutube(parts) {
  const videoId = extractVideoId(rebuildUrl(parts));
  if (videoId) {
    return { videoId, mediaId: videoId, url: getYouTubeUrl(videoId) };
  }
  return null;
}

function validateInstagram(parts) {
  // /[user/]p|reel|reels|tv/<id>
  const m = parts.pathname.match(
    /^\/(?:([\w.\-]+)\/)?(p|reel|reels|tv)\/([\w-]+)\/?$/i
  );
  if (m) {
    return {
      mediaId: m[3],
      videoId: null,
      url: rebuildUrl(parts),
      kind: m[2].toLowerCase(),
      author: m[1] ? `@${m[1]}` : null,
    };
  }
  return null;
}

function validateTiktok(parts) {
  const host = bareHost(parts.hostname);
  // Enlaces cortos: vm.tiktok.com/XXXX o vt.tiktok.com/XXXX
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    const m = parts.pathname.match(/^\/([\w]+)\/?$/);
    if (m)
      return {
        mediaId: m[1],
        videoId: null,
        url: rebuildUrl(parts),
        author: null,
      };
    return null;
  }
  // tiktok.com: /@usuario/video/12345
  const userVideo = parts.pathname.match(/^\/@([\w.\-]+)\/video\/(\d+)\/?$/i);
  if (userVideo) {
    return {
      mediaId: userVideo[2],
      videoId: null,
      url: rebuildUrl(parts),
      author: `@${userVideo[1]}`,
    };
  }
  // tiktok.com: /v/12345, /t/abc
  for (const re of [/^\/v\/(\d+)\/?$/i, /^\/t\/([\w]+)\/?$/i]) {
    const m = parts.pathname.match(re);
    if (m)
      return {
        mediaId: m[1],
        videoId: null,
        url: rebuildUrl(parts),
        author: null,
      };
  }
  return null;
}

function validateFacebook(parts) {
  const host = bareHost(parts.hostname);
  // fb.watch/abc
  if (host === "fb.watch") {
    const m = parts.pathname.match(/^\/([\w-]+)\/?$/);
    if (m)
      return {
        mediaId: m[1],
        videoId: null,
        url: rebuildUrl(parts),
        author: null,
      };
    return null;
  }
  // facebook.com/watch?v=12345 (también /watch/?v=)
  if (/^\/watch\/?$/.test(parts.pathname) && parts.query.v) {
    return {
      mediaId: parts.query.v,
      videoId: null,
      url: rebuildUrl(parts),
      author: null,
    };
  }
  // /usuario/videos/12345 ó /usuario/videos/algo/12345
  const userVideos = parts.pathname.match(
    /^\/([\w.\-]+)\/videos(?:\/[\w.\-]+)?\/(\d+)\/?$/i
  );
  if (userVideos) {
    const u = userVideos[1];
    const isUsername = isNaN(Number(u));
    return {
      mediaId: userVideos[2],
      videoId: null,
      url: rebuildUrl(parts),
      author: isUsername ? `@${u}` : null,
    };
  }
  // /reel/12345 ó /reels/12345
  const reel = parts.pathname.match(/^\/reels?\/(\d+)\/?$/i);
  if (reel) {
    return {
      mediaId: reel[1],
      videoId: null,
      url: rebuildUrl(parts),
      author: null,
    };
  }
  // /share/r/abc, /share/v/abc, /share/p/abc
  const share = parts.pathname.match(/^\/share\/(?:r|v|p)\/([\w-]+)\/?$/i);
  if (share) {
    return {
      mediaId: share[1],
      videoId: null,
      url: rebuildUrl(parts),
      author: null,
    };
  }
  // /story.php?story_fbid=...&id=...
  if (/^\/story\.php\/?$/.test(parts.pathname) && parts.query.story_fbid) {
    return {
      mediaId: parts.query.story_fbid,
      videoId: null,
      url: rebuildUrl(parts),
      author: null,
    };
  }
  return null;
}

export function detectPlatform(rawUrl) {
  const parts = parseUrlParts(rawUrl);
  return detectByHost(parts);
}

export function parseMediaLink(rawUrl) {
  const parts = parseUrlParts(rawUrl);
  if (!parts) return null;
  const platform = detectByHost(parts);
  if (!platform) return null;

  let result = null;
  if (platform === "youtube") result = validateYoutube(parts);
  else if (platform === "instagram") result = validateInstagram(parts);
  else if (platform === "tiktok") result = validateTiktok(parts);
  else if (platform === "facebook") result = validateFacebook(parts);

  if (!result) return null;
  return {
    platform,
    mediaId: result.mediaId,
    videoId: result.videoId,
    url: result.url,
    kind: result.kind || null,
    author: result.author || null,
  };
}

/**
 * Devuelve un título y autor por defecto para un media detectado.
 * Útil para auto-rellenar el formulario en plataformas que no exponen
 * metadatos públicos (Instagram, TikTok, Facebook).
 */
export function getMediaDefaults(media) {
  if (!media) return { title: "", author: "" };
  if (media.platform === "youtube") {
    return { title: "", author: "" };
  }
  let title = "";
  if (media.platform === "instagram") {
    if (media.kind === "reel" || media.kind === "reels") title = "Reel de Instagram";
    else if (media.kind === "tv") title = "IGTV de Instagram";
    else title = "Post de Instagram";
  } else if (media.platform === "tiktok") {
    title = "Video de TikTok";
  } else if (media.platform === "facebook") {
    title = "Video de Facebook";
  }
  return { title, author: media.author || "" };
}

export function getPlatform(platformId) {
  return PLATFORMS[platformId] || null;
}

export function getPlatformHomeUrl(platformId) {
  return PLATFORMS[platformId]?.homeUrl || "https://www.google.com/";
}

export function getPreviewThumbnail(media) {
  if (!media) return null;
  if (media.platform === "youtube" && media.videoId) {
    return getThumbnailUrl(media.videoId, "hq");
  }
  return null;
}

export function getSongThumbnail(song, quality = "hq") {
  if (!song) return null;
  if ((song.platform === "youtube" || !song.platform) && song.videoId) {
    return getThumbnailUrl(song.videoId, quality);
  }
  return null;
}

export function getSongUrl(song) {
  if (!song) return null;
  if (song.url) return song.url;
  if (song.videoId) return getYouTubeUrl(song.videoId);
  return null;
}

export function getSongPlatform(song) {
  if (!song) return PLATFORMS.youtube;
  return PLATFORMS[song.platform] || PLATFORMS.youtube;
}

export { fetchVideoMetadata };
