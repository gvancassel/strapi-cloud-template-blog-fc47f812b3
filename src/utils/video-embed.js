'use strict';

/**
 * Utilities to normalize YouTube/Vimeo URLs into safe, embeddable iframe URLs.
 *
 * Editors usually paste regular share URLs (e.g. https://www.youtube.com/watch?v=ID
 * or https://vimeo.com/ID), but those cannot be loaded inside an <iframe>.
 * This normalizer accepts any of the common URL shapes and returns the proper
 * embed URL plus useful metadata (provider, videoId).
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
]);

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function safeParseUrl(input) {
  if (!input || typeof input !== 'string') return null;
  try {
    return new URL(input.trim());
  } catch (_) {
    return null;
  }
}

function extractYouTubeId(url) {
  const path = url.pathname.replace(/^\/+/, '');
  const segments = path.split('/').filter(Boolean);

  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
    return segments[0] || null;
  }

  const v = url.searchParams.get('v');
  if (v && YOUTUBE_ID_RE.test(v)) return v;

  // /embed/ID, /shorts/ID, /live/ID, /v/ID
  const known = ['embed', 'shorts', 'live', 'v'];
  if (segments.length >= 2 && known.includes(segments[0])) {
    return segments[1];
  }

  return null;
}

function extractVimeoId(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  // player.vimeo.com/video/ID  OR  vimeo.com/ID  OR  vimeo.com/channels/foo/ID
  if (segments[0] === 'video' && segments[1]) return segments[1];
  // last numeric segment is the video id
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(segments[i])) return segments[i];
  }
  return null;
}

/**
 * Normalize an arbitrary YouTube/Vimeo URL into an embeddable iframe URL.
 *
 * @param {string} input
 * @returns {{ originalUrl: string|null, provider: 'youtube'|'vimeo'|null, videoId: string|null, embedUrl: string|null }}
 */
function normalizeVideoUrl(input) {
  const result = {
    originalUrl: typeof input === 'string' ? input : null,
    provider: null,
    videoId: null,
    embedUrl: null,
  };

  const url = safeParseUrl(input);
  if (!url) return result;

  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    const id = extractYouTubeId(url);
    if (id) {
      result.provider = 'youtube';
      result.videoId = id;
      result.embedUrl = `https://www.youtube.com/embed/${id}`;
    }
    return result;
  }

  if (VIMEO_HOSTS.has(host)) {
    const id = extractVimeoId(url);
    if (id) {
      result.provider = 'vimeo';
      result.videoId = id;
      result.embedUrl = `https://player.vimeo.com/video/${id}`;
    }
    return result;
  }

  return result;
}

/**
 * Walk a `blocks` dynamic-zone array and enrich any `shared.video-embed`
 * entries with `embedUrl`, `provider`, and `videoId`. Mutates and returns
 * the array.
 */
function enrichVideoEmbedBlocks(blocks) {
  if (!Array.isArray(blocks)) return blocks;
  for (const block of blocks) {
    if (block && block.__component === 'shared.video-embed' && block.url) {
      const { provider, videoId, embedUrl } = normalizeVideoUrl(block.url);
      block.provider = provider;
      block.videoId = videoId;
      block.embedUrl = embedUrl;
    }
  }
  return blocks;
}

module.exports = {
  normalizeVideoUrl,
  enrichVideoEmbedBlocks,
};
