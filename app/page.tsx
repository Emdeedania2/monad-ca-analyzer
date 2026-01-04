'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder components - will be split later if needed
const StatsCard = ({ title, value, icon: Icon, subtext }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2"
    >
        <div className="p-3 bg-monad-purple/20 rounded-full text-monad-light">
            <Icon size={24} />
        </div>
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtext && <p className="text-xs text-green-400">{subtext}</p>}
    </motion.div>
);

export default function Home() {
    const [contractAddress, setContractAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!contractAddress) return;
        setLoading(true);
        try {
            // Mock API call for now
            const res = await fetch(`/api/analyze?address=${contractAddress}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze contract');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 lg:p-24 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-monad-purple/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col gap-8"
            >
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-monad-light to-monad-purple pb-2">
                        Monad Scout
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Advanced Contract Analysis & Deployer Tracking for Monad Mainnet
                    </p>
                </div>

                {/* Search Section */}
                <div className="w-full max-w-2xl relative">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-monad-purple to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-2">
                            <input
                                type="text"
                                placeholder="Paste Token Contract Address (0x...)"
                                className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-gray-500 font-mono"
                                value={contractAddress}
                                onChange={(e) => setContractAddress(e.target.value)}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="bg-monad-purple hover:bg-monad-light text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-monad-purple/50 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Scanning...' : <><Search size={18} /> Analyze</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {data && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
                    >
                        <StatsCard
                            title="Deployer PnL"
                            value={data.pnl || "$0.00"}
                            subtext="+12% this week"
                            icon={TrendingUp}
                        />
                        <StatsCard
                            title="Tokens Deployed"
                            value={data.deployCount || "0"}
                            icon={Zap}
                        />
                        <StatsCard
                            title="Security Score"
                            value={data.riskScore || "Unknown"}
                            subtext="Based on past launches"
                            icon={ShieldAlert}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:bg-white/5 transition-colors group"
                            onClick={() => alert(`Monitoring enabled for ${data.deployer}`)}
                        >
                            <div className="p-3 bg-green-500/20 rounded-full text-green-400 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Monitor</h3>
                            <p className="text-lg font-bold text-white">Enable Alerts</p>
                        </motion.div>
                    </motion.div>
                )}

                {data && data.history && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full mt-8 glass-panel rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-2 h-8 bg-monad-purple rounded-full" />
                            Deployment History
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b border-white/10">
                                        <th className="pb-4 pl-4">Token Name</th>
                                        <th className="pb-4">Contract</th>
                                        <th className="pb-4">Deployed</th>
                                        <th className="pb-4">Est. PnL</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300">
                                    {data.history.map((item: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 pl-4 font-bold text-white">{item.name}</td>
                                            <td className="py-4 font-mono text-sm text-monad-light">{item.address}</td>
                                            <td className="py-4">{item.date}</td>
                                            <td className="py-4 text-green-400">{item.pnl}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </main>
    );
}
