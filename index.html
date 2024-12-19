const express = require("express");
const fs = require("fs");
const multer = require("multer");
const pino = require("pino");
const {
  makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Global variables
let MznKing;
let isConnected = false;
let qrCode;
let runningGroups = new Map(); // Track running groups and intervals

// Initialize WhatsApp connection
async function startConnection() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const logger = pino({ level: "debug" });

  MznKing = makeWASocket({
    version,
    auth: state,
    logger,
  });

  MznKing.ev.on("creds.update", saveCreds);

  MznKing.ev.on("connection.update", (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      qrCode = qr; // Save QR code
      console.log("QR Code updated");
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startConnection();
      isConnected = false;
    } else if (connection === "open") {
      console.log("Connected successfully!");
      isConnected = true;
    }
  });
}

// Start the connection on server startup
startConnection();

// API to get QR Code
app.get("/get-qr", (req, res) => {
  if (qrCode) {
    res.json({ success: true, qr: qrCode });
  } else {
    res.json({ success: false, message: "QR Code not generated yet." });
  }
});

// API to check login status
app.get("/login-status", (req, res) => {
  res.json({ isConnected });
});

// API to fetch group list
app.get("/get-group-list", async (req, res) => {
  try {
    const groups = await MznKing.groupFetchAllParticipating();
    const groupList = Object.values(groups).map((group) => ({
      name: group.subject,
      uid: group.id,
    }));
    res.json({ success: true, groups: groupList });
  } catch (error) {
    console.error("Error fetching group list:", error.message);
    res.json({ success: false, message: "Error fetching group list." });
  }
});

// API to start sending messages to a group
app.post("/start-sending", upload.single("messageFile"), async (req, res) => {
  const { userName, groupUid, interval } = req.body;
  const messageFilePath = req.file.path;

  if (!userName || !groupUid || !interval || !messageFilePath) {
    return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  try {
    const messages = fs.readFileSync(messageFilePath, "utf-8").split("\n");
    const sendInterval = parseInt(interval);

    // Check if the interval is valid
    if (isNaN(sendInterval) || sendInterval <= 0) {
      return res.status(400).json({ success: false, message: "Invalid interval." });
    }

    let messageIndex = 0;

    // Start sending messages at the specified interval
    const groupInterval = setInterval(async () => {
      const message = messages[messageIndex].trim();
      if (message) {
        const messageWithUserName = `${userName} ${message}`; // Append user name to message
        await MznKing.sendMessage(groupUid, { text: messageWithUserName });
        console.log(`Sent message: ${messageWithUserName} to group: ${groupUid}`);
      }

      messageIndex++;
      if (messageIndex >= messages.length) {
        messageIndex = 0; // Loop over the messages once all are sent
      }
    }, sendInterval * 1000); // Interval in milliseconds

    runningGroups.set(groupUid, groupInterval);

    res.json({ success: true, message: "Started sending messages." });
  } catch (error) {
    console.error("Error starting messages:", error.message);
    res.json({ success: false, message: "Error starting messages." });
  }
});

// API to stop sending messages for a group
app.post("/stop-sending", (req, res) => {
  const { groupUid } = req.body;
  
  if (runningGroups.has(groupUid)) {
    clearInterval(runningGroups.get(groupUid));
    runningGroups.delete(groupUid);
    console.log(`Stopped sending messages to group: ${groupUid}`);
    res.json({ success: true, message: `Stopped sending messages to group: ${groupUid}` });
  } else {
    res.status(404).json({ success: false, message: "Group not found or not running." });
  }
});

// Serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Start the server
app.listen(port, () => {
  console.log(`WhatsApp bot server is running at http://localhost:${port}`);
});
