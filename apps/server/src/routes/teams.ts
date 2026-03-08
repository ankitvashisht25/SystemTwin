import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import { createTeam, getUserTeams, getTeam, getTeamMembers, addTeamMember, removeTeamMember, updateMemberRole, getTeamRole } from '../services/teams.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// POST /api/teams - Create team
router.post('/', (req: AuthRequest, res) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: 'Team name is required' }); return; }
  const team = createTeam(name, description || '', req.user!.userId);
  res.status(201).json(team);
});

// GET /api/teams - List user's teams
router.get('/', (req: AuthRequest, res) => {
  res.json(getUserTeams(req.user!.userId));
});

// GET /api/teams/:id - Get team details + members
router.get('/:id', (req: AuthRequest, res) => {
  const team = getTeam(String(req.params.id));
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (!role) { res.status(403).json({ error: 'Not a member of this team' }); return; }
  const members = getTeamMembers(String(req.params.id));
  res.json({ ...team, members, currentUserRole: role });
});

// PUT /api/teams/:id - Update team
router.put('/:id', (req: AuthRequest, res) => {
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (role !== 'owner') { res.status(403).json({ error: 'Only the owner can update the team' }); return; }
  const { name, description } = req.body;
  const updates: string[] = [];
  const values: string[] = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  updates.push("updated_at = datetime('now')");
  values.push(String(req.params.id));
  db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(getTeam(String(req.params.id)));
});

// DELETE /api/teams/:id - Delete team (owner only)
router.delete('/:id', (req: AuthRequest, res) => {
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (role !== 'owner') { res.status(403).json({ error: 'Only the owner can delete the team' }); return; }
  db.prepare('DELETE FROM teams WHERE id = ?').run(String(req.params.id));
  res.status(204).end();
});

// POST /api/teams/:id/members - Add member
router.post('/:id/members', (req: AuthRequest, res) => {
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (!role || role === 'member') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
  const { email, memberRole } = req.body;
  if (!email) { res.status(400).json({ error: 'Email is required' }); return; }
  const member = addTeamMember(String(req.params.id), email, memberRole || 'member', req.user!.userId);
  if (!member) { res.status(400).json({ error: 'User not found or already a member' }); return; }
  res.status(201).json(member);
});

// DELETE /api/teams/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', (req: AuthRequest, res) => {
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (!role || role === 'member') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
  const success = removeTeamMember(String(req.params.id), String(req.params.userId));
  if (!success) { res.status(400).json({ error: 'Cannot remove this member' }); return; }
  res.status(204).end();
});

// PUT /api/teams/:id/members/:userId - Update member role
router.put('/:id/members/:userId', (req: AuthRequest, res) => {
  const role = getTeamRole(String(req.params.id), req.user!.userId);
  if (role !== 'owner' && role !== 'admin') { res.status(403).json({ error: 'Insufficient permissions' }); return; }
  const { role: newRole } = req.body;
  const success = updateMemberRole(String(req.params.id), String(req.params.userId), newRole);
  if (!success) { res.status(400).json({ error: 'Cannot update role' }); return; }
  res.json({ message: 'Role updated' });
});

export { router as teamsRouter };
