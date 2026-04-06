import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Stellar SDK Configuration
 */
const NETWORK_PASSPHRASE = 
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" 
    ? StellarSdk.Networks.PUBLIC 
    : StellarSdk.Networks.TESTNET;

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Get the current Stellar Network configuration
 */
export function getNetworkConfig() {
  return {
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
    horizon: HORIZON_URL,
    passphrase: NETWORK_PASSPHRASE,
  };
}

/**
 * Fetch account details from Horizon
 */
export async function getAccount(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey);
    return account;
  } catch (error) {
    console.error("Error loading Stellar account:", error);
    return null;
  }
}

/**
 * Get the native (XLM) balance of an account
 */
export async function getAccountBalance(publicKey: string) {
  try {
    const account = await getAccount(publicKey);
    if (!account) return "0";
    
    const nativeBalance = account.balances.find((b: any) => b.asset_type === "native");
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
}

/**
 * Check if the account is funded on the current network
 */
export async function isAccountFunded(publicKey: string) {
  const account = await getAccount(publicKey);
  return account !== null;
}

/**
 * Verify a Certificate on the Stellar Blockchain
 * Checks for a ManageData operation matching the certificate hash
 * 
 * @param institutionAddress The public key of the issuing institution
 * @param certHash The unique hash of the certificate to verify
 */
export async function verifyCertificateOnChain(institutionAddress: string, certHash: string) {
  try {
    const account = await server.loadAccount(institutionAddress);
    
    // We expect the certHash to be stored as a key in the account data
    // Key: cert_[hash_prefix], Value: full_hash_timestamp
    const dataEntry = account.data_attr[certHash];
    
    if (dataEntry) {
      // Data entries are base64 encoded strings
      const decodedValue = Buffer.from(dataEntry, "base64").toString();
      return {
        verified: true,
        data: decodedValue,
        institution: institutionAddress
      };
    }
    
    return { verified: false, institution: institutionAddress };
  } catch (error) {
    console.error("Stellar Verification Error:", error);
    return { verified: false, error: "Account not found or ledger error" };
  }
}

/**
 * Prepare a Certificate Issuance Transaction
 * Note: The actual signing must be done by the client (Freighter) 
 * but the backend provides the transaction structure.
 */
/**
 * Prepare a Certificate Issuance Transaction
 * Includes:
 * 1. Payment (micro-amount) to student wallet or self-payment
 * 2. ManageData for immutable cert hash
 * 3. Memo.text for Cert UUID
 */
export async function buildIssuanceTransaction(
  issuerPublicKey: string, 
  studentPublicKey: string | undefined,
  certId: string, 
  certHash: string
) {
  try {
    const account = await server.loadAccount(issuerPublicKey);
    const destination = studentPublicKey || issuerPublicKey; // Self-payment fallback
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount: "0.00001", // Micro-payment
        })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `cert_${certId.substring(0, 10)}`,
          value: certHash,
        })
      )
      .addMemo(StellarSdk.Memo.text(certId.substring(0, 28))) // Memo limit is 28 chars
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    return transaction.toXDR();
  } catch (error) {
    console.error("Error building transaction:", error);
    throw error;
  }
}

/**
 * Helper to compact cert data into a JSON string
 */
/**
 * Fetch raw transaction data from Horizon using a hash
 */
export async function fetchStellarTransaction(txHash: string) {
  try {
    const tx = await server.transactions().transaction(txHash).call();
    return tx;
  } catch (error) {
    console.error("Error fetching Stellar transaction:", error);
    return null;
  }
}

/**
 * Revoke a Certificate on the Stellar Blockchain
 * Deletes the ManageData entry for the certificate
 */
export async function buildRevocationTransaction(issuerPublicKey: string, certId: string) {
  try {
    const account = await server.loadAccount(issuerPublicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `cert_${certId.substring(0, 10)}`,
          value: null as any, // Null deletes the key
        })
      )
      .addMemo(StellarSdk.Memo.text(`REVOKE_${certId.substring(0, 20)}`))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    return transaction.toXDR();
  } catch (error) {
    console.error("Error building revocation transaction:", error);
    throw error;
  }
}

/**
 * Helper to compact cert data into a JSON string
 */
export function createCertMetadata(data: any) {
  return JSON.stringify({
    n: data.recipientName,
    e: data.recipientEmail,
    c: data.courseTitle,
    d: data.issueDate,
    i: data.certId
  });
}
