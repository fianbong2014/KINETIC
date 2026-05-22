import { notFound } from "next/navigation";
import { PAIRS } from "@/lib/symbols";
import { SymbolPage } from "@/components/symbol/symbol-page";

export async function generateStaticParams() {
  // Pre-known pairs — the per-coin proxy whitelist matches this list, so any
  // out-of-list symbol is a 404 anyway.
  return PAIRS.map((p) => ({ symbol: p.symbol }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const pair = PAIRS.find((p) => p.symbol === symbol.toUpperCase());
  return {
    title: pair ? `${pair.display} · KINETIC` : "Symbol · KINETIC",
  };
}

export default async function SymbolDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const pair = PAIRS.find((p) => p.symbol === upper);
  if (!pair) notFound();
  return <SymbolPage symbol={upper} />;
}
