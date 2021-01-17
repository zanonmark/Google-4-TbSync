/*
 * This file is part of Google-4-TbSync.
 * See CONTRIBUTORS.md for details.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 */

"use strict";

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

// Every Object in here will be loaded into the following namespace: TbSync.providers.google. 
const google = TbSync.providers.google;

/**
 * Base class for the TbSync provider interface.
 */
var Base = class {

    /**
     * Called during the load of this provider add-on.
     *
     */
    static async load() {
        // Set the default preferences.
        let branch = Services.prefs.getDefaultBranch("extensions.google-4-tbsync.");
        branch.setIntPref("timeout", 50);
    }

    /**
     * Called during the unload of this provider add-on.
     *
     */
    static async unload() {
    }

    /**
     * Returns the name of this provider for the "Add account" menu of the
     * TbSync account manager.
     *
     * @returns {string}  A name.
     *
     */
    static getProviderName() {
        return TbSync.getString("menu.name", "google");
    }

    /**
     * Returns the version identifier of the TbSync API this provider is using.
     * If it is not matching the version identifier of the TbSync add-on the
     * user has currently installed, this provider add-on is not loaded.
     *
     * @returns {string}  A version identifier.
     *
     */
    static getApiVersion() {
        return "2.4";
    }

    /**
     * Returns the location of an icon for this provider.
     *
     * @param {integer}      size         The size of the requested icon.
     * @param {AccountData}  accountData  The AccountData instance of the
     *                                    account, which is requesting the
     *                                    icon. Optional.
     *
     * @returns {string}  A resource URI to the file to be used as icon.
     *
     */
    static getProviderIcon(size, accountData = null) {
        switch (size) {
            case 16:
                return "resource://google-4-tbsync/skin/icon16.png";
            case 32:
                return "resource://google-4-tbsync/skin/icon32.png";
            default :
                return "resource://google-4-tbsync/skin/icon64.png";
        }
    }

    /**
     * Returns a list of sponsors, sorted by sortIndex.
     * 
     * ::
     * 
     *    return {
     *        "sortIndex": {
     *            name: "Name", 
     *            description: "Something", 
     *            icon: "chrome://path/or/empty",
     *            link: "url://or/empty",
     *        },
     *    }
     *
     * @returns {Object}  A list of sponsors.
     *
     */
    static getSponsors() {
        return {};
    }

    /**
     * Returns the URL of a page with details about contributors (used in the
     * manager UI).
     *
     * @returns {string}  An URL.
     *
     */
    static getContributorsUrl() {
        return "https://github.com/zanonmark/Google-4-TbSync/blob/master/CONTRIBUTORS.md";
    }

    /**
     * Returns the email address of the maintainer (used for bug reports).
     *
     * @returns {string}  An email address.
     *
     */
    static getMaintainerEmail() {
        return "info@marcozanon.com";
    }

    /**
     * Returns the URL of the new account window.
     *
     * The URL will be opened via openDialog() when the user wants to create a
     * new account of this provider.
     *
     * @returns {string}  A chrome URI to the file to be used in the "Create
     *                    account" dialog.
     *
     */
    static getCreateAccountWindowUrl() {
        return "chrome://google-4-tbsync/content/manager/createAccount.xhtml";
    }

    /**
     * Returns the URL to the overlay for the "Edit account" dialog
     * (chrome://tbsync/content/manager/editAccount.xul)
     *
     * The overlay must (!) implement:
     *
     *    ``tbSyncEditAccountOverlay.onload(window, accountData)``
     *
     * which is called each time an account of this provider is viewed/selected
     * in the manager and gets passed the AccountData of the corresponding
     * account.
     *
     * @returns {string}  A chrome URI to overlay for the "Edit account" dialog.
     *
     */
    static getEditAccountOverlayUrl() {
        return "chrome://google-4-tbsync/content/manager/editAccountOverlay.xhtml";
    }

    /**
     * Returns an Object which contains all possible account properties of
     * accounts of this provider, with their default value if not yet stored in
     * the database.
     * 
     * The returned Object uses the property names as keys and their default
     * values as values:
     *
     * ::
     * 
     *    return {
     *        username: "",
     *        host: "",
     *        https: true,
     *        someOtherOption: false,    
     *    }
     *
     * Please also check the standard account properties added by TbSync.
     *
     * @returns {Object}  A list of properties with default values.
     *
     */
    static getDefaultAccountEntries() {
        let row = {
            clientID: "",
            clientSecret: "",
            code: "",
        };
        //
        return row;
    }

    /**
     * Returns an Object which contains all possible folder properties of
     * folders of this provider, with their default value if not yet stored in
     * the database.
     * 
     * @returns {Object}  A list of properties with default values.
     *
     */
    static getDefaultFolderEntries() {
        let folder = {
            UID: "",
            targetID: "",
        };
        //
        return folder;
    }

    /**
     * Called everytime an account of this provider is enabled in the manager
     * UI.
     *
     * @param {AccountData}  accountData  The AccountData instance of the
     *                                    account being enabled.
     *
     */
    static onEnableAccount(accountData) {
    }

    /**
     * Called everytime an account of this provider is disabled in the manager
     * UI.
     *
     * @param {AccountData}  accountData  The AccountData instance of the
     *                                    account being disabled.
     *
     */
    static onDisableAccount(accountData) {
    }

    /**
     * Called everytime an account of this provider is deleted in the manager
     * UI.
     *
     * @param {AccountData}  accountData  The AccountData instance of the
     *                                    account being deleted.
     *
     */
    static onDeleteAccount(accountData) {
    }

    /**
     * Implement this method if this provider should add additional entries
     * to the autocomplete list while typing something into the address field
     * of the message composer.
     *
     * The return value is an Array of Objects and each Object needs the
     * following attributes:
     *
     *   * ``value`` : An email address written like
     *     ``DisplayName <EmailAddress>``.
     *   * ``comment`` : ``Optional`` A comment displayed to the right of the
     *     value in the autocomplete list.
     *   * ``icon`` : ``Optional`` A chrome uri to a 16x16 icon.
     *   * ``style`` : ``Optional`` A CSS class name.
     *
     * When creating directories, you can set:
     *
     *    ``directory.setBoolValue("enable_autocomplete", false);``
     *
     * to disable the default autocomplete for this directory and have full
     * control over the autocomplete.
     *
     * @param {AccountData}  accountData  The AccountData instance of the
     *                                    account being queried.
     * @param {string}       query        The search query.
     *
     * @returns {array}  An array of Objects.
     *
     */
    static async abAutoComplete(accountData, query)  {
        return [];
    }

    /**
     * Returns all folders of the account, sorted in the desired order.
     *
     * The order will be used in the folder list and also as the order to
     * synchronize the resources of the account identified by the passed
     * AccountData.
     *
     * @param {AccountData}  accountData  The AccountData instance for the
     *                                    account for which the sorted list of
     *                                    folders should be returned.
     *
     * @returns {array}  An array of :class:`FolderData` instances in the
     *                   desired order.
     *
     */
    static getSortedFolders(accountData) {
        return accountData.getAllFolders();
    }

    /**
     * Returns the connection timeout for an active server request, so TbSync
     * can append a countdown to the connection timeout, while waiting for an
     * answer from the server. Only syncstates which start with ``send.`` will
     * trigger this, see :class:`SyncData.setSyncState`.
     *
     * @param {AccountData}  accountData  The AccountData instance for the
     *                                    account for which the timeout is
     *                                    being requested.
     *
     * @returns {integer}  A timeout in milliseconds.
     *
     */
    static getConnectionTimeout(accountData) {
        return Services.prefs.getBranch("extensions.google-4-tbsync.").getIntPref("timeout");
    }

    /**
     * Called to synchronize the folder list.
     *
     * Never call this method directly, but use :class:`AccountData.sync`.
     *
     * @param {SyncData}  syncData   The SyncData instance with information 
     *                               regarding the requested synchronization.
     * @param {string}    syncJob    A specific synchronization job, defaults to
     *                               "sync", but can be set via the
     *                               syncDescription (see AccountData.sync or
     *                               FolderData.sync).
     * @param {integer}   syncRunNr  Indicates the n-th number the account is
     *                               being (re-)synchronized due to enforced
     *                               retries. It starts with 1 and is limited by 
     *                               syncDescription.maxAccountReruns.
     *
     * @returns {StatusData}  A :class:`StatusData` instance with information of
     *                        the synchronization (failed / success).
     *
     */
    static async syncFolderList(syncData, syncJob, syncRunNr) {   
        try {
            await google.sync.folderList(syncData);
        }
        catch (e) {
            if ("google-4-tbsync" == e.name) {
                return e.statusData;
            } else {
                Components.utils.reportError(e);
                // Re-throw any other error and let TbSync handle it.
                throw (e);
            }
        }
        //
        return new TbSync.StatusData();
    }

    /**
     * Called to synchronize a folder.
     *
     * Never call this method directly, but use :class:`AccountData.sync` or
     * :class:`FolderData.sync`.
     *
     * @param {SyncData}  syncData   The SyncData instance with information 
     *                               regarding the requested synchronization.
     * @param {string}    syncJob    A specific synchronization job, defaults to
     *                               "sync", but can be set via the
     *                               syncDescription (see AccountData.sync or
     *                               FolderData.sync).
     * @param {integer}   syncRunNr  Indicates the n-th number the account is
     *                               being (re-)synchronized due to enforced
     *                               retries. It starts with 1 and is limited by 
     *                               syncDescription.maxAccountReruns.
     *
     * @returns {StatusData}  A :class:`StatusData` instance with information of
     *                        the synchronization (failed / success).
     *
     */
    static async syncFolder(syncData, syncJob, syncRunNr) {
        try {
            await google.sync.singleFolder(syncData);
        }
        catch (e) {
            if ("google-4-tbsync" == e.name) {
                return e.statusData;
            } else {
                Components.utils.reportError(e);
                // Re-throw any other error and let TbSync handle it.
                throw (e);
            }
        }
        //
        return new TbSync.StatusData();
    }

}

/**
 * This provider is implementing the StandardFolderList class instead of the
 * FolderList class.
 */
var StandardFolderList = class {

    /**
     * Called before the context menu of the folderlist is shown, allows to
     * show / hide custom menu options based on the selected folder. During an
     * active synchronization, folderData will be null and the folder list will
     * be disabled.
     *
     * @param {nsIDOMWindow}  window      The Object of the account settings
     *                                    window.
     * @param {FolderData}    folderData  The FolderData instance of the
     *                                    selected folder.
     *
     */
    static onContextMenuShowing(window, folderData) {
    }

    /**
     * Returns the icon for a folder to be shown in the folderlist.
     *
     * @param {FolderData}  folderData  The FolderData instance of the folder
     *                                  for which the icon is requested.
     *                                   
     * @returns {string}  A Chrome URI of the icon.
     *
     */
    static getTypeImage(folderData) {
        switch (folderData.getFolderProperty("targetType")) {
            case "addressbook":
                return "chrome://tbsync/skin/contacts16.png";
        }
    }

    /**
     * Returns the display name for a folder to be shown in the folderlist.
     *
     * @param {FolderData}  folderData  The FolderData instance of the folder
     *                                  for which the display name is requested.
     *                                   
     * @returns {string}  A display name of the folder.   
     *
     */
    static getFolderDisplayName(folderData) {
        return folderData.getFolderProperty("foldername");
    }

    /**
     * Returns the attributes for the *readonly* `menuitem <https://dxr.mozilla.org/comm-central/source/comm/mailnews/addrbook/public/nsIAbDirectory.idl>`_
     * element of the ACL selector for a folder to be shown in the folderlist.
     * You can define any available attribute (label, disabled, hidden, style, 
     * ...) by returning an Object which uses the attribute names as keys and
     * the attribute values as values. For example:
     * 
     * ::
     * 
     *    return {
     *        label: "Readonly access",
     *        disabled: false,
     *    }
     *
     * If both (RO+RW) do not return any attributes, the ACL menu is not
     * displayed at all.
     *
     * @param {FolderData}  folderData  The FolderData instance of the folder for
     *                                  which the attributes for the ACL RO XUL
     *                                  element are requested.
     *                                   
     * @returns {Object}  A list of attributes and their values for the ACL RO
     *                    XUL element.
     *
     */
    static getAttributesRoAcl(folderData) {
        return null;
    }

    /**
     * Returns the attributes for the *read/write*
     * `menuitem <https://dxr.mozilla.org/comm-central/source/comm/mailnews/addrbook/public/nsIAbDirectory.idl>`_
     * element of the ACL selector for a folder to be shown in the folderlist.
     * You can define any available attribute (label, disabled, hidden, style, 
     * ...) by returning an Object which uses the attribute names as keys and
     * the attribute values as values. For example:
     * 
     * ::
     * 
     *    return {
     *        label: "Read/Write access",
     *        disabled: true,
     *    }
     *
     * If both (RO+RW) do not return any attributes, the ACL menu is not
     * displayed at all.
     *
     * @param {FolderData}  folderData  The FolderData instance of the folder
     *                                  for which the attributes for the ACL RW
     *                                  XUL element are requested.
     *                                   
     * @returns {Object}  A list of attributes and their values for the ACL RW
     *                    XUL element.
     *
     */
    static getAttributesRwAcl(folderData) {
        return null;
    }

}

var TargetData = class {

    /**
     * TargetData constructor.
     *
     * @param {FolderData}  folderData  The FolderData instance of the folder
     *                                  for which this TargetData instance is
     *                                  being created.
     *
     */
    constructor(folderData) {            
        this._folderData = folderData;
    }
    
    /**
     * Check if the target object of this TargetData exists in the local
     * storage.
     *
     * @returns {boolean}  True if target exists.
     *
     */
    hasTarget() {
        let target = this._folderData.getFolderProperty("targetID");
        let directory = google.addressbook.getDirectoryFromDirectoryUID(target);
        //
        if ((null !== directory) && (directory instanceof Components.interfaces.nsIAbDirectory)) {
            return true;
        }
        //
        return false;
    }

    /**
     * Returns the actual target object (for example a
     * `nsIAbDirectory <https://dxr.mozilla.org/comm-central/source/comm/mailnews/addrbook/public/nsIAbDirectory.idl>`_).
     * If the target does not exist, it should be created. 
     *
     * .. note::
     *    The thrown error message will be used as a status and TbSync will
     *    use ``status.<Error.message>`` from your string bundle (see
     *    :class:`Base.getStringBundleUrl`) for the actual error / status 
     *    message.
     *
     * @returns {Object}  Whatever you want to use as target object for
     *                    this TargetData.
     *
     * @throws {Error}    A reason (why the target could not be created).
     *
     */
    async getTarget() { 
        let target = this._folderData.getFolderProperty("targetID");
        let directory = google.addressbook.getDirectoryFromDirectoryUID(target);
        //
        if (!directory) {
            let dirPrefId = MailServices.ab.newAddressBook(this._folderData.getFolderProperty("foldername"), "", 2);
            let directory = MailServices.ab.getDirectoryFromId(dirPrefId);
            //
            if (!directory) {
                throw new Error("notargets");
            }
            //
            this._folderData.setFolderProperty("targetID", directory.UID);
        }
        //
        return directory;
    }
    
    /**
     * Removes the target from the local storage. If it does not exist, return
     * silently. A call to :class:`TargetData.hasTarget()` should return
     * ``false``, after this has been executed.
     *
     */
    removeTarget() {
        let target = this._folderData.getFolderProperty("targetID");
        let directory = google.addressbook.getDirectoryFromDirectoryUID(target);
        //
        try {
            if (directory) {
                MailServices.ab.deleteAddressBook(directory.URI);
            }
        }
        catch (e) {
        }
    }

    /**
     * Disconnects the target in the local storage from this TargetData, but
     * does not delete it, so it becomes a stale "left over". A call to
     * :class:`TargetData.hasTarget()` should return ``false``, after this has
     * been executed.
     * 
     */
    disconnectTarget() {
    }  
    
    /**
     * Getter / setter for the target name.
     *
     * @throws {Error}  A reason (why the target name could not be set /
                        retrieved).
     *
     */
    set targetName(newName) {
        let target = this._folderData.getFolderProperty("targetID");
        let directory = google.addressbook.getDirectoryFromDirectoryUID(target);
        //
        if (directory && newName) {
            directory.dirName = newName;
        }     
    }
    get targetName() {
        let target = this._folderData.getFolderProperty("targetID");
        let directory = google.addressbook.getDirectoryFromDirectoryUID(target);
        //
        if (directory) {
            return directory.dirName;
        }
        //
        throw new Error("notargets");
    }
    
    /**
     * The readonly property of the associated folder has been changed via the
     * TbSync UI.
     *
     * .. note::
     *    This might be changed to a general FolderProperty observer.
     *
     * @param {boolean}  value  The current value of the ``downloadonly`` folder
     *                          property.
     *
     */    
    setReadOnly(value) {
    }

}

// This is just for the documentation generated from this file to have a
// "TargetData". You do not need to extend your own class of course and just
// name it as needed directly.
var TargetData_addressbook = class extends TargetData {
}

Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/sync.js", this, "UTF-8");
Services.scriptloader.loadSubScript("chrome://google-4-tbsync/content/includes/addressbook.js", this, "UTF-8");
