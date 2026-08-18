import { toast } from "sonner";

/**
 * Submits with offline tolerance: if the device is offline (or the request
 * fails on a dropped connection) the payload is queued and retried when the
 * browser reports it is back online, instead of failing silently.
 */
export async function submitResilient<T>(run: () => Promise<T>): Promise<T | "queued"> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    queue(run);
    return "queued";
  }
  try {
    return await run();
  } catch (error) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      queue(run);
      return "queued";
    }
    throw error;
  }
}

function queue(run: () => Promise<unknown>) {
  toast.info("You're offline — we'll send this as soon as you reconnect.");
  const handler = () => {
    window.removeEventListener("online", handler);
    void run()
      .then(() => toast.success("Your submission was sent."))
      .catch(() => toast.error("Could not send your submission. Please try again."));
  };
  window.addEventListener("online", handler);
}