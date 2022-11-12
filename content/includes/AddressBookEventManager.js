/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

class AddressBookEventManager {

    /* Event listeners. */

    onContactCreated(parentId, id) {
// FIXME
console.log("MZ: contacts.onCreated: " + parentId + " " + id);
    }

    onContactUpdated(node, changedProperties) {
// FIXME
console.log("MZ: contacts.onUpdated: " + node + " " + changedProperties);
    }

    onContactDeleted(parentId, id) {
// FIXME
console.log("MZ: contacts.onDeleted: " + parentId + " " + id);
    }

    onMailingListCreated(node) {
// FIXME
console.log("MZ: mailingLists.onCreated: " + node);
    }

    onMailingListUpdated(node) {
// FIXME
console.log("MZ: mailingLists.onUpdated: " + node);
    }

    onMailingListDeleted(parentId, id) {
// FIXME
console.log("MZ: mailingLists.onDeleted: " + parentId + " " + id);
    }

    onMailingListMemberAdded(node) {
// FIXME
console.log("MZ: mailingLists.onMemberAdded: " + node);
    }

    onMailingListMemberRemoved(parentId, id) {
// FIXME
console.log("MZ: mailingLists.onMemberRemoved: " + parentId + " " + id);
    }

}

var addressBookEventManager = new AddressBookEventManager();