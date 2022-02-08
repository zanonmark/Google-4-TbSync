/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

if ("undefined" === typeof IllegalArgumentError) {
    Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/IllegalArgumentError.js", this, "UTF-8");
}

class Logger {

/* FIXME: disabled as it is still not fully supported.
    _verboseLogging = false;
*/

    constructor(verboseLogging) {
// FIXME: the next two lines are necessary as a workaround for a TbSync's bug.
if ("true" === verboseLogging) verboseLogging = true;
if ("false" === verboseLogging) verboseLogging = false;
        if ("boolean" != typeof verboseLogging) {
            throw new IllegalArgumentError("Invalid 'verboseLogging': not a boolean.");
        }
        //
        this._verboseLogging = verboseLogging;
    }

    getVerboseLogging() {
        return this._verboseLogging;
    }

    /* */

    /* Logging. */

    log0(message) {
        console.log(message);
    }

    log1(message) {
        if (this.getVerboseLogging()) {
            this.log0(message);
        }
    }

}

var logger = null;
