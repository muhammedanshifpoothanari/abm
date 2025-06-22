"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreditManagement() {
  const router = useRouter()
  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [totalCredit, setTotalCredit] = useState("7010")
  const [usedCredit, setUsedCredit] = useState("3650")
  const [notes, setNotes] = useState("")

  // Calculate available credit
  const availableCredit = Number.parseFloat(totalCredit) - Number.parseFloat(usedCredit)

  useEffect(() => {
    fetchCreditSettings()
  }, [])

  const fetchCreditSettings = async () => {
    try {
      const response = await fetch("/api/credit-settings")
      const data = await response.json()
      setTotalCredit(data.totalCredit.toString())
      setUsedCredit(data.usedCredit.toString())
      setNotes(data.notes || "")
    } catch (error) {
      console.error("Error fetching credit settings:", error)
    }
  }

  const handleUpdateCredit = async () => {
    try {
      console.log("Sending data:", { totalCredit, notes })  // Check values
  
      const response = await fetch("/api/credit-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalCredit,
          notes,
        }),
      })
  
      // Check if response is ok (status 200-299)
      if (response.ok) {
        alert("Credit limit updated successfully!")
        setIsEditingTotal(false)
        await fetchCreditSettings() // Refresh data
      } else {
        // Handle the error response
        let errorMsg = "Unknown error"
        try {
          const error = await response.json()
          errorMsg = error.error || error.message
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError)
          errorMsg = 'Invalid error response'
        }
        alert(`Error: ${errorMsg}`)
      }
    } catch (error:any) {
      console.error("Error updating credit:", error)
      alert(`${totalCredit} Error updating credit limits. Error: ${error.message || error}`)
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
            <h1 className="text-2xl font-bold">Credit Management</h1>
            <p className="text-gray-600">Set and manage the available credit limit</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Credit Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg text-center relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-blue-600">Total Credit</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingTotal(!isEditingTotal)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                {isEditingTotal ? (
                  <Input
                    type="number"
                    value={totalCredit}
                    onChange={(e) => setTotalCredit(e.target.value)}
                    className="text-center text-2xl font-bold"
                    onBlur={() => setIsEditingTotal(false)}
                    autoFocus
                  />
                ) : (
                  <p className="text-3xl font-bold text-blue-700">﷼{Number.parseFloat(totalCredit).toLocaleString()}</p>
                )}
              </div>

              <div className="bg-red-50 p-6 rounded-lg text-center relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-red-600">Used Credit</h3>
                  <span className="text-xs text-red-500">(Auto-calculated)</span>
                </div>
                <p className="text-3xl font-bold text-red-700">﷼{Number.parseFloat(usedCredit).toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1">Based on actual bookings</p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg text-center">
                <h3 className="text-sm font-medium text-green-600 mb-2">Available Credit</h3>
                <p className="text-3xl font-bold text-green-700">﷼{availableCredit.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">(Auto-calculated)</p>
              </div>
            </div>

            {/* Credit Update Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Update Total Credit Amount (﷼)
                </label>
                <Input
                  type="number"
                  value={totalCredit}
                  onChange={(e) => setTotalCredit(e.target.value)}
                  className="text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set the total credit limit. Current available credit: ﷼{availableCredit.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Used Credit Amount (﷼) - Auto-calculated
                </label>
                <Input type="number" value={usedCredit} readOnly disabled className="text-lg bg-gray-50" />
                <p className="text-sm text-gray-500 mt-1">
                  This amount is automatically calculated from all flight bookings. Current available credit: ﷼
                  {availableCredit.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <Textarea
                  placeholder="Add any notes about this credit update"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpdateCredit}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
              >
                Update Credit Limit
              </Button>

              <div className="text-center text-sm text-gray-500">
                <p>Last Updated</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
