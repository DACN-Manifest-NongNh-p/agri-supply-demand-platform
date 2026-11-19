import { MessagesPage } from "@/components/messages/MessagesPage";
import { buyer } from "./data/mockBuyer";

export default function BuyerMessagesPage() {
  return <MessagesPage area="buyer" self={buyer.name} />;
}
