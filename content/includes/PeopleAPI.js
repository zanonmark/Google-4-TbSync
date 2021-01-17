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
        if ((null == clientID) || ("" === clientID)) {
            throw "Invalid value: clientID: null or empty."
        }
        if ((null == clientSecret) || ("" === clientSecret)) {
            throw "Invalid value: clientSecret: null or empty."
        }
        //
        this.clientID = clientID;
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

    getNewCode(browserWidget, codeWidget) {
        if (null == browserWidget) {
            throw "Invalid value: browserWidget: null."
        }
        if (null == codeWidget) {
            throw "Invalid value: codeWidget: null."
        }
        // Prepare the authorization request URL.
        let authorizationRequestURL = "https://accounts.google.com/o/oauth2/auth?client_id=__CLIENT_ID__&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=__SCOPE__&response_type=code".replace("__CLIENT_ID__", this.getClientID()).replace("__SCOPE__", SCOPES);
        // Load the URL.
        browserWidget.src = authorizationRequestURL;
        browserWidget.style.display = "block";
        // Check the response every 1s.
        let interval = setInterval(function() {
            let browserTitle = browserWidget.contentTitle;
            // If the browser title contains "Success"...
            if (browserTitle.startsWith("Success")) {
                let pattern = new RegExp("code=(.*)&", "i");
                let group = pattern.exec(browserTitle);
                // ...and if the code could be retrieved...
                if (null != group) {
                    let code = group[1];
                    // ...apply the code to the textbox...
                    codeWidget.value = code;
                    codeWidget.oninput(); // Trigger the event.
                    // ...then hide the browser...
                    browserWidget.style.display = "none";
                    browserWidget.src = "about:blank";
                    // ...and stop the interval.
                    clearInterval(interval);
                }
            }
        }, 1000);
    }

    getAccessToken() {
// TODO
    }

}
