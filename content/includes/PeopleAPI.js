/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

if ("undefined" === typeof AuthorizationCodeError) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/AuthorizationCodeError.js", this, "UTF-8");
}
if ("undefined" === typeof IllegalArgumentError) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/IllegalArgumentError.js", this, "UTF-8");
}
if ("undefined" === typeof Logger) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/Logger.js", this, "UTF-8");
}
if ("undefined" === typeof NetworkError) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/NetworkError.js", this, "UTF-8");
}
if ("undefined" === typeof ResponseError) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/ResponseError.js", this, "UTF-8");
}

let { MailE10SUtils } = ChromeUtils.importESModule("resource:///modules/MailE10SUtils.sys.mjs");

const SCOPES = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts"; // https://developers.google.com/people/v1/how-tos/authorizing
const SERVICE_ENDPOINT = "https://people.googleapis.com";
const CONTACT_PERSON_FIELDS = "names,nicknames,emailAddresses,phoneNumbers,addresses,organizations,urls,birthdays,userDefined,imClients,biographies,memberships";
const CONTACT_UPDATE_PERSON_FIELDS = "names,nicknames,emailAddresses,phoneNumbers,addresses,organizations,urls,birthdays,userDefined,imClients,biographies"; // no 'memberships' here
const CONTACT_PAGE_SIZE = 1000;
const CONTACT_GROUP_FIELDS = "name,groupType";
const CONTACT_GROUP_PAGE_SIZE = 1000;

class PeopleAPI {

/* FIXME: disabled as it is still not fully supported.
    _accountData = null;
*/

    /* */

    constructor(accountData) {
        if (null == accountData) {
            throw new IllegalArgumentError("Invalid 'accountData': null.");
        }
        //
        this._accountData = accountData;
        //
        if (null == logger) {
            logger = new Logger(true);
        }
    }

    getAccountData() {
        return this._accountData;
    }

    getClientID() {
        return this.getAccountData().getAccountProperty("clientID");
    }

    getClientSecret() {
        return this.getAccountData().getAccountProperty("clientSecret");
    }

    getIncludeSystemContactGroups() {
        return this.getAccountData().getAccountProperty("includeSystemContactGroups");
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
            logger.log1("PeopleAPI.getNewAuthorizationCode(): authorizationCodeRequestURL = " + authorizationCodeRequestURL);
            // Open the browser window and set the event handlers.
            let windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
            let authenticationWindow = windowWatcher.openWindow(null, "chrome://google-4-tbsync/content/manager/authenticate.xhtml", null, "chrome,centerscreen", null);
            let browserWidget = null;
            let titleInterval = null;
            let authorizationCodeRetrieved = false;
            authenticationWindow.onload = function() {
                // Set the browser widget.
                browserWidget = authenticationWindow.document.getElementById("browser");
                // Load the URL.
                MailE10SUtils.loadURI(browserWidget, authorizationCodeRequestURL);
                // Check the response every 1s.
                titleInterval = authenticationWindow.setInterval(function() {
                    // Retrieve the browser title.
                    let browserTitle = browserWidget.contentTitle;
                    // If the browser title contains "Success"...
                    if (browserTitle.startsWith("Success")) {
                        let pattern = new RegExp("code=(.*)&", "i");
                        let group = pattern.exec(browserTitle);
                        // ...and if the authorization code could be retrieved...
                        if (null != group) {
                            let authorizationCode = group[1];
                            logger.log1("PeopleAPI.getNewAuthorizationCode(): authorizationCode = " + authorizationCode);
                            // Close the browser window.
                            authenticationWindow.close();
                            // Stop the title interval.
                            authenticationWindow.clearInterval(titleInterval);
                            // Return the authorization code.
                            authorizationCodeRetrieved = true;
                            resolve(authorizationCode);
                        }
                    }
                    // If the browser title contains "Error"...
                    else if (browserTitle.startsWith("Error")) {
                        // Close the browser window.
                        authenticationWindow.close();
                        // Stop the title interval.
                        authenticationWindow.clearInterval(titleInterval);
                        // Return an error.
                        reject(new AuthorizationCodeError("Browser title: " + browserTitle));
                    }
                }, 1000);
            };
            authenticationWindow.onclose = function() {
                // Stop the title interval.
                authenticationWindow.clearInterval(titleInterval);
                // Return an error if the browser window was closed before retrieving the authorization code.
                if (!authorizationCodeRetrieved) {
                    reject(new AuthorizationCodeError("Browser window closed before the authorization code was retrieved."));
                }
            }
        });
        //
        return promise;
    }

    async getResponseData(method, requestURL, requestData) {
        if ((null == method) || ("" === method)) {
            throw new IllegalArgumentError("Invalid 'method': null or empty.");
        }
        if ((null == requestURL) || ("" === requestURL)) {
            throw new IllegalArgumentError("Invalid 'requestURL': null or empty.");
        }
        //
        logger.log1("PeopleAPI.getResponseData(): requestURL = " + requestURL);
        logger.log1("PeopleAPI.getResponseData(): requestData = " + JSON.stringify(requestData));
        // Perform the request.
        let response = null;
        try {
            response = await fetch(requestURL, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: ((null == requestData) ? null : JSON.stringify(requestData)),
            });
        }
        catch (error) {
            // If a network error was encountered...
            if (("TypeError" === error.name) && (error.message.includes("NetworkError"))) {
                throw new NetworkError(error.message);
            }
            // If the root reason is different...
            else {
                // Propagate the error.
                throw error;
            }
        }
        // Check the response status.
        logger.log1("PeopleAPI.getResponseData(): responseStatus = " + response.status);
        if (200 != response.status) {
            throw new ResponseError("Invalid response: " + response.status + ": " + response.statusText);
        }
        // Retrieve the response data.
        let responseData = await response.json();
        logger.log1("PeopleAPI.getResponseData(): responseData = " + JSON.stringify(responseData));
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
        // Retrieve the refresh token.
        let refreshToken = responseData.refresh_token;
        logger.log1("PeopleAPI.retrieveNewRefreshToken(): refreshToken = " + refreshToken);
        // Save the refresh token to the account data.
        this.setRefreshToken(refreshToken);
    }

    async getNewAccessToken(retrieveNewRefreshToken = false) {
        logger.log1("PeopleAPI.getNewAccessToken(): retrieveNewRefreshToken = " + retrieveNewRefreshToken);
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
            logger.log1("PeopleAPI.getNewAccessToken(): accessToken = " + accessToken);
            //
            return accessToken;
        }
        catch (error) {
            // If a response error was encountered...
            if (error instanceof ResponseError) {
                // If the old refresh token was used, chances are it expired or was invalidated, so...
                if (!retrieveNewRefreshToken) {
                    // Retry with a new refresh token.
                    logger.log1("Unable to get a new access token, retrying with a new refresh token first.");
                    return await this.getNewAccessToken(true);
                }
                // If the new refresh token was used...
                else {
                    // Propagate the error.
                    throw error;
                }
            }
            // If the root reason is different...
            else {
                // Propagate the error.
                throw error;
            }
        }
    }

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
        logger.log1("PeopleAPI.getAuthenticatedUser(): authenticatedUser = " + JSON.stringify(authenticatedUser));
        return authenticatedUser;
    }

    /* Contacts. */

    async getContacts() { // https://developers.google.com/people/api/rest/v1/people.connections/list
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Retrieve the contacts page by page.
        let contacts = [];
        let nextPageToken = null;
        while (true) {
            logger.log1("PeopleAPI.getContacts(): nextPageToken = " + nextPageToken);
            // Prepare the partial contact request URL and data.
            let partialContactRequestURL = SERVICE_ENDPOINT + "/v1/people/me/connections";
            partialContactRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
                personFields: CONTACT_PERSON_FIELDS,
                pageSize: CONTACT_PAGE_SIZE,
                sortOrder: "LAST_NAME_ASCENDING",
                access_token: accessToken,
            });
            if (null != nextPageToken) {
                partialContactRequestURL += "&pageToken=" + encodeURIComponent(nextPageToken);
            }
            let partialContactRequestData = null;
            // Perform the request and retrieve the response data.
            let responseData = await this.getResponseData("GET", partialContactRequestURL, partialContactRequestData);
            // Retrieve the partial contacts.
            let partialContacts = responseData.connections;
            // Concatenate the partial contacts with the contacts.
            if (null != partialContacts) {
                contacts = contacts.concat(partialContacts);
            }
            // Retrieve the next page token, necessary to retrieve the next page.
            nextPageToken = responseData.nextPageToken;
            // Check if this was the last page.
            if (null == nextPageToken) {
                break;
            }
        }
        //
        logger.log1("PeopleAPI.getContacts(): contacts = " + JSON.stringify(contacts));
        return contacts;
    }

    async createContact(contact) { // https://developers.google.com/people/api/rest/v1/people/createContact
        if (null == contact) {
            throw new IllegalArgumentError("Invalid 'contact': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Prepare the contact creation request URL and data.
        let contactCreationRequestURL = SERVICE_ENDPOINT + "/v1/people:createContact";
        contactCreationRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            personFields: CONTACT_PERSON_FIELDS,
            access_token: accessToken,
        });
        let contactCreationRequestData = contact;
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("POST", contactCreationRequestURL, contactCreationRequestData);
        // Retrieve the response contact.
        let responseContact = responseData;
        //
        logger.log1("PeopleAPI.createContact(): contact = " + JSON.stringify(responseContact));
        return responseContact;
    }

    async updateContact(contact) { // https://developers.google.com/people/api/rest/v1/people/updateContact
        if (null == contact) {
            throw new IllegalArgumentError("Invalid 'contact': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Get the resource name.
        let resourceName = contact.resourceName;
        // Prepare the contact update request URL and data.
        let contactUpdateRequestURL = SERVICE_ENDPOINT + "/v1/" + resourceName + ":updateContact";
        contactUpdateRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            updatePersonFields: CONTACT_UPDATE_PERSON_FIELDS,
            personFields: CONTACT_PERSON_FIELDS,
            access_token: accessToken,
        });
        let contactUpdateRequestData = contact;
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("PATCH", contactUpdateRequestURL, contactUpdateRequestData);
        // Retrieve the response contact.
        let responseContact = responseData;
        //
        logger.log1("PeopleAPI.updateContact(): contact = " + JSON.stringify(responseContact));
        return responseContact;
    }

    async deleteContact(resourceName) { // https://developers.google.com/people/api/rest/v1/people/deleteContact
        if (null == resourceName) {
            throw new IllegalArgumentError("Invalid 'resourceName': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Prepare the contact deletion request URL and data.
        let contactDeletionRequestURL = SERVICE_ENDPOINT + "/v1/" + resourceName + ":deleteContact";
        contactDeletionRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            access_token: accessToken,
        });
        let contactDeletionRequestData = null;
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("DELETE", contactDeletionRequestURL, contactDeletionRequestData);
        //
        logger.log1("PeopleAPI.deleteContact(): contact " + resourceName + " deleted.");
        return true;
    }

    /* Contact groups. */

    async getContactGroups() { // https://developers.google.com/people/api/rest/v1/contactGroups/list
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Retrieve the contact groups page by page.
        let contactGroups = [];
        let nextPageToken = null;
        while (true) {
            logger.log1("PeopleAPI.getContactGroups(): nextPageToken = " + nextPageToken);
            // Prepare the partial contact group request URL and data.
            let partialContactGroupRequestURL = SERVICE_ENDPOINT + "/v1/contactGroups";
            partialContactGroupRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
                groupFields: CONTACT_GROUP_FIELDS,
                pageSize: CONTACT_GROUP_PAGE_SIZE,
                access_token: accessToken,
            });
            if (null != nextPageToken) {
                partialContactGroupRequestURL += "&pageToken=" + encodeURIComponent(nextPageToken);
            }
            let partialContactGroupRequestData = null;
            // Perform the request and retrieve the response data.
            let responseData = await this.getResponseData("GET", partialContactGroupRequestURL, partialContactGroupRequestData);
            // Retrieve the partial contact groups.
            let partialContactGroups = responseData.contactGroups;
            // Concatenate the partial contact groups with the contact groups.
            if (null != partialContactGroups) {
                contactGroups = contactGroups.concat(partialContactGroups);
            }
            // Retrieve the next page token, necessary to retrieve the next page.
            nextPageToken = responseData.nextPageToken;
            // Check if this was the last page.
            if (null == nextPageToken) {
                break;
            }
        }
        //
        logger.log1("PeopleAPI.getContactGroups(): contactGroups = " + JSON.stringify(contactGroups));
        return contactGroups;
    }

    async createContactGroup(contactGroup) { // https://developers.google.com/people/api/rest/v1/contactGroups/create
        if (null == contactGroup) {
            throw new IllegalArgumentError("Invalid 'contactGroup': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Prepare the contact group creation request URL and data.
        let contactGroupCreationRequestURL = SERVICE_ENDPOINT + "/v1/contactGroups";
        contactGroupCreationRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            access_token: accessToken,
        });
        let contactGroupCreationRequestData = {
            "contactGroup": contactGroup,
            "readGroupFields": CONTACT_GROUP_FIELDS,
        };
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("POST", contactGroupCreationRequestURL, contactGroupCreationRequestData);
        // Retrieve the response contact group.
        let responseContactGroup = responseData;
        //
        logger.log1("PeopleAPI.createContactGroup(): contactGroup = " + JSON.stringify(responseContactGroup));
        return responseContactGroup;
    }

    async updateContactGroup(contactGroup) { // https://developers.google.com/people/api/rest/v1/contactGroups/update
        if (null == contactGroup) {
            throw new IllegalArgumentError("Invalid 'contactGroup': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Get the resource name.
        let resourceName = contactGroup.resourceName;
        // Prepare the contact group update request URL and data.
        let contactGroupUpdateRequestURL = SERVICE_ENDPOINT + "/v1/" + resourceName;
        contactGroupUpdateRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            access_token: accessToken,
        });
        let contactGroupUpdateRequestData = {
            "contactGroup": contactGroup,
            "updateGroupFields": CONTACT_GROUP_FIELDS,
            "readGroupFields": CONTACT_GROUP_FIELDS,
        };
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("PUT", contactGroupUpdateRequestURL, contactGroupUpdateRequestData);
        // Retrieve the response contact group.
        let responseContactGroup = responseData;
        //
        logger.log1("PeopleAPI.updateContactGroup(): contactGroup = " + JSON.stringify(responseContactGroup));
        return responseContactGroup;
    }

    async deleteContactGroup(resourceName) { // https://developers.google.com/people/api/rest/v1/contactGroups/delete
        if (null == resourceName) {
            throw new IllegalArgumentError("Invalid 'resourceName': null.");
        }
        // Get a new access token.
        let accessToken = await this.getNewAccessToken();
        // Prepare the contact group deletion request URL and data.
        let contactGroupDeletionRequestURL = SERVICE_ENDPOINT + "/v1/" + resourceName;
        contactGroupDeletionRequestURL += "?" + PeopleAPI.getObjectAsEncodedURIParameters({
            access_token: accessToken,
        });
        let contactGroupDeletionRequestData = null;
        // Perform the request and retrieve the response data.
        let responseData = await this.getResponseData("DELETE", contactGroupDeletionRequestURL, contactGroupDeletionRequestData);
        //
        logger.log1("PeopleAPI.deleteContactGroup(): contact group " + resourceName + " deleted.");
        return true;
    }

    /* Connection tests. */

    checkConnection() {
        (async () => {
            // Attempt the connection.
            try {
                let authenticatedUser = await this.getAuthenticatedUser();
                let authenticatedUserName = authenticatedUser.names[0].displayName;
                let authenticatedUserEmail = authenticatedUser.emailAddresses[0].value;
                //
                let contacts = await this.getContacts();
                let contactGroups = await this.getContactGroups();
                //
                let systemContactGroupCount = 0;
                for (let contactGroup of contactGroups) {
                    if ("SYSTEM_CONTACT_GROUP" === contactGroup.groupType) {
                        systemContactGroupCount++;
                    }
                }
                //
                alert("Hi " + authenticatedUserName + " (" + authenticatedUserEmail + ").\nYou have " + contacts.length + " contacts and " + (contactGroups.length - (this.getIncludeSystemContactGroups() ? 0 : systemContactGroupCount)) + " contact groups.");
            }
            catch (error) {
                // If a network error was encountered...
                if (error instanceof NetworkError) {
                    logger.log1("PeopleAPI.checkConnection(): Network error.");
                    // Alert the user.
                    alert("Network error, connection aborted!");
                }
                // If the root reason is different...
                else {
                    // Propagate the error.
                    throw error;
                }
            }
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
