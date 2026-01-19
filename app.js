// ================ CONFIGURATION ================
const BACKEND_URL = 'https://bank-back-production-e058.up.railway.app';
// For local testing: 'http://localhost:5000'

// ================ APP STATE ================
let currentMethod = 'bank';
let demoBalance = 100000;

// ================ DOM ELEMENTS ================
const withdrawalForm = document.getElementById('withdrawalForm');
const amountInput = document.getElementById('amount');
const methodOptions = document.querySelectorAll('.method-option');
const bankDetails = document.getElementById('bankDetails');
const mpesaDetails = document.getElementById('mpesaDetails');
const withdrawBtn = document.getElementById('withdrawBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const refreshBtn = document.getElementById('refreshBtn');
const balanceAmount = document.getElementById('balanceAmount');
const displayAmount = document.getElementById('displayAmount');
const displayFees = document.getElementById('displayFees');
const displayNetAmount = document.getElementById('displayNetAmount');
const notification = document.getElementById('notification');
const notificationIcon = document.getElementById('notificationIcon');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const notificationClose = document.getElementById('notificationClose');

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Stripe Money System v2.0 LOADED');
    
    // Setup method selection
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            setWithdrawalMethod(method);
        });
    });
    
    // Setup amount calculation
    amountInput.addEventListener('input', calculateFees);
    
    // Form submission
    withdrawalForm.addEventListener('submit', handleWithdrawal);
    
    // Refresh button
    refreshBtn.addEventListener('click', refreshBalance);
    
    // Notification close
    notificationClose.addEventListener('click', hideNotification);
    
    // Initial calculations
    calculateFees();
    
    // Show initial balance
    updateBalanceDisplay();
    
    console.log('✅ System ready. Backend:', BACKEND_URL);
});

// ================ CORE FUNCTIONS ================
function setWithdrawalMethod(method) {
    console.log('Method:', method);
    currentMethod = method;
    
    // Update UI
    methodOptions.forEach(option => {
        if (option.getAttribute('data-method') === method) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Show/hide forms
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
    
    calculateFees();
}

function calculateFees() {
    const amount = parseFloat(amountInput.value) || 0;
    const fees = currentMethod === 'bank' ? 50 : 25;
    const netAmount = amount - fees;
    
    displayAmount.textContent = `KES ${amount.toLocaleString()}`;
    displayFees.textContent = `KES ${fees.toLocaleString()}`;
    displayNetAmount.textContent = `KES ${Math.max(0, netAmount).toLocaleString()}`;
}

function updateBalanceDisplay() {
    balanceAmount.textContent = demoBalance.toLocaleString();
}

function refreshBalance() {
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing';
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        updateBalanceDisplay();
        showNotification('Balance Refreshed', 'success', 'Updated to KES ' + demoBalance.toLocaleString());
    }, 800);
}

async function handleWithdrawal(e) {
    e.preventDefault();
    console.log('Processing withdrawal...');
    
    // Get values
    const amount = parseFloat(amountInput.value);
    const method = currentMethod;
    const accountName = document.getElementById('accountName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const bankName = document.getElementById('bankName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    // Validation
    if (!amount || amount < 100 || amount > 1000000) {
        showNotification('Invalid Amount', 'error', 'Amount must be between KES 100 and KES 1,000,000');
        return;
    }
    
    if (method === 'bank') {
        if (!accountName || !accountNumber || !bankName) {
            showNotification('Missing Details', 'error', 'Please fill all bank details');
            return;
        }
    } else if (method === 'mpesa') {
        if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
            showNotification('Invalid Phone', 'error', 'Enter valid 10-digit Safaricom number');
            return;
        }
    }
    
    // Check balance
    if (amount > demoBalance) {
        showNotification('Insufficient Balance', 'error', `Available: KES ${demoBalance.toLocaleString()}`);
        return;
    }
    
    // Show loading
    withdrawBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnLoader.style.display = 'inline-block';
    
    try {
        // Prepare data
        const withdrawalData = {
            amount: amount,
            method: method,
            accountName: accountName,
            accountDetails: `${accountNumber} - ${bankName}`,
            phoneNumber: phoneNumber
        };
        
        console.log('Calling backend:', BACKEND_URL);
        
        // Call Stripe backend
        const response = await fetch(`${BACKEND_URL}/api/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(withdrawalData)
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Backend result:', result);
        
        if (result.success) {
            // SUCCESS
            demoBalance -= amount;
            updateBalanceDisplay();
            
            showNotification(
                '✅ Withdrawal Successful!',
                'success',
                `KES ${amount.toLocaleString()} sent via ${method.toUpperCase()}<br>
                 Transaction ID: ${result.transactionId}<br>
                 Net Amount: KES ${result.netAmount}`
            );
            
            // Reset form
            withdrawalForm.reset();
            calculateFees();
            
        } else {
            // FAILED
            showNotification(
                '❌ Withdrawal Failed',
                'error',
                result.message || 'Payment processing failed'
            );
        }
        
    } catch (error) {
        console.error('Network error:', error);
        showNotification(
            '❌ Connection Error',
            'error',
            'Cannot reach server. Check backend is running.'
        );
    } finally {
        // Reset button
        withdrawBtn.disabled = false;
        btnText.textContent = 'Withdraw Funds';
        btnLoader.style.display = 'none';
    }
}

// ================ NOTIFICATION SYSTEM ================
function showNotification(title, type, message = '') {
    console.log(`Notification [${type}]:`, title);
    
    // Set content
    notificationTitle.textContent = title;
    notificationMessage.innerHTML = message;
    
    // Set icon and style
    if (type === 'success') {
        notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        notification.className = 'notification notification-success';
    } else {
        notificationIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        notification.className = 'notification notification-error';
    }
    
    // Show
    notification.classList.add('show');
    
    // Auto-hide success after 5s
    if (type === 'success') {
        setTimeout(hideNotification, 5000);
    }
}

function hideNotification() {
    notification.classList.remove('show');
}

// ================ DEBUG ================
console.log('Frontend Version: 2.0 - Stripe Only');
console.log('Backend URL:', BACKEND_URL);
console.log('Current Time:', new Date().toLocaleString());
