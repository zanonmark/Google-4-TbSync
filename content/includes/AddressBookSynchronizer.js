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
        let serverContacts = await peopleAPI.getContactList();
        // Prepare the variables for the cycles.
        let deletedServerContacts = [];
        let deletedLocalContacts = [];
        // Cycle on the server contacts.
        for (let serverContact in serverContacts) {
            // TODO: get contactId
            // TODO: if contact(contactId) not in targetAddressBook
            // TODO:   if contactId not in deletedLocalContacts
            // TODO:     add it
            // TODO: else
            // TODO:   if contact(contactId) newer than the one in targetAddressBook
            // TODO:     update it
        }
        // Cycle on the local contacts.
        // TODO
    }

}
