import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { Feed } from "@/features/feed/flows/Feed";

export const metadata: Metadata = {
  title: "Moments | Syncro",
  description: "Discover geolocated moments on Syncro.",
};

export default function MomentsPage() {
  return (
    <MainLayout>
      <Feed />
    </MainLayout>
  );
}
