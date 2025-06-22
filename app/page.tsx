"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, Plane, Wallet, ArrowUp, ArrowDown, TrendingUp, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Dashboard() {
  const router = useRouter()
  const { logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [airLedgerData, setAirLedgerData] = useState({
    totalOut: 0,
    totalIn: 0,
    net: 0,
  })
  const [moneyLedgerData, setMoneyLedgerData] = useState({
    totalCredit: 0,
    totalDebit: 0,
    currentBalance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch AirLedger data
      const airResponse = await fetch("/api/air-bookings")
      const airBookings = await airResponse.json()

      const totalOut = airBookings.reduce((sum: number, booking: any) => sum + (booking.ticketCost || 0), 0)
      const totalIn = airBookings.reduce((sum: number, booking: any) => sum + (booking.amountReceived || 0), 0)
      const net = totalIn - totalOut

      setAirLedgerData({
        totalOut,
        totalIn,
        net,
      })

      // Fetch MoneyLedger data
      const moneyResponse = await fetch("/api/customers")
      const customers = await moneyResponse.json()

      const totalCredit = customers.reduce((sum: number, customer: any) => sum + (customer.totalCredit || 0), 0)
      const totalDebit = customers.reduce((sum: number, customer: any) => sum + (customer.totalDebit || 0), 0)
      const currentBalance = customers.reduce((sum: number, customer: any) => sum + (customer.balance || 0), 0)

      setMoneyLedgerData({
        totalCredit,
        totalDebit,
        currentBalance,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLedgerClick = (ledgerType: "air" | "money") => {
    if (ledgerType === "air") {
      router.push("/air-ledger")
    } else {
      router.push("/money-ledger")
    }
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Ledger Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AirLedger Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
            onClick={() => handleLedgerClick("air")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Plane className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xl">AirLedger</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600">
                      <ArrowUp className="h-4 w-4" />
                      <span className="font-medium">Total Out</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">﷼{airLedgerData.totalOut.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <ArrowDown className="h-4 w-4" />
                      <span className="font-medium">Total In</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">﷼{airLedgerData.totalIn.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${airLedgerData.net >= 0 ? "text-green-600" : "text-red-600 rotate-180"}`}
                        />
                        <span className="font-medium text-gray-700">Net Profit</span>
                      </div>
                      <span
                        className={`text-2xl font-bold ${airLedgerData.net >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ﷼{airLedgerData.net.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* MoneyLedger Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
            onClick={() => handleLedgerClick("money")}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xl">MoneyLedger</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <ArrowUp className="h-4 w-4" />
                      <span className="font-medium">Total Credit</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      ﷼{moneyLedgerData.totalCredit.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600">
                      <ArrowDown className="h-4 w-4" />
                      <span className="font-medium">Total Debit</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">
                      ﷼{moneyLedgerData.totalDebit.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Current Balance</span>
                      <span
                        className={`text-2xl font-bold ${moneyLedgerData.currentBalance >= 0 ? "text-blue-600" : "text-red-600"}`}
                      >
                        ﷼{moneyLedgerData.currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
