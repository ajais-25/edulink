import { resend } from "@/lib/resend";
import CourseEnrolledEmail from "@/emails/CourseEnrolledEmail";

export async function sendCourseEnrolledEmail(
  userName: string,
  userEmail: string,
  courseName: string,
  courseDescription: string,
  instructorName: string,
  courseLevel: "beginner" | "intermediate" | "advanced",
  courseThumbnailUrl: string,
  courseLink: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: userEmail,
      subject: "EduLink | Course Enrolled",
      react: CourseEnrolledEmail({
        userName,
        courseName,
        courseDescription,
        instructorName,
        courseLevel,
        courseThumbnailUrl,
        courseLink,
      }),
    });

    // console.log("Email Data: ", data);

    if (error) {
      return { success: false, message: "Error sending course enrolled email" };
    }

    return {
      success: true,
      message: "Course enrolled email sent successfully",
    };
  } catch (error) {
    console.error("Error sending course enrolled email", error);
    return { success: false, message: "Failed to send course enrolled email" };
  }
}
