import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types/platform'

const PLATFORM_FEE_RATE = 0.15
const GST_RATE = 0.10

export async function POST(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ success: true })
}
