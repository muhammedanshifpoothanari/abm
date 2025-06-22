"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Download, Filter, Eye, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AllStatements() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all transactions
      const transactionsResponse = await fetch("/api/money-transactions")
      const transactionsData = await transactionsResponse.json()
      setTransactions(transactionsData)

      // Fetch all customers
      const customersResponse = await fetch("/api/customers")
      const customersData = await customersResponse.json()
      setCustomers(customersData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCustomer = customerFilter === "all" || transaction.customerName === customerFilter
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

    return matchesSearch && matchesCustomer && matchesStatus
  })

  // Calculate totals
  const totalCredit = filteredTransactions.reduce((sum, transaction) => sum + (transaction.credit || 0), 0)
  const totalDebit = filteredTransactions.reduce((sum, transaction) => sum + (transaction.debit || 0), 0)
  const netBalance = totalCredit - totalDebit

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleExportAll = () => {
    const csvContent = [
      ["Date", "Customer", "Description", "Debit", "Credit", "Balance", "Status", "Notes"],
      ...filteredTransactions.map((transaction) => [
        transaction.date,
        transaction.customerName,
        transaction.description,
        transaction.debit,
        transaction.credit,
        transaction.balance,
        transaction.status,
        transaction.notes || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-statements-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleViewCustomerStatement = (customerName: string) => {
    router.push(`/money-ledger/customer-statement?customer=${encodeURIComponent(customerName)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/money-ledger")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">All Customer Statements</h1>
              <p className="text-gray-600">View all transactions across all customers</p>
            </div>
          </div>

          <Button onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">Total Credit</span>
              </div>
              <p className="text-2xl font-bold text-green-600">﷼{totalCredit.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <ArrowDown className="h-4 w-4" />
                <span className="text-sm font-medium">Total Debit</span>
              </div>
              <p className="text-2xl font-bold text-red-600">﷼{totalDebit.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Net Balance</div>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ﷼{netBalance.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Transactions</div>
              <p className="text-2xl font-bold text-purple-600">{filteredTransactions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer.name}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Transactions
              {(searchQuery || customerFilter !== "all" || statusFilter !== "all") &&
                ` (${filteredTransactions.length} of ${transactions.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading transactions...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>CUSTOMER</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead>DEBIT</TableHead>
                    <TableHead>CREDIT</TableHead>
                    <TableHead>BALANCE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>NOTES</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleViewCustomerStatement(transaction.customerName)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {transaction.customerName}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{transaction.description}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {transaction.debit > 0 ? `﷼${transaction.debit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {transaction.credit > 0 ? `﷼${transaction.credit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        ﷼{transaction.balance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">{transaction.notes || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewCustomerStatement(transaction.customerName)}
                          title="View customer statement"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredTransactions.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery || customerFilter !== "all" || statusFilter !== "all"
                    ? "No transactions found matching your filters"
                    : "No transactions found"}
                </p>
              </div>
            )}

            {/* Pagination Summary */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <p>
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
                <p className="mt-1">
                  Total Credit: <span className="font-medium text-green-600">﷼{totalCredit.toFixed(2)}</span> | Total
                  Debit: <span className="font-medium text-red-600 ml-1">﷼{totalDebit.toFixed(2)}</span> | Net:{" "}
                  <span className={`font-medium ml-1 ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    ﷼{netBalance.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
