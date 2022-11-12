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
    messenger.contacts.onCreated.addListener(addressBookEventManager.onContactCreated);
    messenger.contacts.onUpdated.addListener(addressBookEventManager.onContactUpdated);
    messenger.contacts.onDeleted.addListener(addressBookEventManager.onContactDeleted);
    messenger.mailingLists.onCreated.addListener(addressBookEventManager.onMailingListCreated);
    messenger.mailingLists.onUpdated.addListener(addressBookEventManager.onMailingListUpdated);
    messenger.mailingLists.onDeleted.addListener(addressBookEventManager.onMailingListDeleted);
    messenger.mailingLists.onMemberAdded.addListener(addressBookEventManager.onMailingListMemberAdded);
    messenger.mailingLists.onMemberRemoved.addListener(addressBookEventManager.onMailingListMemberRemoved);
}

main();
