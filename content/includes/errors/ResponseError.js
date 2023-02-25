/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

class ResponseError extends Error { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

    /* */

    constructor(...args) {
        // Pass the arguments (including vendor specific ones) to parent constructor.
        super(...args);
        // Maintain proper stack trace for where our error was thrown from (only available on V8).
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ResponseError);
        }
        // Set the internal name.
        this.name = "ResponseError";
    }

}
