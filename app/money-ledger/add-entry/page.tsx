"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AddEntry() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerParam = searchParams.get("customer")
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    debitAmount: "",
    creditAmount: "",
    notes: "",
  })

  useEffect(() => {
    if (customerParam && customerParam !== formData.customerName) {
      setFormData((prev) => ({ ...prev, customerName: customerParam }))
    }
  }, [customerParam])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEntry = async () => {
    if (!formData.customerName) {
      alert("Please enter a customer name")
      return
    }

    if (!formData.debitAmount && !formData.creditAmount) {
      alert("Please enter either a debit or credit amount")
      return
    }

    try {
      const response = await fetch("/api/money-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert("Entry saved successfully!")
        router.push("/money-ledger")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error saving entry:", error)
      alert("Error saving entry")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/money-ledger")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Entry</h1>
            <p className="text-gray-600">Add a new transaction entry</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Ledger Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <Input type="date" value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} />
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Debit Amount (﷼)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.debitAmount}
                  onChange={(e) => handleInputChange("debitAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Amount (﷼)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.creditAmount}
                  onChange={(e) => handleInputChange("creditAmount", e.target.value)}
                  placeholder="0.00"
                />
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

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.push("/money-ledger")}>
                Cancel
              </Button>
              <Button onClick={handleSaveEntry}>Save Entry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
