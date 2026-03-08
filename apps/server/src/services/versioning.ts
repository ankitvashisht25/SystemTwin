import { v4 as uuid } from 'uuid';
import db from './database.js';
import type { ArchitectureVersion, VersionDiff } from '@systemtwin/shared';

export function createVersion(architectureId: string, userId: string, changeSummary = ''): ArchitectureVersion {
  const arch = db.prepare(
    'SELECT name, nodes, edges FROM architectures WHERE id = ?'
  ).get(architectureId) as { name: string; nodes: string; edges: string } | undefined;

  if (!arch) throw new Error('Architecture not found');

  const lastVersion = db.prepare(
    'SELECT MAX(version_number) as maxV FROM architecture_versions WHERE architecture_id = ?'
  ).get(architectureId) as { maxV: number | null };

  const versionNumber = (lastVersion?.maxV ?? 0) + 1;
  const id = uuid();

  db.prepare(
    'INSERT INTO architecture_versions (id, architecture_id, version_number, name, nodes, edges, change_summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, architectureId, versionNumber, arch.name, arch.nodes, arch.edges, changeSummary, userId);

  return {
    id,
    architectureId,
    versionNumber,
    name: arch.name,
    nodes: JSON.parse(arch.nodes),
    edges: JSON.parse(arch.edges),
    changeSummary,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
}

export function getVersionHistory(architectureId: string): Omit<ArchitectureVersion, 'nodes' | 'edges'>[] {
  const rows = db.prepare(
    'SELECT id, architecture_id, version_number, name, change_summary, created_by, created_at FROM architecture_versions WHERE architecture_id = ? ORDER BY version_number DESC'
  ).all(architectureId) as Array<{
    id: string; architecture_id: string; version_number: number; name: string;
    change_summary: string; created_by: string; created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    architectureId: r.architecture_id,
    versionNumber: r.version_number,
    name: r.name,
    changeSummary: r.change_summary,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

export function getVersion(versionId: string): ArchitectureVersion | null {
  const row = db.prepare(
    'SELECT * FROM architecture_versions WHERE id = ?'
  ).get(versionId) as {
    id: string; architecture_id: string; version_number: number; name: string;
    nodes: string; edges: string; change_summary: string; created_by: string; created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    architectureId: row.architecture_id,
    versionNumber: row.version_number,
    name: row.name,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    changeSummary: row.change_summary,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function restoreVersion(architectureId: string, versionId: string, userId: string): ArchitectureVersion {
  // Snapshot current state before restoring
  createVersion(architectureId, userId, 'Auto-snapshot before restore');

  const version = getVersion(versionId);
  if (!version) throw new Error('Version not found');

  db.prepare(
    "UPDATE architectures SET nodes = ?, edges = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(version.nodes), JSON.stringify(version.edges), architectureId);

  return createVersion(architectureId, userId, `Restored from version ${version.versionNumber}`);
}

export function diffVersions(versionId1: string, versionId2: string): VersionDiff {
  const v1 = getVersion(versionId1);
  const v2 = getVersion(versionId2);

  if (!v1 || !v2) throw new Error('Version not found');

  const v1NodeIds = new Set(v1.nodes.map((n) => n.id));
  const v2NodeIds = new Set(v2.nodes.map((n) => n.id));
  const v1EdgeIds = new Set(v1.edges.map((e) => e.id));
  const v2EdgeIds = new Set(v2.edges.map((e) => e.id));

  const addedNodes = v2.nodes.filter((n) => !v1NodeIds.has(n.id)).map((n) => n.id);
  const removedNodes = v1.nodes.filter((n) => !v2NodeIds.has(n.id)).map((n) => n.id);
  const modifiedNodes = v2.nodes
    .filter((n) => v1NodeIds.has(n.id))
    .filter((n) => {
      const old = v1.nodes.find((o) => o.id === n.id);
      return JSON.stringify(old) !== JSON.stringify(n);
    })
    .map((n) => n.id);

  const addedEdges = v2.edges.filter((e) => !v1EdgeIds.has(e.id)).map((e) => e.id);
  const removedEdges = v1.edges.filter((e) => !v2EdgeIds.has(e.id)).map((e) => e.id);
  const modifiedEdges = v2.edges
    .filter((e) => v1EdgeIds.has(e.id))
    .filter((e) => {
      const old = v1.edges.find((o) => o.id === e.id);
      return JSON.stringify(old) !== JSON.stringify(e);
    })
    .map((e) => e.id);

  return {
    added: { nodes: addedNodes, edges: addedEdges },
    removed: { nodes: removedNodes, edges: removedEdges },
    modified: { nodes: modifiedNodes, edges: modifiedEdges },
  };
}
