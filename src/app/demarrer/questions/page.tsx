import type { Metadata } from "next";
import { Questions } from "./Questions";

export const metadata: Metadata = { title: "Quelques questions | Leed" };

export default function Page() {
  return <Questions />;
}
