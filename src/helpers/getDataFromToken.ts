import jwt, { JwtPayload } from "jsonwebtoken";
import { NextRequest } from "next/server";

interface DecodedToken {
  _id: string;
  name: string;
  email: string;
}

export function getDataFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value || "";
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("Configure JWT properly");
    }

    const decodedToken = jwt.verify(token, secret) as JwtPayload & DecodedToken;

    return decodedToken._id;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
