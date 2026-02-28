"use client";

import { useUi } from "@/hooks";
import { NotificationToast } from "@/components/ui/NotificationToast";

export const NotificationStack = () => {
  const { toasts, actions } = useUi();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-4 right-4 top-4 z-50 flex flex-col gap-3 md:left-auto md:right-6 md:top-6 md:w-[360px]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          title={toast.title}
          message={toast.message}
          tone={toast.tone}
          durationMs={toast.durationMs}
          onClick={toast.onClick}
          onClose={() => actions.dismissToast(toast.id)}
        />
      ))}
    </div>
  );
};
