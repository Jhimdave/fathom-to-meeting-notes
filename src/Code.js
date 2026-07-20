function doPost(e) {
  let eventKey = null;
  let working = "Working push"

  try {
    if (!e || !e.postData || !e.postData.contents)
      throw new Error("No POST data received.");

    const fathomPayload = JSON.parse(e.postData.contents);

    eventKey = fathomPayload.event_key || `fathom-recording-${fathomPayload.recording_id}`;

    if (isEventProcessed(eventKey)) {
      logDebug("Duplicate webhook ignored", { eventKey });
      return createJsonResponse({
        success: true,
        duplicate: true,
        eventKey
      });
    }

    const meeting = normalizeFathomPayload(fathomPayload);

    logDebug("Processing Fathom meeting", {
      eventKey,
      title: meeting.title,
      recordingId: meeting.recordingId
    });

    const transcriptFile = createTranscriptFile(meeting);

    const notionPage = createMeetingNote({
      ...meeting,
      transcriptFileUrl: transcriptFile.url
    });

    markEventProcessed(eventKey);

    const result = {
      success: true,
      eventKey,
      recordingId: meeting.recordingId,
      transcriptFileUrl: transcriptFile.url,
      transcriptFileId: transcriptFile.id,
      notionPageId: notionPage.id,
      notionPageUrl: notionPage.url
    };

    logDebug("Meeting successfully processed", result);

    return createJsonResponse(result);
  } catch (error) {
    logError("Fathom webhook processing failed", error, { eventKey });

    return createJsonResponse({
      success: false,
      eventKey,
      error: error.message
    });
  }
}

function normalizeFathomPayload(payload) {
  const data = payload.data || {};

  return {
    eventKey: payload.event_key || null,
    recordingId: payload.recording_id || null,
    title: data.title || `Fathom Meeting ${payload.recording_id || ""}`.trim(),
    createdAt: data.created_at || null,
    timeFinished: getMeetingFinishedTime(data),
    videoUrl: data.url || null,
    shareUrl: data.share_url || null,
    transcriptLanguage: data.transcript_language || null,
    transcript: Array.isArray(data.transcript) ? data.transcript : [],
    actionItems: Array.isArray(data.action_items) ? data.action_items : [],
    invitees: Array.isArray(data.calendar_invitees) ? data.calendar_invitees : [],
    summaryMarkdown: data.default_summary?.markdown_formatted || ""
  };
}

function getMeetingFinishedTime(data) {
  return data.recording_end_time ||
    data.ended_at ||
    data.calendar_end_time ||
    data.created_at ||
    new Date().toISOString();
}

function createTranscriptFile(meeting) {
  const config = getConfig();
  const folder = DriveApp.getFolderById(config.transcriptFolderId);

  const transcriptText = formatTranscript(meeting.transcript);
  const fileName = `${sanitizeFileName(meeting.title)} - Transcript.txt`;

  const existingFiles = folder.getFilesByName(fileName);

  if (existingFiles.hasNext()) {
    const existingFile = existingFiles.next();

    return {
      id: existingFile.getId(),
      name: existingFile.getName(),
      url: existingFile.getUrl()
    };
  }

  const file = folder.createFile(fileName, transcriptText, MimeType.PLAIN_TEXT);

  return {
    id: file.getId(),
    name: file.getName(),
    url: file.getUrl()
  };
}

function formatTranscript(transcript) {
  if (!transcript.length)
    return "No transcript available.";

  return transcript.map(item => {
    const timestamp = item.timestamp || "00:00:00";
    const speaker = item.speaker?.display_name || "Unknown Speaker";
    const text = item.text || "";

    return `[${timestamp}] ${speaker}: ${text}`;
  }).join("\n");
}

function sanitizeFileName(name) {
  return String(name || "Untitled Meeting")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim();
}

function isEventProcessed(eventKey) {
  if (!eventKey)
    return false;

  return PropertiesService.getScriptProperties()
    .getProperty(`PROCESSED_${eventKey}`) !== null;
}

function markEventProcessed(eventKey) {
  if (!eventKey)
    return;

  PropertiesService.getScriptProperties()
    .setProperty(`PROCESSED_${eventKey}`, new Date().toISOString());
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}