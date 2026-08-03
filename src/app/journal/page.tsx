import { db } from "@/db";
import { getAllTrades } from "@/trades/queries";
import { getAllDailyNotes } from "@/journal/queries";
import { JournalClient } from "@/components/journal/journal-client";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const [trades, notesByDate] = await Promise.all([getAllTrades(db), getAllDailyNotes(db)]);
  return <JournalClient trades={trades} notesByDate={notesByDate} />;
}
