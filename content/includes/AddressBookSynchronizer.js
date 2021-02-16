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
        let serverContactList = await peopleAPI.getContactList();
        // Prepare the variables for the cycles.
        console.log("AddressBookSynchronizer.synchronize(): Retrieving local changes since the last synchronization.");
        let addedLocalContacts = targetAddressBook.getAddedItemsFromChangeLog();
        let deletedLocalContacts = targetAddressBook.getDeletedItemsFromChangeLog();
        // Cycle on the server contacts.
        console.log("AddressBookSynchronizer.synchronize(): Starting to cycle on the server contacts.");
        for (let serverContact of serverContactList) {
            // Get the resource name (in the form 'people/contact_id') and the display name.
            let resourceName = serverContact.resourceName;
            let displayName = serverContact.names[0].displayName;
            console.log("AddressBookSynchronizer.synchronize(): resourceName = " + resourceName + " (" + displayName + ")");
            // If the contact is not already available locally...
            if (null == await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", resourceName)) {
                // ...and if it wasn't previously deleted locally...
                if (!deletedLocalContacts.includes(resourceName)) {
                    // ...then add it locally.
// FIXME 1: move the following code into a method on its own.
// FIXME 2: if null, delete old properties
                    let localContact = targetAddressBook.createNewCard();
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    if (serverContact.names && serverContact.names[0]) {
                        if (serverContact.names[0].givenName) {
                            localContact.setProperty("FirstName", serverContact.names[0].givenName);
                        }
                        if (serverContact.names[0].familyName) {
                            localContact.setProperty("LastName", serverContact.names[0].familyName);
                        }
                        if (serverContact.names[0].displayName) {
                            localContact.setProperty("DisplayName", serverContact.names[0].displayName);
                        }
                    }
                    if (serverContact.nicknames && serverContact.nicknames[0]) {
                        localContact.setProperty("NickName", serverContact.nicknames[0].value);
                    }
                    if (serverContact.emailAddresses) {
                        if (serverContact.emailAddresses[0]) {
                            localContact.setProperty("PrimaryEmail", serverContact.emailAddresses[0].value);
                        }
                        if (serverContact.emailAddresses[1]) {
                            localContact.setProperty("SecondEmail", serverContact.emailAddresses[1].value);
                        }
                    }
                    if (serverContact.phoneNumbers) {
                        let workPhoneNumber = null;
                        let homePhoneNumber = null;
                        let faxPhoneNumber = null;
                        let pagerPhoneNumber = null;
                        let mobilePhoneNumber = null;
                        for (let phoneNumber of serverContact.phoneNumbers) {
                            switch (phoneNumber.type) {
                                case "work":
                                    if (null == workPhoneNumber) {
                                        workPhoneNumber = phoneNumber.value;
                                    }
                                    break;
                                case "home":
                                    if (null == homePhoneNumber) {
                                        homePhoneNumber = phoneNumber.value;
                                    }
                                    break;
                                case "workFax":
                                case "homeFax":
                                    if (null == faxPhoneNumber) {
                                        faxPhoneNumber = phoneNumber.value;
                                    }
                                    break;
                                case "pager":
                                    if (null == pagerPhoneNumber) {
                                        pagerPhoneNumber = phoneNumber.value;
                                    }
                                    break;
                                case "mobile":
                                    if (null == mobilePhoneNumber) {
                                        mobilePhoneNumber = phoneNumber.value;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (null != workPhoneNumber) {
                            localContact.setProperty("WorkPhone", workPhoneNumber);
                        }
                        if (null != homePhoneNumber) {
                            localContact.setProperty("HomePhone", homePhoneNumber);
                        }
                        if (null != faxPhoneNumber) {
                            localContact.setProperty("FaxNumber", faxPhoneNumber);
                        }
                        if (null != pagerPhoneNumber) {
                            localContact.setProperty("PagerNumber", pagerPhoneNumber);
                        }
                        if (null != mobilePhoneNumber) {
                            localContact.setProperty("CellularNumber", mobilePhoneNumber);
                        }
                    }
                    if (serverContact.addresses) {
                        let homeInformation = false;
                        let homeAddress = null;
                        let homeAddress2 = null;
                        let homeCity = null;
                        let homeState = null;
                        let homeZipCode = null;
                        let homeCountry = null;
                        let workInformation = false;
                        let workAddress = null;
                        let workAddress2 = null;
                        let workCity = null;
                        let workState = null;
                        let workZipCode = null;
                        let workCountry = null;
                        for (let address of serverContact.addresses) {
                            switch (address.type) {
                                case "home":
                                    if (!homeInformation) {
                                        if (address.streetAddress) {
                                            homeAddress = address.streetAddress;
                                        }
                                        if (address.extendedAddress) {
                                            homeAddress2 = address.extendedAddress;
                                        }
                                        if (address.city) {
                                            homeCity = address.city;
                                        }
                                        if (address.region) {
                                            homeState = address.region;
                                        }
                                        if (address.postalCode) {
                                            homeZipCode = address.postalCode;
                                        }
                                        if (address.country) {
                                            homeCountry = address.country;
                                        }
                                        homeInformation = true;
                                    }
                                    break;
                                case "work":
                                    if (!workInformation) {
                                        if (address.streetAddress) {
                                            workAddress = address.streetAddress;
                                        }
                                        if (address.extendedAddress) {
                                            workAddress2 = address.extendedAddress;
                                        }
                                        if (address.city) {
                                            workCity = address.city;
                                        }
                                        if (address.region) {
                                            workState = address.region;
                                        }
                                        if (address.postalCode) {
                                            workZipCode = address.postalCode;
                                        }
                                        if (address.country) {
                                            workCountry = address.country;
                                        }
                                        workInformation = true;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (null != homeAddress) {
                            localContact.setProperty("HomeAddress", homeAddress);
                        }
                        if (null != homeAddress2) {
                            localContact.setProperty("HomeAddress2", homeAddress2);
                        }
                        if (null != homeCity) {
                            localContact.setProperty("HomeCity", homeCity);
                        }
                        if (null != homeState) {
                            localContact.setProperty("HomeState", homeState);
                        }
                        if (null != homeZipCode) {
                            localContact.setProperty("HomeZipCode", homeZipCode);
                        }
                        if (null != homeCountry) {
                            localContact.setProperty("HomeCountry", homeCountry);
                        }
                        if (null != workAddress) {
                            localContact.setProperty("WorkAddress", workAddress);
                        }
                        if (null != workAddress2) {
                            localContact.setProperty("WorkAddress2", workAddress2);
                        }
                        if (null != workCity) {
                            localContact.setProperty("WorkCity", workCity);
                        }
                        if (null != workState) {
                            localContact.setProperty("WorkState", workState);
                        }
                        if (null != workZipCode) {
                            localContact.setProperty("WorkZipCode", workZipCode);
                        }
                        if (null != workCountry) {
                            localContact.setProperty("WorkCountry", workCountry);
                        }
                    }
                    if (serverContact.organizations && serverContact.organizations[0]) {
                        if (serverContact.organizations[0].name) {
                            localContact.setProperty("Company", serverContact.organizations[0].name);
                        }
                        if (serverContact.organizations[0].title) {
                            localContact.setProperty("JobTitle", serverContact.organizations[0].title);
                        }
                        if (serverContact.organizations[0].department) {
                            localContact.setProperty("Department", serverContact.organizations[0].department);
                        }
                    }
                    if (serverContact.urls) {
                        let personalWebPage = null;
                        let workWebPage = null;
                        for (let url of serverContact.urls) {
                            switch (url.type) {
                                case "work":
                                    if (null == workWebPage) {
                                        workWebPage = url.value;
                                    }
                                    break;
                                default:
                                    if (null == personalWebPage) {
                                        personalWebPage = url.value;
                                    }
                                    break;
                            }
                        }
                        if (null != personalWebPage) {
                            localContact.setProperty("WebPage2", personalWebPage);
                        }
                        if (null != workWebPage) {
                            localContact.setProperty("WebPage1", workWebPage);
                        }
                    }
                    if (serverContact.birthdays && serverContact.birthdays[0]) {
                        localContact.setProperty("BirthMonth", serverContact.birthdays[0].text.substr(0, 2));
                        localContact.setProperty("BirthDay", serverContact.birthdays[0].text.substr(3, 2));
                        localContact.setProperty("BirthYear", serverContact.birthdays[0].text.substr(6, 4));
                    }
                    if (serverContact.userDefined) {
                        if (serverContact.userDefined[0]) {
                            localContact.setProperty("Custom1", serverContact.userDefined[0].value);
                        }
                        if (serverContact.userDefined[1]) {
                            localContact.setProperty("Custom2", serverContact.userDefined[1].value);
                        }
                        if (serverContact.userDefined[2]) {
                            localContact.setProperty("Custom3", serverContact.userDefined[2].value);
                        }
                        if (serverContact.userDefined[3]) {
                            localContact.setProperty("Custom4", serverContact.userDefined[3].value);
                        }
                    }
                    if (serverContact.imClients) {
                        let googleTalkUsername = null;
                        let aimUsername = null;
                        let yahooUsername = null;
                        let skypeUsername = null;
                        let qqUsername = null;
                        let msnUsername = null;
                        let icqUsername = null;
                        let jabberUsername = null;
                        for (let imClient of serverContact.imClients) {
                            switch (imClient.protocol) {
                                case "googleTalk":
                                    if (null == googleTalkUsername) {
                                        googleTalkUsername = imClient.username;
                                    }
                                    break;
                                case "aim":
                                    if (null == aimUsername) {
                                        aimUsername = imClient.username;
                                    }
                                    break;
                                case "yahoo":
                                    if (null == yahooUsername) {
                                        yahooUsername = imClient.username;
                                    }
                                    break;
                                case "skype":
                                    if (null == skypeUsername) {
                                        skypeUsername = imClient.username;
                                    }
                                    break;
                                case "qq":
                                    if (null == qqUsername) {
                                        qqUsername = imClient.username;
                                    }
                                    break;
                                case "msn":
                                    if (null == msnUsername) {
                                        msnUsername = imClient.username;
                                    }
                                    break;
                                case "icq":
                                    if (null == icqUsername) {
                                        icqUsername = imClient.username;
                                    }
                                    break;
                                case "jabber":
                                    if (null == jabberUsername) {
                                        jabberUsername = imClient.username;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (null != googleTalkUsername) {
                            localContact.setProperty("_GoogleTalk", googleTalkUsername);
                        }
                        if (null != aimUsername) {
                            localContact.setProperty("_AimScreenName", aimUsername);
                        }
                        if (null != yahooUsername) {
                            localContact.setProperty("_Yahoo", yahooUsername);
                        }
                        if (null != skypeUsername) {
                            localContact.setProperty("_Skype", skypeUsername);
                        }
                        if (null != qqUsername) {
                            localContact.setProperty("_QQ", qqUsername);
                        }
                        if (null != msnUsername) {
                            localContact.setProperty("_MSN", msnUsername);
                        }
                        if (null != icqUsername) {
                            localContact.setProperty("_ICQ", icqUsername);
                        }
                        if (null != jabberUsername) {
                            localContact.setProperty("_JabberId", jabberUsername);
                        }
                    }
                    if (serverContact.biographies) {
                        if (serverContact.biographies[0]) {
                            localContact.setProperty("Notes", serverContact.biographies[0].value);
                        }
                    }
                    localContact.setProperty("isMailList", false);
                    await targetAddressBook.addItem(localContact);
                    console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was added locally.");
                }
            }
            // If the contact is already available locally...
            else {
                // ...and the server one is more recent...
                if (true /* TODO */) {
                    // ...then update it locally.
                    // TODO
                    console.log("AddressBookSynchronizer.synchronize(): " + resourceName + " (" + displayName + ") was updated locally.");
                }
            }
        }
//console.log("i = " + JSON.stringify(targetAddressBook.getItemsFromChangeLog())); // FIXME
//console.log("a = " + JSON.stringify(targetAddressBook.getAddedItemsFromChangeLog())); // FIXME
//console.log("d = " + JSON.stringify(targetAddressBook.getDeletedItemsFromChangeLog())); // FIXME
        // Add remotely all the contacts which were previously added locally.
        // TODO
        // Determine and delete locally all the contacts which were previously deleted remotely.
        // TODO
    }

}
