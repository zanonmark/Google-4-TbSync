/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

/*
 * Copied and slightly adapted from other TbSync add-ons.
 */

// No need to create namespace, we are in a sandbox.

let onInitDoneObserver = {

    observe: async function (aSubject, aTopic, aData) {        
        let valid = false;
        //
        try {
            var { TbSync } = ChromeUtils.import("chrome://tbsync/content/tbsync.jsm");
            valid = TbSync.enabled;
        }
        catch (e) {
            // If this fails, TbSync is not loaded yet and we will get the notification later again.
        }
        // Load this provider add-on into TbSync.
        if (valid) {
            await TbSync.providers.loadProvider(extension, "google", "chrome://google-4-tbsync/content/provider.js");
        }
    }

}

function startup(data, reason) { // Possible reasons: APP_STARTUP, ADDON_ENABLE, ADDON_INSTALL, ADDON_UPGRADE, or ADDON_DOWNGRADE.
    Services.obs.addObserver(onInitDoneObserver, "tbsync.observer.initialized", false);

    // Did we miss the observer?
    onInitDoneObserver.observe();
}

function shutdown(data, reason) { // Possible reasons: APP_SHUTDOWN, ADDON_DISABLE, ADDON_UNINSTALL, ADDON_UPGRADE, or ADDON_DOWNGRADE.
    // When the application is shutting down, we normally don't have to clean up.
    if (APP_SHUTDOWN == reason) {
        return;
    }
    //
    Services.obs.removeObserver(onInitDoneObserver, "tbsync.observer.initialized");
    // Unload this provider add-on from TbSync.
    try {
        var { TbSync } = ChromeUtils.import("chrome://tbsync/content/tbsync.jsm");
        TbSync.providers.unloadProvider("google");
    }
    catch (e) {
        // If this fails, TbSync has been unloaded already and has unloaded this addon as well.
    }
    //
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}
