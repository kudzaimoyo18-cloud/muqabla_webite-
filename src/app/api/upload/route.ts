import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error('Missing Cloudflare env vars:', { accountId: !!accountId, apiToken: !!apiToken });
      return NextResponse.json({ error: 'Video upload not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxDurationSeconds: 300, requireSignedURLs: false }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error('Cloudflare API error:', JSON.stringify(data.errors || data));
      return NextResponse.json({ error: 'Failed to get upload URL', details: data.errors }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      videoId: data.result.uid,
    });
  } catch (error: any) {
    console.error('Upload URL error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
