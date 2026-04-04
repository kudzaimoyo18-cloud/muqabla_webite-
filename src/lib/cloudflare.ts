const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const STREAM_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

export async function getDirectUploadUrl(): Promise<{ uploadUrl: string; videoId: string } | null> {
  try {
    const response = await fetch(`${STREAM_URL}/direct_upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxDurationSeconds: 300, requireSignedURLs: false }),
    });

    const data = await response.json();
    if (data.success && data.result) {
      return { uploadUrl: data.result.uploadURL, videoId: data.result.uid };
    }
    return null;
  } catch (error) {
    console.error('Cloudflare direct upload error:', error);
    return null;
  }
}

export async function getVideoDetails(videoId: string) {
  try {
    const response = await fetch(`${STREAM_URL}/${videoId}`, {
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });
    const data = await response.json();
    return data.success ? data.result : null;
  } catch {
    return null;
  }
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    const response = await fetch(`${STREAM_URL}/${videoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getPlaybackUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
}

export function getThumbnailUrl(videoId: string, time = 1): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=${time}s`;
}

export function getEmbedUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${videoId}/iframe`;
}
