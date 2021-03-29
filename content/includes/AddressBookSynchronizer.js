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

const FAKE_EMAIL_ADDRESS_DOMAIN = "bug1522453.thunderbird.example.com";

class AddressBookSynchronizer {

    /* Main synchronization. */

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
        // Retrieve other account properties.
        let useFakeEmailAddresses = syncData.accountData.getAccountProperty("useFakeEmailAddresses");
        let readOnlyMode = syncData.accountData.getAccountProperty("readOnlyMode");
        // Check for the read-only mode.
        if (readOnlyMode) {
            console.log("AddressBookSynchronizer.synchronize(): Read-only mode detected, clearing the change log.");
            // Clear the change log.
            await targetAddressBook.clearChangelog();
        }
        // Prepare the variables for the cycles.
        console.log("AddressBookSynchronizer.synchronize(): Retrieving all the local changes since the last synchronization.");
        let addedLocalItemIds = targetAddressBook.getAddedItemsFromChangeLog();
        let modifiedLocalItemIds = targetAddressBook.getModifiedItemsFromChangeLog();
        let deletedLocalItemIds = targetAddressBook.getDeletedItemsFromChangeLog();
        // Synchronize contact groups.
        await AddressBookSynchronizer.synchronizeContactGroups(peopleAPI, targetAddressBook, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds);
        // Synchronize contacts.
        let contactGroupMemberMap = await AddressBookSynchronizer.synchronizeContacts(peopleAPI, targetAddressBook, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds, useFakeEmailAddresses);
        // Synchronize contact group members.
        await AddressBookSynchronizer.synchronizeContactGroupMembers(contactGroupMemberMap, targetAddressBook);
        // Fix the change log.
        await AddressBookSynchronizer.fixChangeLog(targetAddressBook);
        //
        console.log("AddressBookSynchronizer.synchronize(): Done synchronizing.");
    }

    /* Contact group synchronization. */

    static async synchronizeContactGroups(peopleAPI, targetAddressBook, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds) {
        if (null == peopleAPI) {
            new Error("Invalid 'peopleAPI': null.");
        }
        if (null == targetAddressBook) {
            new Error("Invalid 'targetAddressBook': null.");
        }
        if (null == addedLocalItemIds) {
            new Error("Invalid 'addedLocalItemIds': null.");
        }
        if (null == modifiedLocalItemIds) {
            new Error("Invalid 'modifiedLocalItemIds': null.");
        }
        if (null == deletedLocalItemIds) {
            new Error("Invalid 'deletedLocalItemIds': null.");
        }
        // Retrieve all server contact groups.
        let serverContactGroups = await peopleAPI.getContactGroups();
        // Cycle on the server contact groups.
        console.log("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the server contact groups.");
        let includeSystemContactGroups = peopleAPI.getIncludeSystemContactGroups();
        console.log("PeopleAPI.getContactGroups(): includeSystemContactGroups = " + includeSystemContactGroups);
        for (let serverContactGroup of serverContactGroups) {
            // Get the resource name (in the form 'contactGroups/contactGroupId') and the name.
            let resourceName = serverContactGroup.resourceName;
            let name = serverContactGroup.name;
            console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ")");
            // Determine if the server contact group is a system one and if it should be discarded.
            if (("SYSTEM_CONTACT_GROUP" === serverContactGroup.groupType) && (!includeSystemContactGroups)) {
                console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") is a system contact group and was therefore ignored.");
                continue;
            }
            // Try to match the server contact group locally.
            let localContactGroup = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", resourceName);
            // If such a local contact group is currently unavailable...
            if (null == localContactGroup) {
                // ...and if it was previously deleted locally...
                if (deletedLocalItemIds.includes(resourceName)) {
                    // Delete the server contact group remotely.
                    await peopleAPI.deleteContactGroup(resourceName);
                    console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") was deleted remotely.");
                    // Remove the resource name from the local change log (deleted items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
                // ...and if it wasn't previously deleted locally...
                else {
                    // Create a new local contact group.
                    localContactGroup = targetAddressBook.createNewList();
                    // Import the server contact group information into the local contact group.
                    localContactGroup.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    localContactGroup.setProperty("X-GOOGLE-ETAG", serverContactGroup.etag);
                    localContactGroup = AddressBookSynchronizer.fillLocalContactGroupWithServerContactGroupInformation(localContactGroup, serverContactGroup);
                    // Add the local contact group locally.
                    await targetAddressBook.addItem(localContactGroup, true);
                    console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") was added locally.");
                    // Remove the resource name from the local change log (added items).
                    // (This should be logically useless, but sometimes the change log is filled with some of the contact groups added above.)
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
            }
            // If such a local contact group is currently available...
            else {
                // ...and if the server one is more recent...
                if (localContactGroup.getProperty("X-GOOGLE-ETAG") !== serverContactGroup.etag) {
                    // Import the server contact group information into the local contact group.
                    localContactGroup.setProperty("X-GOOGLE-ETAG", serverContactGroup.etag);
                    localContactGroup = AddressBookSynchronizer.fillLocalContactGroupWithServerContactGroupInformation(localContactGroup, serverContactGroup);
                    // Update the local contact group locally.
                    await targetAddressBook.modifyItem(localContactGroup, true);
                    console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") was updated locally.");
                    // Remove the resource name from the local change log (modified items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
            }
        }
        // Prepare the variables for the cycles.
        let addedLocalItemResourceNames = [];
        // Cycle on the locally added contact groups.
        console.log("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the locally added contact groups.");
        for (let localContactGroupId of addedLocalItemIds) {
            // Retrieve the local contact group, and make sure such an item is actually valid and a real contact group.
            let localContactGroup = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactGroupId);
            if (null == localContactGroup) {
                continue;
            }
            if (!localContactGroup.isMailList) {
                continue;
            }
            // Create a new server contact group.
            let serverContactGroup = {};
            // Import the local contact group information into the server contact group.
            serverContactGroup = AddressBookSynchronizer.fillServerContactGroupWithLocalContactGroupInformation(localContactGroup, serverContactGroup);
            // Add the server contact group remotely and get the resource name (in the form 'contactGroups/contactGroupId') and the name.
            serverContactGroup = await peopleAPI.createContactGroup(serverContactGroup);
            let resourceName = serverContactGroup.resourceName;
            let name = serverContactGroup.name;
            console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") was added remotely.");
            // Update the local contact group locally.
            localContactGroup.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
            localContactGroup.setProperty("X-GOOGLE-ETAG", serverContactGroup.etag);
            localContactGroup = AddressBookSynchronizer.fillLocalContactGroupWithServerContactGroupInformation(localContactGroup, serverContactGroup);
            await targetAddressBook.modifyItem(localContactGroup, true);
            // Add the resource name to the proper array.
            addedLocalItemResourceNames.push(resourceName);
            // Remove the local contact group id from the local change log (added items).
            targetAddressBook.removeItemFromChangeLog(localContactGroupId);
        }
        // Cycle on the locally modified contact groups.
        console.log("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the locally modified contact groups.");
        for (let localContactGroupId of modifiedLocalItemIds) {
            // Retrieve the local contact group, and make sure such an item is actually valid and a real contact group.
            let localContactGroup = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactGroupId);
            if (null == localContactGroup) {
                continue;
            }
            if (!localContactGroup.isMailList) {
                continue;
            }
            // Make sure the local contact group has a valid X-GOOGLE-ETAG property (if not, it is probably a system contact group, which cannot be updated).
            if (!localContactGroup.getProperty("X-GOOGLE-ETAG")) {
                console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + localContactGroupId + " has no X-GOOGLE-ETAG property and was therefore ignored.");
                continue;
            }
            // Create a new server contact group.
            let serverContactGroup = {};
            serverContactGroup.resourceName = localContactGroup.getProperty("X-GOOGLE-RESOURCENAME");
            serverContactGroup.etag = localContactGroup.getProperty("X-GOOGLE-ETAG");
            // Import the local contact group information into the server contact group.
            serverContactGroup = AddressBookSynchronizer.fillServerContactGroupWithLocalContactGroupInformation(localContactGroup, serverContactGroup);
            // Update the server contact group remotely and get the resource name (in the form 'contactGroups/contactGroupId') and the name.
            serverContactGroup = await peopleAPI.updateContactGroup(serverContactGroup);
            let resourceName = serverContactGroup.resourceName;
            let name = serverContactGroup.name;
            console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + resourceName + " (" + name + ") was updated remotely.");
            // Update the local contact group locally.
            localContactGroup.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
            localContactGroup.setProperty("X-GOOGLE-ETAG", serverContactGroup.etag);
            localContactGroup = AddressBookSynchronizer.fillLocalContactGroupWithServerContactGroupInformation(localContactGroup, serverContactGroup);
            await targetAddressBook.modifyItem(localContactGroup, true);
            // Remove the local contact group id from the local change log (modified items).
            targetAddressBook.removeItemFromChangeLog(localContactGroupId);
        }
        // Determine all the contact groups which were previously deleted remotely and delete them locally.
        console.log("AddressBookSynchronizer.synchronizeContactGroups(): Determining all the remotely deleted contact groups.");
        for (let localContactGroup of targetAddressBook.getAllItems()) {
            // Make sure the item is actually valid and a real contact group.
            if (null == await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactGroup.getProperty("X-GOOGLE-RESOURCENAME"))) {
                continue;
            }
            if (!localContactGroup.isMailList) {
                continue;
            }
            // Get the local contact group id and the name.
            let localContactGroupId = localContactGroup.getProperty("X-GOOGLE-RESOURCENAME");
            let name = localContactGroup.getProperty("ListName");
            // Check if the local contact group id matches any of the locally added contact groups.
            if (addedLocalItemResourceNames.includes(localContactGroupId)) {
                continue;
            }
            // Check if the local contact group id matches any of the resource names downloaded.
            let localContactGroupFoundAmongServerContactGroups = false;
            for (let serverContactGroup of serverContactGroups) {
                if (localContactGroupId === serverContactGroup.resourceName) {
                    localContactGroupFoundAmongServerContactGroups = true;
                    break;
                }
            }
            if (localContactGroupFoundAmongServerContactGroups) {
                continue;
            }
            // Delete the local contact group locally.
/* FIXME: .deleteItem() does not actually delete a contact group.
            targetAddressBook.deleteItem(localContactGroup, true);
*/
let abManager = Components.classes["@mozilla.org/abmanager;1"].createInstance(Components.interfaces.nsIAbManager);
abManager.deleteAddressBook(localContactGroup._card.mailListURI);
            console.log("AddressBookSynchronizer.synchronizeContactGroups(): " + localContactGroupId + " (" + name + ") was deleted locally.");
        }
    }

    static fillLocalContactGroupWithServerContactGroupInformation(localContactGroup, serverContactGroup) {
        if (null == localContactGroup) {
            new Error("Invalid 'localContactGroup': null.");
        }
        if (null == serverContactGroup) {
            new Error("Invalid 'serverContactGroup': null.");
        }
        // Reset all the properties managed by this method.
        localContactGroup.deleteProperty("ListName");
        // Set the name.
        if (serverContactGroup.name) {
            localContactGroup.setProperty("ListName", serverContactGroup.name);
        }
        //
        return localContactGroup;
    }

    static fillServerContactGroupWithLocalContactGroupInformation(localContactGroup, serverContactGroup) {
        if (null == localContactGroup) {
            new Error("Invalid 'localContactGroup': null.");
        }
        if (null == serverContactGroup) {
            new Error("Invalid 'serverContactGroup': null.");
        }
        // Reset all the properties managed by this method.
        delete serverContactGroup.name;
        // Set the name.
        if (localContactGroup.getProperty("ListName")) {
            serverContactGroup.name = localContactGroup.getProperty("ListName");
        }
        //
        return serverContactGroup;
    }

    /* Contact synchronization. */

    static async synchronizeContacts(peopleAPI, targetAddressBook, addedLocalItemIds, modifiedLocalItemIds, deletedLocalItemIds, useFakeEmailAddresses) {
        if (null == peopleAPI) {
            new Error("Invalid 'peopleAPI': null.");
        }
        if (null == targetAddressBook) {
            new Error("Invalid 'targetAddressBook': null.");
        }
        if (null == addedLocalItemIds) {
            new Error("Invalid 'addedLocalItemIds': null.");
        }
        if (null == modifiedLocalItemIds) {
            new Error("Invalid 'modifiedLocalItemIds': null.");
        }
        if (null == deletedLocalItemIds) {
            new Error("Invalid 'deletedLocalItemIds': null.");
        }
        if (null == useFakeEmailAddresses) {
            new Error("Invalid 'useFakeEmailAddresses': null.");
        }
// FIXME: temporary.
        // Prepare the variables for the cycles.
        let contactGroupMemberMap = new Map();
        // Retrieve all server contacts.
        let serverContacts = await peopleAPI.getContacts();
        // Cycle on the server contacts.
        console.log("AddressBookSynchronizer.synchronizeContacts(): Cycling on the server contacts.");
        for (let serverContact of serverContacts) {
            // Get the resource name (in the form 'people/personId') and the display name.
            let resourceName = serverContact.resourceName;
            let displayName = (serverContact.names ? serverContact.names[0].displayName : "-");
            console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ")");
            // Try to match the server contact locally.
            let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", resourceName);
            // If such a local contact is currently unavailable...
            if (null == localContact) {
                // ...and if it was previously deleted locally...
                if (deletedLocalItemIds.includes(resourceName)) {
                    // Delete the server contact remotely.
                    await peopleAPI.deleteContact(resourceName);
                    console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") was deleted remotely.");
                    // Remove the resource name from the local change log (deleted items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
                }
                // ...and if it wasn't previously deleted locally...
                else {
                    // Create a new local contact.
                    localContact = targetAddressBook.createNewCard();
                    // Import the server contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact, useFakeEmailAddresses);
                    // Add the local contact locally.
                    await targetAddressBook.addItem(localContact, true);
                    console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") was added locally.");
                    // Remove the resource name from the local change log (added items).
                    // (This should be logically useless, but sometimes the change log is filled with some of the contacts added above.)
                    targetAddressBook.removeItemFromChangeLog(resourceName);
// FIXME: temporary,
                    // Update the contact group member map.
                    contactGroupMemberMap = AddressBookSynchronizer.updateContactGroupMemberMap(contactGroupMemberMap, resourceName, serverContact.memberships);
                }
            }
            // If such a local contact is currently available...
            else {
                // ...and if the server one is more recent...
                if (localContact.getProperty("X-GOOGLE-ETAG") !== serverContact.etag) {
                    // Import the server contact information into the local contact.
                    localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
                    localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact, useFakeEmailAddresses);
                    // Update the local contact locally.
                    await targetAddressBook.modifyItem(localContact, true);
                    console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") was updated locally.");
                    // Remove the resource name from the local change log (modified items).
                    targetAddressBook.removeItemFromChangeLog(resourceName);
// FIXME: temporary.
                    // Update the contact group member map.
                    contactGroupMemberMap = AddressBookSynchronizer.updateContactGroupMemberMap(contactGroupMemberMap, resourceName, serverContact.memberships);
                }
            }
        }
        // Prepare the variables for the cycles.
        let addedLocalItemResourceNames = [];
        // Cycle on the locally added contacts.
        console.log("AddressBookSynchronizer.synchronizeContacts(): Cycling on the locally added contacts.");
        for (let localContactId of addedLocalItemIds) {
            // Retrieve the local contact, and make sure such an item is actually valid and not a contact group.
            let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactId);
            if (null == localContact) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Create a new server contact.
            let serverContact = {};
            // Import the local contact information into the server contact.
            serverContact = AddressBookSynchronizer.fillServerContactWithLocalContactInformation(localContact, serverContact, useFakeEmailAddresses);
            // Add the server contact remotely and get the resource name (in the form 'people/personId') and the display name.
            serverContact = await peopleAPI.createContact(serverContact);
            let resourceName = serverContact.resourceName;
            let displayName = (serverContact.names ? serverContact.names[0].displayName : "-");
            console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") was added remotely.");
            // Update the local contact locally.
            localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
            localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
            localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact, useFakeEmailAddresses);
            await targetAddressBook.modifyItem(localContact, true);
            // Add the resource name to the proper array.
            addedLocalItemResourceNames.push(resourceName);
            // Remove the local contact id from the local change log (added items).
            targetAddressBook.removeItemFromChangeLog(localContactId);
        }
        // Cycle on the locally modified contacts.
        console.log("AddressBookSynchronizer.synchronizeContacts(): Cycling on the locally modified contacts.");
        for (let localContactId of modifiedLocalItemIds) {
            // Retrieve the local contact, and make sure such an item is actually valid and not a contact group.
            let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactId);
            if (null == localContact) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Create a new server contact.
            let serverContact = {};
            serverContact.resourceName = localContact.getProperty("X-GOOGLE-RESOURCENAME");
            serverContact.etag = localContact.getProperty("X-GOOGLE-ETAG");
            // Import the local contact information into the server contact.
            serverContact = AddressBookSynchronizer.fillServerContactWithLocalContactInformation(localContact, serverContact, useFakeEmailAddresses);
            // Update the server contact remotely and get the resource name (in the form 'people/personId') and the display name.
            serverContact = await peopleAPI.updateContact(serverContact);
            let resourceName = serverContact.resourceName;
            let displayName = (serverContact.names ? serverContact.names[0].displayName : "-");
            console.log("AddressBookSynchronizer.synchronizeContacts(): " + resourceName + " (" + displayName + ") was updated remotely.");
            // Update the local contact locally.
            localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
            localContact.setProperty("X-GOOGLE-ETAG", serverContact.etag);
            localContact = AddressBookSynchronizer.fillLocalContactWithServerContactInformation(localContact, serverContact, useFakeEmailAddresses);
            await targetAddressBook.modifyItem(localContact, true);
            // Remove the local contact id from the local change log (modified items).
            targetAddressBook.removeItemFromChangeLog(localContactId);
        }
        // Determine all the contacts which were previously deleted remotely and delete them locally.
        console.log("AddressBookSynchronizer.synchronizeContacts(): Determining all the remotely deleted contacts.");
        for (let localContact of targetAddressBook.getAllItems()) {
            // Make sure the item is actually valid and not a contact group.
            if (null == await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContact.getProperty("X-GOOGLE-RESOURCENAME"))) {
                continue;
            }
            if (localContact.isMailList) {
                continue;
            }
            // Get the local contact id and the display name.
            let localContactId = localContact.getProperty("X-GOOGLE-RESOURCENAME");
            let displayName = localContact.getProperty("DisplayName");
            // Check if the local contact id matches any of the locally added contacts.
            if (addedLocalItemResourceNames.includes(localContactId)) {
                continue;
            }
            // Check if the local contact id matches any of the resource names downloaded.
            let localContactFoundAmongServerContacts = false;
            for (let serverContact of serverContacts) {
                if (localContactId === serverContact.resourceName) {
                    localContactFoundAmongServerContacts = true;
                    break;
                }
            }
            if (localContactFoundAmongServerContacts) {
                continue;
            }
            // Delete the local contact locally.
            targetAddressBook.deleteItem(localContact, true);
            console.log("AddressBookSynchronizer.synchronizeContacts(): " + localContactId + " (" + displayName + ") was deleted locally.");
        }
// FIXME: temporary.
        //
        return contactGroupMemberMap;
    }

    static fillLocalContactWithServerContactInformation(localContact, serverContact, useFakeEmailAddresses) {
        if (null == localContact) {
            new Error("Invalid 'localContact': null.");
        }
        if (null == serverContact) {
            new Error("Invalid 'serverContact': null.");
        }
        if (null == useFakeEmailAddresses) {
            new Error("Invalid 'useFakeEmailAddresses': null.");
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
        // Set the nickname.
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
        else if (useFakeEmailAddresses) {
            localContact.setProperty("PrimaryEmail", Date.now() + "." + Math.random() + "@" + FAKE_EMAIL_ADDRESS_DOMAIN);
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
            if (serverContact.birthdays[0] && serverContact.birthdays[0].date && serverContact.birthdays[0].date.month) {
                localContact.setProperty("BirthMonth", serverContact.birthdays[0].date.month);
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].date && serverContact.birthdays[0].date.day) {
                localContact.setProperty("BirthDay", serverContact.birthdays[0].date.day);
            }
            if (serverContact.birthdays[0] && serverContact.birthdays[0].date && serverContact.birthdays[0].date.year) {
                localContact.setProperty("BirthYear", serverContact.birthdays[0].date.year);
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

    static fillServerContactWithLocalContactInformation(localContact, serverContact, useFakeEmailAddresses) {
        if (null == localContact) {
            new Error("Invalid 'localContact': null.");
        }
        if (null == serverContact) {
            new Error("Invalid 'serverContact': null.");
        }
        if (null == useFakeEmailAddresses) {
            new Error("Invalid 'useFakeEmailAddresses': null.");
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
        if ((localContact.getProperty("FirstName")) || (localContact.getProperty("LastName")) || (localContact.getProperty("DisplayName"))) {
            serverContact.names = [];
            serverContact.names[0] = {};
            //
            if (localContact.getProperty("FirstName")) {
                serverContact.names[0].givenName = localContact.getProperty("FirstName");
            }
            if (localContact.getProperty("LastName")) {
                serverContact.names[0].familyName = localContact.getProperty("LastName");
            }
/* Disabled, as names[0].displayName is an output-only field for Google.
            if (localContact.getProperty("DisplayName")) {
                serverContact.names[0].displayName = localContact.getProperty("DisplayName");
            }
*/
        }
        // Set the nickname.
        if (localContact.getProperty("NickName")) {
            serverContact.nicknames = [];
            serverContact.nicknames[0] = {};
            //
            serverContact.nicknames[0].value = localContact.getProperty("NickName");
        }
        // Set the email addresses.
        if ((localContact.getProperty("PrimaryEmail")) || (localContact.getProperty("SecondEmail"))) {
            serverContact.emailAddresses = [];
            let i = 0;
            //
            if (localContact.getProperty("PrimaryEmail")) {
                if (!((localContact.getProperty("PrimaryEmail").endsWith("@" + FAKE_EMAIL_ADDRESS_DOMAIN)) && (useFakeEmailAddresses))) {
                    serverContact.emailAddresses[i] = {};
                    //
                    serverContact.emailAddresses[i].value = localContact.getProperty("PrimaryEmail");
                    serverContact.emailAddresses[i].type = "other";
                    //
                    i++;
                }
            }
            if (localContact.getProperty("SecondEmail")) {
                if (!((localContact.getProperty("SecondEmail").endsWith("@" + FAKE_EMAIL_ADDRESS_DOMAIN)) && (useFakeEmailAddresses))) {
                    serverContact.emailAddresses[i] = {};
                    //
                    serverContact.emailAddresses[i].value = localContact.getProperty("SecondEmail");
                    serverContact.emailAddresses[i].type = "other";
                    //
                    i++;
                }
            }
            //
            if (0 == serverContact.emailAddresses.length) {
                delete serverContact.emailAddresses;
            }
        }
        // Set the phone numbers.
        if ((localContact.getProperty("WorkPhone")) || (localContact.getProperty("HomePhone")) || (localContact.getProperty("FaxNumber")) || (localContact.getProperty("PagerNumber")) || (localContact.getProperty("CellularNumber"))) {
            serverContact.phoneNumbers = [];
            let i = 0;
            //
            if (localContact.getProperty("WorkPhone")) {
                serverContact.phoneNumbers[i] = {};
                //
                serverContact.phoneNumbers[i].value = localContact.getProperty("WorkPhone");
                serverContact.phoneNumbers[i].type = "work";
                //
                i++;
            }
            if (localContact.getProperty("HomePhone")) {
                serverContact.phoneNumbers[i] = {};
                //
                serverContact.phoneNumbers[i].value = localContact.getProperty("HomePhone");
                serverContact.phoneNumbers[i].type = "home";
                //
                i++;
            }
            if (localContact.getProperty("FaxNumber")) {
                serverContact.phoneNumbers[i] = {};
                //
                serverContact.phoneNumbers[i].value = localContact.getProperty("FaxNumber");
                serverContact.phoneNumbers[i].type = "workFax";
                //
                i++;
            }
            if (localContact.getProperty("PagerNumber")) {
                serverContact.phoneNumbers[i] = {};
                //
                serverContact.phoneNumbers[i].value = localContact.getProperty("PagerNumber");
                serverContact.phoneNumbers[i].type = "pager";
                //
                i++;
            }
            if (localContact.getProperty("CellularNumber")) {
                serverContact.phoneNumbers[i] = {};
                //
                serverContact.phoneNumbers[i].value = localContact.getProperty("CellularNumber");
                serverContact.phoneNumbers[i].type = "mobile";
                //
                i++;
            }
        }
        // Set the addresses.
        if ((localContact.getProperty("HomeAddress")) || (localContact.getProperty("HomeAddress2")) || (localContact.getProperty("HomeCity")) || (localContact.getProperty("HomeState")) || (localContact.getProperty("HomeZipCode")) || (localContact.getProperty("HomeCountry")) || (localContact.getProperty("WorkAddress")) || (localContact.getProperty("WorkAddress2")) || (localContact.getProperty("WorkCity")) || (localContact.getProperty("WorkState")) || (localContact.getProperty("WorkZipCode")) || (localContact.getProperty("WorkCountry"))) {
            serverContact.addresses = [];
            let i = 0;
            //
            if ((localContact.getProperty("HomeAddress")) || (localContact.getProperty("HomeAddress2")) || (localContact.getProperty("HomeCity")) || (localContact.getProperty("HomeState")) || (localContact.getProperty("HomeZipCode")) || (localContact.getProperty("HomeCountry"))) {
                serverContact.addresses[i] = {};
                //
                if (localContact.getProperty("HomeAddress")) {
                    serverContact.addresses[i].streetAddress = localContact.getProperty("HomeAddress");
                }
                if (localContact.getProperty("HomeAddress2")) {
                    serverContact.addresses[i].extendedAddress = localContact.getProperty("HomeAddress2");
                }
                if (localContact.getProperty("HomeCity")) {
                    serverContact.addresses[i].city = localContact.getProperty("HomeCity");
                }
                if (localContact.getProperty("HomeState")) {
                    serverContact.addresses[i].region = localContact.getProperty("HomeState");
                }
                if (localContact.getProperty("HomeZipCode")) {
                    serverContact.addresses[i].postalCode = localContact.getProperty("HomeZipCode");
                }
                if (localContact.getProperty("HomeCountry")) {
                    serverContact.addresses[i].country = localContact.getProperty("HomeCountry");
                }
                //
                serverContact.addresses[i].type = "home";
                //
                i++;
            }
            if ((localContact.getProperty("WorkAddress")) || (localContact.getProperty("WorkAddress2")) || (localContact.getProperty("WorkCity")) || (localContact.getProperty("WorkState")) || (localContact.getProperty("WorkZipCode")) || (localContact.getProperty("WorkCountry"))) {
                serverContact.addresses[i] = {};
                //
                if (localContact.getProperty("WorkAddress")) {
                    serverContact.addresses[i].streetAddress = localContact.getProperty("WorkAddress");
                }
                if (localContact.getProperty("WorkAddress2")) {
                    serverContact.addresses[i].extendedAddress = localContact.getProperty("WorkAddress2");
                }
                if (localContact.getProperty("WorkCity")) {
                    serverContact.addresses[i].city = localContact.getProperty("WorkCity");
                }
                if (localContact.getProperty("WorkState")) {
                    serverContact.addresses[i].region = localContact.getProperty("WorkState");
                }
                if (localContact.getProperty("WorkZipCode")) {
                    serverContact.addresses[i].postalCode = localContact.getProperty("WorkZipCode");
                }
                if (localContact.getProperty("WorkCountry")) {
                    serverContact.addresses[i].country = localContact.getProperty("WorkCountry");
                }
                //
                serverContact.addresses[i].type = "work";
                //
                i++;
            }
        }
        // Set the work information.
        if ((localContact.getProperty("Company")) || (localContact.getProperty("JobTitle")) || (localContact.getProperty("Department"))) {
            serverContact.organizations = [];
            serverContact.organizations[0] = {};
            //
            if (localContact.getProperty("Company")) {
                serverContact.organizations[0].name = localContact.getProperty("Company");
            }
            if (localContact.getProperty("JobTitle")) {
                serverContact.organizations[0].title = localContact.getProperty("JobTitle");
            }
            if (localContact.getProperty("Department")) {
                serverContact.organizations[0].department = localContact.getProperty("Department");
            }
        }
        // Set the webpages.
        if ((localContact.getProperty("WebPage1")) || (localContact.getProperty("WebPage2"))) {
            serverContact.urls = [];
            let i = 0;
            //
            if (localContact.getProperty("WebPage1")) {
                serverContact.urls[i] = {};
                //
                serverContact.urls[i].value = localContact.getProperty("WebPage1");
                serverContact.urls[i].type = "work";
                //
                i++;
            }
            if (localContact.getProperty("WebPage2")) {
                serverContact.urls[i] = {};
                //
                serverContact.urls[i].value = localContact.getProperty("WebPage2");
                serverContact.urls[i].type = "other";
                //
                i++;
            }
        }
        // Set the birthday.
        if ((localContact.getProperty("BirthMonth")) || (localContact.getProperty("BirthDay")) || (localContact.getProperty("BirthYear"))) {
            serverContact.birthdays = [];
            serverContact.birthdays[0] = {};
            serverContact.birthdays[0].date = {};
            //
            if (localContact.getProperty("BirthMonth")) {
                serverContact.birthdays[0].date.month = localContact.getProperty("BirthMonth");
            }
            if (localContact.getProperty("BirthDay")) {
                serverContact.birthdays[0].date.day = localContact.getProperty("BirthDay");
            }
            if (localContact.getProperty("BirthYear")) {
                serverContact.birthdays[0].date.year = localContact.getProperty("BirthYear");
            }
        }
        // Set the custom fields.
        if ((localContact.getProperty("Custom1")) || (localContact.getProperty("Custom2")) || (localContact.getProperty("Custom3")) || (localContact.getProperty("Custom4"))) {
            serverContact.userDefined = [];
            let i = 0;
            //
            if (localContact.getProperty("Custom1")) {
                serverContact.userDefined[i] = {};
                //
                serverContact.userDefined[i].value = localContact.getProperty("Custom1");
                serverContact.userDefined[i].key = "Custom" + i;
                //
                i++;
            }
            if (localContact.getProperty("Custom2")) {
                serverContact.userDefined[i] = {};
                //
                serverContact.userDefined[i].value = localContact.getProperty("Custom2");
                serverContact.userDefined[i].key = "Custom" + i;
                //
                i++;
            }
            if (localContact.getProperty("Custom3")) {
                serverContact.userDefined[i] = {};
                //
                serverContact.userDefined[i].value = localContact.getProperty("Custom3");
                serverContact.userDefined[i].key = "Custom" + i;
                //
                i++;
            }
            if (localContact.getProperty("Custom4")) {
                serverContact.userDefined[i] = {};
                //
                serverContact.userDefined[i].value = localContact.getProperty("Custom4");
                serverContact.userDefined[i].key = "Custom" + i;
                //
                i++;
            }
        }
        // Set the IM usernames.
        if ((localContact.getProperty("_GoogleTalk")) || (localContact.getProperty("_AimScreenName")) || (localContact.getProperty("_Yahoo")) || (localContact.getProperty("_Skype")) || (localContact.getProperty("_QQ")) || (localContact.getProperty("_MSN")) || (localContact.getProperty("_ICQ")) || (localContact.getProperty("_JabberId"))) {
            serverContact.imClients = [];
            let i = 0;
            //
            if (localContact.getProperty("_GoogleTalk")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_GoogleTalk");
                serverContact.imClients[i].protocol = "googleTalk";
                //
                i++;
            }
            if (localContact.getProperty("_AimScreenName")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_AimScreenName");
                serverContact.imClients[i].protocol = "aim";
                //
                i++;
            }
            if (localContact.getProperty("_Yahoo")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_Yahoo");
                serverContact.imClients[i].protocol = "yahoo";
                //
                i++;
            }
            if (localContact.getProperty("_Skype")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_Skype");
                serverContact.imClients[i].protocol = "skype";
                //
                i++;
            }
            if (localContact.getProperty("_QQ")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_QQ");
                serverContact.imClients[i].protocol = "qq";
                //
                i++;
            }
            if (localContact.getProperty("_MSN")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_MSN");
                serverContact.imClients[i].protocol = "msn";
                //
                i++;
            }
            if (localContact.getProperty("_ICQ")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_ICQ");
                serverContact.imClients[i].protocol = "icq";
                //
                i++;
            }
            if (localContact.getProperty("_JabberId")) {
                serverContact.imClients[i] = {};
                //
                serverContact.imClients[i].username = localContact.getProperty("_JabberId");
                serverContact.imClients[i].protocol = "jabber";
                //
                i++;
            }
        }
        // Set the notes.
        if (localContact.getProperty("Notes")) {
            serverContact.biographies = [];
            serverContact.biographies[0] = {};
            //
            serverContact.biographies[0].value = localContact.getProperty("Notes");
        }
        //
        return serverContact;
    }

    /* Contact group member synchronization. */

    static async synchronizeContactGroupMembers(contactGroupMemberMap, targetAddressBook) { // https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Address_Book_Examples
        if (null == contactGroupMemberMap) {
            new Error("Invalid 'contactGroupMemberMap': null.");
        }
        if (null == targetAddressBook) {
            new Error("Invalid 'targetAddressBook': null.");
        }
// FIXME: temporary (Google-to-Thunderbird only synchronization).
        // Cycle on the local contact groups.
        console.log("AddressBookSynchronizer.synchronizeContactGroupMembers(): Determining all the members for each contact group.");
        for (let localContactGroup of targetAddressBook.getAllItems()) {
            // Make sure the item is actually valid and a real contact group.
            if (null == await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", localContactGroup.getProperty("X-GOOGLE-RESOURCENAME"))) {
                continue;
            }
            if (!localContactGroup.isMailList) {
                continue;
            }
            // Retrieve the local contact group directory.
            let abManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
            let localContactGroupDirectory = abManager.getDirectory(localContactGroup._card.mailListURI);
            // Clear the local contact group.
//console.log("localContactGroupDirectory = " + localContactGroupDirectory); // FIXME
//console.log("localContactGroupDirectory.childCards = " + localContactGroupDirectory.childCards); // FIXME
// FIXME: temporary.
            if (undefined !== localContactGroupDirectory.childCards) {
                while (0 < localContactGroupDirectory.childCards.length) {
//console.log("del"); // FIXME
                    localContactGroupDirectory.childCards.pop();
                }
            }
            // Fill the local contact group with the server contact group members.
//console.log("contactGroupResourceName = " + localContactGroup.getProperty("X-GOOGLE-RESOURCENAME")); // FIXME
//console.log(contactGroupMemberMap); // FIXME
// FIXME: temporary.
            let contactResourceNames = contactGroupMemberMap.get(localContactGroup.getProperty("X-GOOGLE-RESOURCENAME"));
            if (undefined !== contactResourceNames) {
                for (let contactResourceName of contactResourceNames) {
//console.log("contactResourceName = " + contactResourceName); // FIXME
                    let localContact = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", contactResourceName);
                    localContactGroupDirectory.addCard(localContact._card);
                }
                localContactGroupDirectory.editMailListToDatabase(localContactGroup);
            }
        }
    }

    static updateContactGroupMemberMap(contactGroupMemberMap, contactResourceName, contactMemberships) {
        if (null == contactGroupMemberMap) {
            new Error("Invalid 'contactGroupMemberMap': null.");
        }
        if (null == contactResourceName) {
            new Error("Invalid 'contactResourceName': null.");
        }
        if (null == contactMemberships) {
            new Error("Invalid 'contactMemberships': null.");
        }
        // Cycle on all contact memberships.
        for (let contactMembership of contactMemberships) {
            // Retrieve the contact group resource name.
            let contactGroupResourceName = contactMembership.contactGroupMembership.contactGroupResourceName;
            // If such a contact group is not already in the map, add it and its contact array.
            if (null == contactGroupMemberMap.get(contactGroupResourceName)) {
                contactGroupMemberMap.set(contactGroupResourceName, []);
            }
            // Add the contact to the map.
            contactGroupMemberMap.get(contactGroupResourceName).push(contactResourceName);
        }
        //
        return contactGroupMemberMap;
    }

    /* Change log. */

    static async fixChangeLog(targetAddressBook) {
        if (null == targetAddressBook) {
            new Error("Invalid 'targetAddressBook': null.");
        }
        // Cycle on all the items in the change log.
        console.log("AddressBookSynchronizer.synchronize(): Fixing the change log.");
        for (let item of targetAddressBook.getItemsFromChangeLog()) {
            // Retrieve the item id.
            let itemId = item.itemId;
            // Try to match the item locally.
            let localItem = await targetAddressBook.getItemFromProperty("X-GOOGLE-RESOURCENAME", itemId);
            // If it is not a valid local item...
            if (null == localItem) {
                // Remove the item id from the change log.
                await targetAddressBook.removeItemFromChangeLog(itemId);
                console.log("AddressBookSynchronizer.fixChangeLog(): " + itemId + " was removed from the change log.");
            }
        }
    }

}
