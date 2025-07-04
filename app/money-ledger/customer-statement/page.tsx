"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Edit, Trash2, Share2, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CustomerStatement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customerName, setCustomerName] = useState("")
  const [customer, setCustomer] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    description: "",
    debit: "",
    credit: "",
    status: "",
    notes: "",
  })

  useEffect(() => {
    const customer = searchParams.get("customer")
    if (customer) {
      setCustomerName(customer)
      loadCustomerData(customer)
    }
  }, [searchParams])

  const loadCustomerData = async (customerName: string) => {
    try {
      setLoading(true)

      // Fetch customer info
      const customerResponse = await fetch(`/api/customers?search=${encodeURIComponent(customerName)}`)
      const customers = await customerResponse.json()
      const foundCustomer = customers.find((c: any) => c.name.toLowerCase() === customerName.toLowerCase())

      if (foundCustomer) {
        setCustomer(foundCustomer)

        // Fetch customer transactions
        const transactionsResponse = await fetch(
          `/api/money-transactions?customerName=${encodeURIComponent(customerName)}`,
        )
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      } else {
        setCustomer(null)
        setTransactions([])
      }
    } catch (error) {
      console.error("Error loading customer data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setEditForm({
      date: transaction.date,
      description: transaction.description,
      debit: transaction.debit.toString(),
      credit: transaction.credit.toString(),
      status: transaction.status,
      notes: transaction.notes || "",
    })
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/money-transactions/${editingTransaction._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        alert("Transaction updated successfully!")
        setEditingTransaction(null)
        await loadCustomerData(customerName) // Reload data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error updating transaction:", error)
      alert("Error updating transaction")
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await fetch(`/api/money-transactions/${transactionId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          alert("Transaction deleted successfully!")
          await loadCustomerData(customerName) // Reload data
        } else {
          const error = await response.json()
          alert(`Error: ${error.error}`)
        }
      } catch (error) {
        console.error("Error deleting transaction:", error)
        alert("Error deleting transaction")
      }
    }
  }

  const handleShare = () => {
    const shareData = {
      title: `${customerName} Account Statement`,
      text: `Account statement for ${customerName}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleAddEntry = (customerName: string) => {
    router.push(`/money-ledger/add-entry?customer=${customerName}`)
  }




  const handleExport = () => {
    const csvContent = [
      ["Date", "Description", "Debit", "Credit", "Balance", "Status", "Notes"],
      ...transactions.map((stmt) => [
        stmt.date,
        stmt.description,
        stmt.debit,
        stmt.credit,
        stmt.balance,
        stmt.status,
        stmt.notes || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${customerName}-statement-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push("/money-ledger")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Loading...</h1>
              <p className="text-gray-600">Please wait while we load the customer data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push("/money-ledger")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Customer Not Found</h1>
              <p className="text-gray-600">The customer "{customerName}" was not found</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No customer found with the name "{customerName}"</p>
              <Button onClick={() => router.push("/money-ledger")}>Back to Money Ledger</Button>
            </CardContent>
          </Card>
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/money-ledger")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{customerName} - Account Statement</h1>
              <p className="text-gray-600">Complete transaction history for {customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleAddEntry(customer.name)}>
              ➕
              Add New Entry
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Customer Summary Card */}
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Credit</span>
                </div>
                <p className="text-2xl font-bold text-green-600">﷼{customer.totalCredit?.toLocaleString() || "0"}</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <ArrowDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Debit</span>
                </div>
                <p className="text-2xl font-bold text-red-600">﷼{customer.totalDebit?.toLocaleString() || "0"}</p>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">Current Balance</div>
                <p className="text-2xl font-bold text-blue-600">﷼{customer.balance?.toLocaleString() || "0"}</p>
              </div>
            </div>

            {customer.email && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Email: {customer.email} {customer.phone && `• Phone: ${customer.phone}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
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
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {transaction.debit > 0 ? `﷼${transaction.debit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {transaction.credit > 0 ? `﷼${transaction.credit.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">﷼{transaction.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{transaction.notes}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Transaction</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Date</label>
                                <Input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <Input
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Debit</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.debit}
                                    onChange={(e) => setEditForm({ ...editForm, debit: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Credit</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.credit}
                                    onChange={(e) => setEditForm({ ...editForm, credit: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <Select
                                  value={editForm.status}
                                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <Textarea
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingTransaction(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDelete(transaction._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {transactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found for {customerName}</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/money-ledger/add-entry?customer=${customerName}`)}
                >
                  Add First Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
