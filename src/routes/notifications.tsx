/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/queries";
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/hooks/mutations";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const Notifications = () => {
  const { userType: role } = useAuth();
  const { data: notifsData, isLoading } = useNotifications();
  const markReadMut = useMarkNotificationReadMutation();
  const markAllMut = useMarkAllNotificationsReadMutation();

  const items = notifsData || [];

  const markAll = () => markAllMut.mutate();
  const markOne = (id: string) => markReadMut.mutate(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        {items.length > 0 && (
          <button
            onClick={markAll}
            disabled={markAllMut.isPending}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {markAllMut.isPending ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No notifications yet. Sweeps, matches, rating changes and tier upgrades will appear here.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((n: any) => (
            <li key={n.id}>
              <button
                onClick={() => !n.read && markOne(n.id)}
                disabled={n.read || markReadMut.isPending}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-secondary/50 disabled:cursor-default"
              >
                <span
                  className={
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                    (!n.read ? "bg-primary" : "bg-transparent")
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className={"text-sm " + (!n.read ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
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
