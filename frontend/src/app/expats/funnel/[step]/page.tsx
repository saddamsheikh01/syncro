import { notFound } from "next/navigation";
import ExpatFunnel from "@/features/expats/funnel/ExpatFunnel";

interface Props {
  params: Promise<{ step: string }>;
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ step: String(i + 1) }));
}

export default async function ExpatFunnelPage({ params }: Props) {
  const { step: stepStr } = await params;
  const step = parseInt(stepStr, 10);

  if (isNaN(step) || step < 1 || step > 10) {
    notFound();
  }

  return <ExpatFunnel step={step} />;
}
