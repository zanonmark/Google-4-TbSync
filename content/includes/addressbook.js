/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

var addressbook = {

    getDirectoryFromDirectoryUID: function(UID) {
        let directories = MailServices.ab.directories;
        //
        while (UID && directories.hasMoreElements()) {
            let directory = directories.getNext();
            //
            if (directory instanceof Components.interfaces.nsIAbDirectory) {
                if (UID == directory.UID) {
                    return directory;
                }
            }
        }
        //
        return null;
    },

}
