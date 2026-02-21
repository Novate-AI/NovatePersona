import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  useEffect(() => { if (open) ref.current?.focus(); }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div ref={ref} tabIndex={-1} className="relative glass-card max-w-sm w-full p-5 space-y-4 animate-slide-up">
        <h3 className="text-base font-bold text-primary">{title}</h3>
        <p className="text-sm text-secondary leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">{cancelLabel}</button>
          <button onClick={onConfirm} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.97] ${danger ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20" : "btn-primary"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
