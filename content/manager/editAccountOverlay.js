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
    includeSystemContactGroupsWidget: null,
    useFakeEmailAddresses: null,
    readOnlyMode: null,
/*
    checkConnectionWidget: null,
*/

    onload: function(window, accountData) {
        this.accountData = accountData;
        //
        this.accountNameWidget = document.getElementById("tbsync.accountsettings.pref.accountname");
        this.clientIDWidget = document.getElementById("tbsync.accountsettings.pref.clientID");
        this.clientSecretWidget = document.getElementById("tbsync.accountsettings.pref.clientSecret");
        this.includeSystemContactGroupsWidget = document.getElementById('tbsync.accountsettings.pref.includeSystemContactGroups');
        this.useFakeEmailAddressesWidget = document.getElementById('tbsync.accountsettings.pref.useFakeEmailAddresses');
        this.readOnlyModeWidget = document.getElementById('tbsync.accountsettings.pref.readOnlyMode');
        //
        this.accountNameWidget.value = this.accountData.getAccountProperty("accountname");
        this.clientIDWidget.value = this.accountData.getAccountProperty("clientID");
        this.clientSecretWidget.value = this.accountData.getAccountProperty("clientSecret");
        this.includeSystemContactGroupsWidget.checked = ("true" == this.accountData.getAccountProperty("includeSystemContactGroups"));
        this.useFakeEmailAddressesWidget.checked = ("true" == this.accountData.getAccountProperty("useFakeEmailAddresses"));
        this.readOnlyModeWidget.checked = ("true" == this.accountData.getAccountProperty("readOnlyMode"));
    },

    updateAccountProperty(accountProperty) {
        switch (accountProperty) {
            case "accountName":
                this.accountData.setAccountProperty("accountname", this.accountNameWidget.value);
                break;
            case "clientID":
                this.accountData.setAccountProperty("clientID", this.clientIDWidget.value);
                break;
            case "clientSecret":
                this.accountData.setAccountProperty("clientSecret", this.clientSecretWidget.value);
                break;
            case "includeSystemContactGroups":
                this.accountData.setAccountProperty("includeSystemContactGroups", this.includeSystemContactGroupsWidget.checked);
                break;
            case "useFakeEmailAddresses":
                this.accountData.setAccountProperty("useFakeEmailAddresses", this.useFakeEmailAddressesWidget.checked);
                break;
            case "readOnlyMode":
                this.accountData.setAccountProperty("readOnlyMode", this.readOnlyModeWidget.checked);
                break;
            default:
                break;
        }
    },

    onCheckConnection: function() {
        let accountData = this.accountData;
        //
        let peopleAPI = new PeopleAPI(accountData);
        //
        peopleAPI.checkConnection();
    },

};
