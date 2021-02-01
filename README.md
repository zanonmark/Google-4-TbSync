# Google-4-TbSync

This provider add-on adds Google synchronization capabilities to TbSync. Only contacts are currently managed, using Google's People API.

The work is based on [EteSync4TbSync](https://github.com/etesync/EteSync-4-TbSync), [DAV4TbSync](https://github.com/jobisoft/DAV-4-TbSync), [gContactSync](https://github.com/jdgeenen/gcontactsync) and advices by John Bieling himself.

### Please note

In order to use this Thunderbird add-on, a Google API Console project is needed, and specifically its _Client ID_ and _Client Secret_ properties.

As Google forbids open source projects to include such credentials (because they would be in clear), **every user must create a Google API Console project on its own before using this add-on**.

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
  * scopes: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts" (which will be displayed in _Your sensitive scopes_);
  * _Test users_: your email address (just to test that everything works fine) and all other email addresses you want to use this add-on.
* In the _Library_ page, search for the _Google People API_ card and enable the corresponding API.
