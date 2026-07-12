import "./firebase.js";
import "./storage.js";
import "./state.js";
import "./timer.js";

import "./ui.js";
import "./dialpad.js";
import "./auth.js";
import "./history.js";
import "./socket.js";
import "./webrtc.js";
import "./call.js";

import { Store } from "./storage.js";
import { setMyNumber } from "./state.js";
import "./auth.js";
import { startApp } from "./auth.js";
import { checkForUpdates } from "./update.js";

window.onload = () => {
    const savedUser = Store.getItem("userNumber");

    if (savedUser) {
        setMyNumber(savedUser);
        startApp();
        return;
    }

    const phoneInput = document.getElementById("phone");

    setTimeout(() => {
        phoneInput.focus();
    }, 300);

    document.getElementById("phone")
        .addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                sendOTP();
            }
        });

    document.getElementById("otp")
        .addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                verifyOTP();
            }
        });
};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then(() => {
                console.log("Service Worker Registered");
            })
            .catch(err => {
                console.error(err);
            });
    });
}

window.addEventListener("load", () => {
    checkForUpdates();
});