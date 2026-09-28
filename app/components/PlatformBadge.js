"use client";

import { useState } from "react";

export default function PlatformBadge({ platform }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(platform) ? platform : [];

  if (list.length === 0) return null;

  if (list.length === 1) {
    return <span className="platform-badge">{list[0]}</span>;
  }

  return (
    <span
      className={`platform-badge multi${open ? " open" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen((current) => !current);
      }}
    >
      Multi-platform
      <span className="platform-reveal">
        {list.map((item) => (
          <span className="platform-reveal-item" key={item}>
            {item}
          </span>
        ))}
      </span>
    </span>
  );
}
