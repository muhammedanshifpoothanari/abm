import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify the JWT token
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret")

    return NextResponse.json({
      valid: true,
      decoded,
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid token", valid: false }, { status: 401 })
  }
}
