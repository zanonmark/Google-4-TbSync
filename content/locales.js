/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */
var { ExtensionParent } = ChromeUtils.importESModule(
    "resource://gre/modules/ExtensionParent.sys.mjs"
);
var tbsyncExtension = ExtensionParent.GlobalManager.getExtension(
    "tbsync@jobisoft.de"
);
var { TbSync } = ChromeUtils.importESModule(
    `chrome://tbsync/content/tbsync.sys.mjs?${tbsyncExtension.manifest.version}`
);

TbSync.localizeOnLoad(window, "google");
