# Interlock demo narration

Voice: Kokoro `af_bella`, Apache-2.0 model, local ONNX runtime.

1. Interlock is a verified memory gate for multi-agent systems. Scout observes. Sentinel verifies. Runner simulates only when the evidence supports it.
2. Scout reads a public Sui balance through Tatum, stores the exact observation, and writes a signed fact to Walrus Memory. It verifies the recalled content before activating anything.
3. The memory ledger is an index, not the memory itself. Each record shows its author, scope, hash and Walrus blob. Pending or mismatched records are never active evidence.
4. An owner records a policy as an immutable Walrus constraint. Missing policy always means hold, never implicit approval.
5. An operator creates one immutable plan with an amount and exposure in basis points. The plan hash binds every later decision and clearance.
6. Sentinel enumerates the applicable records, recalls each blob, verifies namespace, author and hash, and applies fixed integer rules. No language model decides.
7. Here, a fifteen percent plan is rejected by a verified ten percent policy. The decision cites the exact fact and constraint, and the verdict is written back to Walrus.
8. The demo harness runs the same plan twice. The unguarded baseline would pass. The protected path rejects with real citations. Same input, different outcome.
9. Runner accepts only a final approval with a verified verdict memory. It mints a sixty second, single use clearance and records one simulation. No funds move.
10. Interlock. Verified memory. Enforced decisions.
