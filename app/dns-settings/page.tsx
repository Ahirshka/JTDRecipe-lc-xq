"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DNSRecord {
  type: string
  name: string
  value: string
  priority?: number
  ttl: number
  description: string
  status?: "checking" | "valid" | "invalid" | "unknown"
}

interface DNSStatus {
  domain: string
  records: DNSRecord[]
  overallStatus: "checking" | "valid" | "partial" | "invalid"
  lastChecked: string
}

const requiredDNSRecords: DNSRecord[] = [
  {
    type: "A",
    name: "@",
    value: "76.76.19.61",
    ttl: 300,
    description: "Main domain pointing to Vercel",
  },
  {
    type: "CNAME",
    name: "www",
    value: "cname.vercel-dns.com",
    ttl: 300,
    description: "WWW subdomain redirect",
  },
  {
    type: "MX",
    name: "@",
    value: "mx1.forwardemail.net",
    priority: 10,
    ttl: 300,
    description: "Primary email server",
  },
  {
    type: "MX",
    name: "@",
    value: "mx2.forwardemail.net",
    priority: 20,
    ttl: 300,
    description: "Secondary email server",
  },
  {
    type: "TXT",
    name: "@",
    value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
    ttl: 300,
    description: "SPF record for email authentication",
  },
  {
    type: "TXT",
    name: "_dmarc",
    value: "v=DMARC1; p=quarantine; rua=mailto:contact@justthedamnrecipe.net",
    ttl: 300,
    description: "DMARC policy for email security",
  },
]

export default function DNSSettingsPage() {
  const [dnsStatus, setDnsStatus] = useState<DNSStatus>({
    domain: "justthedamnrecipe.net",
    records: requiredDNSRecords.map((record) => ({ ...record, status: "unknown" })),
    overallStatus: "unknown",
    lastChecked: "",
  })
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${description} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the text manually",
        variant: "destructive",
      })
    }
  }

  const checkDNSStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/test/dns-status")
      if (response.ok) {
        const data = await response.json()
        setDnsStatus(data)
      } else {
        toast({
          title: "DNS Check Failed",
          description: "Unable to check DNS status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("DNS check error:", error)
      toast({
        title: "DNS Check Error",
        description: "Network error while checking DNS status.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDNSStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "checking":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>
      case "invalid":
        return <Badge className="bg-red-100 text-red-800">Invalid</Badge>
      case "checking":
        return <Badge className="bg-blue-100 text-blue-800">Checking</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DNS Configuration</h1>
          <p className="text-gray-600">
            Configure these DNS records with your domain registrar for justthedamnrecipe.net
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Domain Status: {dnsStatus.domain}</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(dnsStatus.overallStatus)}
                <Button onClick={checkDNSStatus} disabled={isChecking} size="sm" variant="outline">
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dnsStatus.lastChecked && <p className="text-sm text-gray-500">Last checked: {dnsStatus.lastChecked}</p>}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                DNS changes can take up to 48 hours to propagate worldwide. If you just made changes, please wait before
                checking again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* DNS Records */}
        <div className="grid gap-6">
          {dnsStatus.records.map((record, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>
                    {record.type} Record - {record.name === "@" ? "Root Domain" : record.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status || "unknown")}
                    {getStatusBadge(record.status || "unknown")}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{record.description}</p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border text-sm">{record.type}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(record.type, "Record type")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border text-sm">{record.name}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(record.name, "Record name")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded border text-sm flex-1 break-all">{record.value}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(record.value, "Record value")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {record.priority && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <div className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded border text-sm">{record.priority}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(record.priority!.toString(), "Priority")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TTL</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border text-sm">{record.ttl}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(record.ttl.toString(), "TTL")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Access Your Domain Registrar</h3>
              <p className="text-gray-600">Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Find DNS Management</h3>
              <p className="text-gray-600">Look for "DNS Management", "DNS Records", or "Advanced DNS" section</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">3. Add Each Record</h3>
              <p className="text-gray-600">Use the copy buttons above to add each DNS record exactly as shown</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">4. Wait for Propagation</h3>
              <p className="text-gray-600">DNS changes can take up to 48 hours to propagate worldwide</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">5. Verify Configuration</h3>
              <p className="text-gray-600">Use the "Refresh" button above to check your DNS configuration</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
