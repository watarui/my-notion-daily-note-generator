import { Client } from "@notionhq/client";
import { isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { config } from "dotenv";
import type {
	DateFormats,
	LambdaResponse,
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

// Notionクライアントの初期化
const notion = new Client({ auth: notionConfig.apiKey });

/**
 * 構造化ログを出力する
 * @param level ログレベル (info, error, warn)
 * @param message ログメッセージ
 * @param meta 追加情報 (オプション)
 */
const log = (
	level: "info" | "error" | "warn",
	message: string,
	meta?: Record<string, unknown>,
) => {
	console.log(
		JSON.stringify({
			timestamp: new Date().toISOString(),
			level,
			message,
			...(meta && { meta }),
		}),
	);
};

/**
 * 日本時間の現在の日付フォーマットを取得する
 * @returns フォーマット済みの日付
 */
const getJapanDateFormats = (): DateFormats => {
	const now = new Date();
	if (!isValid(now)) {
		throw new Error("Invalid date");
	}

	return {
		yyyyMMdd: formatInTimeZone(now, "Asia/Tokyo", "yyyy-MM-dd"),
		yyyyMMddDdd: formatInTimeZone(now, "Asia/Tokyo", "yyyy-MM-dd EEE"),
	};
};

/**
 * Notionにデイリーノートが存在するか確認
 * @param title ノートのタイトル
 * @returns 存在するかどうか
 */
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
		log("error", "Error checking note existence", { error });
		throw error;
	}
};

/**
 * Notionにデイリーノートを作成
 * @param dateFormats 日付フォーマット
 * @returns 作成結果
 */
const createDailyNote = async (dateFormats: DateFormats): Promise<void> => {
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
								content: dateFormats.yyyyMMddDdd,
							},
						},
					],
				},
				Date: {
					type: "date",
					date: {
						start: dateFormats.yyyyMMdd,
						end: null,
					},
				},
			},
		});
		log("info", `作成成功: ${dateFormats.yyyyMMddDdd}`);
	} catch (error) {
		log("error", "Error creating daily note:", { error });
		throw error;
	}
};

/**
 * メイン処理
 */
const main = async (): Promise<void> => {
	// 設定のバリデーション
	if (!notionConfig.apiKey || !notionConfig.databaseId) {
		throw new Error(
			"Missing required environment variables: NOTION_API_KEY or DATABASE_ID",
		);
	}

	// 日付フォーマットの取得
	const dateFormats = getJapanDateFormats();

	// すでに存在するかチェック
	const exists = await checkNoteExists(dateFormats.yyyyMMddDdd);

	if (exists) {
		log("info", `すでに存在しています: ${dateFormats.yyyyMMddDdd}`);
		return;
	}

	// 作成処理
	await createDailyNote(dateFormats);
};

/**
 * ローカル実行用
 */
main()
	.then(() => console.log("処理完了"))
	.catch((error) => {
		log("error", "メイン処理エラー:", { error });
		process.exit(1);
	});

/**
 * Lambda関数ハンドラー
 */
export async function handler(event: ScheduledEvent): Promise<LambdaResponse> {
	try {
		await main();
		return {
			statusCode: 200,
			body: JSON.stringify({ message: "デイリーノート作成成功" }),
		};
	} catch (error) {
		log("error", "Lambda実行エラー:", { error });
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "デイリーノート作成失敗" }),
		};
	}
}

export { main }; // テスト用にエクスポート
