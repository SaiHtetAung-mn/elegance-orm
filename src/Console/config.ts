import path from "path";
import DataSource from "../Connection/DataSource";
import { MigrationOptions } from "../Connection/types";
import type { MigrationLanguage } from "../Migration/MigrationCreator";

type EleganceCliConfigFile = {
    dataSource: string;
    migrations?: {
        directory: string;
        table?: string;
    };
    models?: {
        directory: string;
    };
    language?: string;
};

type LoadedCliConfig = {
    dataSource: DataSource;
    migrations?: MigrationOptions;
    models?: ModelDirectoryOptions;
    language: MigrationLanguage;
};

type ModelDirectoryOptions = {
    directory: string;
};

const CONFIG_FILENAMES = [
    "elegance.config.ts",
    "elegance.config.js",
    "elegance.config.cjs",
    "elegance.config.mjs",
    "elegance.config.json"
];

const MODULE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".cjs", ".mjs", ".json"];

let cachedConfig: LoadedCliConfig | null = null;

export function getCliConfig(): LoadedCliConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const configPath = resolveConfigPath();
    const configDir = path.dirname(configPath);
    const fileConfig = loadCliConfig(configPath);
    const dataSource = loadDataSourceInstance(fileConfig.dataSource, configDir);
    const migrations = fileConfig.migrations
        ? resolveMigrationsConfig(fileConfig.migrations, configDir)
        : undefined;
    const models = fileConfig.models
        ? resolveModelsConfig(fileConfig.models, configDir)
        : undefined;
    const language = resolveLanguage(fileConfig.language);

    cachedConfig = { dataSource, migrations, models, language };
    return cachedConfig;
}

function resolveLanguage(raw?: string): MigrationLanguage {
    if (!raw) {
        return "typescript";
    }

    const normalized = raw.toLowerCase();
    if (normalized === "ts" || normalized === "typescript") {
        return "typescript";
    }

    if (normalized === "js" || normalized === "javascript") {
        return "javascript";
    }

    throw new Error(`Unsupported language "${raw}". Use "typescript" or "javascript".`);
}

function resolveMigrationsConfig(
    config: NonNullable<EleganceCliConfigFile["migrations"]>,
    baseDir: string
): MigrationOptions {
    if (typeof config.directory !== "string" || !config.directory.trim()) {
        throw new Error("Migrations configuration must include a non-empty 'directory'.");
    }

    const directory = path.isAbsolute(config.directory)
        ? config.directory
        : path.resolve(baseDir, config.directory);

    return {
        directory,
        table: typeof config.table === "string" && config.table.trim().length > 0
            ? config.table
            : undefined
    };
}

function resolveModelsConfig(
    config: NonNullable<EleganceCliConfigFile["models"]>,
    baseDir: string
): ModelDirectoryOptions {
    if (typeof config.directory !== "string" || !config.directory.trim()) {
        throw new Error("Models configuration must include a non-empty 'directory'.");
    }

    const directory = path.isAbsolute(config.directory)
        ? config.directory
        : path.resolve(baseDir, config.directory);

    return { directory };
}

function resolveConfigPath(): string {
    const cwd = process.cwd();
    for (const filename of CONFIG_FILENAMES) {
        const fullPath = path.resolve(cwd, filename);
        try {
            return require.resolve(fullPath);
        } catch {
            continue;
        }
    }

    throw new Error("Could not find an elegance.config file in the project root.");
}

function loadCliConfig(configPath: string): EleganceCliConfigFile {
    const rawModule = require(configPath);
    const resolved = rawModule?.default ?? rawModule;
    if (!resolved || typeof resolved !== "object") {
        throw new Error(`Config file at "${configPath}" must export an object.`);
    }

    if (typeof resolved.dataSource !== "string" || !resolved.dataSource.trim()) {
        throw new Error(`Config file at "${configPath}" must provide a "dataSource" string.`);
    }

    const migrations = resolved.migrations
        ? {
            directory: resolved.migrations.directory,
            table: resolved.migrations.table
        }
        : undefined;
    const models = resolved.models
        ? {
            directory: resolved.models.directory
        }
        : undefined;

    return {
        dataSource: resolved.dataSource,
        migrations,
        models,
        language: resolved.language
    };
}

function loadDataSourceInstance(target: string, baseDir: string): DataSource {
    const modulePath = resolveModulePath(target, baseDir);
    const rawModule = require(modulePath);
    const instance = rawModule?.default ?? rawModule?.dataSource ?? rawModule;
    if (!isDataSource(instance)) {
        throw new Error(`Module "${target}" did not export a DataSource instance.`);
    }

    return instance;
}

function resolveModulePath(target: string, baseDir: string): string {
    const absoluteBase = path.isAbsolute(target) ? target : path.resolve(baseDir, target);
    const hasExtension = path.extname(absoluteBase) !== "";

    const attempts = hasExtension
        ? [absoluteBase]
        : MODULE_EXTENSIONS.map(ext => absoluteBase + ext);

    for (const attempt of attempts) {
        try {
            return require.resolve(attempt);
        } catch {
            continue;
        }
    }

    throw new Error(`Unable to resolve module "${target}" from "${baseDir}".`);
}

function isDataSource(value: unknown): value is DataSource {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.initialize === "function"
        && typeof candidate.destroy === "function"
        && typeof candidate.getConfig === "function";
}
