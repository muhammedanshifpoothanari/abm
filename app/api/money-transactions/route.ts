import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { MoneyTransaction, Customer } from "@/lib/models/Customer"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const customerName = searchParams.get("customerName")

    let query = {}
    if (customerId) {
      query = { customerId: new ObjectId(customerId) }
    } else if (customerName) {
      query = { customerName: { $regex: customerName, $options: "i" } }
    }

    const transactions = await db
      .collection<MoneyTransaction>("money_transactions")
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    // Find or create customer
    let customer = await db
      .collection<Customer>("customers")
      .findOne({ name: { $regex: `^${data.customerName}$`, $options: "i" } })

    if (!customer) {
      const newCustomer: Customer = {
        name: data.customerName,
        totalCredit: 0,
        totalDebit: 0,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const customerResult = await db.collection<Customer>("customers").insertOne(newCustomer)
      customer = { ...newCustomer, _id: customerResult.insertedId }
    }

    // Calculate new balance
    const debit = Number.parseFloat(data.debitAmount) || 0
    const credit = Number.parseFloat(data.creditAmount) || 0
    const newBalance = customer.balance + credit - debit

    // Create transaction
    const transaction: MoneyTransaction = {
      customerId: customer._id!,
      customerName: data.customerName,
      date: data.date,
      description: data.notes || (debit > 0 ? "Debit transaction" : "Credit transaction"),
      debit,
      credit,
      balance: newBalance,
      status: "completed",
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<MoneyTransaction>("money_transactions").insertOne(transaction)

    // Update customer totals
    await db.collection<Customer>("customers").updateOne(
      { _id: customer._id },
      {
        $set: {
          totalCredit: customer.totalCredit + credit,
          totalDebit: customer.totalDebit + debit,
          balance: newBalance,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      _id: result.insertedId,
      ...transaction,
    })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
