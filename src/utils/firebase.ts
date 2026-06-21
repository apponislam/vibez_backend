import admin from "firebase-admin";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import path from "path";

// Path to the service account file
const serviceAccountPath = path.join(process.cwd(), "config", "mytest-project-a0bc5-firebase-adminsdk-fbsvc-195a2665e2.json");

// Initialize only once
const apps = getApps();
if (!apps.length) {
    initializeApp({
        credential: cert(serviceAccountPath),
    });
}

export default admin;
