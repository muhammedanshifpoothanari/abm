"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewBooking() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("transaction")
  const [creditSettings, setCreditSettings] = useState<any>(null)
  const [creditValidation, setCreditValidation] = useState<{
    isValid: boolean
    message: string
    type: "success" | "warning" | "error"
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    referenceNumber: `BK${Date.now()}`,
    customerName: "",
    email: "",
    phone: "",
    departurePlace: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    debitAmount: "",
    creditAmount: "",
    agent: "",
    paymentStatus: "Pending",
    notes: "",
  })

  useEffect(() => {
    fetchCreditSettings()
  }, [])

  useEffect(() => {
    // Validate credit whenever debit amount changes
    if (formData.debitAmount && creditSettings) {
      validateCredit()
    }
  }, [formData.debitAmount, creditSettings])

  const fetchCreditSettings = async () => {
    try {
      const response = await fetch("/api/credit-settings")
      const data = await response.json()
      setCreditSettings(data)
    } catch (error) {
      console.error("Error fetching credit settings:", error)
    }
  }

  const validateCredit = () => {
    const ticketCost = Number.parseFloat(formData.debitAmount) || 0
    const availableCredit = creditSettings?.availableCredit || 0

    if (ticketCost === 0) {
      setCreditValidation(null)
      return
    }

    if (ticketCost > availableCredit) {
      setCreditValidation({
        isValid: false,
        message: `Insufficient credit! Ticket cost ﷼${ticketCost.toFixed(2)} exceeds available credit ﷼${availableCredit.toFixed(2)}`,
        type: "error",
      })
    } else if (ticketCost > availableCredit * 0.8) {
      setCreditValidation({
        isValid: true,
        message: `Warning: This booking will use ${((ticketCost / creditSettings.totalCredit) * 100).toFixed(1)}% of total credit. Remaining: ﷼${(availableCredit - ticketCost).toFixed(2)}`,
        type: "warning",
      })
    } else {
      setCreditValidation({
        isValid: true,
        message: `Credit check passed. Remaining after booking: ﷼${(availableCredit - ticketCost).toFixed(2)}`,
        type: "success",
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateEntry = async () => {
    if (!formData.customerName || !formData.departurePlace || !formData.destination || !formData.debitAmount) {
      alert("Please fill in all required fields")
      return
    }

    if (creditValidation && !creditValidation.isValid) {
      alert("Cannot create booking: " + creditValidation.message)
      return
    }

    try {
      const response = await fetch("/api/air-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert("Booking created successfully!")
        router.push("/air-ledger")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Error creating booking")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/air-ledger")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Booking</h1>
            <p className="text-gray-600">Add a new air ticket booking</p>
          </div>
        </div>

        {/* Credit Status Card */}
        {creditSettings && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-700">Credit Status</h3>
                  <p className="text-sm text-gray-600">
                    Available: ﷼{creditSettings.availableCredit.toFixed(2)} of ﷼{creditSettings.totalCredit.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">﷼{creditSettings.availableCredit.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Available Credit</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="transaction" className="text-purple-600">
                  Transaction Details
                </TabsTrigger>
                <TabsTrigger value="financial">Financial Information</TabsTrigger>
              </TabsList>

              <TabsContent value="transaction" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                    <Input
                      value={formData.referenceNumber}
                      onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                      placeholder="Auto-generated"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Place *</label>
                    <Input
                      value={formData.departurePlace}
                      onChange={(e) => handleInputChange("departurePlace", e.target.value)}
                      placeholder="e.g., New York (NYC)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => handleInputChange("destination", e.target.value)}
                      placeholder="e.g., London (LHR)"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date</label>
                    <Input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => handleInputChange("departureDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Date (Optional)</label>
                    <Input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => handleInputChange("returnDate", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Debit Amount (﷼) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.debitAmount}
                      onChange={(e) => handleInputChange("debitAmount", e.target.value)}
                      placeholder="Ticket cost"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credit Amount (﷼)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.creditAmount}
                      onChange={(e) => handleInputChange("creditAmount", e.target.value)}
                      placeholder="Amount received"
                    />
                  </div>
                </div>

                {/* Credit Validation Alert */}
                {creditValidation && (
                  <Alert
                    className={`${
                      creditValidation.type === "error"
                        ? "border-red-200 bg-red-50"
                        : creditValidation.type === "warning"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {creditValidation.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {creditValidation.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {creditValidation.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      <AlertDescription
                        className={`${
                          creditValidation.type === "error"
                            ? "text-red-700"
                            : creditValidation.type === "warning"
                              ? "text-yellow-700"
                              : "text-green-700"
                        }`}
                      >
                        {creditValidation.message}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
                    <Select value={formData.agent} onValueChange={(value) => handleInputChange("agent", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="akbar">Akbar</SelectItem>
                        <SelectItem value="sarah">Sarah</SelectItem>
                        <SelectItem value="mike">Mike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => handleInputChange("paymentStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Add any additional notes here"
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <Button variant="outline" onClick={() => router.push("/air-ledger")}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateEntry}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={creditValidation && !creditValidation.isValid}
              >
                Create Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
