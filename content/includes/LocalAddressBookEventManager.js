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

/* FIXME: disabled as it is not fully supported yet.
    _localAddressBookEventMap = null;
    _localAddressBookSynchronizationModeSet = null;
*/

    /* */

    constructor() {
        // Initialize the local address book event map.
        this._localAddressBookEventMap = new Map();
        // Initialize the local address book synchronization mode set.
        this._localAddressBookSynchronizationModeSet = new Set();
    }

    /* Event listeners. */

    async onContactCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addContactCreatedEventData(addressBookId, contactId);
        }
    }

    async onContactUpdated(node, changedProperties) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        if (null == changedProperties) {
            throw new IllegalArgumentError("Invalid 'changedProperties': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let addressBookId = node.parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addContactUpdatedEventData(addressBookId, contactId);
        }
    }

    async onContactDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the ids.
        let contactId = id;
        let addressBookId = parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addContactDeletedEventData(addressBookId, contactId);
        }
    }

    async onMailingListCreated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addMailingListCreatedEventData(addressBookId, mailingListId);
        }
    }

    async onMailingListUpdated(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let mailingListId = node.id;
        let addressBookId = node.parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addMailingListUpdatedEventData(addressBookId, mailingListId);
        }
    }

    async onMailingListDeleted(parentId, id) {
        if ((null == parentId) || ("" === parentId)) {
            throw new IllegalArgumentError("Invalid 'parentId': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Get the ids.
        let mailingListId = id;
        let addressBookId = parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addMailingListDeletedEventData(addressBookId, mailingListId);
        }
    }

    async onMailingListMemberAdded(node) {
        if (null == node) {
            throw new IllegalArgumentError("Invalid 'node': null.");
        }
        // Get the ids.
        let contactId = node.id;
        let mailingListId = node.parentId;
        let addressBookId = (await messenger.mailingLists.get(mailingListId)).parentId;
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addMailingListMemberAddedEventData(addressBookId, mailingListId, contactId);
        }
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
        let addressBookId = undefined;
        try {
            addressBookId = (await messenger.mailingLists.get(mailingListId)).parentId;
        }
        catch (error) {
            return;
        }
        // Add the event data to the local addressbook event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.addMailingListMemberRemovedEventData(addressBookId, mailingListId, contactId);
        }
    }

    /* Synchronization mode. */

    async enableSynchronizationMode(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the local address book synchronization mode set.
        this._localAddressBookSynchronizationModeSet.add(addressBookId);
    }

    async disableSynchronizationMode(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the local address book synchronization mode set.
        this._localAddressBookSynchronizationModeSet.delete(addressBookId);
        // Save the local address book event map.
        await this.saveLocalAddressBookEventMap();
    }

    /* Event data. */

    async clearEventData(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the local address book event map.
        this._localAddressBookEventMap.delete(addressBookId);
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addContactCreatedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onCreated", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").add(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearContactCreatedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated"))) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").delete(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addContactUpdatedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").has(contactId))) {
            return;
        }
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onUpdated", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").add(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearContactUpdatedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated"))) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").delete(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addContactDeletedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
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
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted")) {
            this._localAddressBookEventMap.get(addressBookId).set("contacts.onDeleted", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted").add(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearContactDeletedEventData(addressBookId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted"))) {
            this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted").delete(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addMailingListCreatedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onCreated", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").add(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearMailingListCreatedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated"))) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").delete(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addMailingListUpdatedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated")) && (this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").has(mailingListId))) {
            return;
        }
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onUpdated", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").add(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearMailingListUpdatedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated"))) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").delete(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addMailingListDeletedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
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
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted")) {
            this._localAddressBookEventMap.get(addressBookId).set("mailingLists.onDeleted", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted").add(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearMailingListDeletedEventData(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted"))) {
            this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted").delete(mailingListId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addMailingListMemberAddedEventData(addressBookId, mailingListId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) {
            this._localAddressBookEventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberAdded", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").add(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearMailingListMemberAddedEventData(addressBookId, mailingListId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded"))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").delete(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async addMailingListMemberRemovedEventData(addressBookId, mailingListId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        // Prepare the new item flag.
        let newItemRequired = true;
        // Synchronize with other events for the same ids.
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded")) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").has(contactId))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").delete(contactId);
            //
            newItemRequired = false;
        }
        // Prepare the local address book event map.
        if (undefined === this._localAddressBookEventMap.get(addressBookId)) {
            this._localAddressBookEventMap.set(addressBookId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) {
            this._localAddressBookEventMap.get(addressBookId).set(mailingListId, new Map());
        }
        if (undefined === this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved")) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).set("mailingLists.onMemberRemoved", new Set());
        }
        // Update the local address book event map.
        if (newItemRequired) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").add(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    async clearMailingListMemberRemovedEventData(addressBookId, mailingListId, contactId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        if ((null == contactId) || ("" === contactId)) {
            throw new IllegalArgumentError("Invalid 'contactId': null or empty.");
        }
        //
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved"))) {
            this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").delete(contactId);
        }
        // Save the local address book event map (if not in synchronization mode).
        if (!this._localAddressBookSynchronizationModeSet.has(addressBookId)) {
            await this.saveLocalAddressBookEventMap();
        }
    }

    /* Synchronization structures. */

    getCreatedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the created contact id set.
        let createdContactIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated"))) {
            for (let contactId of this._localAddressBookEventMap.get(addressBookId).get("contacts.onCreated").keys()) {
                createdContactIdSet.add(contactId);
            }
        }
        //
        return createdContactIdSet;
    }

    getUpdatedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the updated contact id set.
        let updatedContactIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated"))) {
            for (let contactId of this._localAddressBookEventMap.get(addressBookId).get("contacts.onUpdated").keys()) {
                updatedContactIdSet.add(contactId);
            }
        }
        //
        return updatedContactIdSet;
    }

    getDeletedContactIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the deleted contact id set.
        let deletedContactIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted"))) {
            for (let contactId of this._localAddressBookEventMap.get(addressBookId).get("contacts.onDeleted").keys()) {
                deletedContactIdSet.add(contactId);
            }
        }
        //
        return deletedContactIdSet;
    }

    getCreatedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the created mailing-list id set.
        let createdMailingListIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated"))) {
            for (let mailingListId of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onCreated").keys()) {
                createdMailingListIdSet.add(mailingListId);
            }
        }
        //
        return createdMailingListIdSet;
    }

    getUpdatedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the updated mailing-list id set.
        let updatedMailingListIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated"))) {
            for (let mailingListId of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onUpdated").keys()) {
                updatedMailingListIdSet.add(mailingListId);
            }
        }
        //
        return updatedMailingListIdSet;
    }

    getDeletedMailingListIdSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the deleted mailing-list id set.
        let deletedMailingListIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted"))) {
            for (let mailingListId of this._localAddressBookEventMap.get(addressBookId).get("mailingLists.onDeleted").keys()) {
                deletedMailingListIdSet.add(mailingListId);
            }
        }
        //
        return deletedMailingListIdSet;
    }

    getAddedMailingListMemberIdSet(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the added mailing-list member id set.
        let addedMailingListMemberIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded"))) {
            for (let contactId of this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberAdded").keys()) {
                addedMailingListMemberIdSet.add(contactId);
            }
        }
        //
        return addedMailingListMemberIdSet;
    }

    getRemovedMailingListMemberIdSet(addressBookId, mailingListId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == mailingListId) || ("" === mailingListId)) {
            throw new IllegalArgumentError("Invalid 'mailingListId': null or empty.");
        }
        // Prepare the removed mailing-list member id set.
        let removedMailingListMemberIdSet = new Set();
        if ((undefined !== this._localAddressBookEventMap.get(addressBookId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId)) && (undefined !== this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved"))) {
            for (let contactId of this._localAddressBookEventMap.get(addressBookId).get(mailingListId).get("mailingLists.onMemberRemoved").keys()) {
                removedMailingListMemberIdSet.add(contactId);
            }
        }
        //
        return removedMailingListMemberIdSet;
    }

    /* I/O. */

    async loadLocalAddressBookEventMap() {
        // Search for a previous local address book event map in the local storage.
        let { localAddressBookEventMap } = await messenger.storage.local.get({ localAddressBookEventMap: undefined });
        // If such a previous local address book event map is found...
        if (undefined !== localAddressBookEventMap) {
            // Assign it to the current local address book event map.
            this._localAddressBookEventMap = localAddressBookEventMap;
        }
    }

    async saveLocalAddressBookEventMap() {
        // Save the local address book event map to the local storage.
        await messenger.storage.local.set({ localAddressBookEventMap: this._localAddressBookEventMap });
    }

}

var localAddressBookEventManager = new LocalAddressBookEventManager();
(async () => {
    await localAddressBookEventManager.loadLocalAddressBookEventMap();
})();
