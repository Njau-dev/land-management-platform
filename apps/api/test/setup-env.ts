process.env["NODE_ENV"] = "test";
process.env["JWT_ACCESS_SECRET"] =
  "test-access-secret-that-is-at-least-thirty-two-characters-long";
process.env["JWT_REFRESH_SECRET"] =
  "test-refresh-secret-that-is-distinct-and-at-least-thirty-two-characters";
process.env["JWT_ACCESS_EXPIRES_IN"] = "15m";
process.env["JWT_REFRESH_EXPIRES_IN"] = "7d";
process.env["MPESA_ENVIRONMENT"] = "sandbox";
process.env["MPESA_CONSUMER_KEY"] = "test-consumer-key";
process.env["MPESA_CONSUMER_SECRET"] = "test-consumer-secret";
process.env["MPESA_SHORTCODE"] = "174379";
process.env["MPESA_PASSKEY"] = "test-sandbox-passkey";
process.env["MPESA_CALLBACK_URL"] =
  "https://example.test/api/v1/payments/mpesa/callback";
process.env["MPESA_SIMULATE_CALLBACK"] = "true";
