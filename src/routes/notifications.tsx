import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { businessNotifications, investorNotifications, type Notification } from "@/lib/mock-data";
import { useMockAuth } from "@/lib/mock-auth";

const Notifications = () => {
  const { role } = useMockAuth();
  const initial = useMemo<Notification[]>(
    () => (role === "business" ? businessNotifications : investorNotifications),
    [role],
  );
  const [items, setItems] = useState<Notification[]>(initial);

  const markAll = () => setItems(items.map((n) => ({ ...n, unread: false })));
  const markOne = (id: string) =>
    setItems(items.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        <button onClick={markAll} className="text-sm text-primary hover:underline">
          Mark all as read
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No notifications yet. Sweeps, matches, rating changes and tier upgrades will appear here.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markOne(n.id)}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-secondary/50"
              >
                <span
                  className={
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                    (n.unread ? "bg-primary" : "bg-transparent")
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className={"text-sm " + (n.unread ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{n.ts}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.detail}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Bridge" }] }),
  component: Notifications,
});
