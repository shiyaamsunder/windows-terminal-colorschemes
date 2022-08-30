#! /usr/bin/env node
const fs = require("fs");
const path = require("path")
const fsPromises = fs.promises;
const prompts = require("prompts")

let themes = require("./themes.json")
let themeNames = themes.map(theme => theme.name)

const LOCAL_APPDATA_PATH = process.env.LOCALAPPDATA
const SETTINGS_PATH = path.join(LOCAL_APPDATA_PATH, "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json")

async function writeThemeToFile(themeName, themes) {
  let settings = await getTerminalSettings();
  let schemes = settings.schemes;
  let schemeNames = schemes.map(scheme => scheme.name)

  let selectedTheme = themes.filter(t => t.name === themeName)[0];
  if (schemeNames.includes(themeName)) {
    return true;
  }
  schemes.push(selectedTheme);
  settings.schemes = schemes;

  await writeToFile(SETTINGS_PATH, settings)
}

async function writeToFile(path, content) {
  contentString = JSON.stringify(content, null, 2)
  try {
    await fsPromises.writeFile(path, contentString)
  }
  catch (err) {
    console.log(err)
  }
}
async function setSchemeForProfile(profileName, colorScheme) {

  let settings = await getTerminalSettings();

  let profilesList = settings.profiles.list
  let updatedProfile = profilesList.map(tp => {
    if (tp.name === profileName) {
      return {
        ...tp,
        colorScheme
      }
    }
    return {
      ...tp
    }
  })

  let updatedSettings = {
    ...settings,
    profiles: {
      list: updatedProfile
    }
  }

  try {
    await writeToFile(SETTINGS_PATH, updatedSettings)
    console.log("Theme set successfully")

  } catch (error) {

    console.error(error)
  }

}

async function getTerminalProfileNames() {
  let settings = await getTerminalSettings()
  return settings.profiles.list.map(p => p.name)

}

async function getTerminalSettings() {
  let settingsFile;
  try {
    settingsFile = await fs.promises.readFile(SETTINGS_PATH, "utf-8")
  } catch (error) {
    console.error(error)
  }
  let settings = JSON.parse(settingsFile)
  return settings
}

function main() {
  (async () => {

    let profiles = await getTerminalProfileNames()
    let selectedProfile;
    await prompts([{
      type: 'autocomplete',
      name: 'profile',
      message: 'Select the current Terminal Profile',
      choices: profiles.map((t) => {
        return {
          title: t,
          value: t
        }
      }),
      onState: (state) => {
        if (state.value) selectedProfile = state.value
      }
    },
    {

      type: 'autocomplete',
      name: 'theme',
      message: 'Select a theme',
      choices: themeNames.map((t) => {
        return {
          title: t,
          value: t
        }
      }),

      //TODO: fix multiple console.logs
      onState: async (state) => {
        if (state.value) {
          await writeThemeToFile(state.value, themes)
          await setSchemeForProfile(selectedProfile, state.value)
        }
      }
    }])
  })()

}

main()
