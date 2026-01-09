# bank-front

Money Withdrawal System - Frontend

## Features

✅ **User Interface:**
- Responsive web interface
- Support for bank transfers and M-Pesa withdrawals
- Real-time payment gateway selection (Stripe/Flutterwave)
- Dynamic amount calculation with fees
- Beautiful gradient design with Font Awesome icons

✅ **Functionality:**
- Bank account details form
- M-Pesa phone number form
- Real-time fee calculation
- Amount validation (KES 100 - 1,000,000)
- Dynamic bank selection dropdown
- Payment gateway selection
- Live notifications

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend server running on `http://localhost:5000`

### Installation

No build process required! The frontend is pure HTML, CSS, and JavaScript.

```bash
cd frontend

# Option 1: Open directly in browser
open index.html

# Option 2: Serve with Python
python3 -m http.server 3000

# Option 3: Use Node.js http-server
npx http-server -p 3000
```

Then visit: `http://localhost:3000` (or `http://localhost:8000` if using Python)

## Files

- `index.html` - Main HTML structure and inline styles
- `app.js` - Frontend logic and API communication

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`:

### Endpoints Used:
- `GET /api/test` - Test backend connection
- `GET /api/health` - Check backend health
- `GET /api/banks` - Fetch available banks
- `POST /api/withdraw` - Process withdrawal

## Withdrawal Methods Supported

1. **Bank Transfer**
   - Account Name
   - Account Number
   - Bank Selection
   - Fees: KES 50

2. **M-Pesa**
   - Phone Number (10 digits)
   - Fees: KES 25

## Payment Gateways

Users can choose between:
- **Stripe** - For bank transfers
- **Flutterwave** - For mobile & international transfers

## Amount Limits

- **Minimum:** KES 100
- **Maximum:** KES 1,000,000

## Configuration

Update the backend URL in `app.js`:

```javascript
const BACKEND_URL = 'http://localhost:5000';
```

For production, change to your deployed backend URL.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Notes

- Frontend does NOT store sensitive payment details
- All transactions processed through secure backend API
- Uses HTTPS in production
- Real-time notifications via Pusher

## Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Fetch API

## Development

### To modify styles:
Edit the `<style>` section in `index.html`

### To modify form behavior:
Edit the functions in `app.js`

### To change API endpoint:
Update `BACKEND_URL` at the top of `app.js`

## License

ISC

## Author

Tech-GE
