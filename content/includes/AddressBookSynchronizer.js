/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const FAKE_EMAIL_ADDRESS_DOMAIN = "bug1522453.thunderbird.example.com";
const FAKE_ETAG = "000/mz/000";

class AddressBookSynchronizer {

    /* Main synchronization. */

    static async synchronize(syncData) {
        if (null == syncData) {
            throw new IllegalArgumentError("Invalid 'syncData': null.");
        }
        // Create a PeopleAPI object.
        let peopleAPI = new PeopleAPI(syncData.accountData);
        // Get other account properties.
/* FIXME
        let useFakeEmailAddresses = syncData.accountData.getAccountProperty("useFakeEmailAddresses");
        let readOnlyMode = syncData.accountData.getAccountProperty("readOnlyMode");
        let verboseLogging = syncData.accountData.getAccountProperty("verboseLogging");
*/
let includeSystemContactGroups = syncData.accountData.get("includeSystemContactGroups");
let useFakeEmailAddresses = syncData.accountData.get("useFakeEmailAddresses");
let readOnlyMode = syncData.accountData.get("readOnlyMode");
let verboseLogging = syncData.accountData.get("verboseLogging");
        // Enable the logger.
        logger = new Logger(verboseLogging);
        // Retrieve the local address book and its id.
        logger.log0("AddressBookSynchronizer.synchronize(): Retrieving the local address book.");
// FIXME: syncData.target? true/false?
        let localAddressBookId = syncData.target;
        let localAddressBook = await messenger.addressBooks.get(localAddressBookId, true); // No further checking here, as it must be defined.
        let localAddressBookName = localAddressBook.name;
        logger.log1("AddressBookSynchronizer.synchronize(): Found the local address book '" + localAddressBookId + "' ('" + localAddressBookName + "').");
        // Check for the read-only mode.
        if (readOnlyMode) {
            logger.log0("AddressBookSynchronizer.synchronize(): Read-only mode detected.");
        }
        // Retrieve the local address book item extra property map.
        logger.log0("AddressBookSynchronizer.synchronize(): Loading the local address book item extra property map.");
        let localAddressBookItemExtraPropertyManager = new LocalAddressBookItemExtraPropertyManager();
        await localAddressBookItemExtraPropertyManager.loadLocalAddressBookItemExtraPropertyMap();
        // Retrieve the synchronization structures for the cycles.
        logger.log0("AddressBookSynchronizer.synchronize(): Retrieving the synchronization structures for the cycles.");
        let { originalLocalItemIdMap, originalDeletedLocalItemResourceNameSet } = localAddressBookItemExtraPropertyManager.getItemSynchronizationStructures(localAddressBookId);
        let originalCreatedLocalContactGroupIdSet = localAddressBookEventManager.getCreatedMailingListIdSet(localAddressBookId);
        let originalUpdatedLocalContactGroupIdSet = localAddressBookEventManager.getUpdatedMailingListIdSet(localAddressBookId);
// TODO: contacts, contact group members.
        // Enable synchronization mode for the local address book.
        logger.log0("AddressBookSynchronizer.synchronize(): Enabling synchronization mode for the local address book.");
        await localAddressBookEventManager.enableSynchronizationMode(localAddressBookId);
        // Attempt the synchronization.
        try {
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization started.");
/* FIXME
            // Synchronize the contacts.
            await AddressBookSynchronizer.synchronizeContacts(peopleAPI, localAddressBook, localAddressBookItemMap, contactGroupMemberMap, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds, useFakeEmailAddresses, readOnlyMode);
*/
            // Synchronize the contact groups.
            await AddressBookSynchronizer.synchronizeContactGroups(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalLocalItemIdMap, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactGroupIdSet, originalUpdatedLocalContactGroupIdSet);
/* FIXME
            // Synchronize the contact group members.
            await AddressBookSynchronizer.synchronizeContactGroupMembers(localAddressBook, localAddressBookItemMap, contactGroupMemberMap, readOnlyMode);
*/
            // Save the local address book item extra property map.
            logger.log0("AddressBookSynchronizer.synchronize(): Saving the local address book item extra property map.");
            await localAddressBookItemExtraPropertyManager.saveLocalAddressBookItemExtraPropertyMap();
// TODO: clearEventData if in read-only mode.
            // Disable synchronization mode for the local address book.
            logger.log0("AddressBookSynchronizer.synchronize(): Disabling synchronization mode for the local address book.");
            await localAddressBookEventManager.disableSynchronizationMode(localAddressBookId);
            //
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization finished successfully.");
        }
        catch (error) {
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization failed.");
            // Disable synchronization mode for the local address book.
            logger.log0("AddressBookSynchronizer.synchronize(): Disabling synchronization mode for the local address book.");
            await localAddressBookEventManager.disableSynchronizationMode(localAddressBookId);
            // If a network error was encountered...
            if (error instanceof NetworkError) {
                // Propagate the error.
                throw error;
            }
            // If the root reason is different...
            else {
                // Propagate the error.
                throw error;
            }
        }
    }

    /* Contacts. */

    static async synchronizeContacts(peopleAPI, targetAddressBook, targetAddressBookItemMap, contactGroupMemberMap, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds, useFakeEmailAddresses, readOnlyMode) {
        if (null == peopleAPI) {
            throw new IllegalArgumentError("Invalid 'peopleAPI': null.");
        }
        if (null == targetAddressBook) {
            throw new IllegalArgumentError("Invalid 'targetAddressBook': null.");
        }
        if (null == targetAddressBookItemMap) {
            throw new IllegalArgumentError("Invalid 'targetAddressBookItemMap': null.");
        }
        if (null == contactGroupMemberMap) {
            throw new IllegalArgumentError("Invalid 'contactGroupMemberMap': null.");
        }
        if (null == addedLocalItemIds) {
            throw new IllegalArgumentError("Invalid 'addedLocalItemIds': null.");
        }
        if (null == modifiedLocalItemIds) {
            throw new IllegalArgumentError("Invalid 'modifiedLocalItemIds': null.");
        }
        if (null == deletedLocalItemIds) {
            throw new IllegalArgumentError("Invalid 'deletedLocalItemIds': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
        // Retrieve all remote contacts.
        let remoteContacts = await peopleAPI.getContacts();
        // Cycle on the remote contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the remote contacts.");
        for (let remoteContact of remoteContacts) {
            // Get the resource name (in the form 'people/personId') and the display name.
            let resourceName = remoteContact.resourceName;
            let displayName = (remoteContact.names ? remoteContact.names[0].displayName : "-");
            logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ")");
            // Try to match the remote contact locally.
            let localContact = targetAddressBookItemMap.get(resourceName);
            // If such a local contact is currently unavailable...
            if (undefined === localContact) {
                // ...and if it was previously deleted locally...
                if (deletedLocalItemIds.includes(resourceName)) {
                    // Check we are not in read-only mode, then...
                    if (!readOnlyMode) {
                        // Delete the remote contact remotely.
                        await peopleAPI.deleteContact(resourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been deleted remotely.");
                    }
                    // Remove the resource name from the local change log (deleted items).
                    await targetAddressBook.removeItemFromChangeLog(resourceName);
                }
                // ...and if it wasn't previously deleted locally...
                else {
                    // Create a new local contact.
                    localContact = targetAddressBook.createNewCard();
                    // Import the remote contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    localContact.setProperty("X-GOOGLE-ETAG", remoteContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithRemoteContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                    // Add the local contact locally, keep the target address book item map up-to-date.
                    await targetAddressBook.addItem(localContact, true);
                    targetAddressBookItemMap.set(resourceName, localContact);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been added locally.");
                    // Remove the resource name from the local change log (added items).
                    // (This should be logically useless, but sometimes the change log is filled with some of the contacts added above.)
                    await targetAddressBook.removeItemFromChangeLog(resourceName);
                    // Update the contact group member map.
                    AddressBookSynchronizer.updateContactGroupMemberMap(contactGroupMemberMap, resourceName, remoteContact.memberships);
                }
            }
            // If such a local contact is currently available...
            else {
                // ...and if the remote one is more recent, or if we are in read-only mode...
                if ((localContact.getProperty("X-GOOGLE-ETAG") !== remoteContact.etag) || (readOnlyMode)) {
                    // Import the remote contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-ETAG", remoteContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithRemoteContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                    // Update the local contact locally, and keep the target address book item map up-to-date.
                    await targetAddressBook.modifyItem(localContact, true);
                    targetAddressBookItemMap.set(resourceName, localContact);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been updated locally.");
                    // Remove the resource name from the local change log (modified items).
                    await targetAddressBook.removeItemFromChangeLog(resourceName);
                }
                // Update the contact group member map.
                AddressBookSynchronizer.updateContactGroupMemberMap(contactGroupMemberMap, resourceName, remoteContact.memberships);
            }
        }
        // Prepare the variables for the cycles.
        let addedLocalItemResourceNames = new Set();
        // Cycle on the locally added contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the locally added contacts.");
        for (let localContactId of addedLocalItemIds) {
            // Retrieve the local contact, and make sure such an item is actually valid and not a contact group.
            let localContact = targetAddressBookItemMap.get(localContactId);
            if (undefined === localContact) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Check we are not in read-only mode, then...
            if (!readOnlyMode) {
                // Create a remote contact.
                let remoteContact = {};
                // Import the local contact information into the remote contact.
                remoteContact = AddressBookSynchronizer.fillRemoteContactWithLocalContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                // Add the remote contact remotely and get the resource name (in the form 'people/personId') and the display name.
                remoteContact = await peopleAPI.createContact(remoteContact);
                let resourceName = remoteContact.resourceName;
                let displayName = (remoteContact.names ? remoteContact.names[0].displayName : "-");
                logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been added remotely.");
                // Import the remote contact information into the local contact.
                localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                localContact.setProperty("X-GOOGLE-ETAG", remoteContact.etag);
                localContact = AddressBookSynchronizer.fillLocalContactWithRemoteContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                // Update the local contact locally, and keep the target address book item map up-to-date.
                await targetAddressBook.modifyItem(localContact, true);
                targetAddressBookItemMap.set(resourceName, localContact);
                // Add the resource name to the proper set.
                addedLocalItemResourceNames.add(resourceName);
            }
            // Remove the local contact id from the local change log (added items).
            await targetAddressBook.removeItemFromChangeLog(localContactId);
        }
        // Cycle on the locally modified contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the locally modified contacts.");
        for (let localContactId of modifiedLocalItemIds) {
            // Retrieve the local contact, and make sure such an item is actually valid and not a contact group.
            let localContact = targetAddressBookItemMap.get(localContactId);
            if (undefined === localContact) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Check we are not in read-only mode, then...
            if (!readOnlyMode) {
                // Create a new remote contact.
                let remoteContact = {};
                remoteContact.resourceName = localContact.getProperty("X-GOOGLE-RESOURCENAME");
                remoteContact.etag = localContact.getProperty("X-GOOGLE-ETAG");
                // Import the local contact information into the remote contact.
                remoteContact = AddressBookSynchronizer.fillRemoteContactWithLocalContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                // Update the remote contact remotely or delete the local contact locally.
                try {
                    // Update the remote contact remotely and get the resource name (in the form 'people/personId') and the display name.
                    remoteContact = await peopleAPI.updateContact(remoteContact);
                    let resourceName = remoteContact.resourceName;
                    let displayName = (remoteContact.names ? remoteContact.names[0].displayName : "-");
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been updated remotely.");
                    // Import the remote contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    localContact.setProperty("X-GOOGLE-ETAG", remoteContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithRemoteContactInformation(localContact, remoteContact, useFakeEmailAddresses);
                    // Update the local contact locally, and keep the target address book item map up-to-date.
                    await targetAddressBook.modifyItem(localContact, true);
                    targetAddressBookItemMap.set(resourceName, localContact);
                }
                catch (error) {
                    // If the remote contact is no longer available (i.e.: it was deleted)...
                    if ((error instanceof ResponseError) && (error.message.includes("404"))) {
                        // Get the resource name (in the form 'people/personId').
                        let resourceName = localContact.getProperty("X-GOOGLE-RESOURCENAME");
                        let displayName = (localContact.getProperty("DisplayName") ? localContact.getProperty("DisplayName") : "-");
                        // Delete the local contact locally, and keep the target address book item map up-to-date.
                        targetAddressBook.deleteItem(localContact, true);
                        targetAddressBookItemMap.delete(resourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") has been deleted locally.");
                    }
                    // If the root reason is different...
                    else {
                        // Propagate the error.
                        throw error;
                    }
                }
            }
            // Remove the local contact id from the local change log (modified items).
            await targetAddressBook.removeItemFromChangeLog(localContactId);
        }
        // Determine all the contacts which were previously deleted remotely and delete them locally.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Determining all the remotely deleted contacts.");
        for (let localContact of targetAddressBookItemMap.values()) {
            // Make sure the item is actually valid and not a contact group.
            if (undefined === targetAddressBookItemMap.get(localContact.getProperty("X-GOOGLE-RESOURCENAME"))) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Get the local contact id and the display name.
            let localContactId = localContact.getProperty("X-GOOGLE-RESOURCENAME");
            let displayName = localContact.getProperty("DisplayName");
            // Check if the local contact id matches any of the locally added contacts.
            if (addedLocalItemResourceNames.has(localContactId)) {
                continue;
            }
            // Check if the local contact id matches any of the resource names downloaded.
            let localContactFoundAmongRemoteContacts = false;
            for (let remoteContact of remoteContacts) {
                if (localContactId === remoteContact.resourceName) {
                    localContactFoundAmongRemoteContacts = true;
                    break;
                }
            }
            if (localContactFoundAmongRemoteContacts) {
                continue;
            }
            // Delete the local contact locally, and keep the target address book item map up-to-date.
            targetAddressBook.deleteItem(localContact, true);
            targetAddressBookItemMap.delete(localContactId);
            logger.log1("AddressBookSynchronizer.synchronizeContacts(): " + localContactId + " (" + displayName + ") has been deleted locally.");
        }
    }

    static fillLocalContactWithRemoteContactInformation(localContact, remoteContact, useFakeEmailAddresses) {
        if (null == localContact) {
            throw new IllegalArgumentError("Invalid 'localContact': null.");
        }
        if (null == remoteContact) {
            throw new IllegalArgumentError("Invalid 'remoteContact': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        // Reset all the properties managed by this method.
        localContact._card.vCardProperties.clearValues("n");
        localContact._card.vCardProperties.clearValues("fn");
        localContact._card.vCardProperties.clearValues("nickname");
        localContact._card.vCardProperties.clearValues("email");
        localContact._card.vCardProperties.clearValues("url");
        localContact._card.vCardProperties.clearValues("adr");
        localContact._card.vCardProperties.clearValues("tel");
        localContact._card.vCardProperties.clearValues("impp");
        localContact._card.vCardProperties.clearValues("bday");
        localContact._card.vCardProperties.clearValues("anniversary");
        localContact._card.vCardProperties.clearValues("note");
        localContact._card.vCardProperties.clearValues("title");
        localContact._card.vCardProperties.clearValues("org");
        localContact._card.vCardProperties.clearValues("x-custom1");
        localContact._card.vCardProperties.clearValues("x-custom2");
        localContact._card.vCardProperties.clearValues("x-custom3");
        localContact._card.vCardProperties.clearValues("x-custom4");
        // Set the name and the display name.
        if (remoteContact.names) {
            let name_found = false;
            let name = null;
            for (name of remoteContact.names) {
                if ("CONTACT" === name.metadata.source.type) {
                    name_found = true;
                    break;
                }
            }
            //
            if (name_found) {
                let n_values = [ "", "", "", "", "" ];
                let fn_values = [ "" ];
                //
                if (name.honorificPrefix) {
                    n_values[3] = name.honorificPrefix.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.givenName) {
                    n_values[1] = name.givenName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.middleName) {
                    n_values[2] = name.middleName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.familyName) {
                    n_values[0] = name.familyName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.honorificSuffix) {
                    n_values[4] = name.honorificSuffix.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.displayName) {
                    fn_values[0] = name.displayName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("n", {}, "array", n_values));
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("fn", {}, "text", fn_values[0]));
            }
        }
        // Set the nickname.
        if (remoteContact.nicknames) {
            let nickname_found = false;
            let nickname = remoteContact.nicknames[0];
            nickname_found = true;
            //
            if (nickname_found) {
                let nickname_values = [ "" ];
                //
                if (nickname.value) {
                    nickname_values[0] = nickname.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("nickname", {}, "array", nickname_values));
            }
        }
        // Set the email addresses.
        if (remoteContact.emailAddresses) {
            let pref_param = "1";
            //
            for (let emailAddress of remoteContact.emailAddresses) {
                if ("CONTACT" !== emailAddress.metadata.source.type) {
                    continue;
                }
                //
                let email_values = [ "" ];
                let email_type_param = "";
                //
                if (emailAddress.value) {
                    email_values[0] = emailAddress.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (emailAddress.type) {
                    case "home":
                        email_type_param = "home";
                        //
                        break;
                    case "work":
                        email_type_param = "work";
                        //
                        break;
                    default:
                        email_type_param = "";
                        //
                        break;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("email", { type: email_type_param, pref: pref_param }, "text", email_values[0]));
                //
                pref_param = "";
            }
        }
        else if (useFakeEmailAddresses) {
            let email_values = [ "" ];
            let email_type_param = "";
            //
            email_values[0] = Date.now() + "." + Math.random() + "@" + FAKE_EMAIL_ADDRESS_DOMAIN;
            //
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("email", { type: email_type_param }, "text", email_values[0]));
        }
        // Set the websites.
        if (remoteContact.urls) {
            for (let url of remoteContact.urls) {
                let url_values = [ "" ];
                let url_type_param = "";
                //
                if (url.value) {
                    url_values[0] = url.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (url.type) {
                    case "work":
                        url_type_param = "work";
                        //
                        break;
                    default:
                        url_type_param = "";
                        //
                        break;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("url", { type: url_type_param }, "array", url_values));
            }
        }
        // Set the addresses.
        if (remoteContact.addresses) {
            for (let address of remoteContact.addresses) {
                let adr_values = [ "", "", "", "", "", "", "" ];
                let adr_type_param = "";
                //
                if (address.streetAddress || address.extendedAddress) {
                    adr_values[2] = [];
                }
                if (address.streetAddress) {
                    adr_values[2][0] = address.streetAddress.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.extendedAddress) {
                    if (!address.streetAddress) {
                        adr_values[2][0] = "-";
                    }
                    adr_values[2][1] = address.extendedAddress.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.city) {
                    adr_values[3] = address.city.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.region) {
                    adr_values[4] = address.region.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.postalCode) {
                    adr_values[5] = address.postalCode.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.country) {
                    adr_values[6] = address.country.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                switch (address.type) {
                    case "home":
                        adr_type_param = "home";
                        //
                        break;
                    case "work":
                        adr_type_param = "work";
                        //
                        break;
                    default:
                        adr_type_param = "";
                        //
                        break;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("adr", { type: adr_type_param }, "array", adr_values));
            }
        }
        // Set the phone numbers.
        if (remoteContact.phoneNumbers) {
            for (let phoneNumber of remoteContact.phoneNumbers) {
                let tel_values = [ "" ];
                let tel_type_param = "";
                //
                if (phoneNumber.value) {
                    tel_values[0] = phoneNumber.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (phoneNumber.type) {
                    case "home":
                        tel_type_param = "home";
                        //
                        break;
                    case "work":
                        tel_type_param = "work";
                        //
                        break;
                    case "mobile":
                        tel_type_param = "cell";
                        //
                        break;
                    case "homeFax":
                    case "workFax":
                        tel_type_param = "fax";
                        //
                        break;
                    case "pager":
                        tel_type_param = "pager";
                        //
                        break;
                    default:
                        tel_type_param = "";
                        //
                        break;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("tel", { type: tel_type_param }, "array", tel_values));
            }
        }
        // Set the chat accounts.
        if (remoteContact.imClients) {
            for (let imClient of remoteContact.imClients) {
                let impp_values = [ "" ];
                //
                if (imClient.protocol && imClient.username) {
                    impp_values[0] = imClient.protocol.replaceAll(", ", " ").replaceAll(",", " ") + ":" + imClient.username.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("impp", {}, "array", impp_values));
            }
        }
        // Set the special dates.
        if (remoteContact.birthdays) {
            let birthday_found = false;
            let birthday = remoteContact.birthdays[0];
            birthday_found = true;
            //
            if (birthday_found) {
                let bday_values = [ "" ];
                //
                if (birthday.date) {
                    let year = (birthday.date.year ? String(birthday.date.year).padStart(4, "0") : "-");
                    let month = (birthday.date.month ? String(birthday.date.month).padStart(2, "0") : "-");
                    let day = (birthday.date.day ? String(birthday.date.day).padStart(2, "0") : "-");
                    //
                    bday_values[0] = year + "-" + month + "-" + day;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("bday", {}, "date-and-or-time", bday_values[0]));
            }
        }
        if (remoteContact.events) {
            for (let event of remoteContact.events) {
                let anniversary_values = [ "" ];
                //
                if (event && event.date) {
                    let year = (event.date.year ? String(event.date.year).padStart(4, "0") : "-");
                    let month = (event.date.month ? String(event.date.month).padStart(2, "0") : "-");
                    let day = (event.date.day ? String(event.date.day).padStart(2, "0") : "-");
                    //
                    anniversary_values[0] = year + "-" + month + "-" + day;
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("anniversary", {}, "date-and-or-time", anniversary_values[0]));
            }
        }
        // Set the notes.
        if (remoteContact.biographies) {
            let note_values = [ "" ];
            //
            if (remoteContact.biographies[0] && remoteContact.biographies[0].value) {
                note_values[0] = remoteContact.biographies[0].value.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
            }
            //
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("note", {}, "array", note_values));
        }
        // Set the organizational properties.
        if (remoteContact.organizations) {
            let organization_found = false;
            let organization = remoteContact.organizations[0];
            organization_found = true;
            //
            if (organization_found) {
                let title_values = [ "" ];
                let org_values = [ "" ];
                //
                if (organization.title) {
                    title_values[0] = organization.title.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (organization.name) {
                    org_values[0] = organization.name.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (organization.department) {
// FIXME: temporary.
                    if (!organization.name) {
                        org_values[0] = "-"; // necessary because TB considers the first item to be the name
                    }
                    org_values[1] = organization.department.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("title", {}, "array", title_values));
                localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("org", {}, "array", org_values));
            }
        }
        // Set the custom properties.
        if (remoteContact.userDefined) {
            let x_custom1_values = [ "" ];
            let x_custom2_values = [ "" ];
            let x_custom3_values = [ "" ];
            let x_custom4_values = [ "" ];
            //
            if (remoteContact.userDefined[0] && remoteContact.userDefined[0].value) {
                x_custom1_values[0] = remoteContact.userDefined[0].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[1] && remoteContact.userDefined[1].value) {
                x_custom2_values[0] = remoteContact.userDefined[1].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[2] && remoteContact.userDefined[2].value) {
                x_custom3_values[0] = remoteContact.userDefined[2].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[3] && remoteContact.userDefined[3].value) {
                x_custom4_values[0] = remoteContact.userDefined[3].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            //
/* FIXME: temporary workaround for a TB bug.
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom1", {}, "array", x_custom1_values));
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom2", {}, "array", x_custom2_values));
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom3", {}, "array", x_custom3_values));
            localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom4", {}, "array", x_custom4_values));
*/
localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom1", {}, "array", x_custom1_values[0]));
localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom2", {}, "array", x_custom2_values[0]));
localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom3", {}, "array", x_custom3_values[0]));
localContact._card.vCardProperties.addEntry(new VCardPropertyEntry("x-custom4", {}, "array", x_custom4_values[0]));
        }
        //
        return localContact;
    }

    static fillRemoteContactWithLocalContactInformation(localContact, remoteContact, useFakeEmailAddresses) {
        if (null == localContact) {
            throw new IllegalArgumentError("Invalid 'localContact': null.");
        }
        if (null == remoteContact) {
            throw new IllegalArgumentError("Invalid 'remoteContact': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        // Reset all the properties managed by this method.
        delete remoteContact.names;
        delete remoteContact.nicknames;
        delete remoteContact.emailAddresses;
        delete remoteContact.urls;
        delete remoteContact.addresses;
        delete remoteContact.phoneNumbers;
        delete remoteContact.imClients;
        delete remoteContact.birthdays;
        delete remoteContact.events;
        delete remoteContact.biographies;
        delete remoteContact.organizations;
        delete remoteContact.userDefined;
        // Set the name and the display name.
        let n_entry = localContact._card.vCardProperties.getFirstEntry("n");
        let fn_entry = localContact._card.vCardProperties.getFirstEntry("fn");
        if (n_entry || fn_entry) {
            remoteContact.names = [];
            //
            remoteContact.names[0] = {};
            //
            if (n_entry) {
                let n_values = n_entry.value; // n_entry.value: array
                //
                if (n_values[3]) {
                    remoteContact.names[0].honorificPrefix = n_values[3];
                }
                if (n_values[1]) {
                    remoteContact.names[0].givenName = n_values[1];
                }
                if (n_values[2]) {
                    remoteContact.names[0].middleName = n_values[2];
                }
                if (n_values[0]) {
                    remoteContact.names[0].familyName = n_values[0];
                }
                if (n_values[4]) {
                    remoteContact.names[0].honorificSuffix = n_values[4];
                }
            }
/* Disabled, as names[0].displayName is an output-only field for Google.
            if (fn_entry) {
                let fn_values = [ fn_entry.value ]; // fn_entry.value: string
                //
                if (fn_values[0]) {
                    remoteContact.names[0].displayName = fn_values[0];
                }
            }
*/
        }
        // Set the nickname.
        let nickname_entry = localContact._card.vCardProperties.getFirstEntry("nickname");
        if (nickname_entry) {
            remoteContact.nicknames = [];
            //
            remoteContact.nicknames[0] = {};
            //
            let nickname_values = [ nickname_entry.value ]; // nickname_entry.value: string
            //
            if (nickname_values[0]) {
                remoteContact.nicknames[0].value = nickname_values[0];
            }
        }
        // Set the email addresses.
        let email_entries = localContact._card.vCardProperties.getAllEntries("email");
        if (email_entries) {
            remoteContact.emailAddresses = [];
            let i = 0;
            //
            for (let email_entry of email_entries) {
                if ((email_entry.value.endsWith("@" + FAKE_EMAIL_ADDRESS_DOMAIN)) && (useFakeEmailAddresses)) {
                    continue;
                }
                //
                remoteContact.emailAddresses[i] = {};
                //
                let email_values = [ email_entry.value ]; // email_entry.value: string
                let email_type_param = email_entry.params.type;
                //
                if (email_values[0]) {
                    remoteContact.emailAddresses[i].value = email_values[0];
                }
                switch (email_type_param) {
                    case "work":
                        remoteContact.emailAddresses[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.emailAddresses[i].type = "home";
                        //
                        break;
                    default:
                        remoteContact.emailAddresses[i].type = "other";
                        //
                        break;
                }
                //
                i++;
            }
            //
            if (0 == remoteContact.emailAddresses.length) {
                delete remoteContact.emailAddresses;
            }
        }
        // Set the websites.
        let url_entries = localContact._card.vCardProperties.getAllEntries("url");
        if (url_entries) {
            remoteContact.urls = [];
            let i = 0;
            //
            for (let url_entry of url_entries) {
                remoteContact.urls[i] = {};
                //
                let url_values = [ url_entry.value ]; // url_entry.value: string
                let url_type_param = url_entry.params.type;
                //
                if (url_values[0]) {
                    remoteContact.urls[i].value = url_values[0];
                }
                switch (url_type_param) {
                    case "work":
                        remoteContact.urls[i].type = "work";
                        //
                        break;
                    default:
                        remoteContact.urls[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the addresses.
        let adr_entries = localContact._card.vCardProperties.getAllEntries("adr");
        if (adr_entries) {
            remoteContact.addresses = [];
            let i = 0;
            //
            for (let adr_entry of adr_entries) {
                remoteContact.addresses[i] = {};
                //
                let adr_values = adr_entry.value; // adr_entry.value: array
                let adr_type_param = adr_entry.params.type;
                //
                if (adr_values[2]) {
                    let adr_values_2_values = (Array.isArray(adr_values[2]) ? adr_values[2] : [ adr_values[2] ]); // adr_values[2]: string or array
                    //
                    if (adr_values_2_values[0]) {
                        remoteContact.addresses[i].streetAddress = adr_values_2_values[0];
                    }
                    if (adr_values_2_values[1]) {
                        remoteContact.addresses[i].extendedAddress = adr_values_2_values[1];
                    }
                }
                if (adr_values[3]) {
                    remoteContact.addresses[i].city = adr_values[3];
                }
                if (adr_values[4]) {
                    remoteContact.addresses[i].region = adr_values[4];
                }
                if (adr_values[5]) {
                    remoteContact.addresses[i].postalCode = adr_values[5];
                }
                if (adr_values[6]) {
                    remoteContact.addresses[i].country = adr_values[6];
                }
                switch (adr_type_param) {
                    case "work":
                        remoteContact.addresses[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.addresses[i].type = "home";
                        //
                        break;
                    default:
                        remoteContact.addresses[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the phone numbers.
        let tel_entries = localContact._card.vCardProperties.getAllEntries("tel");
        if (tel_entries) {
            remoteContact.phoneNumbers = [];
            let i = 0;
            //
            for (let tel_entry of tel_entries) {
                remoteContact.phoneNumbers[i] = {};
                //
                let tel_values = [ tel_entry.value ]; // tel_entry.value: string
                let tel_type_param = tel_entry.params.type;
                //
                if (tel_values[0]) {
                    remoteContact.phoneNumbers[i].value = tel_values[0];
                }
                switch (tel_type_param) {
                    case "work":
                        remoteContact.phoneNumbers[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.phoneNumbers[i].type = "home";
                        //
                        break;
                    case "cell":
                        remoteContact.phoneNumbers[i].type = "mobile";
                        //
                        break;
                    case "fax":
                        remoteContact.phoneNumbers[i].type = "Work Fax";
                        //
                        break;
                    case "pager":
                        remoteContact.phoneNumbers[i].type = "pager";
                        //
                        break;
                    default:
                        remoteContact.phoneNumbers[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the chat accounts.
        let impp_entries = localContact._card.vCardProperties.getAllEntries("impp");
        if (impp_entries) {
            remoteContact.imClients = [];
            let i = 0;
            //
            for (let impp_entry of impp_entries) {
                remoteContact.imClients[i] = {};
                //
                let impp_values = [ impp_entry.value ]; // impp_entry.value: string
                //
                if (impp_values[0] && impp_values[0].includes(":")) {
                    let impp_values_pu = impp_values[0].split(":");
                    //
                    remoteContact.imClients[i].username = impp_values_pu[1];
                    remoteContact.imClients[i].protocol = impp_values_pu[0];
                }
                //
                i++;
            }
        }
        // Set the special dates.
        let bday_entry = localContact._card.vCardProperties.getFirstEntry("bday");
        let anniversary_entries = localContact._card.vCardProperties.getAllEntries("anniversary");
        if (bday_entry) {
            remoteContact.birthdays = [];
            //
            remoteContact.birthdays[0] = {};
            remoteContact.birthdays[0].date = {};
            //
            let bday_values = [ bday_entry.value ]; // bday_entry.value: string
            //
            let year = "";
            let month = "";
            let day = "";
            let c = 0;
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                year = bday_values[0].substring(c, c + 4);
                c += 5;
            }
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                month = bday_values[0].substring(c, c + 2);
                c += 3;
            }
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                day = bday_values[0].substring(c, c + 2);
                c += 3;
            }
            //
            if (month) {
                remoteContact.birthdays[0].date.month = month;
            }
            if (day) {
                remoteContact.birthdays[0].date.day = day;
            }
            if (year) {
                remoteContact.birthdays[0].date.year = year;
            }
        }
        if (anniversary_entries) {
            remoteContact.events = [];
            let i = 0;
            //
            for (let anniversary_entry of anniversary_entries) {
                remoteContact.events[i] = {};
                remoteContact.events[i].date = {};
                //
                let anniversary_values = [ anniversary_entry.value ]; // anniversary_entry.value: string
                //
                let year = "";
                let month = "";
                let day = "";
                let c = 0;
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    year = anniversary_values[0].substring(c, c + 4);
                    c += 5;
                }
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    month = anniversary_values[0].substring(c, c + 2);
                    c += 3;
                }
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    day = anniversary_values[0].substring(c, c + 2);
                    c += 3;
                }
                //
                if (month && day) {
                    if (month) {
                        remoteContact.events[i].date.month = month;
                    }
                    if (day) {
                        remoteContact.events[i].date.day = day;
                    }
                    if (year) {
                        remoteContact.events[i].date.year = year;
                    }
                }
                //
                i++;
            }
        }
        // Set the notes.
        let note_entry = localContact._card.vCardProperties.getFirstEntry("note");
        if (note_entry) {
            remoteContact.biographies = [];
            //
            remoteContact.biographies[0] = {};
            //
            let note_values = [ note_entry.value ]; // note_entry.value: string
            //
            if (note_values[0]) {
                remoteContact.biographies[0].value = note_values[0];
            }
        }
        // Set the organizational properties.
        let title_entry = localContact._card.vCardProperties.getFirstEntry("title");
        let org_entry = localContact._card.vCardProperties.getFirstEntry("org");
        if (title_entry || org_entry) {
            remoteContact.organizations = [];
            //
            remoteContact.organizations[0] = {};
            //
            if (title_entry) {
                let title_values = [ title_entry.value ]; // title_entry.value: string
                //
                if (title_values[0]) {
                    remoteContact.organizations[0].title = title_values[0];
                }
            }
            if (org_entry) {
                let org_values = (Array.isArray(org_entry.value) ? org_entry.value : [ org_entry.value ]); // org_entry.value: string or array
                //
                if (org_values[0]) {
                    remoteContact.organizations[0].name = org_values[0];
                }
                if (org_values[1]) {
                    remoteContact.organizations[0].department = org_values[1];
                }
            }
        }
        // Set the custom properties.
        let x_custom1_entry = localContact._card.vCardProperties.getFirstEntry("x-custom1");
        let x_custom2_entry = localContact._card.vCardProperties.getFirstEntry("x-custom2");
        let x_custom3_entry = localContact._card.vCardProperties.getFirstEntry("x-custom3");
        let x_custom4_entry = localContact._card.vCardProperties.getFirstEntry("x-custom4");
        if (x_custom1_entry || x_custom2_entry || x_custom3_entry || x_custom4_entry) {
            remoteContact.userDefined = [];
            let i = 0;
            //
            if (x_custom1_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom1_values = [ x_custom1_entry.value ]; // x_custom1_entry.value: string
                //
                if (x_custom1_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom1_values[0];
                    //
                    i++;
                }
            }
            if (x_custom2_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom2_values = [ x_custom2_entry.value ]; // x_custom2_entry.value: string
                //
                if (x_custom2_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom2_values[0];
                    //
                    i++;
                }
            }
            if (x_custom3_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom3_values = [ x_custom3_entry.value ]; // x_custom3_entry.value: string
                //
                if (x_custom3_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom3_values[0];
                    //
                    i++;
                }
            }
            if (x_custom4_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom4_values = [ x_custom4_entry.value ]; // x_custom4_entry.value: string
                //
                if (x_custom4_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom4_values[0];
                    //
                    i++;
                }
            }
        }
        //
        return remoteContact;
    }

    /* Contact groups. */

    static async synchronizeContactGroups(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalLocalItemIdMap, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactGroupIdSet, originalUpdatedLocalContactGroupIdSet) {
        if (null == peopleAPI) {
            throw new IllegalArgumentError("Invalid 'peopleAPI': null.");
        }
        if (null == includeSystemContactGroups) {
            throw new IllegalArgumentError("Invalid 'includeSystemContactGroups': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
        if (null == localAddressBook) {
            throw new IllegalArgumentError("Invalid 'localAddressBook': null.");
        }
        if (null == localAddressBookItemExtraPropertyManager) {
            throw new IllegalArgumentError("Invalid 'localAddressBookItemExtraPropertyManager': null.");
        }
        if (null == originalLocalItemIdMap) {
            throw new IllegalArgumentError("Invalid 'originalLocalItemIdMap': null.");
        }
        if (null == originalDeletedLocalItemResourceNameSet) {
            throw new IllegalArgumentError("Invalid 'originalDeletedLocalItemResourceNameSet': null.");
        }
        if (null == originalCreatedLocalContactGroupIdSet) {
            throw new IllegalArgumentError("Invalid 'originalCreatedLocalContactGroupIdSet': null.");
        }
        if (null == originalUpdatedLocalContactGroupIdSet) {
            throw new IllegalArgumentError("Invalid 'originalUpdatedLocalContactGroupIdSet': null.");
        }
        // Get the local address book id.
        let localAddressBookId = localAddressBook.id;
        // Retrieve the remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Retrieving the remote contact groups.");
        let remoteContactGroups = await peopleAPI.getContactGroups();
        // Cycle on the remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the remote contact groups.");
        logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): includeSystemContactGroups = " + includeSystemContactGroups + ".");
        for (let remoteContactGroup of remoteContactGroups) {
            // Get the contact group resource name (in the form 'contactGroups/contactGroupId') and name.
            let contactGroupResourceName = remoteContactGroup.resourceName;
            let contactGroupName = remoteContactGroup.name;
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Processing remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "').");
            // Determine if the remote contact group is a system one.
            if ("SYSTEM_CONTACT_GROUP" === remoteContactGroup.groupType) {
                // Determine if the remote contact group should be discarded.
                if (!includeSystemContactGroups) {
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') is a system contact group and has therefore been ignored.");
                    continue;
                }
                // Fix the missing etag.
                remoteContactGroup.etag = FAKE_ETAG;
            }
            // Try to match the remote contact group locally.
            let localItemExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraProperties(localAddressBookId, contactGroupResourceName);
            let contactGroupId = undefined;
            if (undefined !== localItemExtraProperties) {
                contactGroupId = localItemExtraProperties.id;
            }
            let localContactGroup = undefined;
            if (undefined !== contactGroupId) {
                try {
                    localContactGroup = await messenger.mailingLists.get(contactGroupId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Match found: remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') -> local contact group '" + contactGroupId + "'.");
                }
                catch (error) {
                }
            }
            // If such a remote contact group is currently unavailable locally...
            if (undefined === localContactGroup) {
                // ...and if it was previously deleted locally...
                if (originalDeletedLocalItemResourceNameSet.has(contactGroupResourceName)) {
                    // Check we are not in read-only mode, then...
                    if (!readOnlyMode) {
                        // Delete the remote contact group.
                        await peopleAPI.deleteContactGroup(contactGroupResourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been deleted remotely.");
                        // Remove the event data from the local address book event map.
                        await localAddressBookEventManager.clearMailingListDeletedEventData(localAddressBookId, contactGroupId);
                    }
                }
                // ...and if it wasn't previously deleted locally...
                else {
                    // Prepare the local contact group properties.
                    let localContactGroupProperties = AddressBookSynchronizer.getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup);
                    // Create a local contact group, and update the local address book item extra property map.
                    let contactGroupId = await messenger.mailingLists.create(localAddressBookId, localContactGroupProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupResourceName, remoteContactGroup.etag, contactGroupId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been created locally: '" + contactGroupId + "'.");
                }
            }
            // If such a remote contact group is currently available locally...
            else {
                // ...and if the remote one is more recent, or if we are in read-only mode...
                if ((localItemExtraProperties.etag !== remoteContactGroup.etag) || (readOnlyMode)) {
                    // Prepare the local contact group properties.
                    let localContactGroupProperties = AddressBookSynchronizer.getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup);
                    // Update the local contact group, and update the local address book item extra property map.
                    await messenger.mailingLists.update(contactGroupId, localContactGroupProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupResourceName, remoteContactGroup.etag, contactGroupId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been updated locally: '" + contactGroupId + "'.");
                    // Remove the event data from the local address book event map, and remove the contact group from the locally updated ones (to avoid duplications).
                    await localAddressBookEventManager.clearMailingListUpdatedEventData(localAddressBookId, contactGroupId);
                    originalUpdatedLocalContactGroupIdSet.delete(contactGroupId);
                }
            }
        }
        // Cycle on the created local contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the created local contact groups.");
        for (let contactGroupId of originalCreatedLocalContactGroupIdSet) {
            // Check we are not in read-only mode, then...
            if (!readOnlyMode) {
                // Retrieve the local contact group.
                let localContactGroup = await messenger.mailingLists.get(contactGroupId);
                // Get the contact group name.
                let contactGroupName = localContactGroup.name;
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Processing local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
                // Prepare the remote contact group.
                let localContactGroupProperties = {
                    name: contactGroupName,
                    nickName: localContactGroup.nickName,
                    type: localContactGroup.type
                };
                let remoteContactGroup = AddressBookSynchronizer.getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties);
                // Create a remote contact group, and update the local address book item extra property map.
                remoteContactGroup = await peopleAPI.createContactGroup(remoteContactGroup);
                let contactGroupResourceName = remoteContactGroup.resourceName;
                localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupResourceName, remoteContactGroup.etag, contactGroupId);
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been created remotely: '" + contactGroupResourceName + "'.");
                // Remove the event data from the local address book event map.
                await localAddressBookEventManager.clearMailingListCreatedEventData(localAddressBookId, contactGroupId);
            }
        }
        // Cycle on the updated local contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the updated local contact groups.");
        for (let contactGroupId of originalUpdatedLocalContactGroupIdSet) {
            // Check we are not in read-only mode, then...
            if (!readOnlyMode) {
                // Get the contact group extra properties.
                let contactGroupExtraProperties = originalLocalItemIdMap.get(contactGroupId);
                // Make sure the local contact group has a valid etag (if not, it is probably a system contact group, which cannot be updated).
                if (FAKE_ETAG === contactGroupExtraProperties.etag) {
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + localContactGroupId + "' has no etag and has therefore been ignored.");
                    continue;
                }
                // Retrieve the local contact group.
                let localContactGroup = await messenger.mailingLists.get(contactGroupId);
                // Get the contact group name.
                let contactGroupName = localContactGroup.name;
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Processing local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
                // Get the contact group resource name (in the form 'contactGroups/contactGroupId').
                let contactGroupResourceName = contactGroupExtraProperties.resourceName;
                // Prepare the remote contact group.
                let localContactGroupProperties = {
                    name: contactGroupName,
                    nickName: localContactGroup.nickName,
                    type: localContactGroup.type
                };
                let remoteContactGroup = AddressBookSynchronizer.getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties);
                remoteContactGroup.resourceName = contactGroupResourceName;
                remoteContactGroup.etag = contactGroupExtraProperties.etag;
                // Update the remote contact group or delete the local contact group.
                try {
                    // Update the remote contact group, and update the local address book item extra property map.
                    remoteContactGroup = await peopleAPI.updateContactGroup(remoteContactGroup);
                    let contactGroupResourceName = remoteContactGroup.resourceName;
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupResourceName, remoteContactGroup.etag, contactGroupId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been updated remotely: '" + contactGroupResourceName + "'.");
                    // Remove the event data from the local address book event map.
                    await localAddressBookEventManager.clearMailingListUpdatedEventData(localAddressBookId, contactGroupId);
                }
                catch (error) {
                    // If the remote contact group is no longer available (i.e.: it was deleted)...
                    if ((error instanceof ResponseError) && (error.message.includes(": 404:"))) {
                        // Delete the local contact group, and update the local address book item extra property map.
                        await messenger.mailingLists.delete(contactGroupId);
                        localAddressBookItemExtraPropertyManager.deleteItemExtraProperties(localAddressBookId, contactGroupResourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been deleted locally.");
                        // Remove the event data from the local address book event map.
                        await localAddressBookEventManager.clearMailingListUpdatedEventData(localAddressBookId, contactGroupId);
                    }
                    // If the root reason is different...
                    else {
                        // Propagate the error.
                        throw error;
                    }
                }
            }
        }
        // Determine all the deleted remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Determining all the deleted remote contact groups.");
        for (let localContactGroup of await messenger.mailingLists.list(localAddressBookId)) {
            // Get the contact group id and name.
            let contactGroupId = localContactGroup.id;
            let contactGroupName = localContactGroup.name;
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Processing local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
            // Determine if the local contact group is a locally added one.
            if (originalCreatedLocalContactGroupIdSet.has(contactGroupId)) {
                continue;
            }
            // Determine if the local contact group is among the downloaded ones, and get the contact group resource name (in the form 'contactGroups/contactGroupId').
            let localContactGroupFoundAmongRemoteContactGroups = false;
            let contactGroupResourceName = undefined;
// FIXME: find a faster way.
            for (let remoteContactGroup of remoteContactGroups) {
                let localItemExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraProperties(localAddressBookId, remoteContactGroup.resourceName);
                if (undefined !== localItemExtraProperties) {
                    let itemId = localItemExtraProperties.id;
                    if (contactGroupId === itemId) {
                        localContactGroupFoundAmongRemoteContactGroups = true;
                        contactGroupResourceName = remoteContactGroup.resourceName;
                        break;
                    }
                }
            }
            if (localContactGroupFoundAmongRemoteContactGroups) {
                continue;
            }
            // Delete the local contact group, and update the local address book item extra property map.
            await messenger.mailingLists.delete(contactGroupId);
            localAddressBookItemExtraPropertyManager.deleteItemExtraProperties(localAddressBookId, contactGroupResourceName);
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been deleted locally.");
        }
    }

    static getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup) {
        if (null == remoteContactGroup) {
            throw new IllegalArgumentError("Invalid 'remoteContactGroup': null.");
        }
        // Prepare the local contact group properties.
        let localContactGroupProperties = {}
        // Set the name.
        if (remoteContactGroup.name) {
            let name = remoteContactGroup.name.replace(/[<>;,"]/g, '_');
            //
            localContactGroupProperties.name = name;
        }
        //
        return localContactGroupProperties;
    }

    static getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties) {
        if (null == localContactGroupProperties) {
            throw new IllegalArgumentError("Invalid 'localContactGroupProperties': null.");
        }
        // Prepare the remote contact group.
        let remoteContactGroup = {}
        // Set the name.
        if (localContactGroupProperties.name) {
            remoteContactGroup.name = localContactGroupProperties.name;
        }
        //
        return remoteContactGroup;
    }

    /* Contact group members. */

    static async synchronizeContactGroupMembers(targetAddressBook, targetAddressBookItemMap, contactGroupMemberMap, readOnlyMode) { // https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Address_Book_Examples
        if (null == targetAddressBook) {
            throw new IllegalArgumentError("Invalid 'targetAddressBook': null.");
        }
        if (null == targetAddressBookItemMap) {
            throw new IllegalArgumentError("Invalid 'targetAddressBookItemMap': null.");
        }
        if (null == contactGroupMemberMap) {
            throw new IllegalArgumentError("Invalid 'contactGroupMemberMap': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
// FIXME: temporary (Google-to-Thunderbird only synchronization).
        // Cycle on the local contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroupMembers(): Determining all the members for each contact group.");
        for (let localContactGroup of targetAddressBookItemMap.values()) {
            // Make sure the item is actually valid and a real contact group.
            if (undefined === targetAddressBookItemMap.get(localContactGroup.getProperty("X-GOOGLE-RESOURCENAME"))) {
                continue;
            }
            if (!localContactGroup.isMailList) {
                continue;
            }
            // Retrieve the local contact group directory.
            let abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
            let localContactGroupDirectory = abManager.getDirectory(localContactGroup._card.mailListURI);
            // Retrieve the remote contact group members.
            let remoteContactGroupMembers = contactGroupMemberMap.get(localContactGroup.getProperty("X-GOOGLE-RESOURCENAME"));
            // Synchronize the local contact group members with the (old) remote contact group members.
            for (let localContactGroupDirectoryCard of localContactGroupDirectory.childCards) {
                let localContactGroupDirectoryCardResourceName = localContactGroupDirectoryCard.getProperty("X-GOOGLE-RESOURCENAME", null);
                if ((undefined !== remoteContactGroupMembers) && (remoteContactGroupMembers.has(localContactGroupDirectoryCardResourceName))) {
                    remoteContactGroupMembers.delete(localContactGroupDirectoryCardResourceName);
                }
                else {
                    localContactGroupDirectory.deleteCards([ localContactGroupDirectoryCard ]);
                }
            }
            // Fill the local contact group with the remaining (new) remote contact group members.
            if (undefined !== remoteContactGroupMembers) {
                for (let remoteContactGroupMember of remoteContactGroupMembers) {
                    let localContact = targetAddressBookItemMap.get(remoteContactGroupMember);
                    localContactGroupDirectory.addCard(localContact._card);
                }
            }
            // Finalize the changes.
            localContactGroupDirectory.editMailListToDatabase(localContactGroup);
        }
    }

    static updateContactGroupMemberMap(contactGroupMemberMap, contactResourceName, contactMemberships) {
        if (null == contactGroupMemberMap) {
            throw new IllegalArgumentError("Invalid 'contactGroupMemberMap': null.");
        }
        if (null == contactResourceName) {
            throw new IllegalArgumentError("Invalid 'contactResourceName': null.");
        }
        if (null == contactMemberships) {
            throw new IllegalArgumentError("Invalid 'contactMemberships': null.");
        }
        // Cycle on all contact memberships.
        for (let contactMembership of contactMemberships) {
            // Discard useless items.
            if (undefined == contactMembership.contactGroupMembership) {
                continue;
            }
            // Retrieve the contact group resource name.
            let contactGroupResourceName = contactMembership.contactGroupMembership.contactGroupResourceName;
            // If such a contact group is not already in the map, add it and its set.
            if (undefined === contactGroupMemberMap.get(contactGroupResourceName)) {
                contactGroupMemberMap.set(contactGroupResourceName, new Set());
            }
            // Add the contact to the map.
            contactGroupMemberMap.get(contactGroupResourceName).add(contactResourceName);
        }
    }

}
