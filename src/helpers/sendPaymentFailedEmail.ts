import { resend } from "@/lib/resend";
import PaymentFailedEmail from "@/emails/PaymentFailedEmail";

export async function sendPaymentFailedEmail(
  userName: string,
  userEmail: string,
  courseName: string,
  courseDescription: string,
  instructorName: string,
  courseLevel: "beginner" | "intermediate" | "advanced",
  courseThumbnailUrl: string,
  amount: string,
  currency: string,
  orderId: string,
  retryLink: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: userEmail,
      subject: "EduLink | Payment Failed",
      react: PaymentFailedEmail({
        userName,
        courseName,
        courseDescription,
        instructorName,
        courseLevel,
        courseThumbnailUrl,
        amount,
        currency,
        orderId,
        retryLink,
      }),
    });

    if (error) {
      return { success: false, message: "Error sending payment failed email" };
    }

    return {
      success: true,
      message: "Payment failed email sent successfully",
    };
  } catch (error) {
    console.error("Error sending payment failed email", error);
    return { success: false, message: "Failed to send payment failed email" };
  }
}
