/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const FAKE_EMAIL_ADDRESS_DOMAIN = "bug1522453.thunderbird.example.com";
const FAKE_ETAG = "000/mz/000";

class AddressBookSynchronizer {

    /* Main synchronization. */

    static async synchronize(syncData) {
        if (null == syncData) {
            throw new IllegalArgumentError("Invalid 'syncData': null.");
        }
        // Create a PeopleAPI object.
        let peopleAPI = new PeopleAPI(syncData.accountData);
        // Get other account properties.
/* FIXME
        let useFakeEmailAddresses = syncData.accountData.getAccountProperty("useFakeEmailAddresses");
        let readOnlyMode = syncData.accountData.getAccountProperty("readOnlyMode");
        let verboseLogging = syncData.accountData.getAccountProperty("verboseLogging");
*/
let includeSystemContactGroups = syncData.accountData.get("includeSystemContactGroups");
let useFakeEmailAddresses = syncData.accountData.get("useFakeEmailAddresses");
let readOnlyMode = syncData.accountData.get("readOnlyMode");
let verboseLogging = syncData.accountData.get("verboseLogging");
        // Enable the logger.
        logger = new Logger(verboseLogging);
        // Retrieve the local address book and its id.
        logger.log0("AddressBookSynchronizer.synchronize(): Retrieving the local address book.");
// FIXME: syncData.target? true/false?
        let localAddressBookId = syncData.target;
        let localAddressBook = await messenger.addressBooks.get(localAddressBookId, true); // No further checking here, as it must be defined.
        let localAddressBookName = localAddressBook.name;
        logger.log1("AddressBookSynchronizer.synchronize(): Found the local address book '" + localAddressBookId + "' ('" + localAddressBookName + "').");
        // Check if the read-only mode is set.
        if (readOnlyMode) {
            logger.log0("AddressBookSynchronizer.synchronize(): Read-only mode detected.");
        }
        // Retrieve the local address book item extra property map.
        logger.log0("AddressBookSynchronizer.synchronize(): Loading the local address book item extra property map.");
        let localAddressBookItemExtraPropertyManager = new LocalAddressBookItemExtraPropertyManager();
        await localAddressBookItemExtraPropertyManager.loadLocalAddressBookItemExtraPropertyMap();
        // Retrieve the synchronization structures for the cycles.
        logger.log0("AddressBookSynchronizer.synchronize(): Retrieving the synchronization structures for the cycles.");
        let { originalDeletedLocalItemResourceNameSet } = localAddressBookItemExtraPropertyManager.getItemSynchronizationStructures(localAddressBookId);
        let originalCreatedLocalContactGroupIdSet = localAddressBookEventManager.getCreatedMailingListIdSet(localAddressBookId);
        let originalUpdatedLocalContactGroupIdSet = localAddressBookEventManager.getUpdatedMailingListIdSet(localAddressBookId);
        let originalCreatedLocalContactIdSet = localAddressBookEventManager.getCreatedContactIdSet(localAddressBookId);
        let originalUpdatedLocalContactIdSet = localAddressBookEventManager.getUpdatedContactIdSet(localAddressBookId);
        let remoteMembershipMap = new Map();
        // Enable synchronization mode for the local address book.
        logger.log0("AddressBookSynchronizer.synchronize(): Enabling synchronization mode for the local address book.");
        await localAddressBookEventManager.enableSynchronizationMode(localAddressBookId);
        // Attempt the synchronization.
        try {
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization started.");
            // Synchronize the contact groups.
            await AddressBookSynchronizer.synchronizeContactGroups(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactGroupIdSet, originalUpdatedLocalContactGroupIdSet);
            // Synchronize the contacts.
            await AddressBookSynchronizer.synchronizeContacts(peopleAPI, useFakeEmailAddresses, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactIdSet, originalUpdatedLocalContactIdSet, remoteMembershipMap);
            // Synchronize the contact group members.
            await AddressBookSynchronizer.synchronizeContactGroupMembers(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, remoteMembershipMap);
            // Save the local address book item extra property map.
            logger.log0("AddressBookSynchronizer.synchronize(): Saving the local address book item extra property map.");
            await localAddressBookItemExtraPropertyManager.saveLocalAddressBookItemExtraPropertyMap();
// TODO: clearEventData if in read-only mode.
            // Disable synchronization mode for the local address book.
            logger.log0("AddressBookSynchronizer.synchronize(): Disabling synchronization mode for the local address book.");
            await localAddressBookEventManager.disableSynchronizationMode(localAddressBookId);
            //
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization finished successfully.");
        }
        catch (error) {
            logger.log0("AddressBookSynchronizer.synchronize(): Synchronization failed.");
            // Disable synchronization mode for the local address book.
            logger.log0("AddressBookSynchronizer.synchronize(): Disabling synchronization mode for the local address book.");
            await localAddressBookEventManager.disableSynchronizationMode(localAddressBookId);
            // If a network error was encountered...
            if (error instanceof NetworkError) {
                // Propagate the error.
                throw error;
            }
            // If the root reason is different...
            else {
                // Propagate the error.
                throw error;
            }
        }
    }

    /* Contact groups. */

    static async synchronizeContactGroups(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactGroupIdSet, originalUpdatedLocalContactGroupIdSet) {
        if (null == peopleAPI) {
            throw new IllegalArgumentError("Invalid 'peopleAPI': null.");
        }
        if (null == includeSystemContactGroups) {
            throw new IllegalArgumentError("Invalid 'includeSystemContactGroups': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
        if (null == localAddressBook) {
            throw new IllegalArgumentError("Invalid 'localAddressBook': null.");
        }
        if (null == localAddressBookItemExtraPropertyManager) {
            throw new IllegalArgumentError("Invalid 'localAddressBookItemExtraPropertyManager': null.");
        }
        if (null == originalDeletedLocalItemResourceNameSet) {
            throw new IllegalArgumentError("Invalid 'originalDeletedLocalItemResourceNameSet': null.");
        }
        if (null == originalCreatedLocalContactGroupIdSet) {
            throw new IllegalArgumentError("Invalid 'originalCreatedLocalContactGroupIdSet': null.");
        }
        if (null == originalUpdatedLocalContactGroupIdSet) {
            throw new IllegalArgumentError("Invalid 'originalUpdatedLocalContactGroupIdSet': null.");
        }
        // Get the local address book id.
        let localAddressBookId = localAddressBook.id;
        // Retrieve the remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Retrieving the remote contact groups.");
        let remoteContactGroups = await peopleAPI.getContactGroups();
        // Cycle on the remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the remote contact groups.");
        logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): includeSystemContactGroups = " + includeSystemContactGroups + ".");
        for (let remoteContactGroup of remoteContactGroups) {
            // Get the contact group resource name (in the form 'contactGroups/contactGroupId') and name.
            let contactGroupResourceName = remoteContactGroup.resourceName;
            let contactGroupName = remoteContactGroup.name;
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Examining remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "').");
            // Determine if the remote contact group is a system one.
            if ("SYSTEM_CONTACT_GROUP" === remoteContactGroup.groupType) {
                // Determine if the remote contact group should be discarded.
                if (!includeSystemContactGroups) {
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') is a system contact group and has therefore been ignored.");
                    continue;
                }
                // Fix the missing etag.
                remoteContactGroup.etag = FAKE_ETAG;
            }
            // Try to match the remote contact group locally.
            let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactGroupResourceName);
            let contactGroupId = undefined;
            if (undefined !== localContactGroupExtraProperties) {
                contactGroupId = localContactGroupExtraProperties.id;
            }
            let localContactGroup = undefined;
            if (undefined !== contactGroupId) {
                try {
                    localContactGroup = await messenger.mailingLists.get(contactGroupId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Match found: remote contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') -> local contact group '" + contactGroupId + "'.");
                }
                catch (error) {
                }
            }
            // If such a remote contact group is currently unavailable locally...
            if (undefined === localContactGroup) {
                // ...and if it was previously deleted locally, and if the read-only mode is not set...
                if ((originalDeletedLocalItemResourceNameSet.has(contactGroupResourceName)) && (!readOnlyMode)) {
                    // Delete the remote contact group.
                    await peopleAPI.deleteContactGroup(contactGroupResourceName);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been deleted remotely.");
                }
                // ...and if it wasn't previously deleted locally, or if the read-only mode is set...
                else {
                    // Prepare the local contact group properties.
                    let localContactGroupProperties = AddressBookSynchronizer.getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup);
                    // Create a local contact group, and update the local address book item extra property map.
                    let contactGroupId = await messenger.mailingLists.create(localAddressBookId, localContactGroupProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupId, contactGroupResourceName, remoteContactGroup.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been created locally: '" + contactGroupId + "'.");
                }
                // ...and if it was previously deleted locally (regardless of the read-only mode)...
                if (originalDeletedLocalItemResourceNameSet.has(contactGroupResourceName)) {
                    // Remove the event data from the local address book event map.
                    await localAddressBookEventManager.clearMailingListDeletedEventData(localAddressBookId, contactGroupId);
                }
            }
            // If such a remote contact group is currently available locally...
            else {
                // ...and if the remote one is more recent, or if the read-only mode is set...
                if ((localContactGroupExtraProperties.etag !== remoteContactGroup.etag) || (readOnlyMode)) {
                    // Prepare the local contact group properties.
                    let localContactGroupProperties = AddressBookSynchronizer.getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup);
                    // Update the local contact group, and update the local address book item extra property map.
                    await messenger.mailingLists.update(contactGroupId, localContactGroupProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupId, contactGroupResourceName, remoteContactGroup.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupResourceName + "' ('" + contactGroupName + "') has been updated locally: '" + contactGroupId + "'.");
                    // Remove the event data from the local address book event map, and remove the contact group from the locally updated ones (to avoid duplications).
                    await localAddressBookEventManager.clearMailingListUpdatedEventData(localAddressBookId, contactGroupId);
                    originalUpdatedLocalContactGroupIdSet.delete(contactGroupId);
                }
            }
        }
        // Cycle on the created local contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the created local contact groups.");
        for (let contactGroupId of originalCreatedLocalContactGroupIdSet) {
            // If the read-only mode is not set...
            if (!readOnlyMode) {
                // Retrieve the local contact group.
                let localContactGroup = await messenger.mailingLists.get(contactGroupId);
                // Get the contact group name.
                let contactGroupName = localContactGroup.name;
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Examining local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
                // Prepare the remote contact group.
                let localContactGroupProperties = {
                    name: contactGroupName,
                    nickName: localContactGroup.nickName,
                };
                let remoteContactGroup = AddressBookSynchronizer.getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties);
                // Create a remote contact group, and update the local address book item extra property map.
                remoteContactGroup = await peopleAPI.createContactGroup(remoteContactGroup);
                let contactGroupResourceName = remoteContactGroup.resourceName;
                localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupId, contactGroupResourceName, remoteContactGroup.etag);
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been created remotely: '" + contactGroupResourceName + "'.");
            }
            // Remove the event data from the local address book event map.
            await localAddressBookEventManager.clearMailingListCreatedEventData(localAddressBookId, contactGroupId);
        }
        // Cycle on the updated local contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Cycling on the updated local contact groups.");
        for (let contactGroupId of originalUpdatedLocalContactGroupIdSet) {
            // If the read-only mode is not set...
            if (!readOnlyMode) {
                // Get the contact group extra properties.
                let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesById(localAddressBookId, contactGroupId);
                // Make sure the local contact group has a valid etag (if not, it is probably a system contact group, which cannot be updated).
                if (FAKE_ETAG === localContactGroupExtraProperties.etag) {
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + localContactGroupId + "' has no etag and has therefore been ignored.");
                    continue;
                }
                // Retrieve the local contact group.
                let localContactGroup = await messenger.mailingLists.get(contactGroupId);
                // Get the contact group name.
                let contactGroupName = localContactGroup.name;
                logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Examining local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
                // Get the contact group resource name (in the form 'contactGroups/contactGroupId').
                let contactGroupResourceName = localContactGroupExtraProperties.resourceName;
                // Prepare the remote contact group.
                let localContactGroupProperties = {
                    name: contactGroupName,
                    nickName: localContactGroup.nickName,
                };
                let remoteContactGroup = AddressBookSynchronizer.getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties);
                remoteContactGroup.resourceName = contactGroupResourceName;
                remoteContactGroup.etag = localContactGroupExtraProperties.etag;
                // Update the remote contact group or delete the local contact group.
                try {
                    // Update the remote contact group, and update the local address book item extra property map.
                    remoteContactGroup = await peopleAPI.updateContactGroup(remoteContactGroup);
                    let contactGroupResourceName = remoteContactGroup.resourceName;
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactGroupId, contactGroupResourceName, remoteContactGroup.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been updated remotely: '" + contactGroupResourceName + "'.");
                }
                catch (error) {
                    // If the remote contact group is no longer available (i.e.: it was deleted)...
                    if ((error instanceof ResponseError) && (error.message.includes(": 404:"))) {
                        // Delete the local contact group, and update the local address book item extra property map.
                        await messenger.mailingLists.delete(contactGroupId);
                        localAddressBookItemExtraPropertyManager.deleteItemExtraPropertiesByResourceName(localAddressBookId, contactGroupResourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been deleted locally.");
                    }
                    // If the root reason is different...
                    else {
                        // Propagate the error.
                        throw error;
                    }
                }
            }
            // Remove the event data from the local address book event map.
            await localAddressBookEventManager.clearMailingListUpdatedEventData(localAddressBookId, contactGroupId);
        }
        // Determine all the deleted remote contact groups.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroups(): Determining all the deleted remote contact groups.");
        for (let localContactGroup of await messenger.mailingLists.list(localAddressBookId)) {
            // Get the contact group id and name.
            let contactGroupId = localContactGroup.id;
            let contactGroupName = localContactGroup.name;
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Examining local contact group '" + contactGroupId + "' ('" + contactGroupName + "').");
            // Determine if the local contact group is a locally added one.
            if (originalCreatedLocalContactGroupIdSet.has(contactGroupId)) {
                continue;
            }
            // Determine if the local contact group is among the downloaded ones, and get the contact group resource name (in the form 'contactGroups/contactGroupId').
            let localContactGroupFoundAmongRemoteContactGroups = false;
            let contactGroupResourceName = undefined;
// FIXME: find a faster way.
            for (let remoteContactGroup of remoteContactGroups) {
                let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, remoteContactGroup.resourceName);
                if (undefined !== localContactGroupExtraProperties) {
                    let itemId = localContactGroupExtraProperties.id;
                    if (contactGroupId === itemId) {
                        localContactGroupFoundAmongRemoteContactGroups = true;
                        contactGroupResourceName = remoteContactGroup.resourceName;
                        break;
                    }
                }
            }
            if (localContactGroupFoundAmongRemoteContactGroups) {
                continue;
            }
            // Delete the local contact group, and update the local address book item extra property map.
            await messenger.mailingLists.delete(contactGroupId);
            localAddressBookItemExtraPropertyManager.deleteItemExtraPropertiesById(localAddressBookId, contactGroupId);
            logger.log1("AddressBookSynchronizer.synchronizeContactGroups(): Contact group '" + contactGroupId + "' ('" + contactGroupName + "') has been deleted locally.");
        }
    }

    static getLocalContactGroupPropertiesFromRemoteContactGroup(remoteContactGroup) {
        if (null == remoteContactGroup) {
            throw new IllegalArgumentError("Invalid 'remoteContactGroup': null.");
        }
        // Prepare the local contact group properties.
        let localContactGroupProperties = {};
        // Set the name.
        if (remoteContactGroup.name) {
            let name = remoteContactGroup.name.replace(/[<>;,"]/g, '_');
            //
            localContactGroupProperties.name = name;
        }
        //
        return localContactGroupProperties;
    }

    static getRemoteContactGroupFromLocalContactGroupProperties(localContactGroupProperties) {
        if (null == localContactGroupProperties) {
            throw new IllegalArgumentError("Invalid 'localContactGroupProperties': null.");
        }
        // Prepare the remote contact group.
        let remoteContactGroup = {};
        // Set the name.
        if (localContactGroupProperties.name) {
            remoteContactGroup.name = localContactGroupProperties.name;
        }
        //
        return remoteContactGroup;
    }

    /* Contacts. */

    static async synchronizeContacts(peopleAPI, useFakeEmailAddresses, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, originalDeletedLocalItemResourceNameSet, originalCreatedLocalContactIdSet, originalUpdatedLocalContactIdSet, remoteMembershipMap) {
        if (null == peopleAPI) {
            throw new IllegalArgumentError("Invalid 'peopleAPI': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
        if (null == localAddressBook) {
            throw new IllegalArgumentError("Invalid 'localAddressBook': null.");
        }
        if (null == localAddressBookItemExtraPropertyManager) {
            throw new IllegalArgumentError("Invalid 'localAddressBookItemExtraPropertyManager': null.");
        }
        if (null == originalDeletedLocalItemResourceNameSet) {
            throw new IllegalArgumentError("Invalid 'originalDeletedLocalItemResourceNameSet': null.");
        }
        if (null == originalCreatedLocalContactIdSet) {
            throw new IllegalArgumentError("Invalid 'originalCreatedLocalContactIdSet': null.");
        }
        if (null == originalUpdatedLocalContactIdSet) {
            throw new IllegalArgumentError("Invalid 'originalUpdatedLocalContactIdSet': null.");
        }
        if (null == remoteMembershipMap) {
            throw new IllegalArgumentError("Invalid 'remoteMembershipMap': null.");
        }
        // Get the local address book id.
        let localAddressBookId = localAddressBook.id;
        // Retrieve the remote contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Retrieving the remote contacts.");
        let remoteContacts = await peopleAPI.getContacts();
        // Cycle on the remote contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the remote contacts.");
        for (let remoteContact of remoteContacts) {
            // Get the contact resource name (in the form 'people/personId') and display name.
            let contactResourceName = remoteContact.resourceName;
            let contactDisplayName = AddressBookSynchronizer.getRemoteContactDisplayName(remoteContact);
            logger.log1("AddressBookSynchronizer.synchronizeContacts(): Examining remote contact '" + contactResourceName + "' ('" + contactDisplayName + "').");
            // Try to match the remote contact locally.
            let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactResourceName);
            let contactId = undefined;
            if (undefined !== localContactExtraProperties) {
                contactId = localContactExtraProperties.id;
            }
            let localContact = undefined;
            if (undefined !== contactId) {
                try {
                    localContact = await messenger.contacts.get(contactId);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): Match found: remote contact '" + contactResourceName + "' ('" + contactDisplayName + "') -> local contact '" + contactId + "'.");
                }
                catch (error) {
                }
            }
            // If such a remote contact is currently unavailable locally...
            if (undefined === localContact) {
                // ...and if it was previously deleted locally, and if the read-only mode is not set...
                if ((originalDeletedLocalItemResourceNameSet.has(contactResourceName)) && (!readOnlyMode)) {
                    // Delete the remote contact.
                    await peopleAPI.deleteContact(contactResourceName);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactResourceName + "' ('" + contactDisplayName + "') has been deleted remotely.");
                }
                // ...and if it wasn't previously deleted locally, or if the read-only mode is set...
                else {
                    // Prepare the local contact properties.
                    let localContactProperties = AddressBookSynchronizer.getLocalContactPropertiesFromRemoteContact(remoteContact, useFakeEmailAddresses);
                    // Create a local contact, and update the local address book item extra property map.
                    let contactId = await messenger.contacts.create(localAddressBookId, localContactProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactId, contactResourceName, remoteContact.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactResourceName + "' ('" + contactDisplayName + "') has been created locally: '" + contactId + "'.");
                    // Update the remote membership map.
                    AddressBookSynchronizer.updateRemoteMembershipMap(remoteMembershipMap, contactResourceName, remoteContact.memberships);
                }
                // ...and if it was previously deleted locally (regardless of the read-only mode)...
                if (originalDeletedLocalItemResourceNameSet.has(contactResourceName)) {
                    // Remove the event data from the local address book event map.
                    await localAddressBookEventManager.clearContactDeletedEventData(localAddressBookId, contactId);
                }
            }
            // If such a remote contact is currently available locally...
            else {
                // ...and if the remote one is more recent, or if the read-only mode is set...
                if ((localContactExtraProperties.etag !== remoteContact.etag) || (readOnlyMode)) {
                    // Prepare the local contact properties.
                    let localContactProperties = AddressBookSynchronizer.getLocalContactPropertiesFromRemoteContact(remoteContact);
                    // Update the local contact, and update the local address book item extra property map.
                    await messenger.contacts.update(contactId, localContactProperties);
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactId, contactResourceName, remoteContact.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactResourceName + "' ('" + contactDisplayName + "') has been updated locally: '" + contactId + "'.");
                    // Remove the event data from the local address book event map, and remove the contact from the locally updated ones (to avoid duplications).
                    await localAddressBookEventManager.clearContactUpdatedEventData(localAddressBookId, contactId);
                    originalUpdatedLocalContactIdSet.delete(contactId);
                }
                // Update the remote membership map.
                AddressBookSynchronizer.updateRemoteMembershipMap(remoteMembershipMap, contactResourceName, remoteContact.memberships);
            }
        }
        // Cycle on the created local contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the created local contacts.");
        for (let contactId of originalCreatedLocalContactIdSet) {
            // If the read-only mode is not set...
            if (!readOnlyMode) {
                // Retrieve the local contact.
                let localContact = await messenger.contacts.get(contactId);
                // Get the contact display name.
                let contactDisplayName = AddressBookSynchronizer.getLocalContactDisplayName(localContact);
                logger.log1("AddressBookSynchronizer.synchronizeContacts(): Examining local contact '" + contactId + "' ('" + contactDisplayName + "').");
                // Prepare the remote contact.
                let localContactProperties = localContact.properties;
                let remoteContact = AddressBookSynchronizer.getRemoteContactFromLocalContactProperties(localContactProperties, useFakeEmailAddresses);
                // Create a remote contact, and update the local address book item extra property map.
                remoteContact = await peopleAPI.createContact(remoteContact);
                let contactResourceName = remoteContact.resourceName;
                localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactId, contactResourceName, remoteContact.etag);
                logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactId + "' ('" + contactDisplayName + "') has been created remotely: '" + contactResourceName + "'.");
            }
            // Remove the event data from the local address book event map.
            await localAddressBookEventManager.clearContactCreatedEventData(localAddressBookId, contactId);
        }
        // Cycle on the updated local contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Cycling on the updated local contacts.");
        for (let contactId of originalUpdatedLocalContactIdSet) {
            // If the read-only mode is not set...
            if (!readOnlyMode) {
                // Get the contact extra properties.
                let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesById(localAddressBookId, contactId);
                // Retrieve the local contact.
                let localContact = await messenger.contacts.get(contactId);
                // Get the contact display name.
                let contactDisplayName = AddressBookSynchronizer.getLocalContactDisplayName(localContact);
                logger.log1("AddressBookSynchronizer.synchronizeContacts(): Examining local contact '" + contactId + "' ('" + contactDisplayName + "').");
                // Get the contact resource name (in the form 'people/personId').
                let contactResourceName = localContactExtraProperties.resourceName;
                // Prepare the remote contact.
                let localContactProperties = localContact.properties;
                let remoteContact = AddressBookSynchronizer.getRemoteContactFromLocalContactProperties(localContactProperties, useFakeEmailAddresses);
                remoteContact.resourceName = contactResourceName;
                remoteContact.etag = localContactExtraProperties.etag;
                // Update the remote contact or delete the local contact.
                try {
                    // Update the remote contact, and update the local address book item extra property map.
                    remoteContact = await peopleAPI.updateContact(remoteContact);
                    let contactResourceName = remoteContact.resourceName;
                    localAddressBookItemExtraPropertyManager.setItemExtraProperties(localAddressBookId, contactId, contactResourceName, remoteContact.etag);
                    logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactId + "' ('" + contactDisplayName + "') has been updated remotely: '" + contactResourceName + "'.");
                }
                catch (error) {
                    // If the remote contact is no longer available (i.e.: it was deleted)...
                    if ((error instanceof ResponseError) && (error.message.includes(": 404:"))) {
                        // Delete the local contact, and update the local address book item extra property map.
                        await messenger.contacts.delete(contactId);
                        localAddressBookItemExtraPropertyManager.deleteItemExtraPropertiesByResourceName(localAddressBookId, contactResourceName);
                        logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactId + "' ('" + contactDisplayName + "') has been deleted locally.");
                    }
                    // If the root reason is different...
                    else {
                        // Propagate the error.
                        throw error;
                    }
                }
            }
            // Remove the event data from the local address book event map.
            await localAddressBookEventManager.clearContactUpdatedEventData(localAddressBookId, contactId);
        }
        // Determine all the deleted remote contacts.
        logger.log0("AddressBookSynchronizer.synchronizeContacts(): Determining all the deleted remote contacts.");
        for (let localContact of await messenger.contacts.list(localAddressBookId)) {
            // Get the contact id and display name.
            let contactId = localContact.id;
            let contactDisplayName = AddressBookSynchronizer.getLocalContactDisplayName(localContact);
            logger.log1("AddressBookSynchronizer.synchronizeContacts(): Examining local contact '" + contactId + "' ('" + contactDisplayName + "').");
            // Determine if the local contact is a locally added one.
            if (originalCreatedLocalContactIdSet.has(contactId)) {
                continue;
            }
            // Determine if the local contact is among the downloaded ones, and get the contact resource name (in the form 'people/personId').
            let localContactFoundAmongRemoteContacts = false;
            let contactResourceName = undefined;
// FIXME: find a faster way.
            for (let remoteContact of remoteContacts) {
                let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, remoteContact.resourceName);
                if (undefined !== localContactExtraProperties) {
                    let itemId = localContactExtraProperties.id;
                    if (contactId === itemId) {
                        localContactFoundAmongRemoteContacts = true;
                        contactResourceName = remoteContact.resourceName;
                        break;
                    }
                }
            }
            if (localContactFoundAmongRemoteContacts) {
                continue;
            }
            // Delete the local contact, and update the local address book item extra property map.
            await messenger.contacts.delete(contactId);
            localAddressBookItemExtraPropertyManager.deleteItemExtraPropertiesById(localAddressBookId, contactId);
            logger.log1("AddressBookSynchronizer.synchronizeContacts(): Contact '" + contactId + "' ('" + contactDisplayName + "') has been deleted locally.");
        }
    }

    static getRemoteContactDisplayName(remoteContact) {
        if (null == remoteContact) {
            throw new IllegalArgumentError("Invalid 'remoteContact': null.");
        }
        // Get the contact display name.
        let contactDisplayName = "-";
        if (remoteContact.names) {
            contactDisplayName = remoteContact.names[0].displayName;
        }
        //
        return contactDisplayName;
    }

    static getLocalContactDisplayName(localContact) {
        if (null == localContact) {
            throw new IllegalArgumentError("Invalid 'localContact': null.");
        }
        // Unpack the vCard properties.
        let vCardProperties = new ICAL.Component(ICAL.parse(localContact.properties.vCard));
        // Get the contact display name.
        let contactDisplayName = "-";
        let fn_entry = vCardProperties.getFirstProperty("fn");
        if (undefined !== fn_entry) {
            contactDisplayName = fn_entry.jCal[3];
        }
        //
        return contactDisplayName;
    }

    static getLocalContactPropertiesFromRemoteContact(remoteContact, useFakeEmailAddresses) { // https://webextension-api.thunderbird.net/en/stable/how-to/contacts.html
        if (null == remoteContact) {
            throw new IllegalArgumentError("Invalid 'remoteContact': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        // Prepare the local contact properties.
        let localContactProperties = {};
        localContactProperties.PreferDisplayName = "true";
        // Prepare the vCard properties.
        let vCardProperties = [];
        vCardProperties.push([ "version", {}, "text", "4.0" ]);
        // Set the name and the display name.
        if (remoteContact.names) {
            let name_found = false;
            let name = null;
            for (name of remoteContact.names) {
                if ("CONTACT" === name.metadata.source.type) {
                    name_found = true;
                    break;
                }
            }
            //
            if (name_found) {
                let n_values = [ "", "", "", "", "" ];
                let fn_values = [ "" ];
                //
                if (name.honorificPrefix) {
                    n_values[3] = name.honorificPrefix.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.givenName) {
                    n_values[1] = name.givenName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.middleName) {
                    n_values[2] = name.middleName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.familyName) {
                    n_values[0] = name.familyName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.honorificSuffix) {
                    n_values[4] = name.honorificSuffix.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (name.displayName) {
                    fn_values[0] = name.displayName.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                vCardProperties.push([ "n", {}, "array", n_values ]);
                vCardProperties.push([ "fn", {}, "text", fn_values[0] ]);
            }
        }
        // Set the nickname.
        if (remoteContact.nicknames) {
            let nickname_found = false;
            let nickname = remoteContact.nicknames[0];
            nickname_found = true;
            //
            if (nickname_found) {
                let nickname_values = [ "" ];
                //
                if (nickname.value) {
                    nickname_values[0] = nickname.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                vCardProperties.push([ "nickname", {}, "array", nickname_values ]);
            }
        }
        // Set the email addresses.
        if (remoteContact.emailAddresses) {
            let pref_param = "1";
            //
            for (let emailAddress of remoteContact.emailAddresses) {
                if ("CONTACT" !== emailAddress.metadata.source.type) {
                    continue;
                }
                //
                let email_values = [ "" ];
                let email_type_param = "";
                //
                if (emailAddress.value) {
                    email_values[0] = emailAddress.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (emailAddress.type) {
                    case "home":
                        email_type_param = "home";
                        //
                        break;
                    case "work":
                        email_type_param = "work";
                        //
                        break;
                    default:
                        email_type_param = "";
                        //
                        break;
                }
                //
                vCardProperties.push([ "email", { type: email_type_param, pref: pref_param }, "text", email_values[0] ]);
                //
                pref_param = "";
            }
        }
        else if (useFakeEmailAddresses) {
            let email_values = [ "" ];
            let email_type_param = "";
            //
            email_values[0] = Date.now() + "." + Math.random() + "@" + FAKE_EMAIL_ADDRESS_DOMAIN;
            //
            vCardProperties.push([ "email", { type: email_type_param }, "text", email_values[0] ]);
        }
        // Set the websites.
        if (remoteContact.urls) {
            for (let url of remoteContact.urls) {
                let url_values = [ "" ];
                let url_type_param = "";
                //
                if (url.value) {
                    url_values[0] = url.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (url.type) {
                    case "work":
                        url_type_param = "work";
                        //
                        break;
                    default:
                        url_type_param = "";
                        //
                        break;
                }
                //
                vCardProperties.push([ "url", { type: url_type_param }, "array", url_values ]);
            }
        }
        // Set the addresses.
        if (remoteContact.addresses) {
            for (let address of remoteContact.addresses) {
                let adr_values = [ "", "", "", "", "", "", "" ];
                let adr_type_param = "";
                //
                if (address.streetAddress || address.extendedAddress) {
                    adr_values[2] = [];
                }
                if (address.streetAddress) {
                    adr_values[2][0] = address.streetAddress.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.extendedAddress) {
                    if (!address.streetAddress) {
                        adr_values[2][0] = "-";
                    }
                    adr_values[2][1] = address.extendedAddress.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.city) {
                    adr_values[3] = address.city.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.region) {
                    adr_values[4] = address.region.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.postalCode) {
                    adr_values[5] = address.postalCode.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                if (address.country) {
                    adr_values[6] = address.country.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
                }
                switch (address.type) {
                    case "home":
                        adr_type_param = "home";
                        //
                        break;
                    case "work":
                        adr_type_param = "work";
                        //
                        break;
                    default:
                        adr_type_param = "";
                        //
                        break;
                }
                //
                vCardProperties.push([ "adr", { type: adr_type_param }, "array", adr_values ]);
            }
        }
        // Set the phone numbers.
        if (remoteContact.phoneNumbers) {
            for (let phoneNumber of remoteContact.phoneNumbers) {
                let tel_values = [ "" ];
                let tel_type_param = "";
                //
                if (phoneNumber.value) {
                    tel_values[0] = phoneNumber.value.replaceAll(", ", " ").replaceAll(",", " ");
                }
                switch (phoneNumber.type) {
                    case "home":
                        tel_type_param = "home";
                        //
                        break;
                    case "work":
                        tel_type_param = "work";
                        //
                        break;
                    case "mobile":
                        tel_type_param = "cell";
                        //
                        break;
                    case "homeFax":
                    case "workFax":
                        tel_type_param = "fax";
                        //
                        break;
                    case "pager":
                        tel_type_param = "pager";
                        //
                        break;
                    default:
                        tel_type_param = "";
                        //
                        break;
                }
                //
                vCardProperties.push([ "tel", { type: tel_type_param }, "array", tel_values ]);
            }
        }
        // Set the chat accounts.
        if (remoteContact.imClients) {
            for (let imClient of remoteContact.imClients) {
                let impp_values = [ "" ];
                //
                if (imClient.protocol && imClient.username) {
                    impp_values[0] = imClient.protocol.replaceAll(", ", " ").replaceAll(",", " ") + ":" + imClient.username.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                vCardProperties.push([ "impp", {}, "array", impp_values ]);
            }
        }
        // Set the special dates.
        if (remoteContact.birthdays) {
            let birthday_found = false;
            let birthday = remoteContact.birthdays[0];
            birthday_found = true;
            //
            if (birthday_found) {
                let bday_values = [ "" ];
                //
                if (birthday.date) {
                    let year = (birthday.date.year ? String(birthday.date.year).padStart(4, "0") : "-");
                    let month = (birthday.date.month ? String(birthday.date.month).padStart(2, "0") : "-");
                    let day = (birthday.date.day ? String(birthday.date.day).padStart(2, "0") : "-");
                    //
                    bday_values[0] = year + "-" + month + "-" + day;
                }
                //
                vCardProperties.push([ "bday", {}, "date-and-or-time", bday_values[0] ]);
            }
        }
        if (remoteContact.events) {
            for (let event of remoteContact.events) {
                let anniversary_values = [ "" ];
                //
                if (event && event.date) {
                    let year = (event.date.year ? String(event.date.year).padStart(4, "0") : "-");
                    let month = (event.date.month ? String(event.date.month).padStart(2, "0") : "-");
                    let day = (event.date.day ? String(event.date.day).padStart(2, "0") : "-");
                    //
                    anniversary_values[0] = year + "-" + month + "-" + day;
                }
                //
                vCardProperties.push([ "anniversary", {}, "date-and-or-time", anniversary_values[0] ]);
            }
        }
        // Set the notes.
        if (remoteContact.biographies) {
            let note_values = [ "" ];
            //
            if (remoteContact.biographies[0] && remoteContact.biographies[0].value) {
                note_values[0] = remoteContact.biographies[0].value.replaceAll(", ", " ").replaceAll(",", " ").replace(/(\r\n|\n|\r)/gm, " - ");
            }
            //
            vCardProperties.push([ "note", {}, "array", note_values ]);
        }
        // Set the organizational properties.
        if (remoteContact.organizations) {
            let organization_found = false;
            let organization = remoteContact.organizations[0];
            organization_found = true;
            //
            if (organization_found) {
                let title_values = [ "" ];
                let org_values = [ "" ];
                //
                if (organization.title) {
                    title_values[0] = organization.title.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (organization.name) {
                    org_values[0] = organization.name.replaceAll(", ", " ").replaceAll(",", " ");
                }
                if (organization.department) {
// FIXME: temporary.
                    if (!organization.name) {
                        org_values[0] = "-"; // necessary because TB considers the first item to be the name
                    }
                    org_values[1] = organization.department.replaceAll(", ", " ").replaceAll(",", " ");
                }
                //
                vCardProperties.push([ "title", {}, "array", title_values ]);
                vCardProperties.push([ "org", {}, "array", org_values ]);
            }
        }
        // Set the custom properties.
        if (remoteContact.userDefined) {
            let x_custom1_values = [ "" ];
            let x_custom2_values = [ "" ];
            let x_custom3_values = [ "" ];
            let x_custom4_values = [ "" ];
            //
            if (remoteContact.userDefined[0] && remoteContact.userDefined[0].value) {
                x_custom1_values[0] = remoteContact.userDefined[0].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[1] && remoteContact.userDefined[1].value) {
                x_custom2_values[0] = remoteContact.userDefined[1].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[2] && remoteContact.userDefined[2].value) {
                x_custom3_values[0] = remoteContact.userDefined[2].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            if (remoteContact.userDefined[3] && remoteContact.userDefined[3].value) {
                x_custom4_values[0] = remoteContact.userDefined[3].value.replaceAll(", ", " ").replaceAll(",", " ");
            }
            //
/* FIXME: temporary workaround for a TB bug.
            vCardProperties.push([ "x-custom1", {}, "array", x_custom1_values ]);
            vCardProperties.push([ "x-custom2", {}, "array", x_custom2_values ]);
            vCardProperties.push([ "x-custom3", {}, "array", x_custom3_values ]);
            vCardProperties.push([ "x-custom4", {}, "array", x_custom4_values ]);
*/
vCardProperties.push([ "x-custom1", {}, "array", x_custom1_values[0] ]);
vCardProperties.push([ "x-custom2", {}, "array", x_custom2_values[0] ]);
vCardProperties.push([ "x-custom3", {}, "array", x_custom3_values[0] ]);
vCardProperties.push([ "x-custom4", {}, "array", x_custom4_values[0] ]);
        }
        // Pack the vCard properties.
        localContactProperties.vCard = ICAL.stringify([
            "vcard",
            vCardProperties,
            [],
        ]);
        //
        return localContactProperties;
    }

    static getRemoteContactFromLocalContactProperties(localContactProperties, useFakeEmailAddresses) { // https://webextension-api.thunderbird.net/en/stable/how-to/contacts.html
        if (null == localContactProperties) {
            throw new IllegalArgumentError("Invalid 'localContactProperties': null.");
        }
        if (null == useFakeEmailAddresses) {
            throw new IllegalArgumentError("Invalid 'useFakeEmailAddresses': null.");
        }
        // Prepare the remote contact.
        let remoteContact = {};
        // Unpack the vCard properties.
        let vCardProperties = new ICAL.Component(ICAL.parse(localContactProperties.vCard));
        // Set the name and the display name.
        let n_entry = vCardProperties.getFirstProperty("n");
        let fn_entry = vCardProperties.getFirstProperty("fn");
        if (n_entry || fn_entry) {
            remoteContact.names = [];
            //
            remoteContact.names[0] = {};
            //
            if (n_entry) {
                let n_values = n_entry.jCal[3]; // n_entry value: array
                //
                if (n_values[3]) {
                    remoteContact.names[0].honorificPrefix = n_values[3];
                }
                if (n_values[1]) {
                    remoteContact.names[0].givenName = n_values[1];
                }
                if (n_values[2]) {
                    remoteContact.names[0].middleName = n_values[2];
                }
                if (n_values[0]) {
                    remoteContact.names[0].familyName = n_values[0];
                }
                if (n_values[4]) {
                    remoteContact.names[0].honorificSuffix = n_values[4];
                }
            }
/* Disabled, as names[0].displayName is an output-only field for Google.
            if (fn_entry) {
                let fn_values = [ fn_entry.jCal[3] ]; // fn_entry value: string
                //
                if (fn_values[0]) {
                    remoteContact.names[0].displayName = fn_values[0];
                }
            }
*/
        }
        // Set the nickname.
        let nickname_entry = vCardProperties.getFirstProperty("nickname");
        if (nickname_entry) {
            remoteContact.nicknames = [];
            //
            remoteContact.nicknames[0] = {};
            //
            let nickname_values = [ nickname_entry.jCal[3] ]; // nickname_entry value: string
            //
            if (nickname_values[0]) {
                remoteContact.nicknames[0].value = nickname_values[0];
            }
        }
        // Set the email addresses.
        let email_entries = vCardProperties.getAllProperties("email");
        if (email_entries) {
            remoteContact.emailAddresses = [];
            let i = 0;
            //
            for (let email_entry of email_entries) {
                if ((email_entry.jCal[3].endsWith("@" + FAKE_EMAIL_ADDRESS_DOMAIN)) && (useFakeEmailAddresses)) {
                    continue;
                }
                //
                remoteContact.emailAddresses[i] = {};
                //
                let email_values = [ email_entry.jCal[3] ]; // email_entry value: string
                let email_type_param = email_entry.jCal[1].type;
                //
                if (email_values[0]) {
                    remoteContact.emailAddresses[i].value = email_values[0];
                }
                switch (email_type_param) {
                    case "work":
                        remoteContact.emailAddresses[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.emailAddresses[i].type = "home";
                        //
                        break;
                    default:
                        remoteContact.emailAddresses[i].type = "other";
                        //
                        break;
                }
                //
                i++;
            }
            //
            if (0 == remoteContact.emailAddresses.length) {
                delete remoteContact.emailAddresses;
            }
        }
        // Set the websites.
        let url_entries = vCardProperties.getAllProperties("url");
        if (url_entries) {
            remoteContact.urls = [];
            let i = 0;
            //
            for (let url_entry of url_entries) {
                remoteContact.urls[i] = {};
                //
                let url_values = [ url_entry.jCal[3] ]; // url_entry value: string
                let url_type_param = url_entry.jCal[1].type;
                //
                if (url_values[0]) {
                    remoteContact.urls[i].value = url_values[0];
                }
                switch (url_type_param) {
                    case "work":
                        remoteContact.urls[i].type = "work";
                        //
                        break;
                    default:
                        remoteContact.urls[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the addresses.
        let adr_entries = vCardProperties.getAllProperties("adr");
        if (adr_entries) {
            remoteContact.addresses = [];
            let i = 0;
            //
            for (let adr_entry of adr_entries) {
                remoteContact.addresses[i] = {};
                //
                let adr_values = adr_entry.jCal[3]; // adr_entry value: array
                let adr_type_param = adr_entry.jCal[1].type;
                //
                if (adr_values[2]) {
                    let adr_values_2_values = (Array.isArray(adr_values[2]) ? adr_values[2] : [ adr_values[2] ]); // adr_values[2]: string or array
                    //
                    if (adr_values_2_values[0]) {
                        remoteContact.addresses[i].streetAddress = adr_values_2_values[0];
                    }
                    if (adr_values_2_values[1]) {
                        remoteContact.addresses[i].extendedAddress = adr_values_2_values[1];
                    }
                }
                if (adr_values[3]) {
                    remoteContact.addresses[i].city = adr_values[3];
                }
                if (adr_values[4]) {
                    remoteContact.addresses[i].region = adr_values[4];
                }
                if (adr_values[5]) {
                    remoteContact.addresses[i].postalCode = adr_values[5];
                }
                if (adr_values[6]) {
                    remoteContact.addresses[i].country = adr_values[6];
                }
                switch (adr_type_param) {
                    case "work":
                        remoteContact.addresses[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.addresses[i].type = "home";
                        //
                        break;
                    default:
                        remoteContact.addresses[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the phone numbers.
        let tel_entries = vCardProperties.getAllProperties("tel");
        if (tel_entries) {
            remoteContact.phoneNumbers = [];
            let i = 0;
            //
            for (let tel_entry of tel_entries) {
                remoteContact.phoneNumbers[i] = {};
                //
                let tel_values = [ tel_entry.jCal[3] ]; // tel_entry value: string
                let tel_type_param = tel_entry.jCal[1].type;
                //
                if (tel_values[0]) {
                    remoteContact.phoneNumbers[i].value = tel_values[0];
                }
                switch (tel_type_param) {
                    case "work":
                        remoteContact.phoneNumbers[i].type = "work";
                        //
                        break;
                    case "home":
                        remoteContact.phoneNumbers[i].type = "home";
                        //
                        break;
                    case "cell":
                        remoteContact.phoneNumbers[i].type = "mobile";
                        //
                        break;
                    case "fax":
                        remoteContact.phoneNumbers[i].type = "Work Fax";
                        //
                        break;
                    case "pager":
                        remoteContact.phoneNumbers[i].type = "pager";
                        //
                        break;
                    default:
                        remoteContact.phoneNumbers[i].type = "";
                        //
                        break;
                }
                //
                i++;
            }
        }
        // Set the chat accounts.
        let impp_entries = vCardProperties.getAllProperties("impp");
        if (impp_entries) {
            remoteContact.imClients = [];
            let i = 0;
            //
            for (let impp_entry of impp_entries) {
                remoteContact.imClients[i] = {};
                //
                let impp_values = [ impp_entry.jCal[3] ]; // impp_entry value: string
                //
                if (impp_values[0] && impp_values[0].includes(":")) {
                    let impp_values_pu = impp_values[0].split(":");
                    //
                    remoteContact.imClients[i].username = impp_values_pu[1];
                    remoteContact.imClients[i].protocol = impp_values_pu[0];
                }
                //
                i++;
            }
        }
        // Set the special dates.
        let bday_entry = vCardProperties.getFirstProperty("bday");
        let anniversary_entries = vCardProperties.getAllProperties("anniversary");
        if (bday_entry) {
            remoteContact.birthdays = [];
            //
            remoteContact.birthdays[0] = {};
            remoteContact.birthdays[0].date = {};
            //
            let bday_values = [ bday_entry.jCal[3] ]; // bday_entry value: string
            //
            let year = "";
            let month = "";
            let day = "";
            let c = 0;
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                year = bday_values[0].substring(c, c + 4);
                c += 5;
            }
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                month = bday_values[0].substring(c, c + 2);
                c += 3;
            }
            if ("-" == bday_values[0].substring(c, c + 1)) {
                c += 2;
            }
            else {
                day = bday_values[0].substring(c, c + 2);
                c += 3;
            }
            //
            if (month) {
                remoteContact.birthdays[0].date.month = month;
            }
            if (day) {
                remoteContact.birthdays[0].date.day = day;
            }
            if (year) {
                remoteContact.birthdays[0].date.year = year;
            }
        }
        if (anniversary_entries) {
            remoteContact.events = [];
            let i = 0;
            //
            for (let anniversary_entry of anniversary_entries) {
                remoteContact.events[i] = {};
                remoteContact.events[i].date = {};
                //
                let anniversary_values = [ anniversary_entry.jCal[3] ]; // anniversary_entry value: string
                //
                let year = "";
                let month = "";
                let day = "";
                let c = 0;
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    year = anniversary_values[0].substring(c, c + 4);
                    c += 5;
                }
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    month = anniversary_values[0].substring(c, c + 2);
                    c += 3;
                }
                if ("-" == anniversary_values[0].substring(c, c + 1)) {
                    c += 2;
                }
                else {
                    day = anniversary_values[0].substring(c, c + 2);
                    c += 3;
                }
                //
                if (month && day) {
                    if (month) {
                        remoteContact.events[i].date.month = month;
                    }
                    if (day) {
                        remoteContact.events[i].date.day = day;
                    }
                    if (year) {
                        remoteContact.events[i].date.year = year;
                    }
                }
                //
                i++;
            }
        }
        // Set the notes.
        let note_entry = vCardProperties.getFirstProperty("note");
        if (note_entry) {
            remoteContact.biographies = [];
            //
            remoteContact.biographies[0] = {};
            //
            let note_values = [ note_entry.jCal[3] ]; // note_entry value: string
            //
            if (note_values[0]) {
                remoteContact.biographies[0].value = note_values[0];
            }
        }
        // Set the organizational properties.
        let title_entry = vCardProperties.getFirstProperty("title");
        let org_entry = vCardProperties.getFirstProperty("org");
        if (title_entry || org_entry) {
            remoteContact.organizations = [];
            //
            remoteContact.organizations[0] = {};
            //
            if (title_entry) {
                let title_values = [ title_entry.jCal[3] ]; // title_entry value: string
                //
                if (title_values[0]) {
                    remoteContact.organizations[0].title = title_values[0];
                }
            }
            if (org_entry) {
                let org_values = (Array.isArray(org_entry.jCal[3]) ? org_entry.jCal[3] : [ org_entry.jCal[3] ]); // org_entry value: string or array
                //
                if (org_values[0]) {
                    remoteContact.organizations[0].name = org_values[0];
                }
                if (org_values[1]) {
                    remoteContact.organizations[0].department = org_values[1];
                }
            }
        }
        // Set the custom properties.
        let x_custom1_entry = vCardProperties.getFirstProperty("x-custom1");
        let x_custom2_entry = vCardProperties.getFirstProperty("x-custom2");
        let x_custom3_entry = vCardProperties.getFirstProperty("x-custom3");
        let x_custom4_entry = vCardProperties.getFirstProperty("x-custom4");
        if (x_custom1_entry || x_custom2_entry || x_custom3_entry || x_custom4_entry) {
            remoteContact.userDefined = [];
            let i = 0;
            //
            if (x_custom1_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom1_values = [ x_custom1_entry.jCal[3] ]; // x_custom1_entry value: string
                //
                if (x_custom1_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom1_values[0];
                    //
                    i++;
                }
            }
            if (x_custom2_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom2_values = [ x_custom2_entry.jCal[3] ]; // x_custom2_entry value: string
                //
                if (x_custom2_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom2_values[0];
                    //
                    i++;
                }
            }
            if (x_custom3_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom3_values = [ x_custom3_entry.jCal[3] ]; // x_custom3_entry value: string
                //
                if (x_custom3_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom3_values[0];
                    //
                    i++;
                }
            }
            if (x_custom4_entry) {
                remoteContact.userDefined[i] = {};
                //
                let x_custom4_values = [ x_custom4_entry.jCal[3] ]; // x_custom4_entry value: string
                //
                if (x_custom4_values[0]) {
                    remoteContact.userDefined[i].key = "-";
                    remoteContact.userDefined[i].value = x_custom4_values[0];
                    //
                    i++;
                }
            }
        }
        //
        return remoteContact;
    }

    /* Contact group members. */

    static async synchronizeContactGroupMembers(peopleAPI, includeSystemContactGroups, readOnlyMode, localAddressBook, localAddressBookItemExtraPropertyManager, remoteMembershipMap) {
        if (null == peopleAPI) {
            throw new IllegalArgumentError("Invalid 'peopleAPI': null.");
        }
        if (null == includeSystemContactGroups) {
            throw new IllegalArgumentError("Invalid 'includeSystemContactGroups': null.");
        }
        if (null == readOnlyMode) {
            throw new IllegalArgumentError("Invalid 'readOnlyMode': null.");
        }
        if (null == localAddressBook) {
            throw new IllegalArgumentError("Invalid 'localAddressBook': null.");
        }
        if (null == localAddressBookItemExtraPropertyManager) {
            throw new IllegalArgumentError("Invalid 'localAddressBookItemExtraPropertyManager': null.");
        }
        if (null == remoteMembershipMap) {
            throw new IllegalArgumentError("Invalid 'remoteMembershipMap': null.");
        }
        // Get the local address book id.
        let localAddressBookId = localAddressBook.id;
        // Prepare the synchronization structures.
        let localMembershipMap = new Map();
        let remoteContactMembershipUpdateMap = new Map();
        let remoteContactMembershipUpdateSet = new Set();
        // Prepare the local membership map.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroupMembers(): Preparing the local membership map.");
        for (let localContactGroup of await messenger.mailingLists.list(localAddressBookId)) {
            // Get the contact group id.
            let contactGroupId = localContactGroup.id;
            // Retrieve the local contact group members.
            let localContactGroupMembers = await messenger.mailingLists.listMembers(contactGroupId);
            // Update the local membership map.
            AddressBookSynchronizer.updateLocalMembershipMap(localMembershipMap, contactGroupId, localContactGroupMembers, localAddressBookId, localAddressBookItemExtraPropertyManager);
        }
        // Cycle on the remote membership map.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroupMembers(): Cycling on the remote membership map.");
        for (let contactGroupResourceName of remoteMembershipMap.keys()) {
            // Get the remote contact group member set.
            let remoteContactGroupMemberSet = remoteMembershipMap.get(contactGroupResourceName);
            // Get the local contact group member set.
            let localContactGroupMemberSet = localMembershipMap.get(contactGroupResourceName); // No further checking here, as it must be defined.
            // Get the contact group extra properties.
            let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactGroupResourceName);
            // Make sure the contact group extra properties are defined (if not, this is a system contact group which was not considered in the previous steps, and must therefore be discarded).
            if (undefined === localContactGroupExtraProperties) {
                continue;
            }
            // Get the contact group id.
            let contactGroupId = localContactGroupExtraProperties.id;
            // Retrieve the member events on the local contact group.
            let originalRemovedLocalContactGroupMemberIdSet = localAddressBookEventManager.getRemovedMailingListMemberIdSet(localAddressBookId, contactGroupId);
            // Cycle on the remote contact group member set.
            for (let contactResourceName of remoteContactGroupMemberSet) {
                // Get the contact id.
                let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactResourceName);
                let contactId = localContactExtraProperties.id;
                // If such a contact group member is currently unavailable locally...
                if (!localContactGroupMemberSet.has(contactResourceName)) {
                    // ...and if it was previously removed locally, and if the read-only mode is not set...
                    if ((originalRemovedLocalContactGroupMemberIdSet.has(contactId)) && (!readOnlyMode)) {
                        // Update the remote contact membership update map and / or set.
                        if (undefined === remoteContactMembershipUpdateMap.get(contactResourceName)) {
                            remoteContactMembershipUpdateMap.set(contactResourceName, new Set());
                        }
                        remoteContactMembershipUpdateSet.add(contactResourceName);
                    }
                    // ...and if it wasn't previously removed locally, or if the read-only mode is set...
                    else {
                        // Add the member to the local contact group.
                        await messenger.mailingLists.addMember(contactGroupId, contactId);
                        logger.log1("AddressBookSynchronizer.synchronizeContactGroupMembers(): Contact '" + contactResourceName + "' has been added locally to the contact group '" + contactGroupResourceName + "'.");
                    }
                    // ...and if it was previously removed locally (regardless of the read-only mode)...
                    if (originalRemovedLocalContactGroupMemberIdSet.has(contactId)) {
// FIXME: delay the removal until the update has been pushed successfully.
                        // Remove the event data from the local address book event map.
                        await localAddressBookEventManager.clearMailingListMemberRemovedEventData(localAddressBookId, contactGroupId, contactId);
                    }
                }
                // If such a contact group member is currently available locally...
                else {
                    // ...and if the local contact group has a valid etag (if not, it is probably a system contact group, which cannot be updated)...
                    if (FAKE_ETAG !== localContactGroupExtraProperties.etag) {
                        // Update the remote contact membership update map and / or set.
                        if (undefined === remoteContactMembershipUpdateMap.get(contactResourceName)) {
                            remoteContactMembershipUpdateMap.set(contactResourceName, new Set());
                        }
                        remoteContactMembershipUpdateMap.get(contactResourceName).add({
                            "contactGroupMembership": {
                                "contactGroupResourceName": contactGroupResourceName,
                            },
                        });
                    }
                }
                // Update the remote and local contact group member set.
                remoteContactGroupMemberSet.delete(contactResourceName);
                localContactGroupMemberSet.delete(contactResourceName);
            }
        }
        // Cycle on the local membership map.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroupMembers(): Cycling on the local membership map.");
        for (let contactGroupResourceName of localMembershipMap.keys()) {
            // Get the local contact group member set.
            let localContactGroupMemberSet = localMembershipMap.get(contactGroupResourceName);
            // Get the remote contact group member set.
            let remoteContactGroupMemberSet = remoteMembershipMap.get(contactGroupResourceName); // No further checking here, as it must be defined.
            // Get the contact group id.
            let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactGroupResourceName);
            let contactGroupId = localContactGroupExtraProperties.id;
            // Retrieve the member events on the local contact group.
            let originalAddedLocalContactGroupMemberIdSet = localAddressBookEventManager.getAddedMailingListMemberIdSet(localAddressBookId, contactGroupId);
            // Cycle on the local contact group member set (i.e.: the remaining items).
            for (let contactResourceName of localContactGroupMemberSet) {
                // Get the contact id.
                let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactResourceName);
                let contactId = localContactExtraProperties.id;
                // If such a contact group member was previously added locally, and if the read-only mode is not set...
                if ((originalAddedLocalContactGroupMemberIdSet.has(contactId)) && (!readOnlyMode)) {
                    // Update the remote contact membership update map and / or set.
                    if (undefined === remoteContactMembershipUpdateMap.get(contactResourceName)) {
                        remoteContactMembershipUpdateMap.set(contactResourceName, new Set());
                    }
                    remoteContactMembershipUpdateMap.get(contactResourceName).add({
                        "contactGroupMembership": {
                            "contactGroupResourceName": contactGroupResourceName,
                        },
                    });
                    remoteContactMembershipUpdateSet.add(contactResourceName);
                }
                // If such a contact group member wasn't previously added locally, or if the read-only mode is set...
                else {
                    // Remove the member from the local contact group.
                    await messenger.mailingLists.removeMember(contactGroupId, contactId);
                    logger.log1("AddressBookSynchronizer.synchronizeContactGroupMembers(): Contact '" + contactResourceName + "' has been removed locally from the contact group '" + contactGroupResourceName + "'.");
                }
                // If such a contact group member was previously added locally (regardless of the read-only mode)...
                if (originalAddedLocalContactGroupMemberIdSet.has(contactId)) {
// FIXME: delay the removal until the update has been pushed successfully.
                    // Remove the event data from the local address book event map.
                    await localAddressBookEventManager.clearMailingListMemberAddedEventData(localAddressBookId, contactGroupId, contactId);
                }
                // Update the local contact group member set.
                localContactGroupMemberSet.delete(contactResourceName);
            }
        }
        // Cycle on the remote contact membership update map.
        logger.log0("AddressBookSynchronizer.synchronizeContactGroupMembers(): Cycling on the remote contact membership update map.");
        for (let contactResourceName of remoteContactMembershipUpdateMap.keys()) {
            // If the read-only mode is not set...
            if (!readOnlyMode) {
                // Check if the contact actually needs to be updated remotely.
                if (!remoteContactMembershipUpdateSet.has(contactResourceName)) {
                    continue;
                }
                // Get the contact extra properties.
                let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesByResourceName(localAddressBookId, contactResourceName);
                // Get the remote contact memberships.
                let remoteContactMemberships = remoteContactMembershipUpdateMap.get(contactResourceName);
                // Prepare the remote contact.
                let remoteContact = {
                    resourceName: contactResourceName,
                    etag: localContactExtraProperties.etag,
                    memberships: Array.from(remoteContactMemberships),
                };
                // Update the remote contact memberships.
                remoteContact = await peopleAPI.updateContactMemberships(remoteContact);
                contactResourceName = remoteContact.resourceName;
                logger.log1("AddressBookSynchronizer.synchronizeContactGroupMembers(): Contact '" + contactResourceName + "' memberships have been updated remotely.");
            }
        }
    }

    static updateRemoteMembershipMap(remoteMembershipMap, contactResourceName, contactMemberships) {
        if (null == remoteMembershipMap) {
            throw new IllegalArgumentError("Invalid 'remoteMembershipMap': null.");
        }
        if (null == contactResourceName) {
            throw new IllegalArgumentError("Invalid 'contactResourceName': null.");
        }
        if (null == contactMemberships) {
            throw new IllegalArgumentError("Invalid 'contactMemberships': null.");
        }
        // Cycle on all the contact memberships.
        for (let contactMembership of contactMemberships) {
            // Discard useless items.
            if (undefined === contactMembership.contactGroupMembership) {
                continue;
            }
            // Get the contact group resource name (in the form 'contactGroups/contactGroupId').
            let contactGroupResourceName = contactMembership.contactGroupMembership.contactGroupResourceName;
            // Update the remote membership map.
            if (undefined === remoteMembershipMap.get(contactGroupResourceName)) {
                remoteMembershipMap.set(contactGroupResourceName, new Set());
            }
            remoteMembershipMap.get(contactGroupResourceName).add(contactResourceName);
        }
    }

    static updateLocalMembershipMap(localMembershipMap, contactGroupId, contactGroupMembers, localAddressBookId, localAddressBookItemExtraPropertyManager) {
        if (null == localMembershipMap) {
            throw new IllegalArgumentError("Invalid 'localMembershipMap': null.");
        }
        if ((null == contactGroupId) || ("" === contactGroupId)) {
            throw new IllegalArgumentError("Invalid 'contactGroupId': null or empty.");
        }
        if (null == contactGroupMembers) {
            throw new IllegalArgumentError("Invalid 'contactGroupMembers': null.");
        }
        if ((null == localAddressBookId) || ("" === localAddressBookId)) {
            throw new IllegalArgumentError("Invalid 'localAddressBookId': null or empty.");
        }
        if (null == localAddressBookItemExtraPropertyManager) {
            throw new IllegalArgumentError("Invalid 'localAddressBookItemExtraPropertyManager': null.");
        }
        // Get the contact group extra properties.
        let localContactGroupExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesById(localAddressBookId, contactGroupId); // No further checking here, as it must be defined.
        // Get the contact group resource name (in the form 'contactGroups/contactGroupId').
        let contactGroupResourceName = localContactGroupExtraProperties.resourceName;
        // Update the local membership map.
        if (undefined === localMembershipMap.get(contactGroupResourceName)) {
            localMembershipMap.set(contactGroupResourceName, new Set());
        }
        // Cycle on all the contact group members.
        for (let localContact of contactGroupMembers) {
            // Get the contact id.
            let contactId = localContact.id;
            // Get the contact extra properties.
            let localContactExtraProperties = localAddressBookItemExtraPropertyManager.getItemExtraPropertiesById(localAddressBookId, contactId);
            // Get the contact resource name (in the form 'people/personId').
            let contactResourceName = localContactExtraProperties.resourceName;
            // Update the local membership map.
            localMembershipMap.get(contactGroupResourceName).add(contactResourceName);
        }
    }

}
