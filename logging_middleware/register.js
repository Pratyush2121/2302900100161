const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = {
  companyName: "Afford Medical Technologies Private Limited",
  ownerName: "Anuj",
  ownerEmail: "anuj.work@example.com",
  rollNo: "2302900100161",
  accessCode: "sdWWgc",
};

const BASE_URL = "http://4.224.186.213/evaluation-service";
const FALLBACK_URL = "http://20.244.56.144/evaluation-service";

async function run() {
  console.log("Starting registration with evaluation service...");
  console.log("Details:", config);

  let clientID = "";
  let clientSecret = "";
  let targetUrl = BASE_URL;

  try {
    console.log(`\n1. Registering at ${targetUrl}/register...`);
    const regRes = await axios.post(`${targetUrl}/register`, config, { timeout: 10000 });
    clientID = regRes.data.clientID;
    clientSecret = regRes.data.clientSecret;
  } catch (err) {
    console.warn(`Primary URL failed: ${err.message}. Trying fallback URL...`);
    try {
      targetUrl = FALLBACK_URL;
      console.log(`Registering at ${targetUrl}/register...`);
      const regRes = await axios.post(`${targetUrl}/register`, config, { timeout: 10000 });
      clientID = regRes.data.clientID;
      clientSecret = regRes.data.clientSecret;
    } catch (fallbackErr) {
      console.error("\n❌ Registration failed on both primary and fallback servers.");
      console.error("Error details:", fallbackErr.response?.data || fallbackErr.message);
      process.exit(1);
    }
  }

  console.log("✅ Registration Successful!");
  console.log(`ClientID: ${clientID}`);
  console.log(`ClientSecret: ${clientSecret}`);

  console.log(`\n2. Authenticating at ${targetUrl}/auth to get JWT token...`);
  const authPayload = {
    companyName: config.companyName,
    clientID,
    clientSecret,
    ownerName: config.ownerName,
    ownerEmail: config.ownerEmail,
    rollNo: config.rollNo,
  };

  let token = "";
  try {
    const authRes = await axios.post(`${targetUrl}/auth`, authPayload);
    token = authRes.data.token || authRes.data.access_token || authRes.data.jwt;
  } catch (err) {
    console.error("\n❌ Authentication failed.");
    console.error("Error details:", err.response?.data || err.message);
    process.exit(1);
  }

  if (!token) {
    console.error("\n❌ Token not found in authentication response:", authRes.data);
    process.exit(1);
  }

  console.log("✅ Authentication Successful! Got JWT Token.");

  const rootDir = path.join(__dirname, "..");
  const envPath = path.join(rootDir, ".env");
  const envContent = `EVALUATION_TOKEN=${token}\n`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n💾 Saved token to: ${envPath}`);
    console.log("Now your application is ready to run and will automatically use your new token.");
  } catch (err) {
    console.error("\n❌ Failed to write .env file:", err.message);
  }
}

run();
