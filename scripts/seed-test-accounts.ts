/**
 * teech-platform — Test Account Seed Script
 * Run with: npx ts-node --esm scripts/seed-test-accounts.ts
 *
 * Creates four test accounts in Supabase:
 *   test.student@teech.au  — Alex Chen (Year 9 student, streak 5, 4 sections unlocked)
 *   test.parent@teech.au   — Sam Chen  (parent, linked to student)
 *   test.tutor@teech.au    — Jordan Lee (tutor, WWC verified, Stripe complete, $75/hr)
 *   test.admin@teech.au    — Admin account (full admin access)
 *
 * Safe to re-run — existing accounts are skipped.
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PASSWORD = 'TeechTest2025!';

const ACCOUNTS = [
  { email: 'test.student@teech.au', role: 'student', display_name: 'Alex Chen' },
  { email: 'test.parent@teech.au',  role: 'parent',  display_name: 'Sam Chen'  },
  { email: 'test.tutor@teech.au',   role: 'tutor',   display_name: 'Jordan Lee' },
  { email: 'test.admin@teech.au',   role: 'admin',   display_name: 'Admin'     },
];

async function upsertUser(email: string, role: string, displayName: string): Promise<string | null> {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`  Already exists — skipping: ${email} (${found.id})`);
    return found.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { role, display_name: displayName },
  });
  if (error || !data.user) {
    console.error(`  ERROR creating ${email}:`, error?.message);
    return null;
  }
  console.log(`  Created: ${email} (${data.user.id})`);
  return data.user.id;
}

async function seedStudent(userId: string): Promise<void> {
  await admin
    .from('student_profiles')
    .update({ year_level: 9, current_streak: 5, longest_streak: 5 })
    .eq('user_id', userId);

  const slugs = [
    'year-9-science-ecosystems',
    'year-9-science-dna',
    'year-9-science-evolution',
    'year-9-science-body-systems',
  ];
  for (const slug of slugs) {
    const { data: section } = await admin
      .from('curriculum_sections')
      .select('id')
      .eq('slug', slug)
      .single();
    if (!section) continue;
    await admin.from('student_section_progress').upsert(
      { student_id: userId, section_id: section.id, is_unlocked: true, cards_read: 0, cards_total: 2 },
      { onConflict: 'student_id,section_id' }
    );
  }
  console.log('  Student profile updated — streak 5, 4 sections unlocked');
}

async function seedTutor(userId: string): Promise<void> {
  await admin
    .from('tutor_profiles')
    .update({
      status: 'active',
      wwc_number: 'WWC-TEST-0001',
      wwc_verified_at: new Date().toISOString(),
      wwc_expiry: '2028-12-31',
      hourly_rate_cents: 7500,
      average_rating: 4.8,
      review_count: 12,
      stripe_account_id: 'acct_test_placeholder',
      stripe_onboarding_complete: true,
      bio: 'Experienced Year 9 Science tutor. Test account.',
      subjects: ['Science'],
    })
    .eq('user_id', userId);
  console.log('  Tutor profile updated — active, WWC verified, $75/hr, 4.8 rating');
}

async function linkParentChild(parentId: string, studentId: string): Promise<void> {
  await admin
    .from('parent_child_links')
    .upsert({ parent_id: parentId, student_id: studentId }, { onConflict: 'parent_id,student_id' });
  console.log(`  Parent-child link: ${parentId} -> ${studentId}`);
}

async function main(): Promise<void> {
  console.log('\n=== teech-platform seed script ===\n');
  const ids: Record<string, string> = {};
  for (const account of ACCOUNTS) {
    console.log(`Processing: ${account.email}`);
    const id = await upsertUser(account.email, account.role, account.display_name);
    if (id) ids[account.role] = id;
  }
  if (ids['student']) await seedStudent(ids['student']);
  if (ids['tutor'])   await seedTutor(ids['tutor']);
  if (ids['parent'] && ids['student']) await linkParentChild(ids['parent'], ids['student']);

  console.log('\n=== Seed complete ===');
  console.log('  test.student@teech.au -', ids['student'] ?? 'skipped');
  console.log('  test.parent@teech.au  -', ids['parent']  ?? 'skipped');
  console.log('  test.tutor@teech.au   -', ids['tutor']   ?? 'skipped');
  console.log('  test.admin@teech.au   -', ids['admin']   ?? 'skipped');
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
