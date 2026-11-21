interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 bg-[#164A31] text-white text-xs font-medium rounded-xl shadow-lg border border-[#246344] max-w-xs"
    >
      {message}
    </div>
  );
}
