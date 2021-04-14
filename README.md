# Google-4-TbSync

This provider add-on adds Google synchronization capabilities to [TbSync](https://github.com/jobisoft/TbSync). Only contacts and contact groups are currently managed, using Google's People API.

The work is based on [EteSync4TbSync](https://github.com/etesync/EteSync-4-TbSync), [DAV4TbSync](https://github.com/jobisoft/DAV-4-TbSync), [gContactSync](https://github.com/jdgeenen/gcontactsync) and advices by John Bieling himself.

### Current status and roadmap

What already works:
* Google-to-Thunderbird creation / update / deletion of contact groups;
* Google-to-Thunderbird creation / update / deletion of contacts;
* Google-to-Thunderbird creation / update / deletion of contact group members.
* Thunderbird-to-Google creation / update / deletion of contact groups;
* Thunderbird-to-Google creation / update / deletion of contacts;

What is missing:
* Thunderbird-to-Google creation / update / deletion of contact group members. Please note that for this to be fixed the undergoing port of TbSync to WebExtension must be completed first: only then this add-on will be partially rewritten and will be able to fully manage contact group memberships.

A full working version could probably be ready by June / July 2021.

### How to use it

You first need to install [TbSync](https://addons.thunderbird.net/addon/tbsync) and [generate your own Google API Console project credentials](https://github.com/zanonmark/Google-4-TbSync/wiki/How-to-generate-your-own-Google-API-Console-project-credentials). Then do one of the following:

#### Download an official release

.xpi packages can be downloaded from [Thunderbird Add-ons](https://addons.thunderbird.net/addon/google-4-tbsync), or through the Thunderbird > Tools > Add-ons menu.

#### Test the latest code

* [Grab the latest .zip package](https://github.com/zanonmark/Google-4-TbSync/archive/refs/heads/main.zip).
* Unzip it wherever you want.
* Load it as a temporary add-on from Thunderbird > Tools > Add-ons > cog icon > Debug Add-ons > Load Temporary Add-on (pick manifest.json for example).
* Test it, preferably in read-only mode (see below).

### Warning

1. Even if early reports seem to confirm the add-on is working properly, the project is still in its early development stage: **backup both your Google and Thunderbird address books before running the software!**
2. **You are strongly suggested to enable the "Read-only mode" flag**: not only because the software may still have bugs, but also because the Google address book structure is far richer than the one in Thunderbird, and using a bi-directional synchronization may lead to some data being lost or scrambled. You'd better do the full contact management on Google and then make a Google-to-Thunderbird read-only synchronization to update your local Thunderbird address book.

### Additional information

Please refer to the [wiki section](https://github.com/zanonmark/Google-4-TbSync/wiki) for other useful information.
