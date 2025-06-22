import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { MoneyTransaction, Customer } from "@/lib/models/Customer"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    // Get the original transaction
    const originalTransaction = await db
      .collection<MoneyTransaction>("money_transactions")
      .findOne({ _id: new ObjectId(params.id) })

    if (!originalTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update transaction
    const updatedTransaction = {
      date: data.date,
      description: data.description,
      debit: Number.parseFloat(data.debit) || 0,
      credit: Number.parseFloat(data.credit) || 0,
      status: data.status,
      notes: data.notes,
      updatedAt: new Date(),
    }

    await db
      .collection<MoneyTransaction>("money_transactions")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: updatedTransaction })

    // Recalculate customer balance
    const customer = await db.collection<Customer>("customers").findOne({ _id: originalTransaction.customerId })

    if (customer) {
      // Get all transactions for this customer to recalculate totals
      const allTransactions = await db
        .collection<MoneyTransaction>("money_transactions")
        .find({ customerId: customer._id })
        .sort({ date: 1, createdAt: 1 })
        .toArray()

      let totalCredit = 0
      let totalDebit = 0
      let runningBalance = 0

      // Recalculate all balances
      for (const transaction of allTransactions) {
        totalCredit += transaction.credit
        totalDebit += transaction.debit
        runningBalance += transaction.credit - transaction.debit

        // Update the balance for this transaction
        await db
          .collection<MoneyTransaction>("money_transactions")
          .updateOne({ _id: transaction._id }, { $set: { balance: runningBalance } })
      }

      // Update customer totals
      await db.collection<Customer>("customers").updateOne(
        { _id: customer._id },
        {
          $set: {
            totalCredit,
            totalDebit,
            balance: runningBalance,
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()

    // Get the transaction to be deleted
    const transaction = await db
      .collection<MoneyTransaction>("money_transactions")
      .findOne({ _id: new ObjectId(params.id) })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Delete the transaction
    await db.collection<MoneyTransaction>("money_transactions").deleteOne({ _id: new ObjectId(params.id) })

    // Recalculate customer totals
    const customer = await db.collection<Customer>("customers").findOne({ _id: transaction.customerId })

    if (customer) {
      // Get remaining transactions for this customer
      const remainingTransactions = await db
        .collection<MoneyTransaction>("money_transactions")
        .find({ customerId: customer._id })
        .sort({ date: 1, createdAt: 1 })
        .toArray()

      let totalCredit = 0
      let totalDebit = 0
      let runningBalance = 0

      // Recalculate all balances
      for (const trans of remainingTransactions) {
        totalCredit += trans.credit
        totalDebit += trans.debit
        runningBalance += trans.credit - trans.debit

        // Update the balance for this transaction
        await db
          .collection<MoneyTransaction>("money_transactions")
          .updateOne({ _id: trans._id }, { $set: { balance: runningBalance } })
      }

      // Update customer totals
      await db.collection<Customer>("customers").updateOne(
        { _id: customer._id },
        {
          $set: {
            totalCredit,
            totalDebit,
            balance: runningBalance,
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
  }
}
