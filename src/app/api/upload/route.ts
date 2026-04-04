import { NextResponse } from 'next/server';
import { getDirectUploadUrl } from '@/lib/cloudflare';

export async function POST() {
  try {
    const result = await getDirectUploadUrl();

    if (!result) {
      return NextResponse.json({ error: 'Failed to get upload URL' }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl: result.uploadUrl, videoId: result.videoId });
  } catch (error) {
    console.error('Upload URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
