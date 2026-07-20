const CONFIG = {
  NOTION_VERSION: "2022-06-28",

  NOTION_PROPERTIES: {
    TITLE: "Title",
    TIME_FINISHED: "Time finished",
    FILES_MEDIA: "Files & media",
    VIDEO_LINK: "Video Link"
  },

  SCRIPT_PROPERTIES: {
    NOTION_TOKEN: "NOTION_TOKEN",
    NOTION_DATABASE_ID: "NOTION_DATABASE_ID",
    TRANSCRIPT_FOLDER_ID: "TRANSCRIPT_FOLDER_ID"
  }
};

function getConfig() {
  const props = PropertiesService.getScriptProperties();

  return {
    notionToken: getRequiredScriptProperty(props, CONFIG.SCRIPT_PROPERTIES.NOTION_TOKEN),
    notionDatabaseId: getRequiredScriptProperty(props, CONFIG.SCRIPT_PROPERTIES.NOTION_DATABASE_ID),
    transcriptFolderId: getRequiredScriptProperty(props, CONFIG.SCRIPT_PROPERTIES.TRANSCRIPT_FOLDER_ID)
  };
}

function getRequiredScriptProperty(props, key) {
  const value = props.getProperty(key);

  if (!value)
    throw new Error(`Missing required Script Property: ${key}`);

  return value;
}