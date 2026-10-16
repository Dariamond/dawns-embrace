"use client";

// In-app notifications view. Lists the current user's notifications with read
// state and lets them mark all read. Backed by /api/notifications (GET/PATCH).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        setError("Please sign in to view your notifications.");
        setNotifications([]);
        return;
      }
      const data = await res.json();
      setNotifications(data?.notifications ?? []);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Non-blocking; leave current state as-is.
    }
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gulf-blue">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-medium text-persian-blue hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="mt-8 text-sm text-gray-500">Loading…</p>}

      {error && (
        <p className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">
          You have no notifications yet.
        </p>
      )}

      {notifications.length > 0 && (
        <ul className="mt-8 space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl p-5 shadow-sm ${
                n.read
                  ? "bg-brand-white"
                  : "border-l-4 border-persian-blue bg-persian-blue/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-gulf-blue">{n.title}</p>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{n.body}</p>
              {n.orderId && (
                <Link
                  href={`/orders/${n.orderId}`}
                  className="mt-2 inline-block text-sm font-medium text-persian-blue hover:underline"
                >
                  View order
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
