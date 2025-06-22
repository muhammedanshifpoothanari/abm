import { type NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.APP_PASSWORD || "1234"

    if (password !== correctPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Create a simple JWT token
    const token = sign(
      { authenticated: true, timestamp: Date.now() },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "24h" },
    )

    return NextResponse.json({
      success: true,
      token,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
