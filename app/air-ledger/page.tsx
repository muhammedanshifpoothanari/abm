"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Edit,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function AirLedger() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creditSettings, setCreditSettings] = useState<any>(null)

  useEffect(() => {
    fetchBookings()
    fetchCreditSettings()
  }, [searchQuery, paymentFilter, agentFilter])

  const fetchCreditSettings = async () => {
    try {
      const response = await fetch("/api/credit-settings")
      const data = await response.json()
      setCreditSettings(data)
    } catch (error) {
      console.error("Error fetching credit settings:", error)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [searchQuery, paymentFilter, agentFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter)
      if (agentFilter !== "all") params.append("agent", agentFilter)

      const response = await fetch(`/api/air-bookings?${params}`)
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.agent?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPayment = paymentFilter === "all" || booking.paymentStatus?.toLowerCase() === paymentFilter
    const matchesAgent = agentFilter === "all" || booking.agent === agentFilter

    return matchesSearch && matchesPayment && matchesAgent
  })

  // Financial calculations
  const totalTicketCost = filteredBookings.reduce((sum, booking) => sum + (booking.ticketCost || 0), 0)
  const totalAmountReceived = filteredBookings.reduce((sum, booking) => sum + (booking.amountReceived || 0), 0)
  const totalDueAmount = filteredBookings.reduce((sum, booking) => sum + (booking.dueBalance || 0), 0)
  const totalProfit = filteredBookings.reduce((sum, booking) => sum + (booking.profit || 0), 0)
  const availableCredit = creditSettings ? creditSettings.availableCredit : 0

  const handleEdit = (bookingId: string) => {
    router.push(`/air-ledger/edit-booking?id=${bookingId}`)
  }

  const handleDelete = async (bookingId: string) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      try {
        const response = await fetch(`/api/air-bookings/${bookingId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setBookings(bookings.filter((booking) => booking._id !== bookingId))
          alert("Booking deleted successfully!")
        } else {
          alert("Failed to delete booking")
        }
      } catch (error) {
        console.error("Error deleting booking:", error)
        alert("Error deleting booking")
      }
    }
  }

  const handleExportStatement = () => {
    const csvContent = [
      [
        "Date",
        "Reference",
        "Description",
        "Debit (Out)",
        "Credit (In)",
        "Due Balance",
        "Profit/Loss",
        "Agent",
        "Payment Status",
      ],
      ...filteredBookings.map((booking) => [
        booking.createdAt.split("T")[0],
        booking.referenceNumber,
        booking.shortDescription,
        booking.ticketCost,
        booking.amountReceived,
        booking.dueBalance,
        booking.profit,
        booking.paymentStatus,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `air-ledger-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleGenerateInvoice = (booking: any) => {
    // Generate invoice logic
    const invoiceContent = `
INVOICE
Reference: ${booking.referenceNumber}
Date: ${booking.createdAt.split("T")[0]}
Customer: ${booking.shortDescription.split(" - ")[0]}
Flight: ${booking.shortDescription}
Amount: ﷼${booking.amountReceived}
Status: ${booking.paymentStatus}
    `

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${booking.referenceNumber}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportEntry = (booking: any) => {
    const entryContent = `
BOOKING ENTRY
Reference: ${booking.referenceNumber}
Date: ${booking.createdAt.split("T")[0]}
Description: ${booking.fullDescription}
Ticket Cost: ﷼${booking.ticketCost}
Amount Received: ﷼${booking.amountReceived}
Due Balance: ﷼${booking.dueBalance}
Profit/Loss: ﷼${booking.profit}
Agent: ${booking.agent}
Payment Status: ${booking.paymentStatus}
    `

    const blob = new Blob([entryContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `booking-${booking.referenceNumber}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Bookings</h1>
              <p className="text-gray-600">Manage your air ticket bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/air-ledger/credit-management")}>
              Credit Management
            </Button>
            <Button variant="outline" onClick={handleExportStatement}>
              <Download className="h-4 w-4 mr-2" />
              Export Ledger
            </Button>
            <Button onClick={() => router.push("/air-ledger/new-booking")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Booking Ledger Card */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Ledger</CardTitle>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Payment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All...</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All...</SelectItem>
                  <SelectItem value="akbar">Akbar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Due Amount</span>
                </div>
                <p className="text-xl font-bold text-red-600">﷼{totalDueAmount.toFixed(2)}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                  <ArrowDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Available Credit</span>
                </div>
                <p className="text-xl font-bold text-blue-600">﷼{availableCredit.toFixed(2)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Profit</span>
                </div>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ﷼{totalProfit.toFixed(2)}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                  <span className="text-sm font-medium">Total Credit Limit</span>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  ﷼{creditSettings ? creditSettings.totalCredit.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>REFERENCE</TableHead>
                  <TableHead>Perticular</TableHead>
                  <TableHead>Cost (OUT)</TableHead>
                  <TableHead>Revenue(IN)</TableHead>
                  <TableHead>DUE BALANCE</TableHead>
                  <TableHead>PROFIT/LOSS</TableHead>
                  <TableHead>AGENT</TableHead>
                  <TableHead>PAYMENT</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.createdAt.split("T")[0]}</TableCell>
                      <TableCell className="font-mono text-sm">{booking.referenceNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{booking.shortDescription}</span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Flight Details - {booking.referenceNumber}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="whitespace-pre-line text-sm">{booking.fullDescription}</div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                  <div>
                                    <p className="text-sm font-medium">Financial Details</p>
                                    <p className="text-sm">Ticket Cost: ﷼{booking.ticketCost}</p>
                                    <p className="text-sm">Amount Received: ﷼{booking.amountReceived}</p>
                                    <p className="text-sm">Due Balance: ﷼{booking.dueBalance}</p>
                                    <p className="text-sm">Profit/Loss: ﷼{booking.profit}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Booking Info</p>
                                    <p className="text-sm">Agent: {booking.agent}</p>
                                    <p className="text-sm">Status: {booking.paymentStatus}</p>
                                    <p className="text-sm">Date: {booking.createdAt.split("T")[0]}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />﷼{booking.ticketCost?.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        <div className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3" />﷼{booking.amountReceived?.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">﷼{booking.dueBalance?.toFixed(2)}</TableCell>
                      <TableCell className={`font-medium ${booking.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <div className="flex items-center gap-1">
                          {booking.profit >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingUp className="h-3 w-3 rotate-180" />
                          )}
                          ﷼{Math.abs(booking.profit)?.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{booking.agent}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(booking._id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleGenerateInvoice(booking)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleExportEntry(booking)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDelete(booking._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredBookings.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">No bookings found matching your search criteria</p>
              </div>
            )}

            {/* Enhanced Pagination with Summary */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <p>
                  Showing {filteredBookings.length} of {bookings.length} entries
                </p>
                <p className="mt-1">
                  Total Out: <span className="font-medium text-red-600">﷼{totalTicketCost.toFixed(2)}</span> | Total In:{" "}
                  <span className="font-medium text-green-600 ml-1">﷼{totalAmountReceived.toFixed(2)}</span> | Net:{" "}
                  <span className={`font-medium ml-1 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ﷼{totalProfit.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">
                  Page 1 of 1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
