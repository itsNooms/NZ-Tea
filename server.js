require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Init Supabase safely
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ DISASTER: Supabase environment variables are MISSING in Vercel settings!');
  }
  supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  );
} catch (e) {
  console.error('❌ Supabase Init Error:', e.message);
}

// In-memory session store
const sessions = new Set();

const fs = require('fs');
let settings = { investedAmount: null };
try {
  if (fs.existsSync('settings.json')) {
    settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  }
} catch (e) {
  console.error('Failed to load settings', e);
}

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(process.cwd()));

// Root route
app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), 'index.html')));

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nztea.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'FaizanNZTea';

  if (email === adminEmail && password === adminPassword) {
    const token = crypto.randomUUID();
    sessions.add(token);
    res.json({ token, email });
  } else {
    res.status(401).json({ error: 'Invalid email or password.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) sessions.delete(token);
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && sessions.has(token)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: 'NZ Tea backend is running' })
);

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const [productsRes, ordersRes, customersRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('orders').select('*, customers(name, email)'),
      supabase.from('customers').select('id', { count: 'exact' }),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (customersRes.error) throw customersRes.error;

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];

    const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const totalStock = products.reduce((s, p) => s + (p.stock_count || 0), 0);
    const calculatedInvested = products.reduce((s, p) => s + ((parseFloat(p.price) || 0) * (p.stock_count || 0)), 0);
    const totalInvested = settings.investedAmount !== null ? settings.investedAmount : calculatedInvested;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customersRes.count || 0,
      totalRevenue,
      totalStock,
      totalInvested,
      pendingOrders,
      statusCounts,
      recentOrders: orders.slice(0, 8),
      lowStockProducts: products.filter(p => p.stock_count < 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── SETTINGS & UPLOADS ────────────────────────────────────────────────────────
app.post('/api/settings/invested', requireAuth, (req, res) => {
  settings.investedAmount = parseFloat(req.body.amount);
  fs.writeFileSync('settings.json', JSON.stringify(settings));
  res.json({ success: true, investedAmount: settings.investedAmount });
});

app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) return res.status(400).json({ error: 'Missing file data' });

    const imagesDir = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }
    const ext = filename.split('.').pop() || 'png';
    const uniqueName = 'upload-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext;
    const buffer = Buffer.from(matches[2], 'base64');

    fs.writeFileSync(path.join(imagesDir, uniqueName), buffer);
    res.json({ url: 'images/' + uniqueName });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select()
      .single();
    if (error) {
      console.error('Create Product Error:', error);
      return res.status(400).json({ error: error.message || 'Failed to create product' });
    }
    res.status(201).json(data);
  } catch (err) {
    console.error('System Error:', err);
    res.status(500).json({ error: 'System error occurred while creating product' });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) {
      console.error('Update Product Error:', error);
      return res.status(400).json({ error: error.message || 'Failed to update product' });
    }
    res.json(data);
  } catch (err) {
    console.error('System Error:', err);
    res.status(500).json({ error: 'System error occurred while updating product' });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, customers(name, email, phone), order_items(quantity, unit_price, size, products(name))`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer, items, totalAmount, paymentType, paidAmount } = req.body;
  try {
    let customerId;
    const { data: existing } = await supabase
      .from('customers').select('id').eq('email', customer.email).single();

    if (existing) {
      customerId = existing.id;
      // Optional: Update customer details if they changed
      await supabase.from('customers').update({ name: customer.name, phone: customer.phone, address: customer.address }).eq('id', customerId);
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert([{ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address }])
        .select().single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        total_amount: totalAmount,
        status: 'Pending',
        payment_status: paymentType === 'Full' ? 'Paid' : 'Unpaid',
        payment_type: paymentType || 'Full',
        paid_amount: parseFloat(paidAmount || 0)
      }])
      .select().single();
    if (orderErr) throw orderErr;

    for (const item of items) {
      await supabase.from('order_items')
        .insert([{ order_id: order.id, product_id: item.productId, quantity: item.quantity, unit_price: item.price, size: item.size }]);
      await supabase.rpc('decrement_inventory', { p_id: item.productId, qnty: item.quantity });
      await supabase.from('inventory_logs')
        .insert([{ product_id: item.productId, change_amount: -item.quantity, reason: `Order placed: ${order.id}` }]);
    }
    res.status(201).json({ message: 'Order created', orderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
app.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(id, total_amount, status, created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Start server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 NZ Tea Server running on http://localhost:${port}`);
    console.log(`   Admin login: ${process.env.ADMIN_EMAIL || 'admin@nztea.com'}`);
  });
}

module.exports = app;
