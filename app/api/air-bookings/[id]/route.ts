import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { AirBooking, CreditSettings } from "@/lib/models/AirBooking"
import { ObjectId } from "mongodb"

async function updateCreditSettings(db: any) {
  // Calculate used credit from all bookings
  const bookings = await db.collection("air_bookings").find({}).toArray()
  const calculatedUsedCredit = bookings.reduce((sum: number, booking: any) => sum + (booking.ticketCost || 0), 0)

  // Get current credit settings
  let settings = await db.collection<CreditSettings>("credit_settings").findOne({})

  if (!settings) {
    // Create default settings if none exist
    settings = {
      totalCredit: 7010,
      usedCredit: calculatedUsedCredit,
      availableCredit: 7010 - calculatedUsedCredit,
      lastUpdated: new Date(),
    }
    await db.collection<CreditSettings>("credit_settings").insertOne(settings)
  } else {
    // Update credit settings
    const availableCredit = settings.totalCredit - calculatedUsedCredit
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
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const booking = await db.collection<AirBooking>("air_bookings").findOne({ _id: new ObjectId(params.id) })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    // Get the original booking to check credit impact
    const originalBooking = await db.collection<AirBooking>("air_bookings").findOne({ _id: new ObjectId(params.id) })

    if (!originalBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const newTicketCost = Number.parseFloat(data.debitAmount) || 0
    const originalTicketCost = originalBooking.ticketCost || 0
    const creditDifference = newTicketCost - originalTicketCost

    // Check credit availability if the new cost is higher
    if (creditDifference > 0) {
      const settings = await db.collection<CreditSettings>("credit_settings").findOne({})
      const currentAvailableCredit = settings ? settings.availableCredit : 0

      if (creditDifference > currentAvailableCredit) {
        return NextResponse.json(
          {
            error: `Insufficient credit! Additional amount ₹${creditDifference.toFixed(2)} exceeds available credit ₹${currentAvailableCredit.toFixed(2)}`,
            availableCredit: currentAvailableCredit,
            additionalRequired: creditDifference,
          },
          { status: 400 },
        )
      }
    }

    const ticketCost = newTicketCost
    const amountReceived = Number.parseFloat(data.creditAmount) || 0
    const dueBalance = ticketCost - amountReceived
    const profit = amountReceived - ticketCost

    const shortDescription = `${data.customerName} - ${data.departurePlace} → ${data.destination}`
    const fullDescription = `${data.customerName} - ${data.returnDate ? "Round Trip" : "One Way"} Flight\n${data.departurePlace} → ${data.destination}\nDeparture: ${data.departureDate}\n${data.returnDate ? `Return: ${data.returnDate}\n` : ""}Passengers: 1 Adult\nClass: Economy`

    const updateData = {
      referenceNumber: data.referenceNumber,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      departurePlace: data.departurePlace,
      destination: data.destination,
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      shortDescription,
      fullDescription,
      ticketCost,
      amountReceived,
      dueBalance,
      profit,
      agent: data.agent,
      paymentStatus: data.paymentStatus,
      notes: data.notes,
      updatedAt: new Date(),
    }

    const result = await db
      .collection<AirBooking>("air_bookings")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update credit settings after successful booking update
    await updateCreditSettings(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()

    const result = await db.collection<AirBooking>("air_bookings").deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update credit settings after successful booking deletion
    await updateCreditSettings(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
  }
}
