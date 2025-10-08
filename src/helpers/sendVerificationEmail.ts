import { resend } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";

export async function sendVerificationEmail(
  name: string,
  email: string,
  verifyCode: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Akshat <onboarding@resend.dev>",
      to: email,
      subject: "Hello world",
      react: VerificationEmail({ name, otp: verifyCode }),
    });

    console.log(data);

    if (error) {
      return { success: false, message: "Error sending verification email" };
    }

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Error sending verification email", error);
    return { success: false, message: "Failed to send verification email" };
  }
}
