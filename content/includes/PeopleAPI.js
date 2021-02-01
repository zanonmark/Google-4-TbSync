/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const SCOPES = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts"; // https://developers.google.com/people/v1/how-tos/authorizing
const SERVICE_ENDPOINT = "https://people.googleapis.com";
const CONTACT_LIST_PAGE_SIZE = 1000;

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

    setRefreshToken(refreshToken) {
        this.getAccountData().setAccountProperty("refreshToken", refreshToken);
    }

    getRefreshToken() {
        return this.getAccountData().getAccountProperty("refreshToken");
    }

    /* Authentication and authorization. */

    async getNewAuthorizationCode() {
        let clientID = this.getClientID();
        // Prepare a new promise.
        let promise = new Promise(function(resolve, reject) {
            // Prepare the authorization code request URL.
            let authorizationCodeRequestURL = "https://accounts.google.com/o/oauth2/auth";
            authorizationCodeRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
                client_id: clientID,
                redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
                scope: SCOPES,
                response_type: "code",
            });
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

    async getResponseData(method, requestURL, requestData) {
        if ((null == method) || ("" === method)) {
            throw new Error("Invalid value: method: null or empty.");
        }
        if ((null == requestURL) || ("" === requestURL)) {
            throw new Error("Invalid value: requestURL: null or empty.");
        }
        //
        console.log("PeopleAPI.getResponseData(): requestURL = " + requestURL);
        console.log("PeopleAPI.getResponseData(): requestData = " + JSON.stringify(requestData));
        // Perform the request.
        let response = await fetch(requestURL, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: (("GET" === method.toUpperCase()) || ("HEAD" === method.toUpperCase()) ? null : JSON.stringify(requestData)),
        });
        // Check the response status.
        console.log("PeopleAPI.getResponseData(): responseStatus = " + response.status);
        if (200 != response.status) {
            throw new Error("Invalid response: " + response.status + ": " + response.statusText);
        }
        // Retrieve the response data.
        let responseData = await response.json();
        console.log("PeopleAPI.getResponseData(): responseData = " + JSON.stringify(responseData));
        //
        return responseData;
    }

    async retrieveNewRefreshToken() {
        // Get a new authorization code.
        let authorizationCode = await this.getNewAuthorizationCode();
        // Prepare the refresh token request URL and data.
        let refreshTokenRequestURL = "https://accounts.google.com/o/oauth2/token";
        let refreshTokenRequestData = {
            client_id: this.getClientID(),
            client_secret: this.getClientSecret(),
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            grant_type: "authorization_code",
            code: authorizationCode,
        };
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("POST", refreshTokenRequestURL, refreshTokenRequestData);
        // Retrieve the refresh token...
        let refreshToken = responseData.refresh_token;
        console.log("PeopleAPI.retrieveNewRefreshToken(): refreshToken = " + refreshToken);
        // ...and save it to the account data.
        this.setRefreshToken(refreshToken);
    }

    async getNewAccessToken(retrieveNewRefreshToken = false) {
        console.log("PeopleAPI.getNewAccessToken(): retrieveNewRefreshToken = " + retrieveNewRefreshToken);
        // Retrieve a new refresh token if necessary.
        if (retrieveNewRefreshToken) {
            await this.retrieveNewRefreshToken();
        }
        // Get the refresh token.
        let refreshToken = this.getRefreshToken();
        // Prepare the access token request URL and data.
        let accessTokenRequestURL = "https://accounts.google.com/o/oauth2/token";
        let accessTokenRequestData = {
            client_id: this.getClientID(),
            client_secret: this.getClientSecret(),
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        };
        // Try retrieving the access token.
        try {
            // Perform the request and retrieve the response data.
            let responseData = await this.getResponseData("POST", accessTokenRequestURL, accessTokenRequestData);
            // Retrieve the access token.
            let accessToken = responseData.access_token;
            console.log("PeopleAPI.getNewAccessToken(): accessToken = " + accessToken);
            //
            return accessToken;
        }
        catch (error) {
            // If the old refresh token was used, chances are it expired or was invalidated, so...
            if (!retrieveNewRefreshToken) {
                console.log("Unable to get a new access token, retrying with a new refresh token first.");
                // ...retry with a new refresh token.
                return await this.getNewAccessToken(true);
            }
        }
    }

    /* People. */

    async getAuthenticatedUser() { // https://developers.google.com/people/api/rest/v1/people/get
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Prepare the authenticated user request URL and data.
        let authenticatedUserRequestURL = SERVICE_ENDPOINT + "/v1/people/me";
        authenticatedUserRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            personFields: "names,emailAddresses",
            access_token: accessToken,
        });
        let authenticatedUserRequestData = null;
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("GET", authenticatedUserRequestURL, authenticatedUserRequestData);
        // Retrieve the authenticated user.
        let authenticatedUser = responseData;
        //
        console.log("PeopleAPI.getAuthenticatedUser(): authenticatedUser = " + JSON.stringify(authenticatedUser));
        return authenticatedUser;
    }

    async getContactList() { // https://developers.google.com/people/api/rest/v1/people.connections/list
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Retrieve the contact list page by page.
        let contactList = [];
        let nextPageToken = null;
        while (true) {
            console.log("PeopleAPI.getContactList(): nextPageToken = " + nextPageToken);
            // Prepare the partial contact list request URL and data.
            let partialContactListRequestURL = SERVICE_ENDPOINT + "/v1/people/me/connections";
            partialContactListRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
                personFields: "names",
                pageSize: CONTACT_LIST_PAGE_SIZE,
                sortOrder: "LAST_NAME_ASCENDING",
                access_token: accessToken,
            });
            if (null != nextPageToken) {
                partialContactListRequestURL += "&pageToken=" + encodeURIComponent(nextPageToken);
            }
            let partialContactListRequestData = null;
            // Perform the request and retrieve the response data.
            let responseData = await this.getResponseData("GET", partialContactListRequestURL, partialContactListRequestData);
            // Retrieve the partial contact list...
            let partialContactList = responseData.connections;
            // ...and concatenate it with the contact list.
            contactList = contactList.concat(partialContactList);
            // Retrieve the next page token, necessary to retrieve the next page.
            nextPageToken = responseData.nextPageToken;
            // Check if this was the last page.
            if (null == nextPageToken) {
                break;
            }
        }
        //
        console.log("PeopleAPI.getContactList(): contactList = " + JSON.stringify(contactList));
        return contactList;
    }

    checkConnection() {
        (async () => {
            let authenticatedUser = await this.getAuthenticatedUser();
            let authenticatedUserName = authenticatedUser.names[0].displayName;
            let authenticatedUserEmail = authenticatedUser.emailAddresses[0].value;
            //
            let contactList = await this.getContactList();
            //
            alert("Hi " + authenticatedUserName + " (" + authenticatedUserEmail + ").\nYou have " + contactList.length + " contacts.");
        })();
    }

    /* Helpers. */

    static getObjectAsEncodedURIParameters(x) {
        let parameters = [];
        //
        for (let p in x) {
            if (x.hasOwnProperty(p)) {
               parameters.push(encodeURIComponent(p) + "=" + encodeURIComponent(x[p]));
            }
        }
        //
        return parameters.join("&");
    }

}
