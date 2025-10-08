import { ethers } from "hardhat";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { getLayerZeroScanLink, isV2Testnet } from "../tasks/utils.ts";
async function main() {
    const dstEid = 40168;/* sol dev */
    const message = "CptDat9 swap 50 USDC to Solana";
    const contractName = "MyOApp";
    console.log("dst eid:", dstEid.toString());
    console.log("meesage:", message);
    const signer = await ethers.getNamedSigner("deployer");
    const myOApp = (await ethers.getContract(contractName)).connect(signer)
    const options = Options.newOptions().toHex().toString(); 
/* Options:
 gasLimit
adapterParams
refundAddress
extraData */
    const [nativeFee] = await myOApp.quote(dstEid, message, options, false);
    console.log("Native fee quote:", nativeFee.toString());
    const tx = await myOApp.send(dstEid, message, options, {
        value: nativeFee,
    });
    const txReceipt = await tx.wait();
    console.log("Sent cross-chain message:", `"${message}"`, "→ endpointId", dstEid);
    console.log("Tx hash:", txReceipt.transactionHash);
    console.log("Track transfer:", getLayerZeroScanLink(txReceipt.transactionHash, isV2Testnet(dstEid)));
}

main().catch(console.error);