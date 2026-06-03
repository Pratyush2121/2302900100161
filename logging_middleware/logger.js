const axios = require("axios");

const fs = require("fs");
const path = require("path");

const LOG_API = "http://4.224.186.213/evaluation-service/logs";

let localToken = process.env.EVALUATION_TOKEN || "";
if (!localToken) {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/EVALUATION_TOKEN=(.*)/);
      if (match && match[1]) {
        localToken = match[1].trim();
      }
    }
  } catch (e) {}
}

const TOKEN = localToken || "YOUR_OWN_TOKEN_HERE";

const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

const VALID_PACKAGES = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
];

async function Log(stack, level, pkg, message) {
  try {
    if (!VALID_STACKS.includes(stack)) {
      throw new Error(`Invalid stack: ${stack}`);
    }

    if (!VALID_LEVELS.includes(level)) {
      throw new Error(`Invalid level: ${level}`);
    }

    if (!VALID_PACKAGES.includes(pkg)) {
      throw new Error(`Invalid package: ${pkg}`);
    }

    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }

    const response = await axios.post(
      LOG_API,
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data ||
        error.message,
    };
  }
}

module.exports = Log;