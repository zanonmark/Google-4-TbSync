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

    /* Authentication and authorization. */

    async getNewAuthorizationCode() {
        let clientID = this.getClientID();
        // Prepare a new promise.
        let promise = new Promise(function(resolve, reject) {
            // Prepare the authorization code request URL.
            let authorizationCodeRequestURL = "https://accounts.google.com/o/oauth2/auth?client_id=__CLIENT_ID__&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=__SCOPE__&response_type=code".replace("__CLIENT_ID__", clientID).replace("__SCOPE__", SCOPES);
            console.log("PeopleAPI.getNewAuthorizationCode(): authorizationCodeRequestURL = " + authorizationCodeRequestURL);
            // Open the browser window.
            let authenticationWindow = window.open("chrome://google-4-tbsync/content/manager/authenticate.xhtml", null, "chrome");
            let browserWidget = null;
            let titleInterval = null;
            let authorizationCodeRetrieved = false;
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
                        // ...and if the authorization code could be retrieved...
                        if (null != group) {
                            let authorizationCode = group[1];
                            console.log("PeopleAPI.getNewAuthorizationCode(): authorizationCode = " + authorizationCode);
                            // ...close the browser window...
                            authenticationWindow.close();
                            // ...stop the title interval...
                            clearInterval(titleInterval);
                            // ...and return the authorization code.
                            authorizationCodeRetrieved = true;
                            resolve(authorizationCode);
                        }
                    }
                    // Else if the browser title contains "Error"...
                    else if (browserTitle.startsWith("Error")) {
                        // ...close the browser window...
                        authenticationWindow.close();
                        // ...stop the title interval...
                        clearInterval(titleInterval);
                        // ...and return an error.
                        reject(new Error("Browser title: " + browserTitle));
                    }
                }, 1000);
            };
            authenticationWindow.onclose = function() {
                // Stop the title interval.
                clearInterval(titleInterval);
                // Return an error if the browser window was closed before retrieving the authorization code.
                if (!authorizationCodeRetrieved) {
                    reject(new Error("Browser window closed before the authorization code was retrieved."));
                }
            }
        });
        //
        return promise;
    }

    async getResponseData(requestURL, requestData) {
        console.log("PeopleAPI.getResponseData(): requestURL = " + requestURL);
        console.log("PeopleAPI.getResponseData(): requestData = " + JSON.stringify(requestData));
        // Perform the request.
        let response = await fetch(requestURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });
        // Check the response status.
        console.log("PeopleAPI.getResponseData(): responseStatus = " + response.status);
        if (200 != response.status) {
            throw new Error("Invalid response: " + response.status);
        }
        // Retrieve the response data.
        let responseData = await response.json();
        console.log("PeopleAPI.getResponseData(): responseData = " + JSON.stringify(responseData));
        //
        return responseData;
    }

    async getNewAccessToken() {
        // Get a new authorization code.
        let authorizationCode = await this.getNewAuthorizationCode();
        // Prepare the access token request URL and data.
        let accessTokenRequestURL = "https://accounts.google.com/o/oauth2/token";
        let accessTokenRequestData = {
            code: authorizationCode,
            client_id: this.getClientID(),
            client_secret: this.getClientSecret(),
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            grant_type: "authorization_code",
        };
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData(accessTokenRequestURL, accessTokenRequestData);
        // Retrieve the access token.
        let accessToken = responseData.access_token;
        console.log("PeopleAPI.getNewAccessToken(): accessToken = " + accessToken);
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
