

const props = PropertiesService.getScriptProperties()

function debugPrint(key, value) {
  props.setProperty(key, typeof value === "string" ? value : JSON.stringify(value));
}

function debugPrintError(key, value) {
  props.setProperty(key, typeof value === "string" ? value : JSON.stringify(value));
}

function throwError(data, error_message) {
  if(!data) throw new Error(error_message);
}