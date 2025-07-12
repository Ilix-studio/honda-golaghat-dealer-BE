const allowOrigins = [
  "http://localhost:5173",
  "http://localhost:5173/",
  "http://localhost:5173/admin/addbikes",
  "https://tsangpoolhonda.com/",
  "https://tsangpoolhonda.com",
  "https://tsangpoolhonda.com/view-all",
  "https://tsangpoolhonda.com/admin/dashboard",
  "https://tsangpoolhonda.com/admin/superlogin",
  "https://tsangpoolhonda.com/admin/managerlogin",
  "https://honda-site-golaghat-v2.vercel.app",
  "https://honda-site-golaghat-v2.vercel.app/admin/dashboard",
  "https://honda-site-golaghat-v2.vercel.app/admin/superlogin",
  "https://honda-site-golaghat-v2.vercel.app/admin/managerlogin",
  "",
];

// Add environment-specific origins
if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
  allowOrigins.push(process.env.FRONTEND_URL);
}

export default allowOrigins;

// honda-golaghat-dealer
