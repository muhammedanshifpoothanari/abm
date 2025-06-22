import type { ObjectId } from "mongodb"

export interface AirBooking {
  _id?: ObjectId
  referenceNumber: string
  customerName: string
  email?: string
  phone?: string
  departurePlace: string
  destination: string
  departureDate?: string
  returnDate?: string
  shortDescription: string
  fullDescription: string
  ticketCost: number
  amountReceived: number
  dueBalance: number
  profit: number
  agent: string
  paymentStatus: "Paid" | "Pending" | "Unpaid"
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreditSettings {
  _id?: ObjectId
  totalCredit: number
  usedCredit: number
  availableCredit: number
  notes?: string
  lastUpdated: Date
}
