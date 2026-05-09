"use client";

import { toast } from "sonner";

export function useNotifications() {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "An error occurred";
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  const showPromise = <T>(
    promise: Promise<T>,
    { loading, success, error }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showPromise,
  };
}
