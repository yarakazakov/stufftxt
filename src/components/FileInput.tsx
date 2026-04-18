"use client";

import { useRef, useState } from "react";

interface FileInputProps {
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonLabel?: string;
}

export default function FileInput({
  accept,
  onChange,
  buttonLabel = "choose file",
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
    onChange(e);
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {buttonLabel}
      </button>
      <span style={{ fontSize: 13, color: "#666" }}>
        {fileName || "no file selected"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </span>
  );
}
