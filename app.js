// Configuration
const BACKEND_URL = 'https://bank-back-production-e058.up.railway.app';
// Alternative: 'http://localhost:5000' for local testing

// Global variables
let currentMethod = 'bank';
let transactions = [];

// DOM Elements
const withdrawSection = document.getElementById('withdrawSection');
const depositSection = document.getElementById('depositSection');
const tabs = document.querySelectorAll('.tab');
const withdrawForm = document.getElementById('withdrawForm');
const depositForm = document.getElementById('depositForm');
const withdrawAmount = document.getElementById('withdrawAmount');
const depositAmount = document.getElementById('depositAmount');
const methodOptions = document.querySelectorAll('.method-option');
const bankDetails = document.getElementById('bankDetails');
const mpesaDetails = document.getElementById('mpesaDetails');
const balanceAmount = document.getElementById('balanceAmount');
const transactionsList = document.getElementById('transactionsList');
const noTransactions = document.getElementById('noTransactions');
const refreshBalance = document.getElementById('refreshBalance');
const notification = document.getElementById('notification');
const notificationIcon = document.getElementById('notificationIcon');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const notificationClose = document.getElementById('notificationClose');

// Display elements
const displayAmount = document.getElementById('displayAmount');
const displayFees = document.getElementById('displayFees');
const displayNetAmount = document.getElementById('displayNetAmount');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Stripe Money System Initialized');
    
    // Setup tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            setActiveTab(tabId);
        });
    });
    
    // Setup method selection
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            setWithdrawalMethod(method);
        });
    });
    
    // Setup amount calculation
    withdrawAmount.addEventListener('input', calculateFees);
    
    // Form submissions
    withdrawForm.addEventListener('submit', handleWithdrawal);
    depositForm.addEventListener('submit', handleDeposit);
    
    // Refresh balance button
    refreshBalance.addEventListener('click', loadBalance);
    
    // Notification close button
    notificationClose.addEventListener('click', hideNotification);
    
    // Initial calculations
    calculateFees();
    
    // Load initial data
    loadBalance();
    
    console.log('✅ App setup complete');
});

// Set active tab
function setActiveTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Update tabs UI
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show/hide sections
    if (tabId === 'withdraw') {
        withdrawSection.style.display = 'block';
        depositSection.style.display = 'none';
    } else {
        withdrawSection.style.display = 'none';
        depositSection.style.display = 'block';
    }
}

// Set withdrawal method
function setWithdrawalMethod(method) {
    console.log('Setting method to:', method);
    currentMethod = method;
    
    // Update UI
    methodOptions.forEach(option => {
        if (option.getAttribute('data-method') === method) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Show/hide appropriate sections
    if (method === 'bank') {
        bankDetails.style.display = 'block';
        mpesaDetails.style.display = 'none';
        document.getElementById('accountName').required = true;
        document.getElementById('accountNumber').required = true;
        document.getElementById('bankName').required = true;
        document.getElementById('phoneNumber').required = false;
    } else {
        bankDetails.style.display = 'none';
        mpesaDetails.style.display = 'block';
        document.getElementById('accountName').required = false;
        document.getElementById('accountNumber').required = false;
        document.getElementById('bankName').required = false;
        document.getElementById('phoneNumber').required = true;
    }
    
    // Recalculate fees
    calculateFees();
}

// Calculate fees
function calculateFees() {
    const amount = parseFloat(withdrawAmount.value) || 0;
    const fees = currentMethod === 'bank' ? 50 : 25;
    const netAmount = amount - fees;
    
    displayAmount.textContent = `KES ${amount.toLocaleString()}`;
    displayFees.textContent = `KES ${fees.toLocaleString()}`;
    displayNetAmount.textContent = `KES ${Math.max(0, netAmount).toLocaleString()}`;
}

// Load balance from backend
async function loadBalance() {
    try {
        console.log('Loading balance...');
        const response = await fetch(`${BACKEND_URL}/api/balance`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            balanceAmount.textContent = data.balance.toLocaleString();
            console.log('Balance loaded:', data.balance);
        } else {
            showNotification('Failed to load balance', 'error');
        }
    } catch (error) {
        console.error('Balance load error:', error);
        showNotification('Cannot connect to server', 'error');
    }
}

// Handle withdrawal
async function handleWithdrawal(e) {
    e.preventDefault();
    console.log('Processing withdrawal...');
    
    // Get form values
    const amount = parseFloat(withdrawAmount.value);
    const method = currentMethod;
    const accountName = document.getElementById('accountName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const bankName = document.getElementById('bankName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    // Validation
    if (!amount || amount < 100 || amount > 1000000) {
        showNotification('Amount must be between KES 100 and KES 1,000,000', 'error');
        return;
    }
    
    if (method === 'bank') {
        if (!accountName || !accountNumber || !bankName) {
            showNotification('Please fill all bank details', 'error');
            return;
        }
    } else if (method === 'mpesa') {
        if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
            showNotification('Please enter a valid 10-digit phone number', 'error');
            return;
        }
    }
    
    // Prepare data
    const withdrawalData = {
        amount,
        method,
        accountName,
        accountDetails: `${accountNumber} - ${bankName}`,
        phoneNumber
    };
    
    console.log('Withdrawal data:', withdrawalData);
    
    // Show loading
    const withdrawBtn = document.getElementById('withdrawBtn');
    const withdrawBtnText = document.getElementById('withdrawBtnText');
    const withdrawLoader = document.getElementById('withdrawLoader');
    
    withdrawBtn.disabled = true;
    withdrawBtnText.textContent = 'Processing...';
    withdrawLoader.style.display = 'inline-block';
    
    try {
        // Call backend API
        const response = await fetch(`${BACKEND_URL}/api/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(withdrawalData)
        });
        
        const result = await response.json();
        console.log('Withdrawal result:', result);
        
        if (result.success) {
            // Add to transactions list
            addTransaction({
                id: result.transactionId,
                type: 'withdrawal',
                amount: result.amount,
                method: result.method,
                status: 'success',
                message: result.message,
                timestamp: result.timestamp || new Date().toISOString()
            });
            
            // Show success popup
            showNotification(
                `✅ ${result.message}`,
                'success',
                `Transaction ID: ${result.transactionId}<br>Net Amount: KES ${result.netAmount}`
            );
            
            // Reset form
            withdrawForm.reset();
            calculateFees();
            
            // Update balance
            setTimeout(loadBalance, 1000);
        } else {
            // Add failed transaction
            addTransaction({
                id: result.transactionId || `failed_${Date.now()}`,
                type: 'withdrawal',
                amount: amount,
                method: method,
                status: 'failed',
                message: result.message,
                timestamp: new Date().toISOString()
            });
            
            // Show error popup
            showNotification(
                '❌ Withdrawal Failed',
                'error',
                result.message || 'Please try again'
            );
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showNotification(
            '❌ Network Error',
            'error',
            'Cannot connect to server. Please check your connection.'
        );
    } finally {
        // Reset button
        withdrawBtn.disabled = false;
        withdrawBtnText.textContent = 'Withdraw Funds';
        withdrawLoader.style.display = 'none';
    }
}

// Handle deposit
async function handleDeposit(e) {
    e.preventDefault();
    console.log('Processing deposit...');
    
    const amount = parseFloat(depositAmount.value);
    
    // Validation
    if (!amount || amount < 100 || amount > 500000) {
        showNotification('Amount must be between KES 100 and KES 500,000', 'error');
        return;
    }
    
    // Show loading
    const depositBtn = document.getElementById('depositBtn');
    const depositBtnText = document.getElementById('depositBtnText');
    const depositLoader = document.getElementById('depositLoader');
    
    depositBtn.disabled = true;
    depositBtnText.textContent = 'Creating Payment...';
    depositLoader.style.display = 'inline-block';
    
    try {
        // Create deposit session
        const response = await fetch(`${BACKEND_URL}/api/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                returnUrl: window.location.href
            })
        });
        
        const result = await response.json();
        console.log('Deposit result:', result);
        
        if (result.success) {
            // Add to transactions list
            addTransaction({
                id: result.transactionId || `dep_${Date.now()}`,
                type: 'deposit',
                amount: result.amount,
                method: 'stripe',
                status: 'pending',
                message: 'Redirecting to payment...',
                timestamp: new Date().toISOString()
            });
            
            // Redirect to Stripe Checkout
            window.location.href = result.url;
        } else {
            showNotification(
                '❌ Deposit Failed',
                'error',
                result.message || 'Could not create payment'
            );
        }
    } catch (error) {
        console.error('Deposit error:', error);
        showNotification(
            '❌ Network Error',
            'error',
            'Cannot connect to payment server'
        );
    } finally {
        depositBtn.disabled = false;
        depositBtnText.textContent = 'Proceed to Payment';
        depositLoader.style.display = 'none';
    }
}

// Add transaction to list
function addTransaction(transaction) {
    console.log('Adding transaction:', transaction);
    
    // Add to array
    transactions.unshift(transaction);
    
    // Update UI
    updateTransactionsList();
}

// Update transactions list UI
function updateTransactionsList() {
    if (transactions.length === 0) {
        noTransactions.style.display = 'block';
        return;
    }
    
    noTransactions.style.display = 'none';
    
    // Clear and rebuild list
    transactionsList.innerHTML = '';
    
    transactions.slice(0, 5).forEach(txn => {
        const item = document.createElement('div');
        item.className = `transaction-item transaction-${txn.status}`;
        
        const icon = txn.type === 'deposit' ? '⬇️' : '⬆️';
        const methodIcon = txn.method === 'bank' ? '🏦' : 
                          txn.method === 'mpesa' ? '📱' : '💳';
        const statusColor = txn.status === 'success' ? 'var(--success)' : 
                           txn.status === 'failed' ? 'var(--danger)' : 'var(--warning)';
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: 600; color: var(--dark);">
                    ${icon} ${txn.type.toUpperCase()}
                </div>
                <div style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                    ${txn.status.toUpperCase()}
                </div>
            </div>
            <div style="font-size: 1.3rem; font-weight: 700; color: var(--dark); margin: 10px 0;">
                KES ${txn.amount.toLocaleString()}
            </div>
            <div style="color: var(--gray); font-size: 0.9rem;">
                ${methodIcon} ${txn.method.toUpperCase()} • ${new Date(txn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div style="margin-top: 8px; color: var(--dark); font-size: 0.9rem;">
                ${txn.message}
            </div>
        `;
        
        transactionsList.appendChild(item);
    });
}

// Show notification popup
function showNotification(title, type, message = '') {
    console.log('Notification:', type, title, message);
    
    // Set content
    notificationTitle.textContent = title;
    notificationMessage.innerHTML = message;
    
    // Set icon
    if (type === 'success') {
        notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        notification.className = 'notification notification-success';
    } else {
        notificationIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        notification.className = 'notification notification-error';
    }
    
    // Show with animation
    notification.classList.add('show');
    
    // Auto-hide after 5 seconds (only for success)
    if (type === 'success') {
        setTimeout(hideNotification, 5000);
    }
}

// Hide notification
function hideNotification() {
    notification.classList.remove('show');
}
