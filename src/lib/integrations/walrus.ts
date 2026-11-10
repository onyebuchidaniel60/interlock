import { delegateKeyToPublicKey, MemWal } from "@mysten-incubation/memwal";

import { canonicalJson, sha256Hex } from "@/lib/domain/canonical";
import { MemoryEnvelopeSchema, type AgentType, type MemoryEnvelope } from "@/lib/domain/schemas";

const DELEGATE_ENV: Record<AgentType, string> = {
  SCOUT: "MEMWAL_SCOUT_DELEGATE_KEY",
  POLICY: "MEMWAL_POLICY_DELEGATE_KEY",
  SENTINEL: "MEMWAL_SENTINEL_DELEGATE_KEY",
  RUNNER: "MEMWAL_RUNNER_DELEGATE_KEY",
};

const ALLOWED_NAMESPACES = new Set(["interlock", "interlock-prod"]);

export type WalrusWriteEvidence = {
  memoryId: string;
  jobId: string;
  blobId: string;
  owner: string;
  namespace: string;
  agentId: string;
  payloadHash: string;
};

function getNamespace() {
  const namespace = process.env.MEMWAL_NAMESPACE ?? "interlock";
  if (!ALLOWED_NAMESPACES.has(namespace)) {
    throw new Error("MEMWAL_NAMESPACE is not allowlisted.");
  }
  return namespace;
}

function getClient(agent: AgentType) {
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  const serverUrl = process.env.MEMWAL_SERVER_URL;
  const key = process.env[DELEGATE_ENV[agent]];
  if (!accountId || !serverUrl || !key) {
    throw new Error(`Walrus Memory configuration is incomplete for ${agent}.`);
  }
  return MemWal.create({ key, accountId, serverUrl, namespace: getNamespace() });
}

function createClient(agent: AgentType) {
  return getClient(agent);
}

async function findMetadata(memwal: ReturnType<typeof createClient>, blobId: string) {
  const namespace = getNamespace();
  let cursor: string | undefined;
  let hasMore = true;
  for (let page = 0; page < 10 && hasMore; page += 1) {
    const result = await memwal.listMemories({ cursor, namespace, limit: 100 });
    const match = result.memories.find((memory) => memory.blob_id === blobId);
    if (match) return match;
    cursor = result.next_cursor ?? undefined;
    hasMore = result.has_more;
  }
  return null;
}

export async function writeMemory(
  agent: AgentType,
  envelope: MemoryEnvelope,
): Promise<WalrusWriteEvidence> {
    const parsed = MemoryEnvelopeSchema.parse(envelope);
    const namespace = getNamespace();
    const key = process.env[DELEGATE_ENV[agent]];
    if (!key) throw new Error(`Missing Walrus delegate key for ${agent}.`);

    const payload = canonicalJson(parsed);
    const payloadHash = sha256Hex(payload);
    const memwal = createClient(agent);
    const accepted = await memwal.remember(payload, namespace);
    const result = await memwal.waitForRememberJob(accepted.job_id, { timeoutMs: 120_000 });

    if (!result.blob_id || result.namespace !== namespace) {
      throw new Error("Walrus write did not produce a terminal blob in the expected namespace.");
    }

    const metadata = await findMetadata(memwal, result.blob_id);
    if (!metadata) {
      throw new Error("Walrus metadata listing did not contain the written blob.");
    }

    const publicKey = Buffer.from(await delegateKeyToPublicKey(key)).toString("hex");
    if (metadata.agent_id !== publicKey) {
      throw new Error("Walrus metadata author does not match the writing delegate.");
    }

    const recall = await memwal.recall({
      query: `record ${parsed.recordId} ${parsed.type} ${parsed.scope}`,
      namespace,
      limit: 100,
      sort: "recent",
    });
    const match = recall.results.find((item) => item.blob_id === result.blob_id);
    if (!match) throw new Error("Walrus recall did not return the written blob.");
    if (sha256Hex(match.text) !== payloadHash) {
      throw new Error("Walrus recall content hash does not match the canonical payload.");
    }

    return {
      memoryId: result.id,
      jobId: result.job_id ?? result.id,
      blobId: result.blob_id,
      owner: result.owner,
      namespace: result.namespace,
      agentId: metadata.agent_id ?? publicKey,
      payloadHash,
    };
}

export async function recallVerifiedMemory(
  agent: AgentType,
  expected: { recordId: string; blobId: string; contentHash: string },
): Promise<MemoryEnvelope | null> {
  const memwal = createClient(agent);
  const namespace = getNamespace();
  const recall = await memwal.recall({
    query: `record ${expected.recordId} Walrus memory evidence`,
    namespace,
    limit: 100,
    sort: "recent",
  });
  const match = recall.results.find((item) => item.blob_id === expected.blobId);
  if (!match) return null;
  if (sha256Hex(match.text) !== expected.contentHash) return null;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(match.text);
  } catch {
    return null;
  }
  const parsed = MemoryEnvelopeSchema.safeParse(parsedJson);
  if (!parsed.success) return null;
  if (parsed.data.recordId !== expected.recordId) return null;
  return parsed.data;
}

export function walrusNamespace() {
  return getNamespace();
}
