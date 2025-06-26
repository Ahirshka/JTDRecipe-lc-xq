import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = "justthedamnrecipe.net"
    const records = [
      {
        type: "A",
        name: "@",
        value: "76.76.19.61",
        ttl: 300,
        description: "Main domain pointing to Vercel",
        status: "checking",
      },
      {
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
        ttl: 300,
        description: "WWW subdomain redirect",
        status: "checking",
      },
      {
        type: "MX",
        name: "@",
        value: "mx1.forwardemail.net",
        priority: 10,
        ttl: 300,
        description: "Primary email server",
        status: "checking",
      },
      {
        type: "MX",
        name: "@",
        value: "mx2.forwardemail.net",
        priority: 20,
        ttl: 300,
        description: "Secondary email server",
        status: "checking",
      },
      {
        type: "TXT",
        name: "@",
        value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
        ttl: 300,
        description: "SPF record for email authentication",
        status: "checking",
      },
      {
        type: "TXT",
        name: "_dmarc",
        value: "v=DMARC1; p=quarantine; rua=mailto:contact@justthedamnrecipe.net",
        ttl: 300,
        description: "DMARC policy for email security",
        status: "checking",
      },
    ]

    // Simulate DNS checking (in production, you'd use actual DNS lookup)
    const checkedRecords = records.map((record) => ({
      ...record,
      status: Math.random() > 0.5 ? "valid" : "invalid", // Random for demo
    }))

    const validCount = checkedRecords.filter((r) => r.status === "valid").length
    const overallStatus = validCount === records.length ? "valid" : validCount > 0 ? "partial" : "invalid"

    return NextResponse.json({
      domain,
      records: checkedRecords,
      overallStatus,
      lastChecked: new Date().toISOString(),
      summary: {
        total: records.length,
        valid: validCount,
        invalid: records.length - validCount,
      },
    })
  } catch (error) {
    console.error("DNS status check error:", error)
    return NextResponse.json({ error: "Failed to check DNS status" }, { status: 500 })
  }
}
