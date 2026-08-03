import { db } from "@/db";
import { getSchwabConnection } from "@/schwab/connectionQueries";
import { getBrokerConnectionDisplayState } from "@/schwab/connectionDisplay";
import { BrokerConnectionCard } from "@/components/settings/broker-connection-card";
import { CsvImportCard } from "@/components/settings/csv-import-card";
import { ColorblindToggle } from "@/components/settings/colorblind-toggle";
import { TimezonePicker } from "@/components/settings/timezone-picker";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ schwab_connected?: string; schwab_error?: string }>;
}) {
  const params = await searchParams;
  const connection = await getSchwabConnection(db);
  const state = getBrokerConnectionDisplayState(connection);

  return (
    <div className="px-7 pt-6 pb-10 max-w-[1040px]">
      <div className="text-[19px] font-bold mb-0.5">Settings</div>
      <div className="text-[12.5px] text-text-muted mb-[18px]">Connections, accounts, and how the app looks</div>

      {params.schwab_connected && (
        <div className="text-[12.5px] mb-4 px-4 py-2.5 rounded-lg" style={{ color: "var(--win)", background: "var(--win-soft)" }}>
          Schwab connected successfully.
        </div>
      )}
      {params.schwab_error && (
        <div className="text-[12.5px] mb-4 px-4 py-2.5 rounded-lg" style={{ color: "var(--loss)", background: "var(--loss-soft)" }}>
          Schwab connection failed: {params.schwab_error}
        </div>
      )}

      <BrokerConnectionCard connection={connection} state={state} />

      <CsvImportCard />

      <div className="bg-surface border border-border rounded-[10px] px-5 py-[18px]">
        <div className="text-[15px] font-bold mb-3.5">Display</div>
        <div className="flex items-center justify-between py-2.5 border-t border-border">
          <div>
            <div className="text-[13px] font-semibold">Display timezone</div>
            <div className="text-[11.5px] text-text-muted mt-0.5">Used for the secondary &quot;local&quot; time everywhere</div>
          </div>
          <TimezonePicker />
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <div className="text-[13px] font-semibold">Colorblind-safe palette</div>
            <div className="text-[11.5px] text-text-muted mt-0.5 max-w-[220px]">P&amp;L is this app&apos;s most important signal — swap it to blue/orange</div>
          </div>
          <ColorblindToggle />
        </div>
      </div>
    </div>
  );
}
