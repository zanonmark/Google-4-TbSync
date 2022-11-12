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
    messenger.contacts.onCreated.addListener( (node, id) => addressBookEventManager.onContactCreated(node, id) );
    messenger.contacts.onUpdated.addListener( (node, changedProperties) => addressBookEventManager.onContactUpdated(node, changedProperties) );
    messenger.contacts.onDeleted.addListener( (parentId, id) => addressBookEventManager.onContactDeleted(parentId, id) );
    messenger.mailingLists.onCreated.addListener( (node) => addressBookEventManager.onMailingListCreated(node) );
    messenger.mailingLists.onUpdated.addListener( (node) => addressBookEventManager.onMailingListUpdated(node) );
    messenger.mailingLists.onDeleted.addListener( (parentId, id) => addressBookEventManager.onMailingListDeleted(parentId, id) );
    messenger.mailingLists.onMemberAdded.addListener( (node) => addressBookEventManager.onMailingListMemberAdded(node) );
    messenger.mailingLists.onMemberRemoved.addListener( (parentId, id) => addressBookEventManager.onMailingListMemberRemoved(parentId, id) );
}

main();
