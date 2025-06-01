const allowOrigins = [
  "http://localhost:5173",
  "https://honda-site-golaghat-v2.vercel.app",
];

// Add environment-specific origins
if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
  allowOrigins.push(process.env.FRONTEND_URL);
}

export default allowOrigins;
