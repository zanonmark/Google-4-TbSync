/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */
 
"use strict";

Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/AddressBookSynchronizer.js", this, "UTF-8");

var sync = {
    
    finish: function(aStatus = "", msg = "", details = "") {
        let status = TbSync.StatusData.SUCCESS;
        //
        switch (aStatus) {
            case "":
            case "ok":
                status = TbSync.StatusData.SUCCESS;
                //
                break;
            case "info":
                status = TbSync.StatusData.INFO;
                //
                break;
            case "resyncAccount":
                status = TbSync.StatusData.ACCOUNT_RERUN;
                //
                break;
            case "resyncFolder":
                status = TbSync.StatusData.FOLDER_RERUN;
                //
                break;
            case "warning":
                status = TbSync.StatusData.WARNING;
                //
                break;
            case "error":
                status = TbSync.StatusData.ERROR;
                //
                break;
            default:
                console.log("Google-4-TbSync: Unknown status <" + aStatus + ">");
                status = TbSync.StatusData.ERROR;
                //
                break;
        }
        //
        let e = new Error(); 
        e.name = "google-4-tbsync";
        e.message = status.toUpperCase() + ": " + msg.toString() + " (" + details.toString() + ")";
        e.statusData = new TbSync.StatusData(status, msg.toString(), details.toString());
        //
        return e; 
    },

    folderList: async function(syncData) {
        // Retrieve information about the authenticated user.
        let peopleAPI = new PeopleAPI(syncData.accountData);
        let authenticatedUser = await peopleAPI.getAuthenticatedUser();
        let authenticatedUserEmail = authenticatedUser.emailAddresses[0].value;
        // Simulation of folders retrieved from Server.
        let foundFolders = [
            {UID: 1, name: "Google Contacts (" + authenticatedUserEmail + ")"},
        ];
        //
        for (let folder of foundFolders) {
            let existingFolder = syncData.accountData.getFolder("UID", folder.UID);
            //
            if (existingFolder) {
                // We know this folder, update changed properties.
                // foldername is a default FolderProperty.
                existingFolder.setFolderProperty("foldername", folder.name);
            }
            else {
                // Create the folder object for the new folder settings.
                let newFolder = syncData.accountData.createNewFolder();
                // foldername is a default FolderProperty.
                newFolder.setFolderProperty("foldername", folder.name);
                // targetType is a default FolderProperty and is used to select a TargetData implementation.
                newFolder.setFolderProperty("targetType", "addressbook");
                // UID is a custom FolderProperty (defined at getDefaultFolderEntries).
                newFolder.setFolderProperty("UID", folder.UID);
                // Do we have a cached folder?
                let cachedFolderData = syncData.accountData.getFolderFromCache("UID", folder.UID);
                if (cachedFolderData) {
                    // Copy fields from cache which we want to re-use.
                    newFolder.setFolderProperty("downloadonly", cachedFolderData.getFolderProperty("downloadonly"));
                }
            }
        }
    },

    singleFolder: async function(syncData) {
        // Add target to syncData.
        try {
            // Accessing the target for the first time will check if it is available and if not will create it (if possible).
            syncData.target = await syncData.currentFolderData.targetData.getTarget();
        }
        catch (e) {
            Components.utils.reportError(e);
            throw google.sync.finish("warning", e.message);
        }
        //
        syncData.setSyncState("preparing");
        //
        try {
            switch (syncData.currentFolderData.getFolderProperty("targetType")) {
                case "addressbook":
                    await AddressBookSynchronizer.synchronize(syncData);
                    //
                    break;
                default:
                    throw new Error("Unsupported target");
                    //
                    break;
            }
        }
        catch (e) {
            Components.utils.reportError(e);
            throw google.sync.finish("warning", e.message);
        }
    },

}
