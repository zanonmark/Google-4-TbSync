# Google-4-TbSync

This provider add-on adds Google synchronization capabilities to [TbSync](https://github.com/jobisoft/TbSync).

Only contacts and contact groups are currently managed, using Google's People API. There's currently no plan on supporting calendars. Please see [FAQ](https://github.com/zanonmark/Google-4-TbSync/wiki/FAQ-(Frequently-Asked-Questions)) for details.

The work is partly based on [EteSync4TbSync](https://github.com/etesync/EteSync-4-TbSync), [DAV4TbSync](https://github.com/jobisoft/DAV-4-TbSync), [gContactSync](https://github.com/jdgeenen/gcontactsync) and many advices by [John Bieling](https://github.com/jobisoft) himself.

## Current status and roadmap / Known limitations

What already works:
* Google-to-Thunderbird creation / update / deletion of contacts;
* Google-to-Thunderbird creation / update / deletion of contact groups;
* Google-to-Thunderbird creation / update / deletion of contact group members.
* Thunderbird-to-Google creation / update / deletion of contacts;
* Thunderbird-to-Google creation / update / deletion of contact groups;

What is missing:
* Thunderbird-to-Google creation / update / deletion of contact group members. Please note that for this to be fixed the undergoing port of TbSync to WebExtension must be completed first: only then this add-on will be partially rewritten and will be able to fully manage contact group memberships.

A full working version could probably be ready by mid 2025.

**Thunderbird 102+ users please note**. Google-4-TbSync 0.4.x runs much slower than 0.3.x (in my tests it performs 7x slower!). This is a known issue, please see [FAQ](https://github.com/zanonmark/Google-4-TbSync/wiki/FAQ-(Frequently-Asked-Questions)) for details. Upgrading to 0.5.x will greatly improve things, especially when updating an addressbook.

## How to use it

You first need to [install TbSync](https://addons.thunderbird.net/addon/tbsync) and [generate your own Google Cloud Console project credentials](https://github.com/zanonmark/Google-4-TbSync/wiki/How-to-generate-your-own-Google-Cloud-Console-project-credentials). Then do one of the following:

### Download an official release

.xpi packages can be downloaded from [Thunderbird Add-ons](https://addons.thunderbird.net/addon/google-4-tbsync), or through the _Thunderbird_ > _Tools_ > _Add-ons_ menu.

### Test the latest code

1. [Grab the latest .zip package](https://github.com/zanonmark/Google-4-TbSync/archive/refs/heads/main.zip).
2. Unzip it wherever you want.
3. Load it as a temporary add-on from _Thunderbird_ > _Tools_ > _Add-ons_ > cog icon > _Debug Add-ons_ > _Load Temporary Add-on_ (pick _manifest.json_ for example).
4. Test it, preferably using the _Read-only mode_ option (see below).

## Warning

* Even if early reports seem to confirm the add-on is working properly, the project is still in its early development stage: **do regular backups of both your Google and Thunderbird address books!**
* **You are strongly suggested to use the [_Read-only mode_ option](https://github.com/zanonmark/Google-4-TbSync/wiki/Account-options#read-only-mode)**.

## Additional information

Please refer to the [wiki section](https://github.com/zanonmark/Google-4-TbSync/wiki) for other useful information, including [FAQ](https://github.com/zanonmark/Google-4-TbSync/wiki/FAQ-(Frequently-Asked-Questions)), guides and user contributions.
