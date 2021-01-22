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

    accountData = null;

    /* */

    constructor(accountData) {
        if (null == accountData) {
            throw new Error("Invalid value: accountData: null.");
        }
        //
        this.accountData = accountData;
    }

    getAccountData() {
        return this.accountData;
    }

    getClientID() {
        return this.getAccountData().getAccountProperty("clientID");
    }

    getClientSecret() {
        return this.getAccountData().getAccountProperty("clientSecret");
    }

    /* Connections. */

    async getNewCode() {
        let clientID = this.getClientID();
        // Prepare a new promise.
        let promise = new Promise(function(resolve, reject) {
            // Prepare the authorization code request URL.
            let authorizationCodeRequestURL = "https://accounts.google.com/o/oauth2/auth?client_id=__CLIENT_ID__&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=__SCOPE__&response_type=code".replace("__CLIENT_ID__", clientID).replace("__SCOPE__", SCOPES);
            console.log("PeopleAPI.getNewCode(): authorizationCodeRequestURL = " + authorizationCodeRequestURL);
            // Open the browser window.
            let authenticationWindow = window.open("chrome://google-4-tbsync/content/manager/authenticate.xhtml", null, "chrome");
            let browserWidget = null;
            let titleInterval = null;
            let codeRetrieved = false;
            authenticationWindow.onload = function() {
                // Set the browser widget.
                browserWidget = authenticationWindow.document.getElementById("browser");
                // Load the URL.
                browserWidget.setAttribute("src", authorizationCodeRequestURL);
                // Check the response every 1s.
                titleInterval = setInterval(function() {
                    // Retrieve the browser title.
                    let browserTitle = browserWidget.contentTitle;
                    // If the browser title contains "Success"...
                    if (browserTitle.startsWith("Success")) {
                        let pattern = new RegExp("code=(.*)&", "i");
                        let group = pattern.exec(browserTitle);
                        // ...and if the code could be retrieved...
                        if (null != group) {
                            let code = group[1];
                            console.log("PeopleAPI.getNewCode(): code = " + code);
                            // ...close the browser window...
                            authenticationWindow.close();
                            // ...stop the title interval...
                            clearInterval(titleInterval);
                            // ...and return the code.
                            codeRetrieved = true;
                            resolve(code);
                        }
                    }
                }, 1000);
            };
            authenticationWindow.onclose = function() {
                // Stop the title interval.
                clearInterval(titleInterval);
                // Return an error if the browser window was closed before retrieving the code.
                if (!codeRetrieved) {
                    reject(new Error("Browser window closed before the code was retrieved."));
                }
            }
        });
        //
        return promise;
    }

    async getNewAccessToken() {
        // Get a new code.
        let code = await this.getNewCode();
        // Prepare the access token request URL and data.
        let accessTokenRequestURL = "https://accounts.google.com/o/oauth2/token";
        let accessTokenRequestData = {
            code: code,
            client_id: this.getClientID(),
            client_secret: this.getClientSecret(),
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            grant_type: "authorization_code",
        };
        console.log("PeopleAPI.getAccessToken(): accessTokenRequestURL = " + accessTokenRequestURL);
        console.log("PeopleAPI.getAccessToken(): accessTokenRequestData = " + JSON.stringify(accessTokenRequestData));
        // Perform the request.
        let response = await fetch(accessTokenRequestURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(accessTokenRequestData),
        });
        // Check the response status.
        if (200 != response.status) {
            throw new Error("Invalid response: " + response.status);
        }
        // Retrieve the access token.
        let data = await response.json();
        let accessToken = data.access_token;
        console.log("PeopleAPI.getAccessToken(): accessToken = " + accessToken);
        //
        return accessToken;
    }

    checkConnection() {
        (async () => {
            alert("Your new access token is: " + await this.getNewAccessToken());
        })();
    }

    /* Contacts. */

    getContactList() {
        // Get a new access token.
        let newAccessToken = this.getNewAccessToken();
// TODO
    }

}
