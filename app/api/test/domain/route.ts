import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const hostname = new URL(domain).hostname

    // Test domain resolution
    const response = await fetch(domain, {
      method: "HEAD",
      headers: { "User-Agent": "JustTheDamnRecipe-HealthCheck/1.0" },
    })

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? "Domain is accessible" : "Domain is not accessible",
      details: `Status: ${response.status} ${response.statusText}`,
      domain: hostname,
      url: domain,
      status: response.status,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Domain test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
