// Order status stepper. Renders the happy-path progression and marks each step
// reached from the order's OrderStatusEvent history. CANCELLED is shown as a
// terminal callout rather than a step.

import type { OrderStatus } from "@/generated/prisma";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Order placed" },
  { status: "PAID", label: "Payment received" },
  { status: "APPROVED", label: "Approved" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export type StatusEvent = {
  status: OrderStatus;
  createdAt: Date | string;
};

export function StatusStepper({
  currentStatus,
  history,
}: {
  currentStatus: OrderStatus;
  history: StatusEvent[];
}) {
  const reached = new Set(history.map((e) => e.status));

  if (currentStatus === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        This order was cancelled.
      </div>
    );
  }

  const dateFor = (status: OrderStatus): string | null => {
    const event = history
      .filter((e) => e.status === status)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )[0];
    if (!event) {
      return null;
    }
    return new Date(event.createdAt).toLocaleString();
  };

  return (
    <ol className="space-y-4">
      {STEPS.map((step) => {
        const done = reached.has(step.status);
        const date = dateFor(step.status);
        return (
          <li key={step.status} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-persian-blue text-brand-white"
                  : "border border-gray-300 bg-brand-white text-gray-400"
              }`}
            >
              {done ? "✓" : ""}
            </span>
            <div>
              <p
                className={`text-sm font-medium ${
                  done ? "text-gulf-blue" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {date && <p className="text-xs text-gray-500">{date}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
