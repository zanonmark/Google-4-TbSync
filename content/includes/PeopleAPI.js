/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const SCOPES = "profile https://www.googleapis.com/auth/contacts";
const DISCOVERY_DOCS = [ "https://people.googleapis.com/$discovery/rest?version=v1" ];

class PeopleAPI {

    clientID = null;
    clientSecret = null;
    code = null;
    accessToken = null;

    constructor(clientID, clientSecret, code) {
        this.clientID = clientId;
        this.clientSecret = clientSecret;
        this.code = code;
    }

    getClientID() {
        return this.clientID;
    }

    getClientSecret() {
        return this.clientSecret;
    }

    getCode() {
        return this.code;
    }

    static getNewCode() {
// TODO
    }

    getAccessToken() {
// TODO
    }

}
