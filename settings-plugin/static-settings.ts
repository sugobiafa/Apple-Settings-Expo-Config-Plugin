import { ConfigPlugin, withPlugins } from "@expo/config-plugins";

import withIosSettingsPersist from "./withIosSettingsPersist"; // rootPlist, // rootEnglishStrings,
import { createModSetForSettingsPage, SettingsPlist } from "./withRootPlist";
import { createModSetForSettingsStrings } from "./withSettingsStrings";

export const withStaticSettings: ConfigPlugin<
  Record<
    string,
    { page: SettingsPlist; locales?: Record<string, Record<string, string>> }
  >
> = (config, panes) => {
  if (!panes || !("Root" in panes)) {
    throw new Error("Panes must include a 'Root' pane");
  }

  let postMods: any[] = [];

  Object.entries(panes).map(([key, pane]) => {
    const mods = createModSetForSettingsPage({
      // e.g. "Root"
      name: key,
    });

    const locales = pane.locales || {};

    if (Object.keys(locales).length) {
      const name = pane.page.StringsTable ?? key;
      pane.page.StringsTable = name;

      Object.entries(pane.locales).map(([lang, strings]) => {
        const stringsMods = createModSetForSettingsStrings({
          name,
          lang,
        });

        stringsMods.withStrings(config, (config) => {
          config.modResults = strings;

          return config;
        });

        postMods.push(stringsMods.withBaseMod);
      });
    } else {
      // Allow using the default strings table.
      //   delete pane.page.StringsTable;
    }

    config = mods.withSettingsPlist(config, (config) => {
      config.modResults = pane.page;

      return config;
    });

    postMods.push(mods.withBaseMod);
  });

  withIosSettingsPersist(config);

  return withPlugins(config, postMods);
};
