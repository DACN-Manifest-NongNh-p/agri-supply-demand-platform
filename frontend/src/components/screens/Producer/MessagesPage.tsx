import { MessagesPage } from "@/components/messages/MessagesPage";
import { producer } from "./data/mockProducer";

export default function ProducerMessagesPage() {
  return <MessagesPage area="producer" self={producer.name} />;
}
