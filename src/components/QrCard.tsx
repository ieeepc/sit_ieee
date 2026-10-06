"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, QrCode } from "lucide-react";

// Downloadable QR code for a page on this site. The origin is only known in the browser,
// so a QR downloaded from the live site points at the live site.
export default function QrCard({ path, title, fileName }: { path: string; title: string; fileName: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const full = `${window.location.origin}${path}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- origin is only known in the browser
    setUrl(full);
    QRCode.toDataURL(full, { width: 1024, margin: 2 }).then(setQr);
  }, [path]);

  return (
    <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 text-center">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <QrCode size={16} />
        {title}
      </p>
      <div className="w-full overflow-hidden rounded-xl bg-white p-2">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URL
          <img src={qr} alt={`QR code for ${url}`} className="h-auto w-full" />
        ) : (
          <div className="aspect-square" />
        )}
      </div>
      <p className="break-all text-xs text-text-faint">{url}</p>
      <div className="flex w-full flex-col gap-2">
        <a
          href={qr ?? undefined}
          download={fileName}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-2.5 text-xs font-semibold text-black"
        >
          <Download size={15} />
          Download QR
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success("Link copied");
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border-strong py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.05]"
        >
          <Copy size={15} />
          Copy link
        </button>
      </div>
    </div>
  );
}
