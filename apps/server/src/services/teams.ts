import { v4 as uuid } from 'uuid';
import db from './database.js';
import type { Team, TeamMember, TeamRole } from '@systemtwin/shared';

export function createTeam(name: string, description: string, ownerId: string): Team {
  const id = uuid();
  db.prepare(
    'INSERT INTO teams (id, name, description, owner_id) VALUES (?, ?, ?, ?)'
  ).run(id, name, description, ownerId);

  // Add owner as team member
  db.prepare(
    'INSERT INTO team_members (id, team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)'
  ).run(uuid(), id, ownerId, 'owner', ownerId);

  return { id, name, description, ownerId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function getUserTeams(userId: string): Team[] {
  const rows = db.prepare(`
    SELECT t.* FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ?
    ORDER BY t.updated_at DESC
  `).all(userId) as Array<{
    id: string; name: string; description: string; owner_id: string;
    created_at: string; updated_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id, name: r.name, description: r.description,
    ownerId: r.owner_id, createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

export function getTeam(teamId: string): Team | null {
  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as {
    id: string; name: string; description: string; owner_id: string;
    created_at: string; updated_at: string;
  } | undefined;

  if (!row) return null;
  return { id: row.id, name: row.name, description: row.description, ownerId: row.owner_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function getTeamMembers(teamId: string): TeamMember[] {
  const rows = db.prepare(`
    SELECT tm.*, u.name as user_name, u.email as user_email
    FROM team_members tm JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
    ORDER BY tm.joined_at
  `).all(teamId) as Array<{
    id: string; team_id: string; user_id: string; role: TeamRole;
    joined_at: string; user_name: string; user_email: string;
  }>;

  return rows.map((r) => ({
    id: r.id, teamId: r.team_id, userId: r.user_id, role: r.role,
    userName: r.user_name, userEmail: r.user_email, joinedAt: r.joined_at,
  }));
}

export function addTeamMember(teamId: string, email: string, role: TeamRole, invitedBy: string): TeamMember | null {
  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as {
    id: string; name: string; email: string;
  } | undefined;

  if (!user) return null;

  const existing = db.prepare(
    'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, user.id);

  if (existing) return null;

  const id = uuid();
  db.prepare(
    'INSERT INTO team_members (id, team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)'
  ).run(id, teamId, user.id, role, invitedBy);

  return { id, teamId, userId: user.id, role, userName: user.name, userEmail: user.email, joinedAt: new Date().toISOString() };
}

export function removeTeamMember(teamId: string, userId: string): boolean {
  const result = db.prepare(
    'DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND role != ?'
  ).run(teamId, userId, 'owner');
  return result.changes > 0;
}

export function updateMemberRole(teamId: string, userId: string, role: TeamRole): boolean {
  if (role === 'owner') return false; // Can't make someone owner via this method
  const result = db.prepare(
    "UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ? AND role != 'owner'"
  ).run(role, teamId, userId);
  return result.changes > 0;
}

export function getTeamRole(teamId: string, userId: string): TeamRole | null {
  const row = db.prepare(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, userId) as { role: TeamRole } | undefined;
  return row?.role || null;
}
