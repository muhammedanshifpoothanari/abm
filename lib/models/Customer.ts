import type { ObjectId } from "mongodb"

export interface Customer {
  _id?: ObjectId
  name: string
  email?: string
  phone?: string
  totalCredit: number
  totalDebit: number
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface MoneyTransaction {
  _id?: ObjectId
  customerId: ObjectId
  customerName: string
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  status: "completed" | "pending" | "failed"
  notes?: string
  createdAt: Date
  updatedAt: Date
}
