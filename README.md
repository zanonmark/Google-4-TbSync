# Google-4-TbSync

This provider add-on adds Google synchronization capabilities to TbSync. Only contacts and contact groups are currently managed, using Google's People API.

The work is based on [EteSync4TbSync](https://github.com/etesync/EteSync-4-TbSync), [DAV4TbSync](https://github.com/jobisoft/DAV-4-TbSync), [gContactSync](https://github.com/jdgeenen/gcontactsync) and advices by John Bieling himself.

### Why another Google synchronization add-on

Google has currently 3 ways to make contact synchronizations:
1. Through the CardDAV protocol.
This should be the preferred choice, because it's a standard protocol and there are already many interfaces for it.
But the support by Google is broken, as it doesn't support synchronizing contact groups (aka labels).
So, this is a no-go unless Google fixes it (which seems to be: never, as the ticket has been open for years).
2. Through the Google Contacts API.
This is what the gContactSync add-on was doing.
But:
a) the user interface of gContactSync is currently broken, and will probably not be fixed;
b) even if it was, the Google Contacts API itself is deprecated and will stop working on June 15th 2021.
And this leads us to the last method,
3. Through the Google People API.
This is exactly what my Google-4-TbSync add-on is doing.

### Current status

What already works:
* Google-to-Thunderbird creation / update / deletion of contact groups;
* Google-to-Thunderbird creation / update / deletion of contacts;
* Google-to-Thunderbird creation / update / deletion of contact group members.
* Thunderbird-to-Google creation / update / deletion of contact groups;
* Thunderbird-to-Google creation / update / deletion of contacts;

What is missing:
* Thunderbird-to-Google creation / update / deletion of contact group members. Please note that for this to be fixed the undergoing port of TbSync to WebExtension must be completed first: only then this add-on will be partially rewritten and will be able to fully manage contact group memberships.

### Warning

The project is still in its early development stage. **Backup both your Google and Thunderbird address books before running the software!**

Early reports seem to confirm the add-on is working.

### About Google API Console project credentials

In order to use this Thunderbird add-on, a Google API Console project is needed, and specifically its _Client ID_ and _Client Secret_ properties.

As Google forbids open source projects to include such credentials (because they would be in clear), **every user must create a Google API Console project on his own before using this add-on**.

The basic steps are the following.
* Login to [Google API Console](https://console.developers.google.com).
* Create a new project with:
  * _Project name_: whatever you want, e.g.: "YOURNAME-Google-4-TbSync".
* In the _Credentials_ page, create a OAuth Client ID with:
  * _Application type_: Desktop app;
  * _Name_: whatever you want.
* Write down the Client ID and Client Secret properties displayed on screen (and keep them safe!).
* In the _OAuth consent screen_ page, create a new consent screen with:
  * _User type_: external;
  * _App name_: whatever you want, but it would be appropriate to reuse the project name, e.g.: "YOURNAME-Google-4-TbSync";
  * _User support email_: your email address;
  * _Developer contact information_: your email address;
  * scopes: "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email" (which will be displayed in _Your non-sensitive scopes_) and "https://www.googleapis.com/auth/contacts" (which will be displayed in _Your sensitive scopes_);
  * _Test users_: your email address (just to test that everything works fine) and all other email addresses you want to use this add-on.
* In the _Library_ page, search for the _Google People API_ card and enable the corresponding API.
