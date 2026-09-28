import { redirect } from "next/navigation";

/** Settings has no page of its own; Company Settings is the natural landing page. */
export default function SettingsPage() {
  redirect("/settings/company");
}
