import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

function App() {
  // Remove default friends, start with empty array
  const [friends, setFriends] = useState([]);
  const [newFriend, setNewFriend] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingFriendName, setPendingFriendName] = useState('');
  const [pendingFriendAddress, setPendingFriendAddress] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitAmong: []
  });
  const [walletAddress, setWalletAddress] = useState('');
  // Add this state to track requests
  const [requests, setRequests] = useState([]);
  const printRef = useRef();

  // Connect wallet function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (err) {
        alert('Wallet connection failed');
      }
    } else {
      alert('MetaMask not detected');
    }
  };

  // Calculate balances between friends
  const calculateBalances = () => {
    const balances = {};
    friends.forEach(friend => {
      balances[friend.name] = 0;
    });
    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      const splitCount = expense.splitAmong.length;
      const perPersonAmount = amount / splitCount;
      balances[expense.paidBy] += amount;
      expense.splitAmong.forEach(person => {
        balances[person] -= perPersonAmount;
      });
    });
    return balances;
  };

  // Add new friend (show modal for address)
  const addFriend = () => {
    const name = newFriend.trim();
    if (name && !friends.some(f => f.name === name)) {
      setPendingFriendName(name);
      setPendingFriendAddress('');
      setShowAddressModal(true);
    }
  };

  // Confirm friend addition with address
  const confirmAddFriend = () => {
    if (pendingFriendName && pendingFriendAddress) {
      setFriends([...friends, { name: pendingFriendName, address: pendingFriendAddress }]);
      setNewFriend('');
      setShowAddressModal(false);
      setPendingFriendName('');
      setPendingFriendAddress('');
    }
  };

  // Remove friend
  const removeFriend = (friendToRemove) => {
    setFriends(friends.filter(friend => friend.name !== friendToRemove));
    setExpenses(expenses.map(expense => ({
      ...expense,
      splitAmong: expense.splitAmong.filter(person => person !== friendToRemove),
      paidBy: expense.paidBy === friendToRemove ? '' : expense.paidBy
    })).filter(expense => expense.paidBy && expense.splitAmong.length > 0));
  };

  // Add new expense
  const addExpense = () => {
    if (
      newExpense.description &&
      newExpense.amount &&
      newExpense.paidBy &&
      newExpense.splitAmong.length > 0
    ) {
      setExpenses([
        ...expenses,
        {
          ...newExpense,
          id: Date.now(),
          amount: parseFloat(newExpense.amount).toFixed(2)
        }
      ]);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: '',
        splitAmong: []
      });
    }
  };

  // Remove expense
  const removeExpense = (expenseId) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
  };

  // Toggle person in split
  const toggleSplitPerson = (person) => {
    const currentSplit = newExpense.splitAmong;
    if (currentSplit.includes(person)) {
      setNewExpense({
        ...newExpense,
        splitAmong: currentSplit.filter(p => p !== person)
      });
    } else {
      setNewExpense({
        ...newExpense,
        splitAmong: [...currentSplit, person]
      });
    }
  };

  // Function to send request to a friend's address
  const sendRequest = (friend) => {
    if (!walletAddress) {
      alert('Connect your wallet first!');
      return;
    }
    if (!friend.address) {
      alert('Friend does not have a wallet address.');
      return;
    }
    setRequests([
      ...requests,
      {
        to: friend.address,
        name: friend.name,
        from: walletAddress,
        time: new Date().toLocaleString()
      }
    ]);
    alert(`Request sent to ${friend.name} (${friend.address})`);
  };

  // Generate split details text
  const getSplitDetailsText = () => {
    if (expenses.length === 0) return "No expenses to print.";
    let output = "Split Details:\n\n";
    expenses.forEach(expense => {
      output += `Expense: ${expense.description}\n`;
      output += `Amount: ${expense.amount} ETH\n`;
      output += `Paid by: ${expense.paidBy}\n`;
      output += `Split among:\n`;
      expense.splitAmong.forEach(name => {
        const friend = friends.find(f => f.name === name);
        const address = friend ? friend.address : "No address";
        const splitAmount = (parseFloat(expense.amount) / expense.splitAmong.length).toFixed(4);
        output += `  - ${name} (${address}): ${splitAmount} ETH\n`;
      });
      output += "\n";
    });
    return output;
  };

  // Save as Image
  const saveAsImage = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const link = document.createElement('a');
    link.download = 'split-details.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Save as PDF (simple print dialog)
  const saveAsPDF = () => {
    window.print();
  };

  const balances = calculateBalances();
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d6e7ff 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '10px 0'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '1.1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '12px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    buttonSmall: {
      padding: '4px 8px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    friendItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '8px'
    },
    expenseItem: {
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '12px'
    },
    balanceItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      borderRadius: '6px',
      backgroundColor: '#f9fafb',
      marginBottom: '8px'
    },
    positiveBalance: {
      color: '#059669',
      fontWeight: '600'
    },
    negativeBalance: {
      color: '#dc2626',
      fontWeight: '600'
    },
    neutralBalance: {
      color: '#6b7280',
      fontWeight: '600'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      padding: '32px',
      minWidth: '350px',
      maxWidth: '90vw'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
            <span style={{fontSize: '2rem'}}>💰</span>
            <h1 style={styles.title}>Ether-Split</h1>
          </div>
          <p style={styles.subtitle}>Split expenses easily with your friends</p>
          {/* Connect Wallet Button */}
          <div style={{marginTop: '16px'}}>
            {walletAddress ? (
              <span style={{color: '#059669', fontWeight: '600'}}>Connected: {walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>
            ) : (
              <button style={{...styles.button, backgroundColor: '#2563eb'}} onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          {/* Friends Management */}
          <div>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <span>👥</span>
                <span>Friends</span>
              </div>
              
              <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                <input
                  style={{...styles.input, marginBottom: '0', flex: '1'}}
                  type="text"
                  value={newFriend}
                  onChange={(e) => setNewFriend(e.target.value)}
                  placeholder="Add friend name..."
                  onKeyPress={(e) => e.key === 'Enter' ? addFriend() : null}
                />
                <button
                  style={styles.button}
                  onClick={addFriend}
                >
                  +
                </button>
              </div>

              <div>
                {friends.map(friend => (
                  <div key={friend.name} style={styles.friendItem}>
                    <span style={{fontWeight: '500', color: '#374151'}}>{friend.name}</span>
                    <span style={{fontSize: '12px', color: '#6b7280', marginLeft: '8px'}}>
                      {friend.address ? friend.address.slice(0,6) + '...' + friend.address.slice(-4) : 'No address'}
                    </span>
                    <div style={{display: 'flex', gap: '4px'}}>
                      <button
                        style={styles.buttonSmall}
                        onClick={() => removeFriend(friend.name)}
                      >
                        ✕
                      </button>
                      {friend.address && (
                        <button
                          style={{...styles.buttonSmall, backgroundColor: '#2563eb'}}
                          onClick={() => sendRequest(friend)}
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Expense */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <span>➕</span>
                <span>Add Expense</span>
              </div>

              <input
                style={styles.input}
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Expense description..."
              />

              <input
                style={styles.input}
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="Amount (ETH)"
              />

              <select
                style={styles.input}
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
              >
                <option value="">Who paid?</option>
                {friends.map(friend => (
                  <option key={friend.name} value={friend.name}>{friend.name}</option>
                ))}
              </select>

              <div style={{marginBottom: '16px'}}>
                <p style={{fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                  Split among:
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px'}}>
                  {friends.map(friend => (
                    <label key={friend.name} style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <input
                        type="checkbox"
                        checked={newExpense.splitAmong.includes(friend.name)}
                        onChange={() => toggleSplitPerson(friend.name)}
                      />
                      <span style={{fontSize: '14px', color: '#374151'}}>{friend.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                style={{
                  ...styles.button,
                  width: '100%',
                  backgroundColor: newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.splitAmong.length > 0 
                    ? '#059669' 
                    : '#9ca3af',
                  cursor: newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.splitAmong.length > 0 
                    ? 'pointer' 
                    : 'not-allowed'
                }}
                onClick={addExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.splitAmong.length === 0}
              >
                Add Expense
              </button>
            </div>
          </div>

          {/* Expenses and Balances */}
          <div>
            {/* Expenses List */}
            <div style={styles.card}>
              <div style={{...styles.sectionTitle, justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span>💵</span>
                  <span>Expenses</span>
                </div>
                <span style={{fontSize: '14px', color: '#6b7280'}}>
                  Total: {totalExpenses.toFixed(2)} ETH
                </span>
              </div>

              {expenses.length === 0 ? (
                <p style={{color: '#6b7280', textAlign: 'center', padding: '20px 0'}}>
                  No expenses added yet
                </p>
              ) : (
                <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                  {expenses.map(expense => (
                    <div key={expense.id} style={styles.expenseItem}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                        <h3 style={{fontWeight: '500', color: '#1f2937', margin: '0'}}>{expense.description}</h3>
                        <button
                          style={styles.buttonSmall}
                          onClick={() => removeExpense(expense.id)}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280'}}>
                        <p style={{margin: '4px 0'}}>Amount: {expense.amount} ETH</p>
                        <p style={{margin: '4px 0'}}>Paid by: {expense.paidBy}</p>
                        <p style={{margin: '4px 0'}}>Split among: {expense.splitAmong.join(', ')}</p>
                        <p style={{margin: '4px 0'}}>Per person: {(parseFloat(expense.amount) / expense.splitAmong.length).toFixed(4)} ETH</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Balances */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>
                <span>🧮</span>
                <span>Balances</span>
              </div>

              {Object.keys(balances).length === 0 ? (
                <p style={{color: '#6b7280', textAlign: 'center', padding: '20px 0'}}>
                  Add some expenses to see balances
                </p>
              ) : (
                <div>
                  {Object.entries(balances).map(([person, balance]) => (
                    <div key={person} style={styles.balanceItem}>
                      <span style={{fontWeight: '500', color: '#374151'}}>{person}</span>
                      <span style={
                        balance > 0 
                          ? styles.positiveBalance
                          : balance < 0 
                            ? styles.negativeBalance
                            : styles.neutralBalance
                      }>
                        {balance > 0 ? '+' : ''}{balance.toFixed(4)} ETH
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {expenses.length > 0 && (
                <div style={{
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#e0e7ff', 
                  borderRadius: '6px'
                }}>
                  <p style={{fontSize: '12px', color: '#4338ca', margin: '0'}}>
                    💡 Positive balance = owed money, Negative balance = owes money
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Requests List */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <span>📨</span>
            <span>Requests Sent</span>
          </div>
          {requests.length === 0 ? (
            <p style={{color: '#6b7280', textAlign: 'center', padding: '12px 0'}}>
              No requests sent yet
            </p>
          ) : (
            <div>
              {requests.map((req, idx) => (
                <div key={idx} style={{marginBottom: '8px', fontSize: '13px', color: '#374151'}}>
                  <span>To <b>{req.name}</b> ({req.to.slice(0,6)}...{req.to.slice(-4)}) at {req.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal for friend address */}
      {showAddressModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.sectionTitle}>
              <span>🔗</span>
              <span>Add Wallet Address</span>
            </div>
            <p style={{color: '#374151', marginBottom: '12px'}}>
              Enter wallet address for <b>{pendingFriendName}</b>:
            </p>
            <input
              style={styles.input}
              type="text"
              value={pendingFriendAddress}
              onChange={e => setPendingFriendAddress(e.target.value)}
              placeholder="0x..."
            />
            <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
              <button
                style={{...styles.button, backgroundColor: '#059669'}}
                onClick={confirmAddFriend}
                disabled={!pendingFriendAddress}
              >
                Add Friend
              </button>
              <button
                style={{...styles.button, backgroundColor: '#ef4444'}}
                onClick={() => {
                  setShowAddressModal(false);
                  setPendingFriendName('');
                  setPendingFriendAddress('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={printRef} style={{whiteSpace: 'pre', background: '#f3f4f6', padding: '16px', borderRadius: '8px', margin: '16px 0'}}>
        {getSplitDetailsText()}
      </div>
      <button
        style={{
          margin: "8px",
          padding: "10px 24px",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
        onClick={saveAsImage}
      >
        Save as Image
      </button>
      <button
        style={{
          margin: "8px",
          padding: "10px 24px",
          backgroundColor: "#059669",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
        onClick={saveAsPDF}
      >
        Save as PDF
      </button>
    </div>
  );
}

export default App;