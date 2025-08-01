// api/createOrder.js

const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { customerName, customerPhone, customerEmail, amount } = req.body;

  const data = JSON.stringify({
    customer_details: {
      customer_name: customerName,
      customer_email: customerEmail || 'test@example.com',
      customer_phone: customerPhone
    },
    order_amount: amount,
    order_currency: 'INR'
  });

  const options = {
    hostname: 'api.cashfree.com',
    path: '/pg/orders',
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-api-version': '2022-09-01',
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY
    }
  };

  const request = https.request(options, (response) => {
    let body = '';
    response.on('data', (chunk) => (body += chunk));
    response.on('end', () => {
      try {
        const result = JSON.parse(body);
        if (result.payment_link) {
          res.status(200).json({ paymentLink: result.payment_link });
        } else {
          res.status(500).json({ error: result });
        }
      } catch (err) {
        res.status(500).json({ error: 'Invalid response from Cashfree' });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });

  request.write(data);
  request.end();
};
