import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { AirBooking, CreditSettings } from "@/lib/models/AirBooking"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const paymentStatus = searchParams.get("paymentStatus")
    const agent = searchParams.get("agent")

    const query: any = {}

    if (search) {
      query.$or = [
        { shortDescription: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { agent: { $regex: search, $options: "i" } },
      ]
    }

    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus
    }

    if (agent && agent !== "all") {
      query.agent = agent
    }

    const bookings = await db.collection<AirBooking>("air_bookings").find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const data = await request.json()

    const ticketCost = Number.parseFloat(data.debitAmount) || 0
    const amountReceived = Number.parseFloat(data.creditAmount) || 0

    // Check credit availability before creating booking
    const settings = await db.collection<CreditSettings>("credit_settings").findOne({})
    const currentAvailableCredit = settings ? settings.availableCredit : 0

    if (ticketCost > currentAvailableCredit) {
      return NextResponse.json(
        {
          error: `Insufficient credit! Ticket cost ₹${ticketCost.toFixed(2)} exceeds available credit ₹${currentAvailableCredit.toFixed(2)}`,
          availableCredit: currentAvailableCredit,
          requiredAmount: ticketCost,
        },
        { status: 400 },
      )
    }

    const dueBalance = ticketCost - amountReceived
    const profit = amountReceived - ticketCost

    const shortDescription = `${data.customerName} - ${data.departurePlace} → ${data.destination}`
    const fullDescription = `${data.customerName} - ${data.returnDate ? "Round Trip" : "One Way"} Flight\n${data.departurePlace} → ${data.destination}\nDeparture: ${data.departureDate}\n${data.returnDate ? `Return: ${data.returnDate}\n` : ""}Passengers: 1 Adult\nClass: Economy`

    const booking: AirBooking = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<AirBooking>("air_bookings").insertOne(booking)

    // Update credit settings after successful booking creation
    await updateCreditSettings(db)

    return NextResponse.json({
      _id: result.insertedId,
      ...booking,
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
