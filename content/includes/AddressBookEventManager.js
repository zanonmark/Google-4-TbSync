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
        let contactId = node.id;
        //
        if (undefined === this._addressBookEventMap.get("contacts.onCreated")) {
            this._addressBookEventMap.set("contacts.onCreated", new Set());
        }
        //
        this._addressBookEventMap.get("contacts.onCreated").add(contactId);
    }

    onContactUpdated(node, changedProperties) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        if (null == changedProperties) {
            throw new IllegalArgumentError("Invalid 'changedProperties': null.");
        }
        //
        let contactId = node.id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("contacts.onUpdated")) {
            this._addressBookEventMap.set("contacts.onUpdated", new Set());
        }
        //
        this._addressBookEventMap.get("contacts.onUpdated").add(contactId);
    }

    onContactDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
        let contactId = id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("contacts.onDeleted")) {
            this._addressBookEventMap.set("contacts.onDeleted", new Set());
        }
        //
        this._addressBookEventMap.get("contacts.onDeleted").add(contactId);
    }

    onMailingListCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
        let mailingListId = node.id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("mailingLists.onCreated")) {
            this._addressBookEventMap.set("mailingLists.onCreated", new Set());
        }
        //
        this._addressBookEventMap.get("mailingLists.onCreated").add(mailingListId);
    }

    onMailingListUpdated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
        let mailingListId = node.id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("mailingLists.onUpdated")) {
            this._addressBookEventMap.set("mailingLists.onUpdated", new Set());
        }
        //
        this._addressBookEventMap.get("mailingLists.onUpdated").add(mailingListId);
    }

    onMailingListDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
        let mailingListId = id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("mailingLists.onDeleted")) {
            this._addressBookEventMap.set("mailingLists.onDeleted", new Set());
        }
        //
        this._addressBookEventMap.get("mailingLists.onDeleted").add(mailingListId);
    }

    onMailingListMemberAdded(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        //
        let mailingListId = node.parentId;
        let contactId = node.id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("mailingLists.onMemberAdded")) {
            this._addressBookEventMap.set("mailingLists.onMemberAdded", new Map());
        }
        if (undefined === this._addressBookEventMap.get("mailingLists.onMemberAdded").get(mailingListId)) {
            this._addressBookEventMap.get("mailingLists.onMemberAdded").set(mailingListId, new Set());
        }
        //
        this._addressBookEventMap.get("mailingLists.onMemberAdded").get(mailingListId).add(contactId);
    }

    onMailingListMemberRemoved(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        //
        let mailingListId = parentId;
        let contactId = id;
        //
// FIXME / TODO: check for possible conflicts with other listeners.
        if (undefined === this._addressBookEventMap.get("mailingLists.onMemberRemoved")) {
            this._addressBookEventMap.set("mailingLists.onMemberRemoved", new Map());
        }
        if (undefined === this._addressBookEventMap.get("mailingLists.onMemberRemoved").get(mailingListId)) {
            this._addressBookEventMap.get("mailingLists.onMemberRemoved").set(mailingListId, new Set());
        }
        //
        this._addressBookEventMap.get("mailingLists.onMemberRemoved").get(mailingListId).add(contactId);
    }

}

var addressBookEventManager = new AddressBookEventManager();