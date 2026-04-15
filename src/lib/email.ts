// @ts-nocheck
/**
 * teech-platform â Email Client (Resend)
 *
 * All transactional emails go through this module.
 * No marketing emails. No tracking pixels. Australian English throughout.
 *
 * Templates:
 *   sendParentConsentRequest  â when a student registers and names a parent
 *   sendMonthlyParentReport   â monthly progress summary to parent
 *   sendTutorPrompt           â parent notification when child fails twice
 *   sendWWCExpiryAlert        â tutor WWC renewal reminder
 *   sendBadgeEarned           â optional badge notification to parent
 */

import { PLATFORM } from './constants'
import { logger } from './logger'

const RESEND_API_KEY = process.env['RESEND_API_KEY']
const FROM_ADDRESS   = process.env['SYSTEM_EMAIL_FROM'] ?? `noreply@teech.au`

interface EmailPayload {
  to:      string
  subject: string
  html:    string
  text:    string
}

async function send(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logger.warn('email', 'RESEND_API_KEY not set â email not sent', { to: payload.to, subject: payload.subject })
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `teech.au <${FROM_ADDRESS}>`,
        to:   payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      logger.error('email', 'Resend API error', { status: res.status, error, subject: payload.subject })
      return false
    }

    logger.info('email', 'Email sent', { to: payload.to, subject: payload.subject })
    return true
  } catch (err) {
    logger.error('email', 'Email send failed', { error: String(err), subject: payload.subject })
    return false
  }
}

// ââ Shared email wrapper ââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>teech.au</title>
  <style>
    body { margin: 0; padding: 0; background: #090E1A; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
    .logo { font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 32px; }
    .logo span { color: #14B8A6; }
    .card { background: #111827; border: 1px solid rgba(20,184,166,0.18); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.7; color: #64748B; margin: 0 0 16px; }
    p.light { color: #94A3B8; }
    .btn { display: inline-block; background: #14B8A6; color: #090E1A; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(20,184,166,0.08); }
    .stat-label { font-size: 13px; color: #64748B; }
    .stat-value { font-size: 13px; font-weight: 700; color: #ffffff; }
    .footer { font-size: 11px; color: #334155; text-align: center; margin-top: 32px; line-height: 1.8; }
    .footer a { color: #14B8A6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">te<span>e</span>ch<span style="opacity:0.4">.au</span></div>
    ${body}
    <div class="footer">
      teech.au is operated by Flecco Group Pty Ltd ATF Flecco Family Trust, Perth WA.<br />
      All data stored in Sydney, Australia. Never sold. Never shared.<br />
      <a href="https://teech.au/privacy">Privacy Policy</a> &nbsp;&middot;&nbsp;
      <a href="mailto:support@teech.au">Support</a>
    </div>
  </div>
</body>
</html>`
}

// ââ Templates âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export async function sendParentConsentRequest(params: {
  parentEmail: string
  studentName: string
  studentEmail: string
}): Promise<boolean> {
  const subject = `${params.studentName} wants to join teech.au â your approval is needed`

  const html = baseHtml(`
    <div class="card">
      <h1>Your approval is needed</h1>
      <p>
        <strong style="color:#ffffff">${params.studentName}</strong> has signed up for teech.au
        and listed you as their parent or guardian. Before their account activates,
        we need your confirmation.
      </p>
      <p>
        teech.au is an Australian learning platform that helps students pass ACARA
        curriculum sections and earn verified credentials. No ads. No tracking.
        Your child's data stays in Australia.
      </p>
      <p>
        <strong style="color:#ffffff">What you can do:</strong> view all your child's progress,
        receive monthly reports, manage their privacy settings, and request data deletion at any time.
      </p>
      <p style="text-align:center;margin-top:24px">
        <a href="https://teech.au/register/parent?consent=true&studentEmail=${encodeURIComponent(params.studentEmail)}" class="btn">
          Approve and create my account
        </a>
      </p>
    </div>
    <p class="light" style="font-size:13px">
      If you did not expect this email, please ignore it. No account will be activated
      without your explicit approval. Questions? Email us at support@teech.au.
    </p>
  `)

  const text = `${params.studentName} has registered for teech.au and listed you as their parent or guardian.\n\nVisit https://teech.au/register/parent to approve their account and create your own.\n\nteech.au â ${PLATFORM.OPERATOR}`

  return send({ to: params.parentEmail, subject, html, text })
}

export async function sendTutorPrompt(params: {
  parentEmail:  string
  studentName:  string
  sectionName:  string
  failCount:    number
}): Promise<boolean> {
  const subject = `${params.studentName} has attempted ${params.sectionName} ${params.failCount} times`

  const html = baseHtml(`
    <div class="card">
      <h1>A targeted session could help</h1>
      <p>
        <strong style="color:#ffffff">${params.studentName}</strong> has attempted
        <strong style="color:#14B8A6">${params.sectionName}</strong> ${params.failCount} times
        without passing. A 30-minute session with a verified Australian tutor, targeted
        exactly to this concept, is available to book.
      </p>
      <div class="stat-row"><span class="stat-label">Section</span><span class="stat-value">${params.sectionName}</span></div>
      <div class="stat-row"><span class="stat-label">Attempts so far</span><span class="stat-value">${params.failCount}</span></div>
      <div class="stat-row" style="border:0"><span class="stat-label">Session rate</span><span class="stat-value">$49 / 30 min</span></div>
      <p style="margin-top:20px">
        The tutor will receive a summary of exactly which concepts ${params.studentName}
        is finding difficult â prepared automatically from their assessment data.
      </p>
      <p style="text-align:center;margin-top:24px">
        <a href="https://teech.au/parent/dashboard" class="btn">
          View progress and book a session
        </a>
      </p>
    </div>
  `)

  const text = `${params.studentName} has attempted ${params.sectionName} ${params.failCount} times.\n\nA targeted tutoring session may help. Visit https://teech.au/parent/dashboard to view progress and book.\n\nteech.au`

  return send({ to: params.parentEmail, subject, html, text })
}

export async function sendWWCExpiryAlert(params: {
  tutorEmail:     string
  tutorName:      string
  state:          string
  expiryDate:     string
  daysUntilExpiry: number
}): Promise<boolean> {
  const isCritical = params.daysUntilExpiry <= 14
  const subject = isCritical
    ? `URGENT â Your ${params.state} Working With Children Check expires in ${params.daysUntilExpiry} days`
    : `Reminder â Your ${params.state} Working With Children Check expires soon`

  const html = baseHtml(`
    <div class="card" style="border-color:${isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.18)'}">
      <h1>${isCritical ? 'Urgent action required' : 'WWC renewal reminder'}</h1>
      <p>
        Hello <strong style="color:#ffffff">${params.tutorName}</strong>,
      </p>
      <p>
        Your <strong style="color:#ffffff">${params.state} Working With Children Check</strong>
        expires on <strong style="color:#14B8A6">${params.expiryDate}</strong>
        â that is ${params.daysUntilExpiry} day${params.daysUntilExpiry !== 1 ? 's' : ''} away.
      </p>
      ${isCritical ? '<p style="color:#FC8181"><strong>Your tutor profile will be suspended automatically if the check expires without renewal.</strong></p>' : ''}
      <p>
        Please renew your check directly with your state authority and send your new
        check number to <a href="mailto:support@teech.au" style="color:#14B8A6">support@teech.au</a>.
      </p>
      <div class="stat-row"><span class="stat-label">State</span><span class="stat-value">${params.state}</span></div>
      <div class="stat-row" style="border:0"><span class="stat-label">Expires</span><span class="stat-value">${params.expiryDate}</span></div>
    </div>
  `)

  const text = `Your ${params.state} WWC check expires on ${params.expiryDate} (${params.daysUntilExpiry} days). Please renew and send your new check number to support@teech.au.\n\nteech.au`

  return send({ to: params.tutorEmail, subject, html, text })
}

export async function sendMonthlyParentReport(params: {
  parentEmail:     string
  parentName:      string
  studentName:     string
  sectionsPassedThisMonth: number
  totalPassed:     number
  streakCurrent:   number
  consistencyScore: number
  strongestStrand: string | null
  weakestStrand:   string | null
  recommendedAction: string
}): Promise<boolean> {
  const subject = `${params.studentName}'s monthly learning report â teech.au`

  const html = baseHtml(`
    <div class="card">
      <h1>${params.studentName}'s Monthly Report</h1>
      <p>Here is a plain-language summary of ${params.studentName}'s learning this month.</p>

      <div class="stat-row"><span class="stat-label">Sections passed this month</span><span class="stat-value">${params.sectionsPassedThisMonth}</span></div>
      <div class="stat-row"><span class="stat-label">Total sections passed (all time)</span><span class="stat-value">${params.totalPassed}</span></div>
      <div class="stat-row"><span class="stat-label">Current study streak</span><span class="stat-value">${params.streakCurrent} days</span></div>
      <div class="stat-row"><span class="stat-label">Consistency score</span><span class="stat-value">${params.consistencyScore.toFixed(0)}%</span></div>
      ${params.strongestStrand ? `<div class="stat-row"><span class="stat-label">Strongest area</span><span class="stat-value">${params.strongestStrand.replace(/_/g, ' ')}</span></div>` : ''}
      ${params.weakestStrand ? `<div class="stat-row" style="border:0"><span class="stat-label">Area to focus on</span><span class="stat-value">${params.weakestStrand.replace(/_/g, ' ')}</span></div>` : ''}

      <div style="background:#0F1D35;border:1px solid rgba(20,184,166,0.15);border-radius:10px;padding:16px;margin-top:20px">
        <p style="font-size:12px;font-weight:700;color:#14B8A6;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">One recommended action</p>
        <p style="margin:0;color:#94A3B8;font-size:14px">${params.recommendedAction}</p>
      </div>

      <p style="text-align:center;margin-top:24px">
        <a href="https://teech.au/parent/dashboard" class="btn">
          View full report
        </a>
      </p>
    </div>
  `)

  const text = `${params.studentName}'s monthly report from teech.au.\n\nPassed this month: ${params.sectionsPassedThisMonth}\nAll-time total: ${params.totalPassed}\nStreak: ${params.streakCurrent} days\nConsistency: ${params.consistencyScore.toFixed(0)}%\n\nRecommendation: ${params.recommendedAction}\n\nView the full report: https://teech.au/parent/dashboard`

  return send({ to: params.parentEmail, subject, html, text })
}
