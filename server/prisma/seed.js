const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  console.log('🌱 Seeding database...');
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@govdelivery.in' },
    update: {},
    create: {
      name: 'System Administrator',
      phone: '9999999999',
      email: 'admin@govdelivery.in',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create sample postmen
  const postmanPassword = await bcrypt.hash('Postman@123', 12);
  const postman1 = await prisma.postman.upsert({
    where: { employeeId: 'POST001' },
    update: {},
    create: {
      employeeId: 'POST001',
      name: 'Rajesh Kumar',
      passwordHash: postmanPassword,
    },
  });
  const postman2 = await prisma.postman.upsert({
    where: { employeeId: 'POST002' },
    update: {},
    create: {
      employeeId: 'POST002',
      name: 'Suresh Sharma',
      passwordHash: postmanPassword,
    },
  });
  console.log('✅ Postmen created:', postman1.employeeId, postman2.employeeId);

  // Create sample user
  const userPassword = await bcrypt.hash('User@123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Amit Patel',
      phone: '9876543210',
      email: 'user@example.com',
      passwordHash: userPassword,
      role: 'USER',
    },
  });
  console.log('✅ Sample user created:', user.email);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });