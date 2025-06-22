import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Customer } from "@/lib/models/Customer"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = {}
    if (search) {
      query = {
        name: { $regex: search, $options: "i" },
      }
    }

    const customers = await db.collection<Customer>("customers").find(query).sort({ name: 1 }).toArray()

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    const customer: Customer = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Customer>("customers").insertOne(customer)

    return NextResponse.json({
      _id: result.insertedId,
      ...customer,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
