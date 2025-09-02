import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "tsangpool-honda-otp",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail:
      "firebase-adminsdk-fbsvc@tsangpool-honda-otp.iam.gserviceaccount.com",
  }),
});
