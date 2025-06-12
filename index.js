const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const multer = require('multer');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { setIntervalAsync } = require('set-interval-async/fixed');

const app = express();
const port = 5000;

const sessions = {};
const messageQueue = {}; // Store messages for the target number to send continuously
const users = { 'YUSUF RAJA': 'YUSUF-XD' }; // Static Username and Password

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Login page
app.get('/login', (req, res) => {
  res.send(`
    <html>
      <body>
        <div style="background-image: url('[![IMG-20250403-222414.jpg](https://i.postimg.cc/PJkx5SXr/IMG-20250403-222414.jpg)](https://postimg.cc/hzpgCbQH)'); 
                     background-size: cover; height: 100vh; display: flex; justify-content: center; align-items: center;">
          <div style="background: rgba(0, 0, 0, 0.6); padding: 30px; border-radius: 10px; color: white;">
            <h2 style="text-align: center;">Login</h2>
            <form action="/login" method="POST">
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" required /><br><br>

              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required /><br><br>

              <button type="submit">Login</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
              <div style="background: rgba(255, 255, 255, 0.5); padding: 10px; font-size: 16px;">
                <h3>[-LEGEND YUSUF ]</h3>
                <p>[ ❤️ OFFLINE WHATSAPP SERVER ❤️ ] </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] === password) {
    const sessionId = uuidv4();
    res.redirect(`/session/${sessionId}`);
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// Main Page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Session Setup
app.get('/session/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { isConnected: false, qrCode: null, groups: [] };
    setupSession(sessionId);
  }

  const session = sessions[sessionId];
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhatsApp Message Sender</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-image: url('[![IMG-20250403-222414.jpg](https://i.postimg.cc/PJkx5SXr/IMG-20250403-222414.jpg)](https://postimg.cc/hzpgCbQH)');
          background-size: cover;
          background-position: center;
          color: #333;
          margin: 0;
          padding: 0;
          height: 100vh;
        }

        h1 {
          text-align: center;
          color: #FFFFFF;
          padding-top: 50px;
        }

        #qrCodeBox {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.6);
          flex-direction: column;
        }

        #qrCodeBox img {
          max-width: 80%;
          max-height: 80%;
        }

        form {
          margin: 20px auto;
          max-width: 500px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        input, select, button, textarea {
          width: 100%;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }

        input[type="text"], input[type="number"], select, button {
          background-color: #f1f1f1;
        }

        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
        }

        button:hover {
          background-color: #45a049;
        }

        .footer {
          text-align: center;
          color: #4CAF50;
          font-weight: bold;
        }

        .footer a {
          color: #4CAF50;
        }

        #rightReceived {
          background-color: #FFF;
          padding: 20px;
          border: 2px solid #4CAF50;
          margin-top: 30px;
          text-align: center;
          color: #4CAF50;
        }

        .contact-section {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
        }

        .contact-section a {
          color: #4CAF50;
          font-weight: bold;
          text-decoration: none;
          font-size: 18px;
        }

        input[type="text"], input[type="number"], textarea {
          background: linear-gradient(45deg, #ff6347, #ff8c00, #ffd700);
          border: none;
          color: #fff;
          font-weight: bold;
        }

        input[type="text"]:focus, input[type="number"]:focus, textarea:focus {
          outline: none;
        }
      </style>
    </head>
    <body>
      <h1>WhatsApp Message Sender</h1>
      ${session.isConnected ? `
        <form action="/LEGEND-YUSUF/${sessionId}" method="POST" enctype="multipart/form-data">
          <div class="input-box">
            <label for="hater">Enter Hater's Name:</label>
            <input type="text" id="hater" name="hater" placeholder="Enter hater's name" required />
          </div>

          <div class="input-box">
            <label for="target">Select Groups:</label>
            <select id="target" name="target" multiple>
              ${session.groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('')}
            </select>
          </div>

          <div class="input-box">
            <label for="phoneNumber">Enter Target Phone Number (with country code):</label>
            <input type="text" id="phoneNumber" name="phoneNumber" placeholder="e.g., +1234567890" />
          </div>

          <div class="input-box">
            <label for="delay">Enter Delay (seconds):</label>
            <input type="number" id="delay" name="delay" placeholder="Delay in seconds" min="1" required />
          </div>

          <div class="input-box">
            <label for="messageFile">Upload Message File:</label>
            <input type="file" id="messageFile" name="messageFile" accept=".txt" required />
          </div>

          <div class="footer">
            <button type="submit">Send Message</button>
          </div>
        </form>
      ` : `
        <h2>Scan QR Code to Connect WhatsApp</h2>
        <div id="qrCodeBox">
          ${session.qrCode ? `<img src="${session.qrCode}" alt="Scan QR Code"/>` : 'QR Code will appear here...'}
        </div>
        <script>
          setInterval(() => {
            fetch('/session/${sessionId}/qr').then(res => res.json()).then(data => {
              if (data.qrCode) {
                document.getElementById('qrCodeBox').innerHTML = \`<img src="\${data.qrCode}" alt="Scan QR Code"/>\`;
              }
            });
          }, 5000);
        </script>
      `}
      <div id="rightReceived">
        <h3>[🔑RIGHT ☑️RECEIVED 2025⌛]</h3>
        <p>[==> TOOL SCRIPT'☑️CHARACTER '⌛☠️🔛 LEGEND YUSUF RAJA OFFLINE WHATSAPP SERVER 🔛☠️</p>
      </div>

      <div class="contact-section">
        <a href="https://www.facebook.com/welcom.bete.aao.utaao.apne.baap.ki.uid143" target="_blank">Facebook</a>
        <a href="https://wa.me/+9178499 81737" target="_blank">WhatsApp</a>
      </div>
    </body>
    </html>
  `);
});

// Fetch QR Code
app.get('/session/:sessionId/qr', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions[sessionId];
  res.json({ qrCode: session.qrCode });
});

// Fetch Group Names
const fetchGroups = async (socket, sessionId) => {
  const groups = [];
  const chats = await socket.groupFetchAllParticipating();
  for (const groupId in chats) {
    groups.push({ id: groupId, name: chats[groupId].subject });
  }
  sessions[sessionId].groups = groups;
};

// Send Messages
app.post('/send-message/:sessionId', upload.single('messageFile'), async (req, res) => {
  const sessionId = req.params.sessionId;
  const { hater, target, phoneNumber, delay } = req.body;
  const messageFile = req.file.buffer.toString('utf-8');
  const messages = messageFile.split('\n').filter(msg => msg.trim() !== '');

  if (sessions[sessionId]?.socket) {
    const socket = sessions[sessionId].socket;

    try {
      // Convert target to an array if it's a string
      const targetGroups = Array.isArray(target) ? target : target.split(',');

      // Store messages for the target number and initiate continuous sending
      messageQueue[sessionId] = messageQueue[sessionId] || { messages: [], phoneNumber: phoneNumber, targetGroups: targetGroups, index: 0 };
      messageQueue[sessionId].messages = messageQueue[sessionId].messages.concat(messages);

      // Function to send message
      const sendMessageToTarget = async () => {
        const message = `${hater} ${messageQueue[sessionId].messages[messageQueue[sessionId].index]}`;
        // Send to groups
        if (messageQueue[sessionId].targetGroups) {
          for (const groupId of messageQueue[sessionId].targetGroups) {
            await socket.sendMessage(groupId, { text: message });
          }
        }

        // Send to phone number
        if (messageQueue[sessionId].phoneNumber) {
          const formattedNumber = messageQueue[sessionId].phoneNumber.replace(/\D/g, '') + '@s.whatsapp.net';
          await socket.sendMessage(formattedNumber, { text: message });
        }

        // Move to the next message
        messageQueue[sessionId].index++;
        if (messageQueue[sessionId].index >= messageQueue[sessionId].messages.length) {
          messageQueue[sessionId].index = 0; // Loop through messages
        }
      };

      // Set interval to send messages every 30 seconds for 2 years
      setIntervalAsync(sendMessageToTarget, 30000); // 30 seconds interval for nonstop sending

      res.send('Messages are now being sent to the target number and groups.');
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to send messages.');
    }
  } else {
    res.status(400).send('WhatsApp session not connected.');
  }
});

// Setup WhatsApp Session
const setupSession = async (sessionId) => {
  const authDir = `./auth_info/${sessionId}`;
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const connectToWhatsApp = async () => {
    const socket = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'open') {
        sessions[sessionId].isConnected = true;
        await fetchGroups(socket, sessionId);

        // Send approval message to owner's WhatsApp number
        sendApprovalMessage(socket);
      } else if (connection === 'close' && lastDisconnect?.error) {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) await connectToWhatsApp();
      }

      if (qr) {
        sessions[sessionId].qrCode = await qrcode.toDataURL(qr);
      }
    });

    socket.ev.on('creds.update', saveCreds);
    sessions[sessionId].socket = socket;
  };

  await connectToWhatsApp();
};

// Send Approval Message
const sendApprovalMessage = (socket) => {
  const approvalMessage = `😀💔 HELLO YUSUF SIIR AM USING YOUR OFFLINE WHATSAPP SERVER THANKS YOU [❤️=]`;
  const phoneNumber = '+917849981737@s.whatsapp.net';
  socket.sendMessage(phoneNumber, { text: approvalMessage });
};

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
