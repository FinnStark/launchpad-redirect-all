// ---------------------------------------------------------------------------
// Launchpad Redirect (Mindustry v8 - checked against the build 160.4 sources)
//
// Adds a "Redirect here" button to the planet map. Select one of your sectors
// on the map (or in the "Sectors" list), press the button, and the export
// destination of every other sector you own is set to the selected sector.
//
// Author: FinnStark
// Based on the original launchpad-redirect mod by QmelZ (button on the planet
// map + changing the export destination of sectors).
// ---------------------------------------------------------------------------

// Prefix for every bundle key, so we never clash with vanilla or other mods.
// The texts themselves live in bundles/bundle*.properties (one file per language).
const KEY = "launchpadredirect.";

// --- Layout ----------------------------------------------------------------
// The vanilla "Sectors" panel sits in the top-right corner of the planet map,
// is 290 units wide (see PlanetDialog.rebuildExpand) and unfolds downwards into
// a searchable list. We put our button to the LEFT of that panel, on the same
// row: it never overlaps the panel header, nor the list once it is opened
// (the list is handy to pick the target sector before pressing the button).
const SECTORS_PANEL_WIDTH = 290;
const GAP = 6;
const BUTTON_WIDTH = 230;
const BUTTON_HEIGHT = 60; // same height as the vanilla "Sectors" header

// --- Helpers ---------------------------------------------------------------

// Returns the localized text for a key of this mod.
const tr = name => Core.bundle.get(KEY + name);

// Shows a short message at the top of the screen.
// The planet map can be opened from the main menu (no game loaded). In that
// state showInfoToast() removes itself immediately (it checks state.isMenu()),
// so the message would never be visible. showInfoFade() has no such check
// (the game itself uses it in menus), so we use it there. In game we keep the
// regular toast.
const toast = text => {
    if(Vars.state.isMenu()){
        Vars.ui.showInfoFade(text, 4);
    }else{
        Vars.ui.showInfoToast(text, 3);
    }
};

// The button is usable only when the player selected one of their own sectors
// (a sector with a base) and is not a client in someone else's multiplayer game.
const canRedirect = p => {
    const target = p.selected; // sector currently selected on the planet map
    return target != null && target.hasBase() && !Vars.net.client();
};

// --- Main action -----------------------------------------------------------

// Sets the export destination of every owned sector to the selected sector.
const redirectAll = p => {
    const target = p.selected;

    // Same restriction as the vanilla launchpad configuration UI.
    if(Vars.net.client()){
        toast(tr("client"));
        return;
    }
    if(target == null || !target.hasBase()){
        toast(tr("select-first"));
        return;
    }

    // Launchpads can only send items to a sector of the same planet, so we only
    // touch the sectors of the target's planet (works for Serpulo and Erekir).
    const planet = target.planet;

    // Old destinations, so we can refresh their import statistics afterwards.
    const previous = [];
    let count = 0;

    planet.sectors.each(cons(s => {
        // Skip the target itself (a sector exporting to itself would duplicate
        // its own items in the offline simulation) and sectors we don't own.
        if(s === target || !s.hasBase()) return;

        // Already pointing at the target: nothing to do.
        if(s.info.destination === target) return;

        // NOTE: we deliberately do NOT check whether the sector has a launchpad.
        // The game does not store that for sectors that are not loaded (only
        // export statistics, which are empty for idle pads), so every owned
        // sector is redirected. That covers all launchpads, active or not.
        // For a sector without launchpad the destination is simply unused.
        const prev = s.info.destination;
        if(prev != null && previous.indexOf(prev) < 0) previous.push(prev);

        s.info.destination = target;

        // Persist the change. Without this, sectors that are not currently
        // played would lose the new destination when the game is restarted.
        s.saveInfo();
        count++;
    }));

    // The vanilla launchpad UI does the same when a destination is changed:
    // recompute the import rates of the sectors that gained/lost an exporter.
    previous.forEach(prev => {
        if(prev.hasBase()) prev.info.refreshImportRates(planet);
    });
    target.info.refreshImportRates(planet);

    // Feedback for the player.
    if(count == 0){
        toast(Core.bundle.format(KEY + "already", target.name()));
    }else{
        toast(Core.bundle.format(KEY + "done", "" + count, target.name()));
    }
};

// --- UI hook ---------------------------------------------------------------

Events.on(ClientLoadEvent, () => {
    const p = Vars.ui.planet; // the planet map dialog

    // PlanetDialog.setup() runs on every "shown" event and starts with
    // clearChildren(), so the button is rebuilt from scratch each time the map
    // opens (no duplicates). This callback is registered after the vanilla one,
    // so it runs after the dialog has been rebuilt.
    p.shown(() => {
        // Only in the normal browsing mode: not while the map is being used to
        // pick a destination for a launchpad or an interplanetary launch.
        if(p.mode === PlanetDialog.Mode.look){
            // fill() creates a transparent table covering the whole dialog.
            p.fill(cons(t => {
                t.top().right();
                t.button(tr("button"), Icon.upOpen, () => redirectAll(p))
                    .size(BUTTON_WIDTH, BUTTON_HEIGHT)
                    .padRight(SECTORS_PANEL_WIDTH + GAP) // leave room for the "Sectors" panel
                    .disabled(boolf(b => !canRedirect(p))); // greyed out when nothing valid is selected
            }));
        }
    });
});
