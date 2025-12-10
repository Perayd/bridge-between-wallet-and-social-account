// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SiweMessage } from 'siwe';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory store (replace with DB for production)
const linked = {}; // { walletAddress: { provider, socialId, linkedAt } }

app.post('/verify', async (req, res) => {
  try {
    const { message, signature, socialProvider, socialId } = req.body;
    if (!message || !signature || !socialProvider || !socialId) {
      return res.status(400).json({ error: 'Missing fields: message, signature, socialProvider, socialId required.' });
    }

    // Parse SIWE message
    const siwe = new SiweMessage(message);
    const address = siwe.address;

    // Verify signature
    const fields = await siwe.validate(signature);
    // validate() throws on invalid or returns fields on success

    // Basic checks — you should check nonce (from server), domain/origin, issuedAt, and chainId in production.
    // Here we assume validate() ensures signature correctness.

    // Persist mapping (demo)
    linked[address.toLowerCase()] = {
      provider: socialProvider,
      socialId,
      linkedAt: new Date().toISOString()
    };

    return res.json({
      ok: true,
      address,
      linked: linked[address.toLowerCase()]
    });

  } catch (err) {
    console.error('verify error', err);
    return res.status(400).json({ error: err.message || 'Invalid signature or message' });
  }
});

app.get('/linked/:address', (req, res) => {
  const a = (req.params.address || '').toLowerCase();
  if (!a) return res.status(400).json({ error: 'address required' });
  return res.json({ mapped: linked[a] || null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
