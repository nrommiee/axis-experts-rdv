import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastOptions = Omit<ExternalToast, "description"> & {
  description?: string;
};

export const toast = {
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, options);
  },
  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, options);
  },
  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, options);
  },
  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, options);
  },
  message(message: string, options?: ToastOptions) {
    return sonnerToast(message, options);
  },
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
