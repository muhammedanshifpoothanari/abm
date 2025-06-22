"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, Plus, Edit, ArrowUp, ArrowDown, Users, FileText, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MoneyLedger() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [customerName])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (customerName) {
        params.append("search", customerName)
      }

      const response = await fetch(`/api/customers?${params}`)
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = (customerName: string) => {
    router.push(`/money-ledger/add-entry?customer=${customerName}`)
  }

  const handleCustomerClick = (customerName: string) => {
    router.push(`/money-ledger/customer-statement?customer=${customerName}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">MoneyLedger</h1>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">MoneyLedger</h1>
              <p className="text-gray-600">Simple credit/debit tracking per customer</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/money-ledger/customer-management")}>
              <Users className="h-4 w-4 mr-2" />
              Manage Customers
            </Button>
            <Button variant="outline" onClick={() => router.push("/money-ledger/all-statements")}>
              <FileText className="h-4 w-4 mr-2" />
              View All Statements
            </Button>
            <Button onClick={() => router.push("/money-ledger/add-entry")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Search Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Search customers..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Cards List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Customer Ledgers {customerName && `(${customers.length} found)`}</h2>
          </div>

          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer._id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleCustomerClick(customer.name)}
                    >
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleAddEntry(customer.name)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Credit</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ﷼{(customer.totalCredit || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <ArrowDown className="h-4 w-4" />
                        <span className="text-sm font-medium">Debit</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">﷼{(customer.totalDebit || 0).toLocaleString()}</p>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-1">Balance</div>
                      <p className="text-lg font-bold text-blue-600">﷼{(customer.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        {customer.email} {customer.phone && `• ${customer.phone}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {customers.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {customerName ? `No customers found matching "${customerName}"` : "No customers found"}
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => router.push("/money-ledger/add-entry")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/money-ledger/customer-management")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Customers
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
