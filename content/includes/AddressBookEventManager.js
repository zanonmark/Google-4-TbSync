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

/* FIXME: disabled as it is still not fully supported.
    _addressBookEventMap = null;
*/

    /* */

    constructor() {
        this._addressBookEventMap = new Map();
    }

    /* Event listeners. */

    onContactCreated(node, id) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
/* FIXME: disabled because 'id' seems to always be undefined (?!).
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
*/
        //
        let addressBookId = node.parentId;
        let contactId = node.id;
        //
        if (undefined === this._addressBookEventMap.get(addressBookId)) {
            this._addressBookEventMap.set(addressBookId, new Map());
        }
        //
        if (undefined === this._addressBookEventMap.get(addressBookId).get("contacts.created")) {
            this._addressBookEventMap.get(addressBookId).set("contacts.created", new Set());
        }
        //
        this._addressBookEventMap.get(addressBookId).get("contacts.created").add(contactId);
    }

    onContactUpdated(node, changedProperties) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        if (null == changedProperties) {
            throw new IllegalArgumentError("Invalid 'changedProperties': null.");
        }
        //
        let addressBookId = node.parentId;
        let contactId = node.id;
        //
// FIXME: first check that 'contactId' is not already in the 'contacts.created' map.
        if (undefined === this._addressBookEventMap.get(addressBookId)) {
            this._addressBookEventMap.set(addressBookId, new Map());
        }
        //
        if (undefined === this._addressBookEventMap.get(addressBookId).get("contacts.updated")) {
            this._addressBookEventMap.get(addressBookId).set("contacts.updated", new Set());
        }
        //
        this._addressBookEventMap.get(addressBookId).get("contacts.updated").add(contactId);
    }

    onContactDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
        let addressBookId = parentId;
        let contactId = id;
        //
// FIXME: first check that 'contactId' is not already in the 'contacts.created' or 'contacts.updated' maps.
        if (undefined === this._addressBookEventMap.get(addressBookId)) {
            this._addressBookEventMap.set(addressBookId, new Map());
        }
        //
        if (undefined === this._addressBookEventMap.get(addressBookId).get("contacts.deleted")) {
            this._addressBookEventMap.get(addressBookId).set("contacts.deleted", new Set());
        }
        //
        this._addressBookEventMap.get(addressBookId).get("contacts.deleted").add(contactId);
    }

    onMailingListCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
// TODO.
    }

    onMailingListUpdated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
// TODO.
    }

    onMailingListDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
// TODO.
    }

    onMailingListMemberAdded(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
// TODO.
    }

    onMailingListMemberRemoved(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
// TODO.
    }

}

var addressBookEventManager = new AddressBookEventManager();