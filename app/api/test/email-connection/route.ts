import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    // Check if required environment variables are configured
    const missingVars = []
    if (!process.env.RESEND_API_KEY) missingVars.push("RESEND_API_KEY")
    if (!process.env.FROM_EMAIL) missingVars.push("FROM_EMAIL")

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Email configuration incomplete",
        details: `Missing environment variables: ${missingVars.join(", ")}`,
        error: `Missing variables: ${missingVars.join(", ")}`,
      })
    }

    // Validate API key format
    const apiKey = process.env.RESEND_API_KEY!
    if (!apiKey.startsWith("re_")) {
      return NextResponse.json({
        success: false,
        message: "Invalid Resend API key format",
        details: "RESEND_API_KEY should start with 're_'",
        error: "Invalid API key format",
      })
    }

    // Validate email format
    const fromEmail = process.env.FROM_EMAIL!
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json({
        success: false,
        message: "Invalid FROM_EMAIL format",
        details: "FROM_EMAIL must be a valid email address",
        error: "Invalid email format",
      })
    }

    // Test Resend connection
    const resend = new Resend(apiKey)

    // Test API key validity by checking domains (this doesn't send an email)
    const startTime = Date.now()

    try {
      // Try to get domains - this validates the API key without sending emails
      const domains = await resend.domains.list()
      const connectionTime = Date.now() - startTime

      // Check if the FROM_EMAIL domain is verified
      const fromDomain = fromEmail.split("@")[1]
      const verifiedDomains = domains.data?.filter((domain) => domain.status === "verified") || []
      const isDomainVerified = verifiedDomains.some((domain) => domain.name === fromDomain)

      let domainStatus = "Domain verification needed"
      if (isDomainVerified) {
        domainStatus = "Domain is verified and ready"
      } else if (verifiedDomains.length > 0) {
        domainStatus = `Domain not verified. Verified domains: ${verifiedDomains.map((d) => d.name).join(", ")}`
      }

      return NextResponse.json({
        success: true,
        message: "Email service connection successful",
        details: `Connected to Resend in ${connectionTime}ms. ${domainStatus}`,
        data: {
          connection_time: connectionTime,
          api_key_valid: true,
          from_email: fromEmail,
          from_domain: fromDomain,
          domain_verified: isDomainVerified,
          verified_domains: verifiedDomains.map((d) => d.name),
          total_domains: domains.data?.length || 0,
        },
      })
    } catch (resendError) {
      const connectionTime = Date.now() - startTime

      if (resendError instanceof Error) {
        // Handle specific Resend API errors
        if (resendError.message.includes("401") || resendError.message.includes("Unauthorized")) {
          return NextResponse.json({
            success: false,
            message: "Invalid Resend API key",
            details: "The RESEND_API_KEY is invalid or expired. Get a new one from your Resend dashboard.",
            error: "Unauthorized - Invalid API key",
          })
        } else if (resendError.message.includes("403") || resendError.message.includes("Forbidden")) {
          return NextResponse.json({
            success: false,
            message: "Resend API access denied",
            details: "Your API key doesn't have permission to access this resource.",
            error: "Forbidden - Insufficient permissions",
          })
        } else if (resendError.message.includes("429")) {
          return NextResponse.json({
            success: false,
            message: "Resend API rate limit exceeded",
            details: "Too many requests. Wait a moment and try again.",
            error: "Rate limit exceeded",
          })
        }
      }

      throw resendError // Re-throw if not a specific Resend error
    }
  } catch (error) {
    console.error("Email service test error:", error)

    let errorMessage = "Email service connection failed"
    let errorDetails = "Unknown email service error"

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes("fetch")) {
        errorDetails = "Network error connecting to Resend API. Check your internet connection."
      } else if (error.message.includes("timeout")) {
        errorDetails = "Request to Resend API timed out. Try again in a moment."
      } else {
        errorDetails = `Email service error: ${error.message}`
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        details: errorDetails,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
