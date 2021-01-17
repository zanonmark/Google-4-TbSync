/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const google = TbSync.providers.google;

var tbSyncEditAccountOverlay = {

    accountNameWidget: null,
    clientIDWidget: null,
    clientSecretWidget: null,
    codeWidget: null,
    browserWidget: null,

    onLoad: function(window, accountData) {
        this.accountNameWidget = document.getElementById("tbsync.accountsettings.pref.accountname");
        this.clientIDWidget = document.getElementById("tbsync.accountsettings.pref.clientID");
        this.clientSecretWidget = document.getElementById("tbsync.accountsettings.pref.clientSecret");
        this.codeWidget = document.getElementById("tbsync.accountsettings.pref.code");
        this.browserWidget = document.getElementById("tbsync.newaccount.browser");
        //
        this.browserWidget.style.display = "none";
        //
        this.accountData = accountData;
    },

    onUnload: function() {
    },

    onClose: function() {
        return true;
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

};
