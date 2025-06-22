"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Edit, Trash2, User, AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CustomerManagement() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert("Customer name is required")
      return
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      })

      if (response.ok) {
        alert("Customer added successfully!")
        setIsAddDialogOpen(false)
        setNewCustomer({ name: "", email: "", phone: "" })
        await fetchCustomers()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error adding customer:", error)
      alert("Error adding customer")
    }
  }

  const handleEditCustomer = async () => {
    if (!editingCustomer.name.trim()) {
      alert("Customer name is required")
      return
    }

    try {
      const response = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingCustomer.name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
        }),
      })

      if (response.ok) {
        alert("Customer updated successfully!")
        setIsEditDialogOpen(false)
        setEditingCustomer(null)
        await fetchCustomers()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      alert("Error updating customer")
    }
  }

  const handleDeleteCustomer = async (customer: any) => {
    const hasTransactions = customer.totalCredit > 0 || customer.totalDebit > 0

    if (hasTransactions) {
      alert(
        `Cannot delete customer "${customer.name}" because they have existing transactions.\n\nTotal Credit: ﷼${customer.totalCredit}\nTotal Debit: ﷼${customer.totalDebit}\nBalance: ﷼${customer.balance}\n\nPlease clear all transactions before deleting this customer.`,
      )
      return
    }

    if (confirm(`Are you sure you want to delete customer "${customer.name}"?\n\nThis action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/customers/${customer._id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          alert("Customer deleted successfully!")
          await fetchCustomers()
        } else {
          const error = await response.json()
          alert(`Error: ${error.error}`)
        }
      } catch (error) {
        console.error("Error deleting customer:", error)
        alert("Error deleting customer")
      }
    }
  }

  const openEditDialog = (customer: any) => {
    setEditingCustomer({
      _id: customer._id,
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    })
    setIsEditDialogOpen(true)
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
              <h1 className="text-2xl font-bold">Customer Management</h1>
              <p className="text-gray-600">Add, edit, and manage customers</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name *</label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomer}>Add Customer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              All Customers ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading customers...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CUSTOMER NAME</TableHead>
                    <TableHead>CONTACT INFO</TableHead>
                    <TableHead>TOTAL CREDIT</TableHead>
                    <TableHead>TOTAL DEBIT</TableHead>
                    <TableHead>BALANCE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const hasTransactions = customer.totalCredit > 0 || customer.totalDebit > 0
                    return (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.email && <div>{customer.email}</div>}
                            {customer.phone && <div>{customer.phone}</div>}
                            {!customer.email && !customer.phone && (
                              <span className="text-gray-400">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ﷼{customer.totalCredit?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          ﷼{customer.totalDebit?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${customer.balance >= 0 ? "text-blue-600" : "text-red-600"}`}
                        >
                          ﷼{customer.balance?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell>
                          {hasTransactions ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-500">
                              <User className="h-4 w-4" />
                              <span className="text-sm">No Transactions</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${hasTransactions ? "text-gray-400 cursor-not-allowed" : "text-red-600"}`}
                              onClick={() => handleDeleteCustomer(customer)}
                              disabled={hasTransactions}
                              title={
                                hasTransactions
                                  ? "Cannot delete customer with existing transactions"
                                  : "Delete customer"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {customers.length === 0 && !loading && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No customers found</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            {editingCustomer && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name *</label>
                  <Input
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditCustomer}>Update Customer</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Alert */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Customers with existing transactions (credit/debit amounts greater than zero) cannot
            be deleted. You must clear all transactions for a customer before deletion is allowed.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
