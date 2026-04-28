import "./server/env.js";

import { createApp } from "./server/app.js";
import { startBankEmailCron } from "./server/services/bank-email-cron.js";

const port = Number(process.env.PORT) || 3000;

const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
  startBankEmailCron();
});
