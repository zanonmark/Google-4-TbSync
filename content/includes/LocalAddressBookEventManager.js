/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

class LocalAddressBookEventManager {

/* FIXME: disabled as it is still not fully supported.
    _localAddressBookEventMap = null;
    _disabledAddressBookIdSet = null;
*/

    /* */

    constructor() {
        // Initialize the local address book map.
        this._localAddressBookEventMap = new Map();
        // Initialize the disabled address book id set.
        this._disabledAddressBookIdSet = new Set();
    }

    /* Event disabling. */

    enableEvents(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the disabled address book id set.
        this._disabledAddressBookIdSet.delete(addressBookId);
    }

    disableEvents(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the disabled address book id set.
        this._disabledAddressBookIdSet.add(addressBookId);
    }

    /* Event listeners. */

    onContactCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onCreated", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").add(contactId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    onContactUpdated(node, changedProperties) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        if (null == changedProperties) {
            throw new IllegalArgumentError("Invalid 'changedProperties': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").has(contactId))) {
            return;
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onUpdated", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").add(contactId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    onContactDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the ids.
        let contactId = id;
        let addressBookId = parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").delete(contactId);
            //
            newItemRequired = false;
        }
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated")) && (this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").delete(contactId);
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onDeleted", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted").add(contactId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    onMailingListCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onCreated", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").add(mailingListId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    onMailingListUpdated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").has(mailingListId))) {
            return;
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onUpdated", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").add(mailingListId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    onMailingListDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the ids.
        let mailingListId = id;
        let addressBookId = parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").has(mailingListId))) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").delete(mailingListId);
            //
            newItemRequired = false;
        }
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated")) && (this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").has(mailingListId))) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").delete(mailingListId);
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onDeleted", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted").add(mailingListId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    async onMailingListMemberAdded(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let mailingListId = node.parentId;
        let addressBookId = (await messenger.contacts.get(contactId)).parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) {
            this._localAddressBookEventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberAdded", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").add(contactId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    async onMailingListMemberRemoved(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the ids.
        let contactId = id;
        let mailingListId = parentId;
        let addressBookId = (await messenger.mailingLists.get(mailingListId)).parentId;
        // Determine if events are currently disabled for the addressbook.
        if (this._disabledAddressBookIdSet.has(addressBookId)) {
            return;
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the local address book map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) {
            this._localAddressBookEventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberRemoved", new Set());
        }
        // Update the local address book map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").add(contactId);
        }
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    /* Event management. */

    getCreatedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getUpdatedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getDeletedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getCreatedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getUpdatedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getDeletedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getAddedMailingListMemberIdSet(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    getRemovedMailingListMemberIdSet(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the id set.
        let idSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved"))) {
            for (let key of this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").keys()) {
                idSet.add(key);
            }
        }
        //
        return idSet;
    }

    clearEvents(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the local address book map.
        this._localAddressBookEventMap.delete(addressBookId);
        // Save the local address book map.
        this.saveLocalAddressBookEventMap();
    }

    /* I/O. */

    async loadLocalAddressBookEventMap() {
        // Search for a previous local address book map in the local storage.
        let { localAddressBookEventMap } = await messenger.storage.local.get({ localAddressBookEventMap: undefined });
        // If such a previous local address book map is found...
        if (undefined !== localAddressBookEventMap) {
            // Assign it to the current local address book map.
            this._localAddressBookEventMap = localAddressBookEventMap;
        }
    }

    async saveLocalAddressBookEventMap() {
        // Save the local address book map to the local storage.
        await messenger.storage.local.set({ localAddressBookEventMap: this._localAddressBookEventMap });
    }

}

var localAddressBookEventManager = new LocalAddressBookEventManager();
localAddressBookEventManager.loadLocalAddressBookEventMap();