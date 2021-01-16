# Google-4-TbSync

This provider add-on adds Google synchronization capabilities to TbSync. Only contacts are currently managed, using Google's People API.

The work is based on [EteSync4TbSync](https://github.com/etesync/EteSync-4-TbSync), [DAV4TbSync](https://github.com/jobisoft/DAV-4-TbSync) and advices by John Bieling himself.

## Please note

In order to user this Thunderbird add-on, a Google API Console project is needed, and specifically its Client ID and Client Secret properties.

As Google forbids open source projects to include such credentials (because they would be in clear), every user must create a Google API Console on its own.

The basic steps are the following.
* Login to [Google API Console](https://console.developers.google.com).
* Create a new project and name it whatever you want, e.g.: "MyGoogle4TbSync".
* In the Credentials page, create a OAuth 2.0 Client ID with:
  * application type: Desktop app;
  * name: whatever you want.
* Write down the Client ID and Client Secret properties displayed on screen.
* In the OAuth consent screen page, create a new consent screen with:
  * user type: external.
* Publish the app; otherwise only users specified in Test users will be able to
  use the add-on (note: users added this way cannot be removed).
