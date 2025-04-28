import type { Client } from "@notionhq/client";
import type { NoteProperties } from "../types";

export const createPage = async (
	notion: Client,
	databaseId: string,
	note: NoteProperties,
): Promise<void> => {
	await notion.pages.create({
		parent: { database_id: databaseId },
		properties: {
			Name: {
				title: [{ text: { content: note.name } }],
			},
			Date: {
				type: "date",
				date: { start: note.date, end: null },
			},
		},
	});
};

export const queryDatabase = async (
	notion: Client,
	databaseId: string,
	filter: Parameters<Client["databases"]["query"]>[0]["filter"],
): Promise<boolean> => {
	const response = await notion.databases.query({
		database_id: databaseId,
		filter,
	});
	return response.results.length > 0;
};
