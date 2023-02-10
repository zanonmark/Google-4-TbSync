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

/* FIXME: disabled as it is still not fully supported.
    _localAddressBookItemExtraPropertyMap = null;
*/

    /* */

    constructor() {
        // Initialize the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap = new Map();
    }

    /* Items. */

    getItemResourceNameSet(addressBookId) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        // Prepare the resource name set.
        let resourceNameSet = new Set();
        if (undefined !== this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            for (let key of this._localAddressBookItemExtraPropertyMap.get(addressBookId).keys()) {
                resourceNameSet.add(key);
            }
        }
        //
        return resourceNameSet;
    }

    /* Properties. */

    setItemExtraProperties(addressBookId, resourceName, eTag, id) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == resourceName) || ("" === resourceName)) {
            throw new IllegalArgumentError("Invalid 'resourceName': null or empty.");
        }
        if ((null == eTag) || ("" === eTag)) {
            throw new IllegalArgumentError("Invalid 'eTag': null or empty.");
        }
        if ((null == id) || ("" === id)) {
            throw new IllegalArgumentError("Invalid 'id': null or empty.");
        }
        // Prepare the local address book item extra property map.
        if (undefined === this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            this._localAddressBookItemExtraPropertyMap.set(addressBookId, new Map());
        }
        // Prepare the item extra properties.
        let itemExtraProperties = {
            eTag: eTag,
            id: id
        };
        // Update the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap.get(addressBookId).set(resourceName, itemExtraProperties);
    }

    getItemExtraProperties(addressBookId, resourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == resourceName) || ("" === resourceName)) {
            throw new IllegalArgumentError("Invalid 'resourceName': null or empty.");
        }
        // Prepare the item extra properties.
        let itemExtraProperties = undefined;
        if (undefined !== this._localAddressBookItemExtraPropertyMap.get(addressBookId)) {
            itemExtraProperties = this._localAddressBookItemExtraPropertyMap.get(addressBookId).get(resourceName);
        }
        //
        return itemExtraProperties;
    }

    deleteItemExtraProperties(addressBookId, resourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == resourceName) || ("" === resourceName)) {
            throw new IllegalArgumentError("Invalid 'resourceName': null or empty.");
        }
        // Update the local address book item extra property map.
        this._localAddressBookItemExtraPropertyMap.get(addressBookId).delete(resourceName);
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
