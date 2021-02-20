/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/PeopleAPI.js", this, "UTF-8");

class AddressBookSynchronizer {

    /* Synchronization. */

    static async synchronize(syncData) {
        if (null == syncData) {
            new Error("Invalid 'syncData': null.");
        }
        // Retrieve the target address book.
        let targetAddressBook = syncData.target;
        if (null == targetAddressBook) {
            new Error("Invalid target address book: null.");
        }
        // Create a new PeopleAPI object.
        let peopleAPI = new PeopleAPI(syncData.accountData);
        // Retrieve all server contacts.
        let serverContacts = await peopleAPI.getContacts();
        // Prepare the variables for the cycles.
        console.log("AddressBookSynchronizer.synchronize(): Retrieving local changes since the last synchronization.");
        let addedLocalContacts = targetAddressBook.getAddedItemsFromChangeLog();
        let modifiedLocalContacts = targetAddressBook.getModifiedItemsFromChangeLog();
        let deletedLocalContacts = targetAddressBook.getDeletedItemsFromChangeLog();
        // Cycle on the server contacts.
        console.log("AddressBookSynchronizer.synchronize(): Cycling on the server contacts.");
        for (let serverContact of serverContacts) {
            // Get the resource name (in the form 'people/contact_id') and the display name.
            let resourceName = serverContact.resourceName;
            let displayName = serverContact.names[0].displayName;
            console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ")");
            // Try to match the server contact locally.
            let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", resourceName);
            // If such a local contact is currently unavailable...
            if (null == localContact) {
                // ...and if it was previously deleted locally...
                if (deletedLocalContacts.includes(resourceName)) {
                    // Delete the server contact remotely.
                    await peopleAPI.deleteContact(resourceName);
                    console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was deleted remotely.");
                    // Remove the resource name from the local changelog (deleted items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
                // ...and if it wasn't previously deleted locally...
                else {
                    // Create a new local contact.
                    localContact = targetAddressBook.createNewCard();
                    localContact.setProperty("isMailList", false);
                    // Import the server contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact);
                    // Add the local contact locally.
                    await targetAddressBook.addItem(localContact, true);
                    console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was added locally.");
// FIXME: the following two lines should be logically useless, but I sometimes find some of the contacts (2-3 out of 490) added before into the local changelog...
                    // Remove the resource name from the local changelog (added items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
            }
            // If such a local contact is currently available...
            else {
                // ...and if the server one is more recent...
                if (localContact.getProperty("X-GOOGLE-ETAG") !== serverContact.etag) {
                    // Import the server contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact);
                    // Update the local contact locally.
                    await targetAddressBook.modifyItem(localContact, true);
                    console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was updated locally.");
                    // Remove the resource name from the local changelog (modified items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
            }
        }
        // Cycle on the locally added contacts.
        console.log("AddressBookSynchronizer.synchronize(): Cycling on the locally added contacts.");
        for (let localContactKey of addedLocalContacts) {
            // Retrieve the local contact.
            let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactKey);
            // Create a new server contact.
            let serverContact = {};
            // Import the local contact information into the server contact.
            serverContact = AddressBookSynchronizer.fillServerContactWithLocalContactInformation(localContact, serverContact);
            // Add the server contact remotely and get the resource name (in the form 'people/contact_id') and the display name.
            serverContact = await peopleAPI.createContact(serverContact);
            let resourceName = serverContact.resourceName;
            let displayName = serverContact.names[0].displayName;
            console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was added remotely.");
            // Update the local contact locally.
            localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
            localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
            await targetAddressBook.modifyItem(localContact, true);
            // Remove the local contact key from the local changelog (added items).
            targetAddressBook.removeItemFromChangeLog(localContactKey);
        }
        // Cycle on the locally modified contacts.
        console.log("AddressBookSynchronizer.synchronize(): Cycling on the locally modified contacts.");
        for (let localContactKey of modifiedLocalContacts) {
            // TODO
        }
        // Determine all the contacts which were previously deleted remotely and delete them locally.
        // TODO
        //
        console.log("AddressBookSynchronizer.synchronize(): Done synchronizing.");
    }

    static fillLocalContactWithServerContactInformation(localContact, serverContact) {
        if (null == localContact) {
            new Error("Invalid 'localContact': null.");
        }
        if (null == serverContact) {
            new Error("Invalid 'serverContact': null.");
        }
        // Reset all the properties managed by this method.
        localContact.deleteProperty("FirstName");
        localContact.deleteProperty("LastName");
        localContact.deleteProperty("DisplayName");
        localContact.deleteProperty("NickName");
        localContact.deleteProperty("PrimaryEmail");
        localContact.deleteProperty("SecondEmail");
        localContact.deleteProperty("WorkPhone");
        localContact.deleteProperty("HomePhone");
        localContact.deleteProperty("FaxNumber");
        localContact.deleteProperty("PagerNumber");
        localContact.deleteProperty("CellularNumber");
        localContact.deleteProperty("HomeAddress");
        localContact.deleteProperty("HomeAddress2");
        localContact.deleteProperty("HomeCity");
        localContact.deleteProperty("HomeState");
        localContact.deleteProperty("HomeZipCode");
        localContact.deleteProperty("HomeCountry");
        localContact.deleteProperty("WorkAddress");
        localContact.deleteProperty("WorkAddress2");
        localContact.deleteProperty("WorkCity");
        localContact.deleteProperty("WorkState");
        localContact.deleteProperty("WorkZipCode");
        localContact.deleteProperty("WorkCountry");
        localContact.deleteProperty("Company");
        localContact.deleteProperty("JobTitle");
        localContact.deleteProperty("Department");
        localContact.deleteProperty("WebPage2");
        localContact.deleteProperty("WebPage1");
        localContact.deleteProperty("BirthMonth");
        localContact.deleteProperty("BirthDay");
        localContact.deleteProperty("BirthYear");
        localContact.deleteProperty("Custom1");
        localContact.deleteProperty("Custom2");
        localContact.deleteProperty("Custom3");
        localContact.deleteProperty("Custom4");
        localContact.deleteProperty("_GoogleTalk");
        localContact.deleteProperty("_AimScreenName");
        localContact.deleteProperty("_Yahoo");
        localContact.deleteProperty("_Skype");
        localContact.deleteProperty("_QQ");
        localContact.deleteProperty("_MSN");
        localContact.deleteProperty("_ICQ");
        localContact.deleteProperty("_JabberId");
        localContact.deleteProperty("Notes");
        // Set the names.
        if (serverContact.names) {
            if (serverContact.names[0] && serverContact.names[0].givenName) {
                localContact.setProperty("FirstName", serverContact.names[0].givenName);
            }
            if (serverContact.names[0] && serverContact.names[0].familyName) {
                localContact.setProperty("LastName", serverContact.names[0].familyName);
            }
            if (serverContact.names[0] && serverContact.names[0].displayName) {
                localContact.setProperty("DisplayName", serverContact.names[0].displayName);
            }
        }
        if (serverContact.nicknames) {
            if (serverContact.nicknames[0] && serverContact.nicknames[0].value) {
                localContact.setProperty("NickName", serverContact.nicknames[0].value);
            }
        }
        // Set the email addresses.
        if (serverContact.emailAddresses) {
            if (serverContact.emailAddresses[0] && serverContact.emailAddresses[0].value) {
                localContact.setProperty("PrimaryEmail", serverContact.emailAddresses[0].value);
            }
            if (serverContact.emailAddresses[1] && serverContact.emailAddresses[1].value) {
                localContact.setProperty("SecondEmail", serverContact.emailAddresses[1].value);
            }
        }
        // Set the phone numbers.
        if (serverContact.phoneNumbers) {
            let workPhoneNumber = false;
            let homePhoneNumber = false;
            let faxPhoneNumber = false;
            let pagerPhoneNumber = false;
            let mobilePhoneNumber = false;
            //
            for (let phoneNumber of serverContact.phoneNumbers) {
                switch (phoneNumber.type) {
                    case "work":
                        if (workPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("WorkPhone", phoneNumber.value);
                        }
                        workPhoneNumber = true;
                        //
                        break;
                    case "home":
                        if (homePhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("HomePhone", phoneNumber.value);
                        }
                        homePhoneNumber = true;
                        //
                        break;
                    case "workFax":
                    case "homeFax":
                        if (faxPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("FaxNumber", phoneNumber.value);
                        }
                        faxPhoneNumber = true;
                        //
                        break;
                    case "pager":
                        if (pagerPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("PagerNumber", phoneNumber.value);
                        }
                        pagerPhoneNumber = true;
                        //
                        break;
                    case "mobile":
                        if (mobilePhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("CellularNumber", phoneNumber.value);
                        }
                        mobilePhoneNumber = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
        // Set the addresses.
        if (serverContact.addresses) {
            let homeInformation = false;
            let workInformation = false;
            //
            for (let address of serverContact.addresses) {
                switch (address.type) {
                    case "home":
                        if (homeInformation) {
                            continue;
                        }
                        //
                        if (address.streetAddress) {
                            localContact.setProperty("HomeAddress", address.streetAddress);
                        }
                        if (address.extendedAddress) {
                            localContact.setProperty("HomeAddress2", address.extendedAddress);
                        }
                        if (address.city) {
                            localContact.setProperty("HomeCity", address.city);
                        }
                        if (address.region) {
                            localContact.setProperty("HomeState", address.region);
                        }
                        if (address.postalCode) {
                            localContact.setProperty("HomeZipCode", address.postalCode);
                        }
                        if (address.country) {
                            localContact.setProperty("HomeCountry", address.country);
                        }
                        homeInformation = true;
                        //
                        break;
                    case "work":
                        if (workInformation) {
                            continue;
                        }
                        //
                        if (address.streetAddress) {
                            localContact.setProperty("WorkAddress", address.streetAddress);
                        }
                        if (address.extendedAddress) {
                            localContact.setProperty("WorkAddress2", address.extendedAddress);
                        }
                        if (address.city) {
                            localContact.setProperty("WorkCity", address.city);
                        }
                        if (address.region) {
                            localContact.setProperty("WorkState", address.region);
                        }
                        if (address.postalCode) {
                            localContact.setProperty("WorkZipCode", address.postalCode);
                        }
                        if (address.country) {
                            localContact.setProperty("WorkCountry", address.country);
                        }
                        workInformation = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
        // Set the work information.
        if (serverContact.organizations) {
            if (serverContact.organizations[0] && serverContact.organizations[0].name) {
                localContact.setProperty("Company", serverContact.organizations[0].name);
            }
            if (serverContact.organizations[0] && serverContact.organizations[0].title) {
                localContact.setProperty("JobTitle", serverContact.organizations[0].title);
            }
            if (serverContact.organizations[0] && serverContact.organizations[0].department) {
                localContact.setProperty("Department", serverContact.organizations[0].department);
            }
        }
        // Set the webpages.
        if (serverContact.urls) {
            let personalWebPage = false;
            let workWebPage = false;
            //
            for (let url of serverContact.urls) {
                switch (url.type) {
                    case "work":
                        if (workWebPage) {
                            continue;
                        }
                        //
                        if (url.value) {
                            localContact.setProperty("WebPage1", url.value);
                        }
                        workWebPage = true;
                        //
                        break;
                    default:
                        if (personalWebPage) {
                            continue;
                        }
                        //
                        if (url.value) {
                            localContact.setProperty("WebPage2", url.value);
                        }
                        personalWebPage = true;
                        //
                        break;
                }
            }
        }
        // Set the birthday.
        if (serverContact.birthdays) {
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(0, 2)) {
                localContact.setProperty("BirthMonth", serverContact.birthdays[0].text.substr(0, 2));
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(3, 2)) {
                localContact.setProperty("BirthDay", serverContact.birthdays[0].text.substr(3, 2));
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(6, 4)) {
                localContact.setProperty("BirthYear", serverContact.birthdays[0].text.substr(6, 4));
            }
        }
        // Set the custom fields.
        if (serverContact.userDefined) {
            if (serverContact.userDefined[0] && serverContact.userDefined[0].value) {
                localContact.setProperty("Custom1", serverContact.userDefined[0].value);
            }
            if (serverContact.userDefined[1] && serverContact.userDefined[1].value) {
                localContact.setProperty("Custom2", serverContact.userDefined[1].value);
            }
            if (serverContact.userDefined[2] && serverContact.userDefined[2].value) {
                localContact.setProperty("Custom3", serverContact.userDefined[2].value);
            }
            if (serverContact.userDefined[3] && serverContact.userDefined[3].value) {
                localContact.setProperty("Custom4", serverContact.userDefined[3].value);
            }
        }
        // Set the IM usernames.
        if (serverContact.imClients) {
            let googleTalkUsername = false;
            let aimUsername = false;
            let yahooUsername = false;
            let skypeUsername = false;
            let qqUsername = false;
            let msnUsername = false;
            let icqUsername = false;
            let jabberUsername = false;
            //
            for (let imClient of serverContact.imClients) {
                switch (imClient.protocol) {
                    case "googleTalk":
                        if (googleTalkUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_GoogleTalk", imClient.username);
                        }
                        googleTalkUsername = true;
                        //
                        break;
                    case "aim":
                        if (aimUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_AimScreenName", imClient.username);
                        }
                        aimUsername = true;
                        //
                        break;
                    case "yahoo":
                        if (yahooUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_Yahoo", imClient.username);
                        }
                        yahooUsername = true;
                        //
                        break;
                    case "skype":
                        if (skypeUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_Skype", imClient.username);
                        }
                        skypeUsername = true;
                        //
                        break;
                    case "qq":
                        if (qqUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_QQ", imClient.username);
                        }
                        qqUsername = true;
                        //
                        break;
                    case "msn":
                        if (msnUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_MSN", imClient.username);
                        }
                        msnUsername = true;
                        //
                        break;
                    case "icq":
                        if (icqUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_ICQ", imClient.username);
                        }
                        icqUsername = true;
                        //
                        break;
                    case "jabber":
                        if (jabberUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_JabberId", imClient.username);
                        }
                        jabberUsername = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
        // Set the notes.
        if (serverContact.biographies) {
            if (serverContact.biographies[0] && serverContact.biographies[0].value) {
                localContact.setProperty("Notes", serverContact.biographies[0].value);
            }
        }
        //
        return localContact;
    }

    static fillServerContactWithLocalContactInformation(localContact, serverContact) {
        if (null == localContact) {
            new Error("Invalid 'localContact': null.");
        }
        if (null == serverContact) {
            new Error("Invalid 'serverContact': null.");
        }
        // Reset all the properties managed by this method.
        delete serverContact.names;
        delete serverContact.nicknames;
        delete serverContact.emailAddresses;
        delete serverContact.phoneNumbers;
        delete serverContact.addresses;
        delete serverContact.organizations;
        delete serverContact.urls;
        delete serverContact.birthdays;
        delete serverContact.userDefined;
        delete serverContact.imClients;
        delete serverContact.biographies;
        // Set the names.
        if (localContact.getProperty("FirstName")) {
            if ("undefined" === typeof(serverContact.names)) {
                serverContact.names = [];
            }
            if ("undefined" === typeof(serverContact.names[0])) {
                serverContact.names[0] = {};
            }
            serverContact.names[0].givenName = localContact.getProperty("FirstName");
        }
        if (localContact.getProperty("LastName")) {
            if ("undefined" === typeof(serverContact.names)) {
                serverContact.names = [];
            }
            if ("undefined" === typeof(serverContact.names[0])) {
                serverContact.names[0] = {};
            }
            serverContact.names[0].familyName = localContact.getProperty("LastName");
        }
/* Disabled, as names[0].displayName is an output-only field for Google.
        if (localContact.getProperty("DisplayName")) {
            if ("undefined" === typeof(serverContact.names)) {
                serverContact.names = [];
            }
            if ("undefined" === typeof(serverContact.names[0])) {
                serverContact.names[0] = {};
            }
            serverContact.names[0].displayName = localContact.getProperty("DisplayName");
        }
*/
        if (localContact.getProperty("NickName")) {
            if ("undefined" === typeof(serverContact.nicknames)) {
                serverContact.nicknames = [];
            }
            if ("undefined" === typeof(serverContact.nicknames[0])) {
                serverContact.nicknames[0] = {};
            }
            serverContact.nicknames[0].value = localContact.getProperty("NickName");
        }
        // Set the email addresses.
/* FIXME
        if (serverContact.emailAddresses) {
            if (serverContact.emailAddresses[0] && serverContact.emailAddresses[0].value) {
                localContact.setProperty("PrimaryEmail", serverContact.emailAddresses[0].value);
            }
            if (serverContact.emailAddresses[1] && serverContact.emailAddresses[1].value) {
                localContact.setProperty("SecondEmail", serverContact.emailAddresses[1].value);
            }
        }
*/
        // Set the phone numbers.
/* FIXME
        if (serverContact.phoneNumbers) {
            let workPhoneNumber = false;
            let homePhoneNumber = false;
            let faxPhoneNumber = false;
            let pagerPhoneNumber = false;
            let mobilePhoneNumber = false;
            //
            for (let phoneNumber of serverContact.phoneNumbers) {
                switch (phoneNumber.type) {
                    case "work":
                        if (workPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("WorkPhone", phoneNumber.value);
                        }
                        workPhoneNumber = true;
                        //
                        break;
                    case "home":
                        if (homePhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("HomePhone", phoneNumber.value);
                        }
                        homePhoneNumber = true;
                        //
                        break;
                    case "workFax":
                    case "homeFax":
                        if (faxPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("FaxNumber", phoneNumber.value);
                        }
                        faxPhoneNumber = true;
                        //
                        break;
                    case "pager":
                        if (pagerPhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("PagerNumber", phoneNumber.value);
                        }
                        pagerPhoneNumber = true;
                        //
                        break;
                    case "mobile":
                        if (mobilePhoneNumber) {
                            continue;
                        }
                        //
                        if (phoneNumber.value) {
                            localContact.setProperty("CellularNumber", phoneNumber.value);
                        }
                        mobilePhoneNumber = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
*/
        // Set the addresses.
/* FIXME
        if (serverContact.addresses) {
            let homeInformation = false;
            let workInformation = false;
            //
            for (let address of serverContact.addresses) {
                switch (address.type) {
                    case "home":
                        if (homeInformation) {
                            continue;
                        }
                        //
                        if (address.streetAddress) {
                            localContact.setProperty("HomeAddress", address.streetAddress);
                        }
                        if (address.extendedAddress) {
                            localContact.setProperty("HomeAddress2", address.extendedAddress);
                        }
                        if (address.city) {
                            localContact.setProperty("HomeCity", address.city);
                        }
                        if (address.region) {
                            localContact.setProperty("HomeState", address.region);
                        }
                        if (address.postalCode) {
                            localContact.setProperty("HomeZipCode", address.postalCode);
                        }
                        if (address.country) {
                            localContact.setProperty("HomeCountry", address.country);
                        }
                        homeInformation = true;
                        //
                        break;
                    case "work":
                        if (workInformation) {
                            continue;
                        }
                        //
                        if (address.streetAddress) {
                            localContact.setProperty("WorkAddress", address.streetAddress);
                        }
                        if (address.extendedAddress) {
                            localContact.setProperty("WorkAddress2", address.extendedAddress);
                        }
                        if (address.city) {
                            localContact.setProperty("WorkCity", address.city);
                        }
                        if (address.region) {
                            localContact.setProperty("WorkState", address.region);
                        }
                        if (address.postalCode) {
                            localContact.setProperty("WorkZipCode", address.postalCode);
                        }
                        if (address.country) {
                            localContact.setProperty("WorkCountry", address.country);
                        }
                        workInformation = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
*/
        // Set the work information.
/* FIXME
        if (serverContact.organizations) {
            if (serverContact.organizations[0] && serverContact.organizations[0].name) {
                localContact.setProperty("Company", serverContact.organizations[0].name);
            }
            if (serverContact.organizations[0] && serverContact.organizations[0].title) {
                localContact.setProperty("JobTitle", serverContact.organizations[0].title);
            }
            if (serverContact.organizations[0] && serverContact.organizations[0].department) {
                localContact.setProperty("Department", serverContact.organizations[0].department);
            }
        }
*/
        // Set the webpages.
/* FIXME
        if (serverContact.urls) {
            let personalWebPage = false;
            let workWebPage = false;
            //
            for (let url of serverContact.urls) {
                switch (url.type) {
                    case "work":
                        if (workWebPage) {
                            continue;
                        }
                        //
                        if (url.value) {
                            localContact.setProperty("WebPage1", url.value);
                        }
                        workWebPage = true;
                        //
                        break;
                    default:
                        if (personalWebPage) {
                            continue;
                        }
                        //
                        if (url.value) {
                            localContact.setProperty("WebPage2", url.value);
                        }
                        personalWebPage = true;
                        //
                        break;
                }
            }
        }
*/
        // Set the birthday.
/* FIXME
        if (serverContact.birthdays) {
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(0, 2)) {
                localContact.setProperty("BirthMonth", serverContact.birthdays[0].text.substr(0, 2));
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(3, 2)) {
                localContact.setProperty("BirthDay", serverContact.birthdays[0].text.substr(3, 2));
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].text.substr(6, 4)) {
                localContact.setProperty("BirthYear", serverContact.birthdays[0].text.substr(6, 4));
            }
        }
*/
        // Set the custom fields.
/* FIXME
        if (serverContact.userDefined) {
            if (serverContact.userDefined[0] && serverContact.userDefined[0].value) {
                localContact.setProperty("Custom1", serverContact.userDefined[0].value);
            }
            if (serverContact.userDefined[1] && serverContact.userDefined[1].value) {
                localContact.setProperty("Custom2", serverContact.userDefined[1].value);
            }
            if (serverContact.userDefined[2] && serverContact.userDefined[2].value) {
                localContact.setProperty("Custom3", serverContact.userDefined[2].value);
            }
            if (serverContact.userDefined[3] && serverContact.userDefined[3].value) {
                localContact.setProperty("Custom4", serverContact.userDefined[3].value);
            }
        }
*/
        // Set the IM usernames.
/* FIXME
        if (serverContact.imClients) {
            let googleTalkUsername = false;
            let aimUsername = false;
            let yahooUsername = false;
            let skypeUsername = false;
            let qqUsername = false;
            let msnUsername = false;
            let icqUsername = false;
            let jabberUsername = false;
            //
            for (let imClient of serverContact.imClients) {
                switch (imClient.protocol) {
                    case "googleTalk":
                        if (googleTalkUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_GoogleTalk", imClient.username);
                        }
                        googleTalkUsername = true;
                        //
                        break;
                    case "aim":
                        if (aimUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_AimScreenName", imClient.username);
                        }
                        aimUsername = true;
                        //
                        break;
                    case "yahoo":
                        if (yahooUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_Yahoo", imClient.username);
                        }
                        yahooUsername = true;
                        //
                        break;
                    case "skype":
                        if (skypeUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_Skype", imClient.username);
                        }
                        skypeUsername = true;
                        //
                        break;
                    case "qq":
                        if (qqUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_QQ", imClient.username);
                        }
                        qqUsername = true;
                        //
                        break;
                    case "msn":
                        if (msnUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_MSN", imClient.username);
                        }
                        msnUsername = true;
                        //
                        break;
                    case "icq":
                        if (icqUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_ICQ", imClient.username);
                        }
                        icqUsername = true;
                        //
                        break;
                    case "jabber":
                        if (jabberUsername) {
                            continue;
                        }
                        //
                        if (imClient.username) {
                            localContact.setProperty("_JabberId", imClient.username);
                        }
                        jabberUsername = true;
                        //
                        break;
                    default:
                        break;
                }
            }
        }
*/
        // Set the notes.
/* FIXME
        if (serverContact.biographies) {
            if (serverContact.biographies[0] && serverContact.biographies[0].value) {
                localContact.setProperty("Notes", serverContact.biographies[0].value);
            }
        }
*/
        //
        return serverContact;
    }

}
