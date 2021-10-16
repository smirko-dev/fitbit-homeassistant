# Fitbit Homeassistant

![languages](https://img.shields.io/badge/languages-JavaScript%20|%20CSS-blue)
![platform](https://img.shields.io/badge/platforms-Ionic%20|%20Versa%20|%20Versa%202%20|%20Versa%20Lite%20|%20Versa%203%20|%20Sense-silver)
![version](https://img.shields.io/badge/version-%200.3.0-green)
[![](https://img.shields.io/badge/license-MIT-green)](https://github.com/smirko-dev/fitbit-homeassistant/blob/main/LICENSE)
[![FitbitBuild Actions Status](https://github.com/smirko-dev/fitbit-homeassistant/workflows/FitbitBuild/badge.svg)](https://github.com/smirko-dev/fitbit-homeassistant/actions)
[![CodeQL Actions Status](https://github.com/smirko-dev/fitbit-homeassistant/workflows/CodeQL/badge.svg)](https://github.com/smirko-dev/fitbit-clohomeassistantckface/actions)

## Description

This app allows to control [Home Assistant](https://www.home-assistant.io/) entities from a [Fitbit watch](https://www.fitbit.com/global/eu/home).

Supported languages: de-DE, en-US.

Currently only entities are supported which can be turned on and off.

App icon is from https://icon-icons.com/de/symbol/home-assistant/138491 ([Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)).

### Requirements

Homeassistant accessible via HTTPS. The [Fetch API](https://dev.fitbit.com/build/reference/companion-api/fetch/) doesn't support HTTP!.

A homeassistant token, described in [Authentication](https://www.home-assistant.io/docs/authentication/).

### Settings

- URL (text)
- Token (text)
- Entities (list of texts)

*Entities should be added by ID and not by name!*

## Screenshots

![App](screenshots/app.png)

## How to build

Choose SDK version

| SDK | Device                            |
|-----|-----------------------------------|
| 4   | Versa, Versa Lite, Versa 2, Ionic |
| 5   | Versa 3, Sense                    |

```
cp package.sdkX.json package.json
```

```
git clone git@github.com:smirko-dev/fitbit-homeassistant.git
cd fitbit-homeassistant
npm add --also=dev @fitbit/sdk
npm add --also=dev @fitbit/sdk-cli
npx fitbit-build generate-appid
npx fitbit-build
```
