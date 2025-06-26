// Email service integration for verification and password reset emails
// This example uses Resend, but you can adapt it for other providers

import { Resend } from "resend"

// Initialize Resend (you'll need to add RESEND_API_KEY to your environment variables)
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private fromEmail = process.env.FROM_EMAIL || "contact@justthedamnrecipe.net"

  async sendEmail({ to, subject, html, from }: EmailTemplate): Promise<boolean> {
    const response = await resend.emails.send({
      from: from || this.fromEmail,
      to,
      subject,
      html,
    })
    return response.success
  }

  // Password reset email template
  async sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - Just The Damn Recipe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍳 Just The Damn Recipe</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${username},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${resetUrl}</p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 Just The Damn Recipe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return await this.sendEmail({
      to: email,
      subject: "Reset Your Password - Just The Damn Recipe",
      html,
    })
  }

  // Welcome email template
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Just The Damn Recipe! 🍳</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #ea580c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍳 Welcome to Just The Damn Recipe! 🍳</h1>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Welcome to the community! We're excited to have you join thousands of home cooks who are tired of life stories and just want the damn recipe.</p>
              
              <h3>What you can do now:</h3>
              
              <div class="feature">
                <h4>📖 Browse Recipes</h4>
                <p>Discover thousands of recipes without the fluff - just ingredients and instructions.</p>
              </div>
              
              <div class="feature">
                <h4>➕ Share Your Recipes</h4>
                <p>Add your favorite recipes and help others skip the stories.</p>
              </div>
              
              <div class="feature">
                <h4>❤️ Save Favorites</h4>
                <p>Build your personal recipe collection for quick access.</p>
              </div>
              
              <div class="feature">
                <h4>⭐ Rate & Review</h4>
                <p>Help the community by rating recipes and leaving helpful reviews.</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Start Cooking!</a>
              </p>
              
              <p>Happy cooking!</p>
              <p>The Just The Damn Recipe Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Just The Damn Recipe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return await this.sendEmail({
      to: email,
      subject: "Welcome to Just The Damn Recipe! 🍳",
      html,
    })
  }
}

export const emailService = new EmailService()
