import { config } from "dotenv"
config({ path: ".env.local" })
import crypto from "crypto"

async function main() {
  const { connectToDatabase } = await import("../lib/mongodb")
  const { User } = await import("../lib/models/User")

  await connectToDatabase()
  const user = await User.findOne({ email: "karim@incentive.io" })
  if (!user) { console.log("User not found"); process.exit(1) }

  console.log("User found:", user.email, "ID:", user._id.toString())
  console.log("Has resetPasswordToken field in schema:", "resetPasswordToken" in user.schema.paths)

  const token = crypto.randomBytes(32).toString("hex")
  console.log("Generated token:", token.slice(0, 20) + "...")

  const updateResult = await User.findByIdAndUpdate(user._id, {
    resetPasswordToken: token,
    resetPasswordExpires: new Date(Date.now() + 3600000),
  }, { new: true }).lean()

  console.log("After update:")
  console.log("- token:", updateResult?.resetPasswordToken?.slice(0, 20) + "..." || "MISSING")
  console.log("- expires:", updateResult?.resetPasswordExpires || "MISSING")

  process.exit(0)
}
main()
