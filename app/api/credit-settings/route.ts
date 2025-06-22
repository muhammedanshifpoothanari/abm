import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { CreditSettings } from "@/lib/models/AirBooking"

export async function GET() {
  try {
    const db = await getDatabase()

    // Calculate used credit from actual bookings
    const bookings = await db.collection("air_bookings").find({}).toArray()
    const calculatedUsedCredit = bookings.reduce((sum, booking) => sum + (booking.ticketCost || 0), 0)

    let settings = await db.collection<CreditSettings>("credit_settings").findOne({})

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings: CreditSettings = {
        totalCredit: 7010,
        usedCredit: calculatedUsedCredit,
        availableCredit: 7010 - calculatedUsedCredit,
        lastUpdated: new Date(),
      }

      const result = await db.collection<CreditSettings>("credit_settings").insertOne(defaultSettings)
      settings = { ...defaultSettings, _id: result.insertedId }
    } else {
      // Update used credit with calculated value
      const totalCredit = settings.totalCredit
      const availableCredit = totalCredit - calculatedUsedCredit

      await db.collection<CreditSettings>("credit_settings").updateOne(
        { _id: settings._id },
        {
          $set: {
            usedCredit: calculatedUsedCredit,
            availableCredit: availableCredit,
            lastUpdated: new Date(),
          },
        },
      )

      settings = {
        ...settings,
        usedCredit: calculatedUsedCredit,
        availableCredit: availableCredit,
        lastUpdated: new Date(),
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching credit settings:", error)
    return NextResponse.json({ error: "Failed to fetch credit settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    // Calculate used credit from actual bookings
    const bookings = await db.collection("air_bookings").find({}).toArray()
    const calculatedUsedCredit = bookings.reduce((sum, booking) => sum + (booking.ticketCost || 0), 0)

    const totalCredit = Number.parseFloat(data.totalCredit) || 0
    const availableCredit = totalCredit - calculatedUsedCredit

    const updateData = {
      totalCredit,
      usedCredit: calculatedUsedCredit,
      availableCredit,
      notes: data.notes,
      lastUpdated: new Date(),
    }

    const result = await db
      .collection<CreditSettings>("credit_settings")
      .updateOne({}, { $set: updateData }, { upsert: true })

    return NextResponse.json({ success: true, ...updateData })
  } catch (error) {
    console.error("Error updating credit settings:", error)
    return NextResponse.json({ error: "Failed to update credit settings" }, { status: 500 })
  }
}
