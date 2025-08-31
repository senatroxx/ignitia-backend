import { config } from "dotenv";

config();

export default {
  SERVER: {
    MODE: process.env.MODE,
    PORT: Number(process.env.PORT) ?? 3000,
  },
};
