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
                    let localContact = targetAddressBook.createNewCard();
                    localContact.setProperty("X-GOOGLE-RESOURCENAME", resourceName);
                    if (serverContact.names && serverContact.names[0] && serverContact.names[0].givenName) {
                        localContact.setProperty("FirstName", serverContact.names[0].givenName);
                    }
                    if (serverContact.names && serverContact.names[0] && serverContact.names[0].familyName) {
                        localContact.setProperty("LastName", serverContact.names[0].familyName);
                    }
                    if (serverContact.names && serverContact.names[0] && serverContact.names[0].displayName) {
                        localContact.setProperty("DisplayName", serverContact.names[0].displayName);
                    }
                    if (serverContact.emailAddresses && serverContact.emailAddresses[0] && serverContact.emailAddresses[0].value) {
                        localContact.setProperty("PrimaryEmail", serverContact.emailAddresses[0].value);
                    }
                    if (serverContact.emailAddresses && serverContact.emailAddresses[1] && serverContact.emailAddresses[1].value) {
                        localContact.setProperty("SecondEmail", serverContact.emailAddresses[1].value);
                    }
// TODO: phone numbers, addresses
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
