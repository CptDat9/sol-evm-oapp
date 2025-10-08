import { publicKey, transactionBuilder } from "@metaplex-foundation/umi";
import bs58 from "bs58";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { myoapp } from "../lib/client/index.ts";
import { addComputeUnitInstructions, deriveConnection, getSolanaDeployment, TransactionType } from "../tasks/solana/index.ts";
import { getLayerZeroScanLink, isV2Testnet } from "../tasks/utils.ts";

async function main() {
  const fromEid = 40168; // Solana Devnet
  const dstEid = 40102; // BSC Testnet
  const message = "Hello from Solana to EVM";
  const computeUnitPriceScaleFactor = 4;
  const solanaDeployment = getSolanaDeployment(fromEid);
  const { connection, umi, umiWalletSigner } = await deriveConnection(fromEid);
  const myoappInstance = new myoapp.MyOApp(publicKey(solanaDeployment.programId));
  const options = Options.newOptions().toBytes();
  const { nativeFee } = await myoappInstance.quote(
    umi.rpc,
    umiWalletSigner.publicKey,
    { dstEid, message, options, payInLzToken: false }
  );
  console.log("Native fee quoted:", nativeFee.toString());
  let txBuilder = transactionBuilder().add(
    await myoappInstance.send(umi.rpc, umiWalletSigner.publicKey, {
      dstEid,
      message,
      options,
      nativeFee,
    })
  );
  txBuilder = await addComputeUnitInstructions(
    connection,
    umi,
    fromEid,
    txBuilder,
    umiWalletSigner,
    computeUnitPriceScaleFactor,
    TransactionType.SendMessage
  );
  const tx = await txBuilder.sendAndConfirm(umi);
  const txHash = bs58.encode(tx.signature);
  console.log("Sent cross-chain message:", `"${message}"`, "→ endpointId", dstEid);
  console.log("Transaction hash:", txHash);
  console.log("Track transfer:", getLayerZeroScanLink(txHash, isV2Testnet(dstEid)));
}

main().catch(console.error);
