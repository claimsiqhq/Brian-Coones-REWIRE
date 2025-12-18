// SendGrid Email Service - using standard SendGrid setup
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('[SendGrid] Initialized with API key');
} else {
  console.warn('[SendGrid] SENDGRID_API_KEY not found - email functionality disabled');
}

function getSendGridClient() {
  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables.');
  }
  return {
    client: sgMail,
    fromEmail: fromEmail
  };
}

function getBaseUrl(): string {
  return process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'http://localhost:5000';
}

// Send coach invitation email
export async function sendCoachInviteEmail(
  recipientEmail: string,
  coachName: string,
  inviteCode: string
): Promise<void> {
  const { client, fromEmail } = getSendGridClient();
  const baseUrl = getBaseUrl();
  const inviteLink = `${baseUrl}/join/${inviteCode}`;
  
  const msg = {
    to: recipientEmail,
    from: {
      email: fromEmail,
      name: 'MindfulCoach'
    },
    subject: `${coachName} invites you to join MindfulCoach`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MindfulCoach</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your Personal Growth Companion</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              <strong>${coachName}</strong> has invited you to join MindfulCoach as their client. 
              As a client, you'll get access to:
            </p>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>Personalized mood tracking and insights</li>
              <li>AI-powered journal prompts</li>
              <li>Habit tracking with streak motivation</li>
              <li>Guided breathing exercises</li>
              <li>Direct connection with your coach</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Or copy this link: <br>
              <span style="color: #6b7280; word-break: break-all;">${inviteLink}</span>
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            This invitation was sent by ${coachName} via MindfulCoach.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `${coachName} has invited you to join MindfulCoach!\n\nClick here to accept: ${inviteLink}\n\nAs a client, you'll get personalized mood tracking, AI-powered journal prompts, habit tracking, and more.`
  };

  try {
    const [response] = await client.send(msg);
    console.log(`[SendGrid] Coach invite email sent to ${recipientEmail} - Status: ${response.statusCode}`);
  } catch (error: any) {
    console.error(`[SendGrid] Failed to send coach invite email to ${recipientEmail}`);
    if (error.response) {
      console.error('[SendGrid] Error body:', JSON.stringify(error.response.body, null, 2));
      console.error('[SendGrid] Error status:', error.response.statusCode);
    }
    throw error;
  }
}

// Send daily check-in reminder email
export async function sendDailyReminderEmail(
  recipientEmail: string,
  userName: string
): Promise<void> {
  const { client, fromEmail } = getSendGridClient();
  const baseUrl = getBaseUrl();
  
  const msg = {
    to: recipientEmail,
    from: {
      email: fromEmail,
      name: 'MindfulCoach'
    },
    subject: `Time for your daily check-in, ${userName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Daily Check-in</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">MindfulCoach</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Hey ${userName}! 👋</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              How are you feeling today? Taking a moment to check in with yourself can make a big difference in your wellness journey.
            </p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #4b5563; margin: 0; font-size: 14px;">
                <strong>Quick reminder:</strong> Log your mood, complete your habits, or write a quick journal entry to keep your streak going!
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Open MindfulCoach
              </a>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            You're receiving this because you enabled daily reminders. Update your preferences in the app settings.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Hey ${userName}!\n\nHow are you feeling today? Taking a moment to check in with yourself can make a big difference.\n\nOpen MindfulCoach: ${baseUrl}\n\nYou're receiving this because you enabled daily reminders.`
  };

  try {
    const [response] = await client.send(msg);
    console.log(`[SendGrid] Daily reminder email sent to ${recipientEmail} - Status: ${response.statusCode}`);
  } catch (error: any) {
    console.error(`[SendGrid] Failed to send daily reminder email to ${recipientEmail}`);
    if (error.response) {
      console.error('[SendGrid] Error body:', JSON.stringify(error.response.body, null, 2));
      console.error('[SendGrid] Error status:', error.response.statusCode);
    }
    throw error;
  }
}

// Send session booking confirmation email
export async function sendSessionBookingEmail(
  recipientEmail: string,
  recipientName: string,
  coachName: string,
  sessionDate: Date,
  sessionNotes?: string
): Promise<void> {
  const { client, fromEmail } = getSendGridClient();
  const baseUrl = getBaseUrl();
  
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  const msg = {
    to: recipientEmail,
    from: {
      email: fromEmail,
      name: 'MindfulCoach'
    },
    subject: `Coaching session confirmed with ${coachName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Session Confirmed ✓</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">MindfulCoach</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${recipientName}!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Your coaching session with <strong>${coachName}</strong> has been confirmed.
            </p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #4b5563; margin: 0 0 8px 0;"><strong>📅 Date & Time:</strong></p>
              <p style="color: #1f2937; margin: 0; font-size: 18px;">${formattedDate}</p>
              ${sessionNotes ? `
              <p style="color: #4b5563; margin: 16px 0 8px 0;"><strong>📝 Session Notes:</strong></p>
              <p style="color: #6b7280; margin: 0;">${sessionNotes}</p>
              ` : ''}
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                View in MindfulCoach
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${recipientName}!\n\nYour coaching session with ${coachName} has been confirmed.\n\nDate & Time: ${formattedDate}\n${sessionNotes ? `Notes: ${sessionNotes}\n` : ''}\nOpen MindfulCoach: ${baseUrl}`
  };

  try {
    const [response] = await client.send(msg);
    console.log(`[SendGrid] Session booking email sent to ${recipientEmail} - Status: ${response.statusCode}`);
  } catch (error: any) {
    console.error(`[SendGrid] Failed to send session booking email to ${recipientEmail}`);
    if (error.response) {
      console.error('[SendGrid] Error body:', JSON.stringify(error.response.body, null, 2));
      console.error('[SendGrid] Error status:', error.response.statusCode);
    }
    throw error;
  }
}

// Send welcome email to new users
export async function sendWelcomeEmail(
  recipientEmail: string,
  userName: string,
  role: 'client' | 'coach'
): Promise<void> {
  const { client, fromEmail } = getSendGridClient();
  const baseUrl = getBaseUrl();
  
  const roleSpecificContent = role === 'coach' 
    ? `
      <p style="color: #4b5563; line-height: 1.6;">
        As a coach, you can invite clients, track their progress, and guide them on their wellness journey.
      </p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Invite clients using the Clients tab</li>
        <li>View client mood trends and habits</li>
        <li>Schedule coaching sessions</li>
        <li>Assign homework and track completion</li>
      </ul>
    `
    : `
      <p style="color: #4b5563; line-height: 1.6;">
        Start your wellness journey with these powerful features:
      </p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Track your mood daily with emoji check-ins</li>
        <li>Build positive habits and watch your streaks grow</li>
        <li>Journal with AI-powered prompts</li>
        <li>Practice guided breathing exercises</li>
        <li>Chat with Coach Brian, your AI companion</li>
      </ul>
    `;

  const msg = {
    to: recipientEmail,
    from: {
      email: fromEmail,
      name: 'MindfulCoach'
    },
    subject: `Welcome to MindfulCoach, ${userName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MindfulCoach! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your Personal Growth Companion</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Hey ${userName}! 👋</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Welcome aboard! We're excited to have you join our community of mindful individuals.
            </p>
            ${roleSpecificContent}
            <div style="text-align: center; margin: 32px 0;">
              <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #f97316 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Get Started
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              If you have any questions, just reply to this email. We're here to help!
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to MindfulCoach, ${userName}!\n\nWe're excited to have you join our community.\n\nGet started: ${baseUrl}`
  };

  try {
    const [response] = await client.send(msg);
    console.log(`[SendGrid] Welcome email sent to ${recipientEmail} - Status: ${response.statusCode}`);
  } catch (error: any) {
    console.error(`[SendGrid] Failed to send welcome email to ${recipientEmail}`);
    if (error.response) {
      console.error('[SendGrid] Error body:', JSON.stringify(error.response.body, null, 2));
      console.error('[SendGrid] Error status:', error.response.statusCode);
    }
    throw error;
  }
}

// Test email function - sends to the configured from email
export async function sendTestEmail(): Promise<{ success: boolean; fromEmail: string; error?: string }> {
  try {
    const { client, fromEmail } = getSendGridClient();
    
    const msg = {
      to: fromEmail,
      from: {
        email: fromEmail,
        name: 'MindfulCoach Test'
      },
      subject: 'MindfulCoach - Email Test Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #8b5cf6;">Email Configuration Test</h1>
          <p>This is a test email from MindfulCoach.</p>
          <p>If you received this, your SendGrid integration is working correctly!</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </body>
        </html>
      `,
      text: `MindfulCoach Email Test - Sent at ${new Date().toISOString()}`
    };

    await client.send(msg);
    console.log(`[SendGrid] Test email sent successfully to ${fromEmail}`);
    return { success: true, fromEmail };
  } catch (error: any) {
    console.error('[SendGrid] Test email failed:', error);
    return { 
      success: false, 
      fromEmail: 'unknown',
      error: error.message || 'Unknown error'
    };
  }
}
