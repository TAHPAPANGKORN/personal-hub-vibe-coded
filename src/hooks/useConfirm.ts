"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    setIsOpen(false);
  }, [options]);

  const confirmProps = {
    isOpen,
    onClose: handleClose,
    onConfirm: handleConfirm,
    title: options?.title,
    message: options?.message,
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    variant: options?.variant,
  };

  return { confirm, confirmProps };
}
