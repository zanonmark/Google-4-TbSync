/*
 * This file is part of GOOGLE-4-TbSync.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

var addressbook = {
  getDirectoryFromDirectoryUID: function(UID) {
    let directories = MailServices.ab.directories;
    while (UID && directories.hasMoreElements()) {
      let directory = directories.getNext();
      if (directory instanceof Components.interfaces.nsIAbDirectory) {
        if (directory.UID == UID) return directory;
      }
    }       
    return null;
  },
}
