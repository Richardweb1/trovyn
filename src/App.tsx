import { FormEvent, useEffect, useRef, useState } from "react";
import type { Hash } from "genlayer-js/types";
import {
  ArrowDownRight,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Fingerprint,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  EXPLORER_URL,
  createWriteClient,
  ensureBradburyNetwork,
  errorMessage,
  readClient,
  shortAddress,
} from "./genlayer";

type Phase = "idle" | "signing" | "pending" | "proposing" | "committing" | "revealing" | "accepted" | "finalized";
type MatchResult = { kind: string; verdict: string; confidence: number; reason: string };

const phaseLabel: Record<Phase, string> = {
  idle: "Ready", signing: "Confirm in wallet", pending: "Pending", proposing: "Proposing",
  committing: "Committing", revealing: "Revealing", accepted: "Accepted", finalized: "Finalized",
};

const DEMO_RESULT: MatchResult = {
  kind: "Backpack",
  verdict: "MATCH",
  confidence: 91,
  reason: "The burgundy canvas, repaired left strap, and stitched moon patch are distinctive details shared by both reports.",
};

function normalizePhase(value?: string): Phase {
  const phase = value?.toLowerCase();
  return phase && phase in phaseLabel ? phase as Phase : "pending";
}

function parseLatest(raw: unknown): MatchResult | null {
  if (typeof raw !== "string" || !raw) return null;
  const [kind, verdict, confidence, reason] = raw.split("|");
  return kind && verdict && reason ? { kind, verdict, confidence: Number(confidence), reason } : null;
}

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [itemKind, setItemKind] = useState("Backpack");
  const [lost, setLost] = useState("Burgundy canvas backpack with a repaired left shoulder strap and a small embroidered moon patch on the front pocket.");
  const [found, setFound] = useState("Dark red canvas rucksack found near the station. Left strap has black repair thread and the front pocket has a stitched crescent moon.");
  const [phase, setPhase] = useState<Phase>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [consensus, setConsensus] = useState("IDLE");
  const [result, setResult] = useState<MatchResult | null>(CONTRACT_ADDRESS ? null : DEMO_RESULT);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const busy = !["idle", "accepted", "finalized"].includes(phase);

  useEffect(() => {
    alive.current = true;
    void window.ethereum?.request({ method: "eth_accounts" }).then((accounts) => {
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first === "string") setAccount(first as `0x${string}`);
    });
    if (CONTRACT_ADDRESS) {
      void readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_latest", args: [] })
        .then((value) => setResult(parseLatest(value))).catch(() => undefined);
    }
    return () => { alive.current = false; };
  }, []);

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) { setError("Install MetaMask to sign a GenLayer transaction."); return null; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first !== "string") throw new Error("No wallet account was returned.");
      await ensureBradburyNetwork();
      const address = first as `0x${string}`;
      setAccount(address);
      return { address, client: createWriteClient(address) };
    } catch (err) { setError(errorMessage(err)); return null; }
  };

  const pollTransaction = async (hash: `0x${string}`) => {
    if (!CONTRACT_ADDRESS) return;
    for (let attempt = 0; attempt < 180 && alive.current; attempt += 1) {
      const tx = await readClient.getTransaction({ hash: hash as Hash });
      const next = normalizePhase(String(tx.statusName || "PENDING"));
      setPhase(next);
      setConsensus(String(tx.resultName || "IDLE"));
      if (next === "accepted" || next === "finalized") {
        const latest = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_latest", args: [] });
        const parsed = parseLatest(latest);
        if (parsed) setResult(parsed);
        if (next === "finalized") return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    try {
      if (itemKind.trim().length < 2) throw new Error("Add the item type.");
      if (lost.trim().length < 25 || found.trim().length < 25) throw new Error("Each description needs at least 25 characters.");
      if (!CONTRACT_ADDRESS) { setResult(DEMO_RESULT); throw new Error("Preview ready. Deploy the Trovyn contract to unlock consensus."); }
      setPhase("signing");
      const wallet = account ? { address: account, client: createWriteClient(account) } : await connectWallet();
      if (!wallet) { setPhase("idle"); return; }
      await ensureBradburyNetwork();
      const hash = await wallet.client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "compare_items",
        args: [itemKind.trim(), lost.trim(), found.trim()],
        value: 0n,
      });
      setTxHash(hash);
      await pollTransaction(hash);
    } catch (err) { setError(errorMessage(err)); setPhase("idle"); }
  };

  return <div className="page-shell">
    <a className="skip-link" href="#matcher">Skip to matcher</a>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Trovyn home"><MapPin size={22} />TROVYN</a>
      <div className="header-right">
        <span className="network"><i />BRADBURY TESTNET</span>
        <button className="wallet" type="button" onClick={() => void connectWallet()}><Wallet size={18} />{account ? shortAddress(account) : "Connect wallet"}</button>
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} />Lost meets found, by consensus</p>
          <h1>Some things<br />belong <em>together.</em></h1>
          <p>Trovyn compares the details that matter and records a neutral lost-and-found match on GenLayer.</p>
          <a href="#matcher" className="hero-cta">Check two reports <ArrowDownRight size={18} /></a>
        </div>
        <div className="ticket-stack" aria-hidden="true">
          <div className="ticket ticket-back"><span>FOUND / 024</span><Fingerprint size={70} /><b>DETAILS ALIGN</b></div>
          <div className="ticket ticket-front"><span>LOST PROPERTY</span><strong>?</strong><small>ONE ITEM<br />TWO STORIES</small></div>
        </div>
      </section>

      <section className="how">
        <div><b>01</b><span>Describe what was lost</span></div>
        <div><b>02</b><span>Add what was found</span></div>
        <div><b>03</b><span>Let validators compare</span></div>
      </section>

      <section className="matcher" id="matcher">
        <div className="matcher-intro">
          <p className="eyebrow"><Search size={16} />Comparison desk</p>
          <h2>Do the details<br />tell one story?</h2>
          <p>Use precise, non-sensitive details. Never include names, phone numbers, addresses, access codes, or private documents.</p>
          <div className="privacy-note"><ShieldCheck size={20} /><span><b>Public by design</b>Descriptions and the final decision are stored on-chain.</span></div>
        </div>

        <form onSubmit={(event) => void submit(event)} noValidate>
          <label htmlFor="kind">Item type</label>
          <input id="kind" value={itemKind} maxLength={40} onChange={(event) => setItemKind(event.target.value)} placeholder="Backpack, keys, watch…" />
          <div className="field-head"><label htmlFor="lost">Lost report</label><span>{lost.length}/500</span></div>
          <textarea id="lost" value={lost} maxLength={500} onChange={(event) => setLost(event.target.value)} />
          <div className="field-head"><label htmlFor="found">Found report</label><span>{found.length}/500</span></div>
          <textarea id="found" value={found} maxLength={500} onChange={(event) => setFound(event.target.value)} />
          {error ? <div className="error" role="alert"><CircleAlert size={18} />{error}</div> : null}
          <button className="submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle className="spin" size={20} /> : <Fingerprint size={20} />}
            {busy ? phaseLabel[phase] : "Compare with consensus"}
          </button>
        </form>
      </section>

      {result || txHash ? <section className={`result ${result?.verdict === "MATCH" ? "is-match" : ""}`} aria-live="polite">
        <div className="result-kicker"><span><CheckCircle2 size={18} />Consensus record</span><span>{txHash ? phaseLabel[phase] : "DEMO PREVIEW"}</span></div>
        {result ? <div className="result-body">
          <div><small>VERDICT / {result.kind.toUpperCase()}</small><h2>{result.verdict === "MATCH" ? "LIKELY A MATCH" : "NOT A MATCH"}</h2></div>
          <div className="confidence"><strong>{result.confidence}</strong><span>%<br />confidence</span></div>
          <p>{result.reason}</p>
        </div> : <p>Validators are comparing both reports. Consensus: {consensus}</p>}
        {txHash ? <a className="tx-link" href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={16} /></a> : null}
      </section> : null}
    </main>
    <footer><span>© 2026 TROVYN</span><span>Built on GenLayer</span><span>Return what matters.</span></footer>
  </div>;
}
