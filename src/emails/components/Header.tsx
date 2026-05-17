import { Section, Img } from "@react-email/components";
import * as React from "react";
import { spacing } from "../styles/styles";

interface HeaderProps {
  logoUrl?: string;
  logoAlt?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logoUrl = "https://ik.imagekit.io/xtz3yyavr/EduLink/logo.png", // Update this with your actual domain when deploying
  logoAlt = "EduLink Logo",
}) => {
  return (
    <Section style={headerStyle}>
      <Img
        src={logoUrl}
        width="150"
        height="50"
        alt={logoAlt}
        style={logoStyle}
      />
    </Section>
  );
};

const headerStyle = {
  padding: `${spacing.xl} 20px 0`,
  textAlign: "center" as const,
};

const logoStyle = {
  margin: "0 auto",
};
