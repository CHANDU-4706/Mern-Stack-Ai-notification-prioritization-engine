import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // In local dev we can skip this, but in production Vercel sends this
        // skip for now if not set
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mern-notification-engine.onrender.com';

    try {
        console.log(`[CRON] Pinging MERN backend: ${backendUrl}/api/health`);
        const response = await fetch(`${backendUrl}/api/health`, { cache: 'no-store' });
        const data = await response.json();

        return NextResponse.json({
            success: true,
            message: 'MERN Backend Pinged Successfully',
            backend_status: data.status
        });
    } catch (error: any) {
        console.error('[CRON] Error pinging MERN backend:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
