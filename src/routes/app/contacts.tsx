import { createFileRoute } from "@tanstack/react-router";
import { Contacts } from "../../pages/App";

export const Route = createFileRoute("/app/contacts")({
  component: Contacts,
});
