export const getEnv = (key: string, defaultValue = ""): string => {
	return process.env[key] ?? defaultValue;
};

export const validateEnv = (
	requiredKeys: string[],
	env: NodeJS.ProcessEnv = process.env,
): void => {
	for (const key of requiredKeys) {
		if (!env[key]) {
			throw new Error(`Missing required environment variable: ${key}`);
		}
	}
};
