import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Dipanggil Vercel Cron setiap hari agar proyek Supabase (free tier) tidak ter-pause.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  if (!supabase) return NextResponse.json({ ok: false, error: 'supabase env belum diisi' }, { status: 500 });

  const { error } = await supabase.from('keep_alive').select('id').limit(1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
}
