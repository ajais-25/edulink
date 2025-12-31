"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";

function VerifyCodeContent() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/sign-up");
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    // Focus on the last filled input or the next empty one
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(
        `/api/auth/verify-code?email=${encodeURIComponent(email || "")}`,
        {
          code: verificationCode,
        }
      );

      setSuccess(response.data.message);

      // Redirect to sign-in page after successful verification
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An error occurred during verification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to{" "}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-4">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => {
                // Could implement resend functionality here
                setError("Please sign up again to receive a new code");
              }}
            >
              Resend
            </button>
          </p>
          <p className="text-sm text-gray-600">
            <Link
              href="/sign-up"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyCode() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}
