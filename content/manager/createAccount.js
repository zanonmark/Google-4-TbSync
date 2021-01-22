/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */
 
"use strict";

var { TbSync } = ChromeUtils.import("chrome://tbsync/content/tbsync.jsm");

const google = TbSync.providers.google;

var tbSyncNewAccount = {

    accountNameWidget: null,
    clientIDWidget: null,
    clientSecretWidget: null,

    onLoad: function() {
        this.providerData = new TbSync.ProviderData("google");
        //
        this.accountNameWidget = document.getElementById("tbsync.newaccount.accountName");
        this.clientIDWidget = document.getElementById("tbsync.newaccount.clientID");
        this.clientSecretWidget = document.getElementById("tbsync.newaccount.clientSecret");
        //
        document.getElementById("tbsync.newaccount.wizard").canRewind = false;
        document.getElementById("tbsync.newaccount.wizard").canAdvance = false;
        //
        this.accountNameWidget.focus();
        //
        document.addEventListener("wizardfinish", tbSyncNewAccount.onFinish.bind(this));
    },

    onUnload: function() {
    },

    onClose: function() {
        return true;
    },

    onUserTextInput: function() {
        document.getElementById("tbsync.newaccount.wizard").canAdvance = (("" !== this.accountNameWidget.value.trim()) && ("" !== this.clientIDWidget.value.trim()) && ("" !== this.clientSecretWidget.value.trim()));
    },

    onFinish: function(event) {
        let accountName = this.accountNameWidget.value.trim();
        let clientID = this.clientIDWidget.value.trim();
        let clientSecret = this.clientSecretWidget.value.trim();
        //
        tbSyncNewAccount.addAccount(accountName, clientID, clientSecret);
    },

    addAccount: function(accountName, clientID, clientSecret) {
        // Retrieve a new object with default values.
        let newAccountEntry = this.providerData.getDefaultAccountEntries();
        // Override the default values.
        newAccountEntry.clientID = clientID;
        newAccountEntry.clientSecret = clientSecret;
        // Add the new account.
        let newAccountData = this.providerData.addAccount(accountName, newAccountEntry);
        // Close the window.
        window.close();
    },

};
