import { createPublicClient, http, defineChain } from 'viem';

export const monadMainnet = defineChain({
    id: 143, // Monad Mainnet ID (based on research)
    name: 'Monad Mainnet',
    network: 'monad-mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.monad.xyz'],
        },
        public: {
            http: ['https://rpc.monad.xyz'],
        },
    },
    blockExplorers: {
        default: { name: 'MonadScan', url: 'https://monadscan.com' },
    },
});

export const publicClient = createPublicClient({
    chain: monadMainnet,
    transport: http()
});
