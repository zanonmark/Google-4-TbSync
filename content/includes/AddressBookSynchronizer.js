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
console.log("synchronize()"); // FIXME
        // Create a new PeopleAPI object.
        let peopleAPI = new PeopleAPI(syncData.accountData);
        // Retrieve the target address book.
        let targetAddressBook = syncData.target;
    }

}
