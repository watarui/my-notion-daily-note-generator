import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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

export interface NoteProperties {
	name: string;
	date: string;
	properties?: PageObjectResponse["properties"];
}

export interface Context {
	traceId: string;
	notion: Client;
	config: NotionConfig;
}
