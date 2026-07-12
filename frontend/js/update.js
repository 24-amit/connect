import { APP_VERSION } from "./version.js";

export async function checkForUpdates() {

    try {

        const response = await fetch("/version.json");

        const data = await response.json();

        if (data.version !== APP_VERSION) {

            const update = confirm(
                `New Version ${data.version} Available`
            );

            if (update) {
                window.open(data.apk, "_system");
            }
        }

    } catch (err) {
        console.error(err);
    }
}