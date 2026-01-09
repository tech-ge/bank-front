// Configuration
// Auto-detect backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://bank-back-production-e058.up.railway.app';

let banks = [];
let currentMethod = 'bank';
let currentPaymentMethod = 'flutterwave';

// DOM Elements
const withdrawalForm = document.getElementById('withdrawalForm');
const amountInput = document.getElementById('amount');
const bankDetails = document.getElementById('bankDetails');
const mpesaDetails = document.getElementById('mpesaDetails');
const withdrawBtn = document.getElementById('withdrawBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const transactionsList = document.getElementById('transactionsList');
const refreshBtn = document.getElementById('refreshBtn');
const notification = document.getElementById('notification');
const methodOptions = document.querySelectorAll('.method-option');
const bankSelect = document.getElementById('bankCode');

// Display elements
const displayAmount = document.getElementById('displayAmount');
const displayFees = document.getElementById('displayFees');
const displayNetAmount = document.getElementById('displayNetAmount');

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App initialized');
    
    // Load initial data
    await loadBanks();
    
    // Setup method selection
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            setWithdrawalMethod(method);
        });
    });
    
    // Setup payment method selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-payment');
            setPaymentMethod(method);
        });
    });
    
    // Setup amount calculation
    amountInput.addEventListener('input', calculateFees);
    
    // Form submission
    withdrawalForm.addEventListener('submit', handleWithdrawal);
    
    // Calculate initial fees
    calculateFees();
    
    console.log('App setup complete');
});

// Set withdrawal method
function setWithdrawalMethod(method) {
    console.log('Setting withdrawal method to:', method);
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
        document.getElementById('bankCode').required = true;
        document.getElementById('phoneNumber').required = false;
    } else {
        bankDetails.style.display = 'none';
        mpesaDetails.style.display = 'block';
        document.getElementById('accountName').required = false;
        document.getElementById('accountNumber').required = false;
        document.getElementById('bankCode').required = false;
        document.getElementById('phoneNumber').required = true;
    }
    
    // Recalculate fees
    calculateFees();
}

// Set payment gateway method
function setPaymentMethod(method) {
    console.log('Setting payment method to:', method);
    currentPaymentMethod = method;
    
    // Update UI
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        if (option.getAttribute('data-payment') === method) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Calculate fees based on amount and method
function calculateFees() {
    const amount = parseFloat(amountInput.value) || 0;
    const fees = currentMethod === 'bank' ? 50 : 25;
    const netAmount = amount - fees;
    
    displayAmount.textContent = `KES ${amount.toLocaleString()}`;
    displayFees.textContent = `KES ${fees.toLocaleString()}`;
    displayNetAmount.textContent = `KES ${Math.max(0, netAmount).toLocaleString()}`;
}

// Load banks from backend
async function loadBanks() {
    try {
        console.log('Loading banks...');
        const response = await fetch(`${BACKEND_URL}/api/banks`);
        const data = await response.json();
        
        if (data.success) {
            banks = data.banks;
            console.log('Loaded banks:', banks.length);
            
            // Populate bank select
            bankSelect.innerHTML = '<option value="">Select Bank</option>' +
                banks.map(bank => 
                    `<option value="${bank.code}">${bank.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading banks:', error);
        showNotification('Failed to load banks list', 'error');
    }
}

// Handle withdrawal form submission
async function handleWithdrawal(e) {
    e.preventDefault();
    console.log('Handling withdrawal...');
    
    // Get form values
    const amount = parseFloat(amountInput.value);
    const withdrawalMethod = currentMethod;
    const paymentMethod = currentPaymentMethod;
    const accountName = document.getElementById('accountName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const bankCode = document.getElementById('bankCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    // Validation
    if (!amount || amount < 100 || amount > 1000000) {
        showNotification('Amount must be between KES 100 and KES 1,000,000', 'error');
        return;
    }
    
    if (withdrawalMethod === 'bank') {
        if (!accountName || !accountNumber || !bankCode) {
            showNotification('Please fill all bank details', 'error');
            return;
        }
    } else if (withdrawalMethod === 'mpesa') {
        if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
            showNotification('Please enter a valid 10-digit phone number', 'error');
            return;
        }
    }
    
    // Prepare withdrawal data
    const withdrawalData = {
        amount,
        withdrawalMethod,
        paymentMethod,
        accountName,
        accountNumber,
        bankCode,
        phoneNumber
    };
    
    console.log('Submitting withdrawal:', withdrawalData);
    
    // Show loading state
    withdrawBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnLoader.style.display = 'inline-block';
    
    try {
        // Make API call to backend
        const response = await fetch(`${BACKEND_URL}/api/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(withdrawalData)
        });
        
        const result = await response.json();
        console.log('Withdrawal response:', result);
        
        if (result.success) {
            console.log('✅ SUCCESSFUL - Withdrawal of KES ' + amount.toLocaleString() + ' initiated. Transaction ID: ' + result.transactionId);
            
            // Reset form
            withdrawalForm.reset();
            
            // Reset calculation
            calculateFees();
        } else {
            showNotification(`Withdrawal failed: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset button state
        withdrawBtn.disabled = false;
        btnText.textContent = 'Withdraw Funds';
        btnLoader.style.display = 'none';
    }
}

// Load banks from backend
async function loadBanks() {
    try {
        console.log('Loading banks...');
        const response = await fetch(`${BACKEND_URL}/api/banks`);
        const data = await response.json();
        
        if (data.success) {
            banks = data.banks;
            console.log('Loaded banks:', banks.length);
            
            // Populate bank select
            bankSelect.innerHTML = '<option value="">Select Bank</option>' +
                banks.map(bank => 
                    `<option value="${bank.code}">${bank.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading banks:', error);
        showNotification('Failed to load banks list', 'error');
    }
}

// Show notification
function showNotification(message, type) {
    console.log('Notification:', type, message);
    notification.textContent = message;
    notification.className = `notification ${type === 'success' ? 'notification-success' : 'notification-error'}`;
    
    // Add show class
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}
