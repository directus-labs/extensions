# Directus Migration Module

Migrate the current Directus instance to another location with ease, using this simple module.

![Migration Module Banner](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/migration-bundle/docs/migration-module.jpg)

## Usage

Once installed you can enable the navigation menu item in your Project Settings or go straight to the module page at `/admin/migration`.

To get started, enter the destination URL and admin token into the fields provided, then click <strong>Check</strong>. This will compare both Directus platform and see if they are compatible.

_Please make sure the destination instance is on the same version and the same database platform as the source instance._

If valid, you can start the "Dry Run" migration straight away or customize the migration as required.

Run the migration by unchecking the Dry Run checkbox and click start. The process runs in the background so you can close your browser and it will notify you when the migration is complete. Normally, a small to medium project will only be a 1 - 2 minutes. Projects will large file libraries will take much longer.

![Migration Live Updates](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/migration-bundle/docs/migration-module-live-updates.jpg)

### Incomatible Schema

The destination instance must be the same version and the same database platform as the source instance. This can be overriden using the **Force** checkbox which appears when this error occurs.

This is not recommended and will most likely need further intervention.

### Failed Migration

If the migration fails, don't worry, simply run the migration again. Existing content is skipped so it will continue where it left off.

## Requirements

- 2x Directus instances on at least 11.1.2+ using the same database platform.
- Admin user and admin token from destination.

_For larger projects, migrations naturally use significant bandwidth. Limits have been placed on API calls to ensure the destination is not overwhelmed._

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to Customize the Migration

1. On the migration module, add the destination server and token and click **Check**
2. If valid, the Migration options field will appear. Click this to reveal what is migrated
3. Uncheck any sections to exclude from the migration
4. Start the migration

![Customise the module](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/migration-bundle/docs/migration-module-customize.jpg)


## Permissions

This extension requires admin privilages on both instances to ensure all data is accessible and writable.
