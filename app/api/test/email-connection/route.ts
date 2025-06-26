import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY not configured",
        },
        { status: 400 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test connection by attempting to get domains
    try {
      const { data, error } = await resend.domains.list()

      if (error) {
        return NextResponse.json({
          success: false,
          error: `Resend API error: ${error.message}`,
          details: error,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Resend",
        domains: data?.data || [],
        api_key_valid: true,
      })
    } catch (apiError: any) {
      return NextResponse.json({
        success: false,
        error: `Connection failed: ${apiError.message}`,
        details: apiError,
      })
    }
  } catch (error: any) {
    console.error("Email connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Connection test failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
