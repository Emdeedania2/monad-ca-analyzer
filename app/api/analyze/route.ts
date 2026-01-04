import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { monadMainnet } from '@/lib/monad';
import axios from 'axios';

const MONADSCAN_API_URL = 'https://api.monadscan.com/api';
// Generic free-tier or no-key access often works for checking, but in prod use env var
const API_KEY = process.env.MONADSCAN_API_KEY || '';

// Setup Viem client
const client = createPublicClient({
    chain: monadMainnet,
    transport: http(),
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address || !address.startsWith('0x')) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    try {
        // 1. Find Deployer via robust multi-strategy
        let deployer = null;
        let creationDate = '';

        // Strategy 1: Use Etherscan-standard 'getcontractcreation' endpoint
        // This is the most reliable way if supported by MonadScan
        const creationParams = {
            module: 'contract',
            action: 'getcontractcreation',
            contractaddresses: address,
            apikey: API_KEY,
        };

        try {
            // @ts-ignore
            const creationRes = await axios.get(MONADSCAN_API_URL, { params: creationParams });

            if (creationRes.data.status === '1' && creationRes.data.result && creationRes.data.result.length > 0) {
                deployer = creationRes.data.result[0].contractCreator;
                // Note: 'getcontractcreation' might not return timestamp directly.
                // We can fetch the txHash if needed, but for speed we proceed.
            }
        } catch (e) {
            console.log("Strategy 1 (getcontractcreation) failed:", e);
        }

        // Strategy 2: Fallback to first regular transaction (if Strat 1 failed or returned nothing)
        if (!deployer) {
            const txListParams = {
                module: 'account',
                action: 'txlist',
                address: address,
                startblock: 0,
                endblock: 99999999,
                page: 1,
                offset: 1,
                sort: 'asc',
                apikey: API_KEY,
            };

            try {
                const txRes = await axios.get(MONADSCAN_API_URL, { params: txListParams });
                if (txRes.data.status === '1' && txRes.data.result.length > 0) {
                    const creationTx = txRes.data.result[0];
                    deployer = creationTx.from;
                    creationDate = new Date(parseInt(creationTx.timeStamp) * 1000).toLocaleDateString();
                }
            } catch (e) { console.log("Strategy 2 (txlist) failed:", e); }
        }

        // Strategy 3: Internal transactions (for factory deployments)
        if (!deployer) {
            try {
                const internalParams = {
                    module: 'account',
                    action: 'txlistinternal',
                    address: address,
                    startblock: 0,
                    endblock: 99999999,
                    page: 1,
                    offset: 1,
                    sort: 'asc',
                    apikey: API_KEY,
                };
                const internalRes = await axios.get(MONADSCAN_API_URL, { params: internalParams });
                if (internalRes.data.status === '1' && internalRes.data.result.length > 0) {
                    deployer = internalRes.data.result[0].from;
                }
            } catch (e) { console.log("Strategy 3 (internal) failed:", e); }
        }

        if (!deployer) {
            return NextResponse.json({ error: 'Could not identify deployer. Contract might be unverified or very new.' }, { status: 404 });
        }

        // 2. Fetch Deployer Stats (Balance)
        const balance = await client.getBalance({ address: deployer as `0x${string}` });
        const balanceFormatted = formatEther(balance);

        // 3. Fetch Deployer History (Other Contracts)
        // We look for other transactions from this deployer that created contracts (to: null)
        // Note: This is a simplified check. A full check requires scanning all txs.
        const historyParams = {
            module: 'account',
            action: 'txlist',
            address: deployer,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 50, // limit to last 50 txs for speed
            sort: 'desc',
            apikey: API_KEY,
        };

        const historyRes = await axios.get(MONADSCAN_API_URL, { params: historyParams });
        const historyData: any[] = [];
        let deployCount = 0;

        if (historyRes.data.status === '1') {
            const txs = historyRes.data.result;
            for (const tx of txs) {
                // Check for contract creation (to === "" or null)
                // Or if specific methods are called (this is harder to guess without ABI)
                if (!tx.to || tx.to === '') {
                    deployCount++;
                    if (tx.contractAddress && tx.contractAddress.toLowerCase() !== address.toLowerCase()) {
                        historyData.push({
                            name: "Unknown Token", // Cannot easily get name without calling symbol() on each
                            address: tx.contractAddress,
                            date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
                            pnl: "Analyzing...", // Placeholder
                            hash: tx.hash
                        });
                    }
                }
            }
        }

        // 4. Enrich History Data (Get symbols for found contracts) - Parallel execution
        // Limit to first 5 for performance
        const enrichedHistory = await Promise.all(historyData.slice(0, 5).map(async (item) => {
            try {
                const name = await client.readContract({
                    address: item.address as `0x${string}`,
                    abi: [{ name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
                    functionName: 'symbol',
                });
                return { ...item, name: name || 'UNKNOWN' };
            } catch (e) {
                return item; // Keep as Unknown if call fails (not an ERC20)
            }
        }));

        return NextResponse.json({
            contract: address,
            deployer: deployer,
            riskScore: deployCount > 5 ? "Medium" : "Low", // Simple heuristic
            pnl: `${parseFloat(balanceFormatted).toFixed(4)} MON`,
            deployCount: deployCount,
            history: enrichedHistory
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
