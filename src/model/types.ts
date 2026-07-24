export type TrashedMode = "without" | "with" | "only";

export type ModelQueryMetadata = Readonly<{
    softDeletes: boolean;
    deletedAtColumn: string;
}>;

export type SoftDeleteConstraint = {
    column: string;
    trashed: boolean;
};
