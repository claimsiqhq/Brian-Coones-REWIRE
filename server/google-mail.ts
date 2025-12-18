import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

export async function getGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, body: string, fromName?: string): string {
  const emailLines = [
    `To: ${to}`,
    fromName ? `From: ${fromName}` : '',
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].filter(line => line !== '');

  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  fromName?: string
) {
  const gmail = await getGmailClient();
  
  const encodedMessage = createEmailMessage(to, subject, htmlBody, fromName);
  
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data;
}

export async function sendSessionBookingEmail(
  clientEmail: string,
  clientName: string,
  coachName: string,
  sessionDate: Date,
  sessionDuration: number,
  notes?: string
) {
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Coaching Session Scheduled with ${coachName}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Your Coaching Session is Confirmed!</h2>
      <p>Hi ${clientName},</p>
      <p>Your coaching session has been scheduled with <strong>${coachName}</strong>.</p>
      
      <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6d28d9;">Session Details</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${sessionDuration} minutes</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
      
      <p>A calendar invite has been sent to your email. Please make sure to add it to your calendar.</p>
      
      <p>Looking forward to your session!</p>
      
      <p style="color: #6b7280; font-size: 14px;">— MindfulCoach Team</p>
    </div>
  `;

  return sendEmail(clientEmail, subject, htmlBody, 'MindfulCoach');
}

export async function sendSessionReminderEmail(
  clientEmail: string,
  clientName: string,
  coachName: string,
  sessionDate: Date
) {
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Reminder: Coaching Session Tomorrow with ${coachName}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Session Reminder</h2>
      <p>Hi ${clientName},</p>
      <p>This is a friendly reminder about your upcoming coaching session.</p>
      
      <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6d28d9;">Session Details</h3>
        <p><strong>Coach:</strong> ${coachName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>
      
      <p>See you soon!</p>
      
      <p style="color: #6b7280; font-size: 14px;">— MindfulCoach Team</p>
    </div>
  `;

  return sendEmail(clientEmail, subject, htmlBody, 'MindfulCoach');
}

export async function sendDailyCheckInReminderEmail(
  userEmail: string,
  userName: string
) {
  const subject = `Daily Check-in Reminder`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Time for Your Daily Check-in!</h2>
      <p>Hi ${userName},</p>
      <p>This is a friendly reminder to take a moment and check in with yourself today.</p>
      
      <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #6d28d9;">Quick Check-in Ideas</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Log your current mood</li>
          <li>Write a quick journal entry</li>
          <li>Check off your daily habits</li>
          <li>Take a few deep breaths</li>
        </ul>
      </div>
      
      <p>Remember, consistency is key to personal growth. Even a quick check-in counts!</p>
      
      <p style="color: #6b7280; font-size: 14px;">— MindfulCoach Team</p>
      <p style="color: #9ca3af; font-size: 12px;">You're receiving this because you enabled daily reminders in your settings. You can turn them off anytime in your profile.</p>
    </div>
  `;

  return sendEmail(userEmail, subject, htmlBody, 'MindfulCoach');
}
