export interface ImoogleArtifactData {
  id: string;
  title: string;
}

// Legacy alias for backward compatibility
export interface BoltArtifactData extends ImoogleArtifactData {
  id: string;
  title: string;
}
