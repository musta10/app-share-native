/**
 * Utilidades para trabajar con URLs de YouTube
 */

export function extractVideoId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function getThumbnailUrl(videoId, quality = "hq") {
  if (!videoId) return null;
  const map = {
    max: "maxresdefault",
    hq: "hqdefault",
    mq: "mqdefault",
    sd: "sddefault",
  };
  const file = map[quality] || "hqdefault";
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
}

export function getYouTubeUrl(videoId) {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function fetchVideoMetadata(videoId) {
  if (!videoId) return null;
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || getThumbnailUrl(videoId),
    };
  } catch (error) {
    return null;
  }
}
