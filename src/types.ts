// NotionClientの環境変数の型
export interface NotionConfig {
	apiKey: string;
	databaseId: string;
}

// Lambda関数のイベント型
export interface ScheduledEvent {
	version: string;
	id: string;
	"detail-type": string;
	source: string;
	account: string;
	time: string;
	region: string;
	resources: string[];
	detail: Record<string, unknown>;
}

// Lambda関数のレスポンス型
export interface LambdaResponse {
	statusCode: number;
	body: string;
}

// 日付フォーマット用の型
export interface DateFormats {
	yyyyMMdd: string;
	yyyyMMddDdd: string;
}
