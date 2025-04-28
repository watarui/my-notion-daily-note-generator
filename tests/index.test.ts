import { checkNoteExists, createDailyNote } from "../src/index";
import type { Context } from "../src/types";
import { createPage, queryDatabase } from "../src/utils/notion";

jest.mock("../src/utils/logger", () => ({
	structuredLog: jest.fn(), // ログ出力をモック
}));
jest.mock("../src/utils/notion");

describe("checkNoteExists", () => {
	it("should return true if the note exists", async () => {
		(queryDatabase as jest.Mock).mockResolvedValue(true);
		const mockContext = {
			traceId: "test-trace-id",
			notion: {},
			config: {},
		} as Context;
		const result = await checkNoteExists(mockContext, "Test Note");
		expect(result).toBe(true);
	});

	it("should return false if the note does not exist", async () => {
		(queryDatabase as jest.Mock).mockResolvedValue(false);
		const mockContext = {
			traceId: "test-trace-id",
			notion: {},
			config: {},
		} as Context;
		const result = await checkNoteExists(mockContext, "Nonexistent Note");
		expect(result).toBe(false);
	});
});

jest.mock("../src/utils/notion");

describe("createDailyNote", () => {
	it("should call createPage with the correct arguments", async () => {
		const mockContext = {
			notion: {},
			config: { databaseId: "test-database-id" },
			traceId: "test-trace-id",
		};
		const mockNote = { name: "Test Note", date: "2025-04-28" };

		await createDailyNote(mockContext as Context, mockNote);

		expect(createPage).toHaveBeenCalledWith(
			mockContext.notion,
			mockContext.config.databaseId,
			mockNote,
		);
	});
});
