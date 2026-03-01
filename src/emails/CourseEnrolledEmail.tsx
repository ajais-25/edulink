import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./components/Header";
import { Button } from "./components/Button";
import { Footer } from "./components/Footer";
import {
  baseStyles,
  typography,
  components,
  boxes,
  layout,
  detailsBox,
} from "./styles/styles";

interface CourseEnrolledEmailProps {
  userName: string;
  courseName: string;
  courseDescription?: string;
  instructorName: string;
  courseLevel?: "beginner" | "intermediate" | "advanced";
  courseThumbnailUrl?: string;
  courseLink: string;
}

export const CourseEnrolledEmail = ({
  userName,
  courseName,
  courseDescription,
  instructorName,
  courseLevel,
  courseThumbnailUrl,
  courseLink,
}: CourseEnrolledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        You&apos;re enrolled in {courseName} — start learning now!
      </Preview>
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          <Header />

          <Section style={baseStyles.content}>
            <Section style={{ textAlign: "center" as const, margin: "20px 0" }}>
              <Text style={{ fontSize: "64px", margin: "0" }}>🎉</Text>
            </Section>

            <Heading style={typography.heading}>Enrollment Confirmed!</Heading>

            <Text style={typography.paragraph}>Hi {userName},</Text>

            <Text style={typography.paragraph}>
              Congratulations! You have been successfully enrolled in{" "}
              <strong>{courseName}</strong>. Your learning journey starts now!
            </Text>

            {courseThumbnailUrl && (
              <Section
                style={{ textAlign: "center" as const, margin: "24px 0" }}
              >
                <Img
                  src={courseThumbnailUrl}
                  width="100%"
                  alt={courseName}
                  style={{
                    borderRadius: "8px",
                    maxWidth: "500px",
                    objectFit: "cover" as const,
                  }}
                />
              </Section>
            )}

            <Section style={detailsBox.container}>
              <Text style={detailsBox.title}>📚 Course Details</Text>
              <table style={detailsBox.table}>
                <tbody>
                  <tr>
                    <td style={detailsBox.label}>Course</td>
                    <td style={detailsBox.value}>{courseName}</td>
                  </tr>
                  <tr>
                    <td style={detailsBox.label}>Instructor</td>
                    <td style={detailsBox.value}>{instructorName}</td>
                  </tr>
                  {courseLevel && (
                    <tr>
                      <td style={detailsBox.label}>Level</td>
                      <td style={detailsBox.value}>
                        {courseLevel.charAt(0).toUpperCase() +
                          courseLevel.slice(1)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {courseDescription && (
              <Text style={typography.small}>{courseDescription}</Text>
            )}

            <Section style={layout.centered}>
              <Button href={courseLink}>Start Learning</Button>
            </Section>

            <Text style={typography.paragraph}>
              Or copy and paste this link into your browser:
            </Text>

            <Text
              style={{
                ...typography.small,
                textAlign: "center" as const,
                wordBreak: "break-all" as const,
              }}
            >
              <Link href={courseLink} style={components.link}>
                {courseLink}
              </Link>
            </Text>

            <Hr style={components.hr} />

            <Section style={boxes.success}>
              <Text
                style={{
                  ...typography.small,
                  color: "#15803d",
                  margin: "8px 0",
                }}
              >
                <strong>🚀 Tips for getting started:</strong>
              </Text>
              <Text
                style={{
                  ...typography.small,
                  color: "#166534",
                  margin: "4px 0",
                }}
              >
                • Set a consistent learning schedule to stay on track.
              </Text>
              <Text
                style={{
                  ...typography.small,
                  color: "#166534",
                  margin: "4px 0",
                }}
              >
                • Take notes while watching lessons to reinforce learning.
              </Text>
              <Text
                style={{
                  ...typography.small,
                  color: "#166534",
                  margin: "4px 0",
                }}
              >
                • Complete quizzes to test your understanding.
              </Text>
            </Section>

            <Hr style={components.hr} />

            <Text style={{ ...typography.small, textAlign: "center" as const }}>
              If you have any questions or need help, feel free to reach out to
              our support team. Happy learning!
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
};

export default CourseEnrolledEmail;
