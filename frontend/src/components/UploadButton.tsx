import React from "react";
import { Upload } from "lucide-react";

import { Button } from "./ui/Button";
import { useUploadPdf, useIngestPdf } from "../api/hooks";
import { useAppStore } from "../store/useAppStore";
import { pushToast } from "./Toast";

export const UploadButton = ({
  label = "Select Files",
  variant = "secondary",
  size = "md",
  onComplete,
  className,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
  className?: string;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [stage, setStage] = React.useState<"idle" | "uploading" | "ingesting">(
    "idle"
  );
  const uploadMutation = useUploadPdf();
  const ingestMutation = useIngestPdf();
  const addDocument = useAppStore((state) => state.addDocument);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStage("uploading");
    try {
      const upload = await uploadMutation.mutateAsync(file);
      setStage("ingesting");
      const ingest = await ingestMutation.mutateAsync({
        file_path: upload.file_path,
      });

      addDocument({
        id: crypto.randomUUID(),
        filename: upload.filename,
        filePath: upload.file_path,
        sizeBytes: upload.size_bytes,
        ingestedAt: new Date().toISOString(),
        pagesIndexed: ingest.pages_indexed,
        chunksIndexed: ingest.chunks_indexed,
      });

      pushToast({
        title: "Document indexed",
        description: `${upload.filename} is ready for research`,
        tone: "success",
      });
      onComplete?.();
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Backend unreachable. Start the API on http://localhost:8000."
          : error instanceof Error
          ? error.message
          : "Unable to ingest PDF";
      pushToast({
        title: "Upload failed",
        description: message,
        tone: "error",
      });
    } finally {
      setStage("idle");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {stage === "uploading"
          ? "Uploading..."
          : stage === "ingesting"
          ? "Indexing..."
          : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
