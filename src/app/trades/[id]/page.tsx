export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="px-7 py-6">
      <div className="text-[19px] font-bold">Trade Detail</div>
      <p className="text-text-muted text-sm mt-2">Coming soon (trade {id}).</p>
    </div>
  );
}
