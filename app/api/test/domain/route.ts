import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = "justthedamnrecipe.net"
    const testResults = {
      domain_accessible: false,
      ssl_valid: false,
      response_time: 0,
      status_code: 0,
      redirect_chain: [] as string[],
      ssl_details: {} as any,
    }

    // Test 1: Basic HTTP/HTTPS accessibility
    const startTime = Date.now()

    try {
      // Test HTTPS first
      const httpsUrl = `https://${domain}`
      const response = await fetch(httpsUrl, {
        method: "HEAD",
        redirect: "manual", // Don't follow redirects automatically
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      testResults.response_time = Date.now() - startTime
      testResults.status_code = response.status
      testResults.domain_accessible = response.status < 500

      // Check for redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (location) {
          testResults.redirect_chain.push(`${response.status} -> ${location}`)
        }
      }

      // If HTTPS works, SSL is likely valid
      if (response.status < 500) {
        testResults.ssl_valid = true
      }
    } catch (httpsError) {
      // If HTTPS fails, try HTTP
      try {
        const httpUrl = `http://${domain}`
        const response = await fetch(httpUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        })

        testResults.response_time = Date.now() - startTime
        testResults.status_code = response.status
        testResults.domain_accessible = response.status < 500
        testResults.ssl_valid = false // HTTP means no SSL
      } catch (httpError) {
        testResults.response_time = Date.now() - startTime
        throw new Error(
          `Both HTTPS and HTTP failed: ${httpsError instanceof Error ? httpsError.message : "Unknown error"}`,
        )
      }
    }

    // Test 2: Check if it's actually serving the app
    let servingApp = false
    let appDetails = ""

    try {
      const fullResponse = await fetch(`https://${domain}`, {
        signal: AbortSignal.timeout(10000),
      })

      if (fullResponse.ok) {
        const html = await fullResponse.text()

        // Check for Next.js indicators
        if (html.includes("__NEXT_DATA__") || html.includes("_next/")) {
          servingApp = true
          appDetails = "Next.js application detected"
        } else if (html.includes("Just The Damn Recipe") || html.includes("recipe")) {
          servingApp = true
          appDetails = "Recipe application content detected"
        } else if (html.length > 100) {
          servingApp = true
          appDetails = "Website is serving content"
        } else {
          appDetails = "Website accessible but content unclear"
        }
      }
    } catch (error) {
      appDetails = `Could not fetch full page: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    // Determine overall success
    const success = testResults.domain_accessible && testResults.ssl_valid && servingApp

    let message = "Domain test completed"
    let details = ""

    if (success) {
      message = "Domain is fully operational"
      details = `${domain} is accessible via HTTPS in ${testResults.response_time}ms. ${appDetails}`
    } else if (!testResults.domain_accessible) {
      message = "Domain is not accessible"
      details = `${domain} returned status ${testResults.status_code} or failed to respond`
    } else if (!testResults.ssl_valid) {
      message = "SSL certificate issue"
      details = `${domain} is accessible but SSL/HTTPS is not working properly`
    } else if (!servingApp) {
      message = "Domain accessible but app not detected"
      details = `${domain} responds but may not be serving your application correctly`
    }

    return NextResponse.json({
      success,
      message,
      details,
      data: {
        domain,
        accessible: testResults.domain_accessible,
        ssl_valid: testResults.ssl_valid,
        serving_app: servingApp,
        response_time: testResults.response_time,
        status_code: testResults.status_code,
        redirect_chain: testResults.redirect_chain,
        app_details: appDetails,
        test_url: `https://${domain}`,
      },
    })
  } catch (error) {
    console.error("Domain test error:", error)

    let errorMessage = "Domain test failed"
    let errorDetails = "Could not test domain connectivity"

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes("timeout")) {
        errorDetails = "Domain request timed out. The server may be slow or unreachable."
      } else if (error.message.includes("DNS")) {
        errorDetails = "DNS resolution failed. Check your domain configuration."
      } else if (error.message.includes("certificate")) {
        errorDetails = "SSL certificate error. Check your SSL configuration."
      } else if (error.message.includes("connection")) {
        errorDetails = "Connection failed. The server may be down or unreachable."
      } else {
        errorDetails = `Domain connectivity error: ${error.message}`
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        details: errorDetails,
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          domain: "justthedamnrecipe.net",
          accessible: false,
          ssl_valid: false,
          serving_app: false,
          response_time: 0,
          status_code: 0,
        },
      },
      { status: 500 },
    )
  }
}
