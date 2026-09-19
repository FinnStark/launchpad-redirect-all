# launchpad-redirect

Redirects the exports of all your sectors to one sector with a single click.

1. Open the planet map (main menu > Campaign, or in game).
2. Select the sector that should receive the resources (on the map or in the "Sectors" list).
3. Click "Redirect here" (top right, left of the "Sectors" panel).

Every owned sector on that planet gets the selected sector as export destination
(launchpad or not: the game does not tell us which unloaded sectors have one).

## Credits

- Author: FinnStark
- Based on the original launchpad-redirect mod by QmelZ.

Checked against the Mindustry v160.4 sources.

## Translations

Texts are in `bundles/`. The game language decides which file is used, the
default `bundle.properties` (English) is the fallback. To add a language, copy
`bundle.properties` to `bundle_<locale>.properties` (same names as the vanilla
game, e.g. `bundle_nl.properties`) and translate the values.
Avoid apostrophes in the texts: they are special characters in `{0}` messages.
