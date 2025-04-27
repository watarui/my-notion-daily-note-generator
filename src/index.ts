import { Client } from "@notionhq/client";
import { isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { config } from "dotenv";
import type {
	LambdaResponse,
	NoteProperties,
	NotionConfig,
	ScheduledEvent,
} from "./types";

// 開発環境では.envファイルから環境変数を読み込む
if (process.env.NODE_ENV !== "production") {
	config();
}

// Notionの設定
const notionConfig: NotionConfig = {
	apiKey: process.env.NOTION_API_KEY ?? "",
	databaseId: process.env.DATABASE_ID ?? "",
};

const createNotionClient = (config: NotionConfig): Client => {
	return new Client({ auth: config.apiKey });
};

// Notionクライアントの初期化
const notion = createNotionClient(notionConfig);

const structuredLog = (
	level: "info" | "error" | "warn",
	message: string,
	additionalInfo?: Record<string, unknown>,
) => {
	console.log(
		JSON.stringify({
			timestamp: new Date().toISOString(),
			level,
			message,
			...(additionalInfo && { additionalInfo }),
		}),
	);
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

const checkNoteExists = async (title: string): Promise<boolean> => {
	try {
		const response = await notion.databases.query({
			database_id: notionConfig.databaseId,
			filter: {
				property: "Name",
				title: {
					equals: title,
				},
			},
		});

		return response.results.length > 0;
	} catch (error) {
		structuredLog("error", "Error checking note existence", { error });
		throw error;
	}
};

const createDailyNote = async (note: NoteProperties): Promise<void> => {
	try {
		await notion.pages.create({
			parent: {
				database_id: notionConfig.databaseId,
			},
			properties: {
				Name: {
					title: [
						{
							text: {
								content: note.name,
							},
						},
					],
				},
				Date: {
					type: "date",
					date: {
						start: note.date,
						end: null,
					},
				},
			},
		});
		structuredLog("info", `Created successfully: ${note.name}`);
	} catch (error) {
		structuredLog("error", "Error creating daily note:", { error });
		throw error;
	}
};

const validateEnv = (): void => {
	if (!process.env.NOTION_API_KEY) {
		throw new Error("Missing environment variable: NOTION_API_KEY");
	}
	if (!process.env.DATABASE_ID) {
		throw new Error("Missing environment variable: DATABASE_ID");
	}
	if (!process.env.AWS_REGION) {
		throw new Error("Missing environment variable: AWS_REGION");
	}
	if (!process.env.AWS_ACCESS_KEY_ID) {
		throw new Error("Missing environment variable: AWS_ACCESS_KEY_ID");
	}
	if (!process.env.AWS_SECRET_ACCESS_KEY) {
		throw new Error("Missing environment variable: AWS_SECRET_ACCESS_KEY");
	}
};

const executeDailyNoteCreation = async (): Promise<void> => {
	const note = getNoteProperties();
	const exists = await checkNoteExists(note.name);

	if (exists) {
		structuredLog("info", `Note already exists: ${note.name}`);
		return;
	}

	await createDailyNote(note);
};

const main = async (): Promise<void> => {
	validateEnv();
	await executeDailyNoteCreation();
};

const run = async (): Promise<void> => {
	main()
		.then(() => structuredLog("info", "Main process completed"))
		.catch((error) => {
			structuredLog("error", "Main process execution error:", { error });
			process.exit(1);
		});
};

/**
 * ローカル実行用
 */
if (require.main === module) {
	run();
}

/**
 * Lambda関数ハンドラー
 */
export async function handler(event: ScheduledEvent): Promise<LambdaResponse> {
	try {
		await main();
		structuredLog("info", "Lambda function executed successfully");
		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Daily note created successfully" }),
		};
	} catch (error) {
		structuredLog("error", "Lambda function execution error:", { error });
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Daily note creation failed" }),
		};
	}
}

export { main }; // テスト用にエクスポート
