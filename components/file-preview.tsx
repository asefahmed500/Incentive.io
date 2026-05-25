"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Download, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  url: string
  index?: number
}

export function FilePreview({ url, index }: FilePreviewProps) {
  const [type, setType] = useState<"image" | "pdf" | "other" | "loading">("loading")

  useEffect(() => {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase()
    if (ext === "pdf") {
      setType("pdf")
      return
    }
    if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp" || ext === "svg") {
      setType("image")
      return
    }
    if (url.includes("/api/files/")) {
      fetch(url, { method: "HEAD" })
        .then(res => {
          const ct = res.headers.get("content-type") || ""
          if (ct.startsWith("image/")) setType("image")
          else if (ct.includes("pdf")) setType("pdf")
          else setType("other")
        })
        .catch(() => setType("other"))
    } else {
      setType("other")
    }
  }, [url])

  return (
    <div className="rounded-lg border overflow-hidden">
      {type === "image" && (
        <div className="relative bg-gray-100 dark:bg-gray-800">
          <img
            src={url}
            alt={`Proof document ${index ? index + 1 : ""}`}
            className="max-h-96 w-full object-contain"
            onError={() => setType("other")}
          />
        </div>
      )}

      {type === "pdf" && (
        <iframe
          src={url}
          className="w-full h-96 border-0"
          title={`PDF document ${index ? index + 1 : ""}`}
        />
      )}

      {(type === "other" || type === "loading") && (
        <div className="flex items-center justify-center h-40 bg-gray-50 dark:bg-gray-800/50 gap-2">
          {type === "loading" ? (
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <span className="text-sm">Document {index ? index + 1 : ""}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 border-t bg-white dark:bg-gray-900">
        <span className="text-xs font-medium flex-1 truncate">
          {type === "image" && <><ImageIcon className="h-3 w-3 inline mr-1" /> Image</>}
          {type === "pdf" && <><FileText className="h-3 w-3 inline mr-1" /> PDF</>}
          {(type === "other" || type === "loading") && "Document"}
          {index !== undefined ? ` ${index + 1}` : ""}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={url} download>
            <Download className="h-4 w-4 mr-1" />
            Download
          </a>
        </Button>
      </div>
    </div>
  )
}
