import { useEffect } from "react";
import type { Notice } from "./NotificationBell";
import { dispatch, usePrefs, wants, type NotifyArea, type NotifyEvent } from "@/lib/notificationPrefs";
import { conversationsOf, otherSide, unreadIn, useConversations } from "@/lib/messageStore";

/** A notice plus the kind of event it is, so the user's settings can route it. */
export type EventNotice = Notice & { event: NotifyEvent };

/**
 * Applies the user's notification settings: notices whose event is off "in the app" are left out of
 * the bell, and each notice goes once to the outside channels they picked (email, SMS, Zalo).
 */
export function useRoutedNotices(area: NotifyArea, notices: EventNotice[], contact: { email: string; phone: string }): Notice[] {
  const prefs = usePrefs(area);
  const signature = notices.map((notice) => notice.id).join("|");

  useEffect(() => {
    for (const notice of notices) dispatch(area, notice.event, notice, contact);
    // The notice list is rebuilt every render; only new ids matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, signature]);

  return notices.filter((notice) => wants(prefs, notice.event, "in_app"));
}

/** One notice per conversation with unread messages for this party. */
export function useMessageNotices(area: "producer" | "buyer", self: string): EventNotice[] {
  const all = useConversations();
  return conversationsOf(self, all)
    .filter((conversation) => unreadIn(conversation, self) > 0)
    .map((conversation) => {
      const last = conversation.messages.at(-1)!;
      const count = unreadIn(conversation, self);
      return {
        id: `msg-${conversation.id}-${last.id}`,
        event: "message",
        tone: "info",
        title: `${count} new ${count === 1 ? "message" : "messages"} from ${otherSide(conversation, self)}`,
        detail: last.text.length > 90 ? `${last.text.slice(0, 90)}…` : last.text,
        link: { label: "Reply", to: `/${area}/messages?c=${conversation.id}` },
      };
    });
}
