// One-time script to update admin email to match Resend account
require('dotenv').config();
const prisma = require('./config/db');

async function updateAdminEmail() {
  try {
    await prisma.$connect();
    
    const result = await prisma.user.updateMany({
      where: { username: 'admin' },
      data: { email: 'azizhons.agdullayevv@gmail.com' }
    });
    
    console.log(`Updated ${result.count} admin user(s) email to azizhons.agdullayevv@gmail.com`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAdminEmail();
