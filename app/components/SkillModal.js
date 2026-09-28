"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SkillDetailContent from "./SkillDetailContent";

export default function SkillModal({ skill }) {
  const router = useRouter();

  function close() {
    router.back();
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={close} aria-label="Close">
          &times;
        </button>
        <SkillDetailContent skill={skill} />
      </div>
    </div>
  );
}
