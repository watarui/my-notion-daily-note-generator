import { Client } from "@notionhq/client";
import { isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import type {
	Context,
	LambdaResponse,
	NoteProperties,
	NotionConfig,
	ScheduledEvent,
} from "./types";
import { getEnv, validateEnv } from "./utils/env";
import { structuredLog } from "./utils/logger";
import { createPage, queryDatabase } from "./utils/notion";

// 開発環境では.envファイルから環境変数を読み込む
if (getEnv("NODE_ENV") !== "production") {
	config();
}

// Notionの設定
const notionConfig: NotionConfig = {
	apiKey: getEnv("NOTION_API_KEY"),
	databaseId: getEnv("DATABASE_ID"),
};

const createNotionClient = (config: NotionConfig): Client => {
	return new Client({ auth: config.apiKey });
};

const generateTraceId = (): string => {
	return uuidv4().replace(/-/g, "");
};

const getNoteProperties = (): NoteProperties => {
	const now = new Date();
	if (!isValid(now)) {
		throw new Error("Invalid date");
	}

	return {
		name: formatInTimeZone(now, "Asia/Tokyo", "yyyy-MM-dd EEE"),
		date: formatInTimeZone(now, "Asia/Tokyo", "yyyy-MM-dd"),
	};
};

const checkNoteExists = async (
	context: Context,
	title: string,
): Promise<boolean> => {
	try {
		return await queryDatabase(context.notion, context.config.databaseId, {
			property: "Name",
			title: { equals: title },
		});
	} catch (error) {
		structuredLog("error", "Error checking note existence", { error });
		throw error;
	}
};

const createDailyNote = async (
	context: Context,
	note: NoteProperties,
): Promise<void> => {
	try {
		await createPage(context.notion, context.config.databaseId, note);
		structuredLog(
			"info",
			`Created successfully: ${note.name}`,
			undefined,
			context.traceId,
		);
	} catch (error) {
		structuredLog(
			"error",
			`Error creating daily note: ${note.name}`,
			{ error },
			context.traceId,
		);
		throw error;
	}
};

const executeDailyNoteCreation = async (context: Context): Promise<void> => {
	const note = getNoteProperties();
	const exists = await checkNoteExists(context, note.name);

	if (exists) {
		structuredLog(
			"info",
			`Note already exists: ${note.name}`,
			undefined,
			context.traceId,
		);
		return;
	}

	await createDailyNote(context, note);
};

const initialize = (): void => {
	validateEnv([
		"NOTION_API_KEY",
		"DATABASE_ID",
		"AWS_REGION",
		"AWS_ACCESS_KEY_ID",
		"AWS_SECRET_ACCESS_KEY",
	]);
};

const processDailyNote = async (context: Context): Promise<void> => {
	await executeDailyNoteCreation(context);
};

const main = async (context: Context): Promise<void> => {
	initialize();
	await processDailyNote(context);
};

const runOnLocal = async (context: Context): Promise<void> => {
	main(context)
		.then(() =>
			structuredLog(
				"info",
				"Main process completed",
				undefined,
				context.traceId,
			),
		)
		.catch((error) => {
			structuredLog(
				"error",
				"Main process execution error:",
				{ error },
				context.traceId,
			);
			process.exit(1);
		});
};

if (require.main === module) {
	const context = {
		traceId: generateTraceId(),
		notion: createNotionClient(notionConfig),
		config: notionConfig,
	};
	runOnLocal(context);
}

const runOnLambda = async (context: Context): Promise<LambdaResponse> => {
	try {
		await main(context);
		structuredLog(
			"info",
			"Lambda function executed successfully",
			undefined,
			context.traceId,
		);
		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Daily note created successfully" }),
		};
	} catch (error) {
		structuredLog(
			"error",
			"Lambda function execution error:",
			{ error },
			context.traceId,
		);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Daily note creation failed" }),
		};
	}
};

export async function handler(event: ScheduledEvent): Promise<LambdaResponse> {
	const context = {
		traceId: generateTraceId(),
		notion: createNotionClient(notionConfig),
		config: notionConfig,
	};
	return runOnLambda(context);
}

export { main }; // テスト用にエクスポート
