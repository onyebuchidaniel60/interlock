import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import { hashCanonical } from "@/lib/domain/canonical";

const ALLOWED_TARGETS = new Set(["sui-mainnet-grpc.gateway.tatum.io", "sui-mainnet-grpc.gateway.tatum.io:443"]);
const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

type GetBalanceResponse = {
  balance?: {
    coinType?: string;
    balance?: string;
    coinBalance?: string;
    addressBalance?: string;
  };
};

export type ChainBalance = {
  provider: "TATUM";
  method: "StateService.GetBalance";
  chain: "SUI";
  network: "MAINNET";
  address: string;
  coinType: string;
  balanceMist: string;
  coinBalanceMist: string | null;
  addressBalanceMist: string | null;
  observedAt: string;
  receivedAt: string;
  providerReference: null;
  checkpoint: null;
  rawResponseHash: string;
};

type StateServiceClient = {
  GetBalance: (
    request: { owner: string; coinType: string },
    metadata: grpc.Metadata,
    options: { deadline: Date },
    callback: (error: grpc.ServiceError | null, response: GetBalanceResponse) => void,
  ) => void;
};

type LoadedProto = {
  sui: {
    rpc: {
      v2: {
        StateService: new (
          target: string,
          credentials: grpc.ChannelCredentials,
          options?: Record<string, unknown>,
        ) => StateServiceClient;
      };
    };
  };
};

let client: StateServiceClient | undefined;

function getClient() {
  if (client) return client;

  const target = process.env.TATUM_SUI_GRPC_TARGET ?? "sui-mainnet-grpc.gateway.tatum.io";
  if (!ALLOWED_TARGETS.has(target)) {
    throw new Error("Tatum gRPC target is not allowlisted.");
  }

  const protoRoot = path.join(process.cwd(), "proto");
  const definition = protoLoader.loadSync("sui/rpc/v2/state_service.proto", {
    includeDirs: [protoRoot],
    keepCase: false,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(definition) as unknown as LoadedProto;
  client = new loaded.sui.rpc.v2.StateService(target, grpc.credentials.createSsl(), {
    "grpc.max_receive_message_length": 16 * 1024 * 1024,
  });
  return client;
}

function asAtomic(value: unknown, field: string): string {
  if (value === undefined || value === null) return "0";
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new Error(`Tatum returned an invalid ${field}.`);
  }
  return text;
}

export async function getSuiBalance(address: string, coinType = DEFAULT_COIN_TYPE): Promise<ChainBalance> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
    throw new Error("Invalid Sui address.");
  }
  if (coinType !== DEFAULT_COIN_TYPE) {
    throw new Error("Only the allowlisted SUI coin type is supported.");
  }
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) throw new Error("TATUM_API_KEY is not configured.");

  const observedAt = new Date().toISOString();
  const metadata = new grpc.Metadata();
  metadata.set("x-api-key", apiKey);

  const response = await new Promise<GetBalanceResponse>((resolve, reject) => {
    getClient().GetBalance(
      { owner: address, coinType },
      metadata,
      { deadline: new Date(Date.now() + 15_000) },
      (error: grpc.ServiceError | null, value: GetBalanceResponse) => {
        if (error) reject(new Error(`Tatum gRPC failed (${error.code}): ${error.details}`));
        else resolve(value);
      },
    );
  });

  if (!response.balance) {
    throw new Error("Tatum returned no balance field.");
  }

  return {
    provider: "TATUM",
    method: "StateService.GetBalance",
    chain: "SUI",
    network: "MAINNET",
    address,
    coinType,
    balanceMist: asAtomic(response.balance.balance, "balance"),
    coinBalanceMist: response.balance.coinBalance ? asAtomic(response.balance.coinBalance, "coinBalance") : null,
    addressBalanceMist: response.balance.addressBalance
      ? asAtomic(response.balance.addressBalance, "addressBalance")
      : null,
    observedAt,
    receivedAt: new Date().toISOString(),
    providerReference: null,
    checkpoint: null,
    rawResponseHash: hashCanonical(response),
  };
}
