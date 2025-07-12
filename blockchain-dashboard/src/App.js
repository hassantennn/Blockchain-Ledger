import './App.css';
import React, { useEffect, useState } from 'react';

function App() {
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState(null);

  const [miningStatus, setMiningStatus] = useState(null);

  const [showTxHistory, setShowTxHistory] = useState(false);

  // Helper to truncate hashes nicely
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const fetchChain = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/chain');
      const data = await res.json();
      setChain(data.chain);
    } catch (err) {
      console.error('Error fetching blockchain:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (address) => {
    if (!address) {
      setBalance(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/balance/${address}`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();

    // Generate mock wallet address once on component mount
    const address = crypto.randomUUID();
    setWalletAddress(address);
    setSender(address); // pre-fill sender input with this mock address
  }, []);

  useEffect(() => {
    fetchBalance(walletAddress);
  }, [walletAddress]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
      .then(() => {
        setCopyMessage('Wallet address copied!');
        setTimeout(() => setCopyMessage(''), 2000);
      })
      .catch(() => {
        setCopyMessage('Failed to copy wallet address.');
        setTimeout(() => setCopyMessage(''), 2000);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTxStatus(null);

    if (!sender || !receiver || !amount) {
      setTxStatus('Please fill all fields.');
      return;
    }

    const txData = {
      sender: sender.trim(),
      receiver: receiver.trim(),
      amount: Number(amount)
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/transactions/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      });

      const text = await response.text();

      if (response.ok) {
        setTxStatus('✅ Transaction added successfully!');
        setSender(walletAddress); // Reset sender back to wallet address
        setReceiver('');
        setAmount('');
        await fetchChain();
        await fetchBalance(walletAddress);
      } else {
        setTxStatus(text || 'Transaction failed.');
      }
    } catch (error) {
      setTxStatus('⚠️ Error submitting transaction.');
      console.error(error);
    }
  };

  const mineBlock = async () => {
    setMiningStatus('⛏️ Mining block...');
    try {
      const response = await fetch('http://127.0.0.1:5000/mine');
      const text = await response.text();

      if (response.ok) {
        setMiningStatus(`🎉 ${text}`);
        await fetchChain();
        await fetchBalance(walletAddress);
      } else {
        setMiningStatus('⛔ Mining failed.');
      }
    } catch (error) {
      setMiningStatus('⚠️ Error mining block.');
      console.error(error);
    }
  };

  // Filter transactions related to current wallet
  const walletTransactions = chain
    .flatMap(block => block.transactions)
    .filter(tx => tx.sender === walletAddress || tx.receiver === walletAddress);

  return (
    <div className="min-h-screen bg-[#00060e] text-white flex justify-center items-start p-6 relative font-sans">

      {/* Toggle Button */}
      <button
        onClick={() => setShowTxHistory(!showTxHistory)}
        className="fixed top-6 right-6 z-50 bg-indigo-700 hover:bg-indigo-800 rounded-full p-3 shadow-lg transition-colors"
        aria-label="Toggle Transaction History"
        title="Toggle Transaction History"
      >
        {showTxHistory ? '×' : 'Tx History'}
      </button>

      {/* Main Content */}
      <div className={`max-w-6xl w-full transition-all duration-300 ${
        showTxHistory ? 'mr-[320px]' : ''
      }`}>

        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold mb-2 tracking-wide text-indigo-400">BlockVision</h1>
          <p className="text-indigo-300 text-lg">Your Ultimate Blockchain Dashboard</p>
        </header>

        {/* Wallet Section */}
        <section className="max-w-md mx-auto bg-[#111822] rounded-xl shadow-2xl p-8 mb-8 text-center border border-indigo-700">
          <h2 className="text-3xl font-semibold mb-3 text-indigo-300">Your Wallet Address</h2>
          <input
            type="text"
            value={walletAddress}
            onChange={e => setWalletAddress(e.target.value.trim())}
            className="w-full rounded-md border border-indigo-600 bg-[#0c1424] px-4 py-3 text-white placeholder-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 font-mono text-lg"
            placeholder="Enter or paste wallet address"
          />
          <button
            onClick={copyToClipboard}
            className="mb-4 inline-block bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold rounded-md py-2 px-8 text-lg"
          >
            Copy Address
          </button>
          {copyMessage && <p className="mt-2 text-green-400 font-semibold">{copyMessage}</p>}

          <p className="text-2xl font-semibold mt-6">
            Balance: {balanceLoading ? 'Loading...' : balance ?? '0'}
          </p>
        </section>

        {/* Transaction Form */}
        <section className="max-w-md mx-auto bg-[#111822] rounded-xl shadow-2xl p-8 mb-12 border border-indigo-700">
          <h2 className="text-3xl font-semibold mb-6 text-indigo-300">Submit Transaction</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {['Sender', 'Receiver'].map((label, idx) => (
              <div key={idx}>
                <label className="block mb-2 text-indigo-400 font-semibold text-lg">{label}</label>
                <input
                  type="text"
                  value={label === 'Sender' ? sender : receiver}
                  onChange={e =>
                    label === 'Sender' ? setSender(e.target.value.trim()) : setReceiver(e.target.value.trim())
                  }
                  placeholder={`${label} wallet address`}
                  required
                  className="w-full rounded-md border border-indigo-600 bg-[#0c1424] px-4 py-3 text-white placeholder-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                />
              </div>
            ))}

            <div>
              <label className="block mb-2 text-indigo-400 font-semibold text-lg">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount"
                min="1"
                required
                className="w-full rounded-md border border-indigo-600 bg-[#0c1424] px-4 py-3 text-white placeholder-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors font-bold rounded-md py-3 mt-4 text-xl"
            >
              Submit Transaction
            </button>
          </form>
          {txStatus && (
            <p className="mt-5 font-semibold text-center text-yellow-400 animate-pulse">{txStatus}</p>
          )}

          {/* Mine Block */}
          <div className="mt-10 text-center">
            <button
              onClick={mineBlock}
              className="inline-block bg-purple-700 hover:bg-purple-800 transition-colors font-bold rounded-md py-3 px-10 text-xl"
            >
              Mine Block
            </button>
            {miningStatus && (
              <p className="mt-4 font-semibold text-green-400 animate-pulse">{miningStatus}</p>
            )}
          </div>
        </section>

        {/* Blockchain display */}
        <section>
          {loading ? (
            <div className="text-center text-indigo-400 text-xl">Loading blockchain...</div>
          ) : chain.length === 0 ? (
            <div className="text-center text-indigo-400 text-xl">No blocks found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {chain.map(block => (
                <div
                  key={block.index}
                  className="bg-[#111822] rounded-2xl p-6 shadow-2xl border border-indigo-700 flex flex-col"
                >
                  <h3 className="text-2xl font-bold mb-3 text-indigo-400">Block #{block.index}</h3>
                  <p className="mb-1 text-indigo-300">
                    <span className="font-semibold">Hash:</span>{' '}
                    <code
                      title={block.hash}
                      className="break-words font-mono text-xs bg-[#0c1424] rounded px-1"
                    >
                      {truncateHash(block.hash)}
                    </code>
                  </p>
                  <p className="mb-1 text-indigo-300">
                    <span className="font-semibold">Previous Hash:</span>{' '}
                    <code
                      title={block.previous_hash}
                      className="break-words font-mono text-xs bg-[#0c1424] rounded px-1"
                    >
                      {truncateHash(block.previous_hash)}
                    </code>
                  </p>
                  <p className="mb-1 text-indigo-300">
                    <span className="font-semibold">Timestamp:</span>{' '}
                    {new Date(block.timestamp * 1000).toLocaleString()}
                  </p>
                  <p className="mb-1 text-indigo-300">
                    <span className="font-semibold">Nonce:</span> {block.nonce}
                  </p>
                  <div className="mt-4 flex-grow overflow-auto">
                    <strong className="text-indigo-300">Transactions:</strong>
                    <ul className="list-disc list-inside mt-2 max-h-48 overflow-y-auto text-indigo-400 text-sm">
                      {block.transactions.length === 0 ? (
                        <li>No transactions</li>
                      ) : (
                        block.transactions.map((tx, i) => (
                          <li key={i}>
                            From <b>{tx.sender}</b> to <b>{tx.receiver}</b> – {tx.amount}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sidebar for Transaction History */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-[#0a1227] via-[#111822] to-[#1b2738] shadow-2xl border-l border-indigo-700 transform transition-transform duration-300 z-50
          ${showTxHistory ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="relative flex flex-col h-full p-6">

          {/* Close button */}
          <button
            onClick={() => setShowTxHistory(false)}
            className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-200 text-3xl font-bold focus:outline-none"
            aria-label="Close Transaction History"
            title="Close Transaction History"
          >
            ×
          </button>

          <h2 className="text-2xl font-extrabold mb-6 border-b border-indigo-600 pb-3 text-indigo-300 select-none">
            Transaction History
          </h2>

          {walletTransactions.length === 0 ? (
            <p className="text-indigo-400 text-center mt-12">No transactions found for this wallet.</p>
          ) : (
            <ul className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-indigo-900">
              {walletTransactions.map((tx, i) => (
                <li
                  key={`${tx.sender}-${tx.receiver}-${tx.amount}-${i}`}
                  className="bg-[#122040] rounded-lg p-4 border border-indigo-700 cursor-default hover:bg-indigo-900 transition-colors"
                >
                  <span
                    className={`font-semibold ${
                      tx.sender === walletAddress ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {tx.sender === walletAddress ? 'Sent' : 'Received'}
                  </span>{' '}
                  {tx.amount} coins {tx.sender === walletAddress ? `to ${tx.receiver}` : `from ${tx.sender}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
