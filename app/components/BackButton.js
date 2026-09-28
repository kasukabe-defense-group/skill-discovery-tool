"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ children }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="back-link"
      onClick={() => router.back()}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "var(--accent)",
        font: "inherit",
      }}
    >
      {children}
    </button>
  );
}
