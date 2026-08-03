export const dynamic = "force-dynamic";

// Placeholder until the real Settings page (mockup: broker connection card,
// CSV import, preferences) is built. Exists right now only so the Schwab
// OAuth callback has a real page to redirect to instead of 404ing.
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ schwab_connected?: string; schwab_error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Settings</h1>
      {params.schwab_connected && <p>Schwab connected successfully.</p>}
      {params.schwab_error && <p>Schwab connection failed: {params.schwab_error}</p>}
      {!params.schwab_connected && !params.schwab_error && <p>No broker connected yet.</p>}
    </main>
  );
}
