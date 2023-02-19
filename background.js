/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

async function main() {
    await messenger.BootstrapLoader.registerChromeUrl([ 
        [
            "content",
            "google-4-tbsync",
            "content/",
        ],
        [
            "resource",
            "google-4-tbsync",
            ".",
        ],
    ]);
    //
    await messenger.BootstrapLoader.registerBootstrapScript("chrome://google-4-tbsync/content/bootstrap.js");
    //
    messenger.contacts.onCreated.addListener( (node) => localAddressBookEventManager.onContactCreated(node) );
    messenger.contacts.onUpdated.addListener( (node, changedProperties) => localAddressBookEventManager.onContactUpdated(node, changedProperties) );
    messenger.contacts.onDeleted.addListener( (parentId, id) => localAddressBookEventManager.onContactDeleted(parentId, id) );
    messenger.mailingLists.onCreated.addListener( (node) => localAddressBookEventManager.onMailingListCreated(node) );
    messenger.mailingLists.onUpdated.addListener( (node) => localAddressBookEventManager.onMailingListUpdated(node) );
    messenger.mailingLists.onDeleted.addListener( (parentId, id) => localAddressBookEventManager.onMailingListDeleted(parentId, id) );
    messenger.mailingLists.onMemberAdded.addListener( (node) => localAddressBookEventManager.onMailingListMemberAdded(node) );
    messenger.mailingLists.onMemberRemoved.addListener( (parentId, id) => localAddressBookEventManager.onMailingListMemberRemoved(parentId, id) );
// FIXME: temporary.
localAddressBookEventManager.clearEventData("53e04e69-57c7-4152-a313-16507e8ad9b6");
//~ localAddressBookEventManager.disableEvents("53e04e69-57c7-4152-a313-16507e8ad9b6");
// FIXME: temporary.
let localAddressBookItemExtraPropertyManager = new LocalAddressBookItemExtraPropertyManager();
localAddressBookItemExtraPropertyManager.loadLocalAddressBookItemExtraPropertyMap();
//~ localAddressBookItemExtraPropertyManager.setItemExtraProperties("rubr", "contact/12345", "88888", "67890");
//~ console.log(localAddressBookItemExtraPropertyManager);
//~ console.log(localAddressBookItemExtraPropertyManager.getItemExtraProperties("rubr", "contact/12345"));
//~ console.log(localAddressBookItemExtraPropertyManager.getItemResourceNameSet("rubr"));
//~ localAddressBookItemExtraPropertyManager.deleteItemExtraProperties("rubr", "contact/12345");
//~ console.log(localAddressBookItemExtraPropertyManager);
localAddressBookItemExtraPropertyManager.deleteItemExtraProperties("53e04e69-57c7-4152-a313-16507e8ad9b6");
localAddressBookItemExtraPropertyManager.saveLocalAddressBookItemExtraPropertyMap();
// FIXME: temporary.
messenger.browserAction.onClicked.addListener(async (tab, info) => {
    accountData = new Map();
    accountData.set("clientID", "*** INSERT HERE ***");
    accountData.set("clientSecret", "*** INSERT HERE ***");
    accountData.set("refreshToken", "");
    accountData.set("includeSystemContactGroups", true);
    accountData.set("useFakeEmailAddresses", true);
    accountData.set("readOnlyMode", false);
    accountData.set("verboseLogging", true);
    syncData = {
        accountData: accountData,
        target: "53e04e69-57c7-4152-a313-16507e8ad9b6",
    };
    //~ // TEST #1.
    //~ let peopleAPI = new PeopleAPI(accountData);
    //~ peopleAPI.checkConnection();
    // TEST #2.
    //~ let addressBooks = await messenger.addressBooks.list(false);
    //~ console.log(addressBooks);
    // TEST #3.
    //~ console.log("TEST:");
    //~ console.log(localAddressBookEventManager);
    //~ console.log(localAddressBookEventManager.getCreatedContactIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getUpdatedContactIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getDeletedContactIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getCreatedMailingListIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getUpdatedMailingListIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getDeletedMailingListIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6"));
    //~ console.log(localAddressBookEventManager.getAddedMailingListMemberIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6", "012baae5-dcbc-4a81-8680-2726ada64554"));
    //~ console.log(localAddressBookEventManager.getRemovedMailingListMemberIdSet("53e04e69-57c7-4152-a313-16507e8ad9b6", "012baae5-dcbc-4a81-8680-2726ada64554"));
    // TEST #4.
    AddressBookSynchronizer.synchronize(syncData);
} );
}

main();
