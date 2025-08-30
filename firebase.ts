import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "course90-b95d3",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
