# @dxatscale/browserforce

> sf plugin for browser automation


Unlike the [Scratch Org Definition Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm) which can only be used **on the creation of a scratch org** (`sfdx force:org:create -f config/scratch-def.json`),
the _Browserforce Configuration_ allows to "shape" **any org**, (e.g. scratch org, sandbox or production org) with **similar preferences and unofficial preferences** that are not (yet) available in the _Scratch Org Definition Configuration_ or as _Metadata_ (`sfdx browserforce:apply -f config/setup-admin-login-as-any.json -u myOrg@example.com`).

Further benefits:

- comfortable configuration using JSON Schema (similar to the [Scratch Org Definition Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm))
- idempotency of the `apply` command only applies what's necessary and allows re-execution (concept similar to [terraform](https://www.terraform.io/docs/commands/apply.html))
- browser automation powered by [Puppeteer](https://github.com/GoogleChrome/puppeteer) (Chromium)
- implement your own custom preferences (a.k.a. plugins; to be improved)

# Installation

There are several different methods to install `sfdx-browserforce-plugin`:

```console
# as an sfdx plugin globally
sf plugins:install @dxatscale/browserforce

```

# Usage

Depending on your choice of installation, you can find the `browserforce` namespace:

```console
# globally in the sfdx cli
sf browserforce --help

```

```console
$ sf browserforce --help
browser automation

USAGE
  $ sf browserforce:COMMAND

COMMANDS
  browserforce:apply  apply a plan from a definition file
  browserforce:plan   retrieve state and generate plan file
```

Both the `browserforce:apply` and `browserforce:plan` commands expect a config file and a target username or alias for the org.

# Example

To enable `Setup -> Security Controls -> Login Access Policies -> Administrators Can Log in as Any User`, the config file (here: `./config/setup-admin-login-as-any.json`) should look like this:

```json
{
  "$schema": "https://raw.githubusercontent.com/amtrack/sfdx-browserforce-plugin/master/src/plugins/schema.json",
  "settings": {
    "security": {
      "loginAccessPolicies": {
        "administratorsCanLogInAsAnyUser": true
      }
    }
  }
}
```

Tip: If you use _Visual Studio Code_, you can leverage tab completion to build the config (powered by the JSON Schema).

Next apply the config:

```console
$ sfdx browserforce:apply -f ./config/setup-admin-login-as-any.json --targetusername myOrg@example.com
  logging in... done
  Applying definition file ./config/setup-admin-login-as-any.json to org myOrg@example.com
  [Security] retrieving state... done
  [Security] changing 'loginAccessPolicies' to '{"administratorsCanLogInAsAnyUser":true}'... done
  logging out... done
```

# Supported Settings

See the [JSON Schema](src/plugins/schema.json) for all supported settings.

Here is a full blown example showing most of the supported settings in action:

```json
{
  "$schema": "https://raw.githubusercontent.com/amtrack/sfdx-browserforce-plugin/master/src/plugins/schema.json",
  "settings": {
    "communities": { "enabled": true },
    "customerPortal": { "enabled": true },
    "deferSharingCalculation": {
      "suspend": true
    },
    "highVelocitySalesSettings": {
      "setUpAndEnable": true
    },
    "homePageLayouts": {
      "homePageLayoutAssignments": [
        {
          "profile": "Standard User",
          "layout": "Home Page Default"
        },
        {
          "profile": "System Administrator",
          "layout": "DE Default"
        }
      ]
    },
    "picklists": {
      "picklistValues": [
        {
          "metadataType": "StandardValueSet",
          "metadataFullName": "LeadSource",
          "value": "Partner",
          "newValue": "Partner Referral"
        },
        {
          "metadataType": "CustomField",
          "metadataFullName": "Vehicle__c.Features__c",
          "value": "CD",
          "newValue": "Media",
          "absent": true
        },
        {
          "metadataType": "CustomField",
          "metadataFullName": "Vehicle__c.Features__c",
          "value": "CD",
          "newValue": "AC",
          "active": false
        }
      ]
    },
    "recordTypes": { "deletions": [{ "fullName": "Vehicle__c.SUV" }] },
    "salesforceToSalesforce": { "enabled": true },
    "security": {
      "loginAccessPolicies": { "administratorsCanLogInAsAnyUser": true },
      "sharing": { "enableExternalSharingModel": true }
    },
    "companyInformation": {
      "defaultCurrencyIsoCode": "English (Ireland) - EUR"
    }
  }
}
```

# Environment Variables

- `BROWSER_DEBUG` run in non-headless mode (default: `false`)
- `BROWSERFORCE_NAVIGATION_TIMEOUT_MS`: adjustable for slow internet connections (default: `90000`)
- `BROWSERFORCE_RETRY_MAX_RETRIES`: number of retries on failures opening a page (default: `4`)
- `BROWSERFORCE_RETRY_TIMEOUT_MS`: initial time between retries in exponential mode (default: `4000`)

# Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for getting started.

# Sponsors

- [PARX](https://www.parx.com)
- [IPfolio](https://www.ipfolio.com)

# License

MIT © [dxatscale](@dxatscale)
