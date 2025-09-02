import admin from "firebase-admin";
import serviceAccount from "./tsangpool-honda-otp-firebase-adminsdk-fbsvc-d12f0a6d9e.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
