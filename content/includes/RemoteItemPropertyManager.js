/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

class RemoteItemPropertyManager {

/* FIXME: disabled as it is still not fully supported.
    _remoteItemPropertyMap = null;
*/

    /* */

    constructor() {
        // Initialize the remote item property map.
        this._remoteItemPropertyMap = new Map();
    }

    /* Property management. */

    setRemoteItemProperties(addressBookId, resourceName, eTag, id) {
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
        // Prepare the remote item property map.
        if (undefined === this._remoteItemPropertyMap.get(addressBookId)) {
            this._remoteItemPropertyMap.set(addressBookId, new Map());
        }
        // Prepare the remote item property object.
        let remoteItemProperties = {
            eTag: eTag,
            id: id
        };
        // Update the remote item property map.
        this._remoteItemPropertyMap.get(addressBookId).set(resourceName, remoteItemProperties);
    }

    getRemoteItemProperties(addressBookId, resourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == resourceName) || ("" === resourceName)) {
            throw new IllegalArgumentError("Invalid 'resourceName': null or empty.");
        }
        // Prepare the remote item property object.
        let remoteItemProperties = undefined;
        if (undefined !== this._remoteItemPropertyMap.get(addressBookId)) {
            remoteItemProperties = this._remoteItemPropertyMap.get(addressBookId).get(resourceName);
        }
        //
        return remoteItemProperties;
    }

    deleteRemoteItemProperties(addressBookId, resourceName) {
        if ((null == addressBookId) || ("" === addressBookId)) {
            throw new IllegalArgumentError("Invalid 'addressBookId': null or empty.");
        }
        if ((null == resourceName) || ("" === resourceName)) {
            throw new IllegalArgumentError("Invalid 'resourceName': null or empty.");
        }
        // Update the remote item property map.
        this._remoteItemPropertyMap.get(addressBookId).delete(resourceName);
    }

    /* I/O. */

    async loadRemoteItemPropertyMap() {
        // Search for a previous remote item property map in the local storage.
        let { remoteItemPropertyMap } = await messenger.storage.local.get({ remoteItemPropertyMap: undefined });
        // If such a previous remote item property map is found...
        if (undefined !== remoteItemPropertyMap) {
            // Assign it to the current remote item property map.
            this._remoteItemPropertyMap = remoteItemPropertyMap;
        }
    }

    async saveRemoteItemPropertyMap() {
        // Save the remote item property map to the local storage.
        await messenger.storage.local.set({ remoteItemPropertyMap: this._remoteItemPropertyMap });
    }

}

var remoteItemPropertyManager = new RemoteItemPropertyManager();
remoteItemPropertyManager.loadRemoteItemPropertyMap();