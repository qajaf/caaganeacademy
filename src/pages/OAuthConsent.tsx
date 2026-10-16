import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("authorization_id ayaa maqan");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) { window.location.href = immediate; return; }
        setDetails(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Qalad");
      }
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      if (error) { setBusy(false); return setError(error.message); }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) { setBusy(false); return setError("Jawaab redirect ah lama helin."); }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Qalad");
    }
  }

  const name = details?.client?.name ?? details?.client?.client_name ?? "app";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-5">
        {error ? (
          <p className="text-destructive">Codsigan lama soo rarin karo: {error}</p>
        ) : !details ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : (
          <>
            <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-xl font-bold">Ku xir {name} akoonkaaga</h1>
            <p className="text-muted-foreground text-sm">
              {name} wuxuu awoodi doonaa inuu arko koorsooyinka iyo horumarkaaga Caagane Academy adiga oo kale.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Diid</Button>
              <Button disabled={busy} onClick={() => decide(true)}>Oggolow</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
