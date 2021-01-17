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
    codeWidget: null,
    browserWidget: null,

    onLoad: function() {
        this.providerData = new TbSync.ProviderData("google");
        //
        this.accountNameWidget = document.getElementById("tbsync.newaccount.accountName");
        this.clientIDWidget = document.getElementById("tbsync.newaccount.clientID");
        this.clientSecretWidget = document.getElementById("tbsync.newaccount.clientSecret");
        this.codeWidget = document.getElementById("tbsync.newaccount.code");
        this.browserWidget = document.getElementById("tbsync.newaccount.browser");
        //
        this.browserWidget.style.display = "none";
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
        document.getElementById("tbsync.newaccount.wizard").canAdvance = (("" !== this.accountNameWidget.value.trim()) && ("" !== this.clientIDWidget.value.trim()) && ("" !== this.clientSecretWidget.value.trim()) && ("" !== this.codeWidget.value.trim()));
    },

    onNewCodeRequest: function() {
        let clientID = this.clientIDWidget.value.trim();
        let clientSecret = this.clientSecretWidget.value.trim();
        let code = this.codeWidget.value.trim();
        //
        try {
            let peopleAPI = new PeopleAPI(clientID, clientSecret, code);
            //
            peopleAPI.getNewCode(this.browserWidget, this.codeWidget);
        }
        catch (exception) {
            alert("Could not get a new code: " + exception);
        }
    },

    onFinish: function(event) {
        let accountName = this.accountNameWidget.value.trim();
        let clientID = this.clientIDWidget.value.trim();
        let clientSecret = this.clientSecretWidget.value.trim();
        let code = this.codeWidget.value.trim();
        //
        tbSyncNewAccount.addAccount(accountName, clientID, clientSecret, code);
    },

    addAccount: function(accountName, clientID, clientSecret, code) {
        // Retrieve a new object with default values.
        let newAccountEntry = this.providerData.getDefaultAccountEntries();
        // Override the default values.
        newAccountEntry.clientID = clientID;
        newAccountEntry.clientSecret = clientSecret;
        newAccountEntry.code = code;
        // Add the new account.
        let newAccountData = this.providerData.addAccount(accountName, newAccountEntry);
        //
        window.close();
    },

};
