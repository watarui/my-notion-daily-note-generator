import { validateEnv } from "../../src/utils/env";

describe("validateEnv", () => {
	it("should throw an error if a required environment variable is missing", () => {
		expect(() => validateEnv(["MISSING_VAR"], {})).toThrow(
			"Missing required environment variable: MISSING_VAR",
		);
	});

	it("should not throw an error if all required environment variables are present", () => {
		expect(() =>
			validateEnv(["EXISTING_VAR"], { EXISTING_VAR: "value" }),
		).not.toThrow();
	});
});
