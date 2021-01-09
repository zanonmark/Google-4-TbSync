/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

const google = TbSync.providers.google;

var tbSyncEditAccountOverlay = {

    onload: function(window, accountData) {
        this.accountData = accountData;
    },

};
