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
    _eventMap = null;
*/

    /* */

    constructor() {
        // Initialize the event map.
        this._eventMap = new Map();
    }

    /* Event listeners. */

    onContactCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the id(s).
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("contacts.onCreated")) {
            this._eventMap.get(addressBookId).set("contacts.onCreated", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("contacts.onCreated").add(contactId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    onContactUpdated(node, changedProperties) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        if (null == changedProperties) {
            throw new IllegalArgumentError("Invalid 'changedProperties': null.");
        }
        // Get the id(s).
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("contacts.onCreated")) && (this._eventMap.get(addressBookId).get("contacts.onCreated").has(contactId))) {
            return;
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("contacts.onUpdated")) {
            this._eventMap.get(addressBookId).set("contacts.onUpdated", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("contacts.onUpdated").add(contactId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    onContactDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the id(s).
        let contactId = id;
        let addressBookId = parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("contacts.onCreated")) && (this._eventMap.get(addressBookId).get("contacts.onCreated").has(contactId))) {
            this._eventMap.get(addressBookId).get("contacts.onCreated").delete(contactId);
            //
            newItemRequired = false;
        }
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("contacts.onUpdated")) && (this._eventMap.get(addressBookId).get("contacts.onUpdated").has(contactId))) {
            this._eventMap.get(addressBookId).get("contacts.onUpdated").delete(contactId);
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("contacts.onDeleted")) {
            this._eventMap.get(addressBookId).set("contacts.onDeleted", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("contacts.onDeleted").add(contactId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    onMailingListCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the id(s).
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("mailingLists.onCreated")) {
            this._eventMap.get(addressBookId).set("mailingLists.onCreated", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("mailingLists.onCreated").add(mailingListId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    onMailingListUpdated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the id(s).
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("mailingLists.onCreated")) && (this._eventMap.get(addressBookId).get("mailingLists.onCreated").has(mailingListId))) {
            return;
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("mailingLists.onUpdated")) {
            this._eventMap.get(addressBookId).set("mailingLists.onUpdated", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("mailingLists.onUpdated").add(mailingListId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    onMailingListDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the id(s).
        let mailingListId = id;
        let addressBookId = parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("mailingLists.onCreated")) && (this._eventMap.get(addressBookId).get("mailingLists.onCreated").has(mailingListId))) {
            this._eventMap.get(addressBookId).get("mailingLists.onCreated").delete(mailingListId);
            //
            newItemRequired = false;
        }
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get("mailingLists.onUpdated")) && (this._eventMap.get(addressBookId).get("mailingLists.onUpdated").has(mailingListId))) {
            this._eventMap.get(addressBookId).get("mailingLists.onUpdated").delete(mailingListId);
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get("mailingLists.onDeleted")) {
            this._eventMap.get(addressBookId).set("mailingLists.onDeleted", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get("mailingLists.onDeleted").add(mailingListId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    async onMailingListMemberAdded(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the id(s).
        let contactId = node.id;
        let mailingListId = node.parentId;
        let addressBookId = (await messenger.contacts.get(contactId)).parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").has(contactId))) {
            this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get(mailingListId)) {
            this._eventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) {
            this._eventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberAdded", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").add(contactId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    async onMailingListMemberRemoved(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the id(s).
        let contactId = id;
        let mailingListId = parentId;
        let addressBookId = (await messenger.contacts.get(contactId)).parentId;
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same id(s).
        if ((undefined !== this._eventMap.get(addressBookId)) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) && (undefined !== this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").has(contactId))) {
            this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the event map.
        if (undefined === this._eventMap.get(addressBookId)) {
            this._eventMap.set(addressBookId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get(mailingListId)) {
            this._eventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) {
            this._eventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberRemoved", new Set());
        }
        // Update the event map.
        if (newItemRequired) {
            this._eventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").add(contactId);
        }
        // Save the event map.
        this.saveEventMap();
    }

    /* I/O. */

    async loadEventMap() {
        // Search for a previous event map in the local storage.
        let { eventMap } = await messenger.storage.local.get({ eventMap: undefined });
        // If such a previous event map is found...
        if (undefined !== eventMap) {
            // Assign it to the current event map.
            this._eventMap = eventMap;
        }
    }

    async saveEventMap() {
        // Save the event map to the local storage.
        await messenger.storage.local.set({ eventMap: this._eventMap });
    }

}

var addressBookEventManager = new AddressBookEventManager();
addressBookEventManager.loadEventMap();