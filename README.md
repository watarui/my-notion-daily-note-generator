# my-notion-daily-note-generator

Make .env:

```bash
cp .env.example .env
vi .env
```

To install dependencies:

```bash
bun install
```

To create AWS resources:

```bash
bun run deploy:init
bun run deploy
```

To run in local:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
