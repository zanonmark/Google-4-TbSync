/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

class LocalAddressBookItemExtraPropertyManager {

/* FIXME: disabled as it is not fully supported yet.
    _localAddressBookItemExtraPropertyMap = null;
*/

    /* */

    constructor() {
        // Initialize the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap = new Map();
    }

    /* Properties. */

    setItemExtraProperties(addressBookId, itemId, itemResourceName, itemEtag) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == itemId) || ("" === itemId)) {
            throw new IllegalArgumentError("Invalid 'itemId': null or empty.");
        }
        if ((null == itemResourceName) || ("" === itemResourceName)) {
            throw new IllegalArgumentError("Invalid 'itemResourceName': null or empty.");
        }
        if ((null == itemEtag) || ("" === itemEtag)) {
            throw new IllegalArgumentError("Invalid 'itemEtag': null or empty.");
        }
        // Prepare the local address book item extra property map.
        if (undefined === this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            this._localAddressBookItemExtraPropertyMap.set(addressBookId, new Map());
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).set("by-id", new Map());
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).set("by-resourceName", new Map());
        }
        // Prepare the item extra properties.
        let itemExtraProperties = {
            id: itemId,
            resourceName: itemResourceName,
            etag: itemEtag
        };
        // Update the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-id").set(itemId, itemExtraProperties);
        this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-resourceName").set(itemResourceName, itemExtraProperties);
    }

    getItemExtraPropertiesById(addressBookId, itemId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == itemId) || ("" === itemId)) {
            throw new IllegalArgumentError("Invalid 'itemId': null or empty.");
        }
        // Prepare the item extra properties.
        let itemExtraProperties = undefined;
        if (undefined !== this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            itemExtraProperties = this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-id").get(itemId);
        }
        //
        return itemExtraProperties;
    }

    getItemExtraPropertiesByResourceName(addressBookId, itemResourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == itemResourceName) || ("" === itemResourceName)) {
            throw new IllegalArgumentError("Invalid 'itemResourceName': null or empty.");
        }
        // Prepare the item extra properties.
        let itemExtraProperties = undefined;
        if (undefined !== this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            itemExtraProperties = this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-resourceName").get(itemResourceName);
        }
        //
        return itemExtraProperties;
    }

    deleteItemExtraPropertiesById(addressBookId, itemId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == itemId) || ("" === itemId)) {
            throw new IllegalArgumentError("Invalid 'itemId': null or empty.");
        }
        // Update the local address book item extra property map.
        let itemExtraProperties = this.getItemExtraPropertiesById(addressBookId, itemId);
        if (undefined !== itemExtraProperties) {
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-id").delete(itemId);
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-resourceName").delete(itemExtraProperties.resourceName);
        }
    }

    deleteItemExtraPropertiesByResourceName(addressBookId, itemResourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == itemResourceName) || ("" === itemResourceName)) {
            throw new IllegalArgumentError("Invalid 'itemResourceName': null or empty.");
        }
        // Update the local address book item extra property map.
        let itemExtraProperties = this.getItemExtraPropertiesByResourceName(addressBookId, itemResourceName);
        if (undefined !== itemExtraProperties) {
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-id").delete(itemExtraProperties.id);
            this._localAddressBookItemExtraPropertyMap.get(addressBookId).get("by-resourceName").delete(itemResourceName);
        }
    }

    deleteItemExtraProperties(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Update the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap.delete(addressBookId);
    }

    /* Synchronization structures. */

    getItemSynchronizationStructures(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Retrieve the deleted item id sets.
        let deletedMailingListIdSet = localAddressBookEventManager.getDeletedMailingListIdSet(addressBookId);
        let deletedContactIdSet = localAddressBookEventManager.getDeletedContactIdSet(addressBookId);
        // Prepare the item synchronization structures, and remove the deleted items from the local address book item extra property map.
        let originalDeletedLocalItemResourceNameSet = new Set();
        if (undefined !== this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            for (let itemResourceName of this._localAddressBookItemExtraPropertyMap.get(addressBookId).keys()) {
                let itemId = this._localAddressBookItemExtraPropertyMap.get(addressBookId).get(itemResourceName).id;
                if ((deletedMailingListIdSet.has(itemId)) || (deletedContactIdSet.has(itemId))) {
                    originalDeletedLocalItemResourceNameSet.add(key);
                    //
                    this.deleteItemExtraPropertiesByResourceName(addressBookId, itemResourceName);
                }
            }
        }
        //
        return { originalDeletedLocalItemResourceNameSet };
    }

    /* I/O. */

    async loadLocalAddressBookItemExtraPropertyMap() {
        // Search for a previous local address book item extra property map in the local storage.
        let { localAddressBookItemExtraPropertyMap } = await messenger.storage.local.get({ localAddressBookItemExtraPropertyMap: undefined });
        // If such a previous local address book item extra property map is found...
        if (undefined !== localAddressBookItemExtraPropertyMap) {
            // Assign it to the current local address book item extra property map.
            this._localAddressBookItemExtraPropertyMap = localAddressBookItemExtraPropertyMap;
        }
    }

    async saveLocalAddressBookItemExtraPropertyMap() {
        // Save the local address book item extra property map to the local storage.
        await messenger.storage.local.set({ localAddressBookItemExtraPropertyMap: this._localAddressBookItemExtraPropertyMap });
    }

}
