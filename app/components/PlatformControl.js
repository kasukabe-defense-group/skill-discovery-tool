"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PLATFORM_OPTIONS } from "../../lib/constants/options.js";

export default function PlatformControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("platform") || "";

  function setPlatform(value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("platform", value);
    } else {
      params.delete("platform");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="platform-control">
      {!current && (
        <p className="platform-nudge">
          Showing general skills — pick a platform to narrow these down.
        </p>
      )}
      <div className="chip-group">
        {PLATFORM_OPTIONS.map((option) => (
          <button
            type="button"
            key={option}
            className={`chip${current === option ? " selected" : ""}`}
            onClick={() => setPlatform(current === option ? "" : option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
