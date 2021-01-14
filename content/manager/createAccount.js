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

    onClose: function() {
        return true;
    },

    onLoad: function() {
        this.providerData = new TbSync.ProviderData("google");
        //
        this.accountNameWidget = document.getElementById('tbsync.newaccount.accountName');
        this.accessTokenWidget = document.getElementById('tbsync.newaccount.accessToken');
        //
        document.getElementById('tbsync.newaccount.wizard').canRewind = false;
        document.getElementById('tbsync.newaccount.wizard').canAdvance = false;
        //
        document.getElementById("tbsync.newaccount.accountName").focus();
        //
        document.addEventListener("wizardfinish", tbSyncNewAccount.onFinish.bind(this));
    },

    onUnload: function() {
    },

    onUserTextInput: function() {
        document.getElementById('tbsync.newaccount.wizard').canAdvance = (("" !== this.accountNameWidget.value.trim()) && ("" !== this.accessTokenWidget.value.trim()));
    },

    onFinish: function(event) {
        let accountName = this.accountNameWidget.value.trim();
        let accessToken = this.accessTokenWidget.value.trim();
        //
        tbSyncNewAccount.addAccount(accountName, accessToken);
    },

    addAccount: function(accountName, accessToken) {
        // Retrieve a new object with default values.
        let newAccountEntry = this.providerData.getDefaultAccountEntries();
        // Override the default values.
        newAccountEntry.accessToken = accessToken;
        // Add the new account.
        let newAccountData = this.providerData.addAccount(accountName, newAccountEntry);
        //
        window.close();
    },

};
