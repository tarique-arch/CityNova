import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://citynova-db-tarique-104.turso.io';
  const authToken = process.env.TURSO_AUTH_TOKEN || process.argv[2];

  if (!authToken) {
    console.error('\n❌ Missing Turso Auth Token!');
    console.error('Usage: npx tsx prisma/sync-dev-to-turso.ts <YOUR_TURSO_AUTH_TOKEN>\n');
    process.exit(1);
  }

  // 1. Read directly from local SQLite dev.db
  const localPrisma = new PrismaClient({
    datasources: {
      db: { url: 'file:./dev.db' },
    },
  });

  // 2. Connect to Turso
  console.log(`Connecting to Turso: ${tursoUrl}...`);
  const turso = createClient({ url: tursoUrl, authToken });

  // 3. Read all data from local dev.db
  const cities = await localPrisma.city.findMany();
  const users = await localPrisma.user.findMany();
  const tickets = await localPrisma.ticket.findMany();
  const histories = await localPrisma.ticketStatusHistory.findMany();
  const comments = await localPrisma.ticketComment.findMany();
  const reactions = await localPrisma.ticketReaction.findMany();

  console.log(`Found in local dev.db:`);
  console.log(`- ${cities.length} Cities`);
  console.log(`- ${users.length} Users (including saksham1, vivek1..5, etc.)`);
  console.log(`- ${tickets.length} Tickets`);
  console.log(`- ${histories.length} History entries`);
  console.log(`- ${comments.length} Comments`);
  console.log(`- ${reactions.length} Reactions`);

  // 4. Sync Cities
  for (const c of cities) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "City" (id, name, state, normalizedKey, centerLat, centerLng, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.state, c.normalizedKey, c.centerLat, c.centerLng, c.createdAt.toISOString()],
    });
  }
  console.log(`✅ Synced ${cities.length} cities`);

  // 5. Sync Users
  for (const u of users) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "User" (
        id, name, phone, username, employeeId, phoneHash, aadhaarHash, state, cityId,
        email, designation, dob, bio, avatarUrl, coverUrl, civicScore, isBanned, banReason,
        bannedAt, bannedBy, role, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        u.id, u.name, u.phone, u.username, u.employeeId, u.phoneHash, u.aadhaarHash, u.state, u.cityId,
        u.email, u.designation, u.dob, u.bio, u.avatarUrl, u.coverUrl, u.civicScore,
        u.isBanned ? 1 : 0, u.banReason, u.bannedAt ? u.bannedAt.toISOString() : null, u.bannedBy,
        u.role, u.createdAt.toISOString(),
      ],
    });
  }
  console.log(`✅ Synced ${users.length} users`);

  // 6. Sync Tickets
  for (const t of tickets) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "Ticket" (
        id, caseId, title, description, category, urgency, plainLanguageRights, status,
        latitude, longitude, addressDescription, cityId, reporterId, citizenName, citizenPhone,
        publicCommitmentDate, slaDeadline, initialPhotoUrl, initialAudioUrl, resolutionPhotoUrl,
        resolutionGpsLat, resolutionGpsLng, resolutionTimestamp, resolutionNotes, disputeReason,
        disputePhotoUrl, hadDispute, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        t.id, t.caseId, t.title, t.description, t.category, t.urgency, t.plainLanguageRights, t.status,
        t.latitude, t.longitude, t.addressDescription, t.cityId, t.reporterId, t.citizenName, t.citizenPhone,
        t.publicCommitmentDate.toISOString(), t.slaDeadline.toISOString(), t.initialPhotoUrl, t.initialAudioUrl,
        t.resolutionPhotoUrl, t.resolutionGpsLat, t.resolutionGpsLng,
        t.resolutionTimestamp ? t.resolutionTimestamp.toISOString() : null,
        t.resolutionNotes, t.disputeReason, t.disputePhotoUrl, t.hadDispute ? 1 : 0,
        t.createdAt.toISOString(), t.updatedAt.toISOString(),
      ],
    });
  }
  console.log(`✅ Synced ${tickets.length} tickets`);

  // 7. Sync History
  for (const h of histories) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "TicketStatusHistory" (id, ticketId, actorId, actorRole, actorName, status, comment, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [h.id, h.ticketId, h.actorId, h.actorRole, h.actorName, h.status, h.comment, h.createdAt.toISOString()],
    });
  }
  console.log(`✅ Synced ${histories.length} status histories`);

  // 8. Sync Comments
  for (const cm of comments) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "TicketComment" (id, ticketId, userId, body, createdAt)
            VALUES (?, ?, ?, ?, ?)`,
      args: [cm.id, cm.ticketId, cm.userId, cm.body, cm.createdAt.toISOString()],
    });
  }
  console.log(`✅ Synced ${comments.length} comments`);

  // 9. Sync Reactions
  for (const r of reactions) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO "TicketReaction" (id, ticketId, userId, createdAt)
            VALUES (?, ?, ?, ?)`,
      args: [r.id, r.ticketId, r.userId, r.createdAt.toISOString()],
    });
  }
  console.log(`✅ Synced ${reactions.length} reactions`);

  await localPrisma.$disconnect();
  console.log('\n🎉 ALL demo accounts, users, and tickets are now synced to Turso!');
}

main().catch((err) => {
  console.error('\n❌ Sync failed:', err);
  process.exit(1);
});

