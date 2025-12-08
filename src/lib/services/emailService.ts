import { Resend } from 'resend';

// Lazy initialization to prevent build errors when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static getFromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || 'noreply@goalflow.app';
  }

  static async sendEmail(data: EmailNotificationData): Promise<boolean> {
    const resend = getResend();
    if (!resend) {
      console.warn('RESEND_API_KEY is not set. Email notifications are disabled.');
      return false;
    }

    try {
      await resend.emails.send({
        from: this.getFromEmail(),
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  static async sendGoalStatusChangeNotification(
    email: string,
    goalTitle: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<boolean> {
    const subject = `Goal Status Changed: ${goalTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Goal Status Changed</h2>
        <p>Your goal <strong>${goalTitle}</strong> status has been updated:</p>
        <p>
          <span style="padding: 4px 8px; background-color: #f0f0f0; border-radius: 4px;">${oldStatus}</span>
          →
          <span style="padding: 4px 8px; background-color: #e3f2fd; border-radius: 4px;">${newStatus}</span>
        </p>
        <p>Visit your dashboard to see more details.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  static async sendProgressUpdateNotification(
    email: string,
    goalTitle: string,
    progress: number,
  ): Promise<boolean> {
    const subject = `Progress Update: ${goalTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Progress Update</h2>
        <p>Your goal <strong>${goalTitle}</strong> progress has been updated:</p>
        <div style="background-color: #f0f0f0; border-radius: 4px; height: 24px; margin: 16px 0;">
          <div style="background-color: #4caf50; height: 100%; width: ${progress}%; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${progress}%
          </div>
        </div>
        <p>Visit your dashboard to see more details.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  static async sendDeadlineReminderNotification(
    email: string,
    goalTitle: string,
    daysLeft: number,
  ): Promise<boolean> {
    const subject = `Deadline Reminder: ${goalTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Deadline Reminder</h2>
        <p>Your goal <strong>${goalTitle}</strong> deadline is approaching!</p>
        <p style="font-size: 18px; color: #ff9800; font-weight: bold;">
          ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining
        </p>
        <p>Visit your dashboard to update your progress.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  static async sendWorkspaceInvitation(
    email: string,
    workspaceName: string,
    inviterName: string,
    inviteLink: string,
  ): Promise<boolean> {
    const subject = `Invitation to join ${workspaceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Workspace Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy this link: ${inviteLink}</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

