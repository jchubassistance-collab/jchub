import { sleep } from 'workflow';

type SignupUser = {
  id: string;
  email: string;
};

async function createUser(email: string): Promise<SignupUser> {
  'use step';

  return {
    id: crypto.randomUUID(),
    email,
  };
}

async function sendWelcomeEmail(user: SignupUser): Promise<void> {
  'use step';

  console.log(`[WORKFLOW] Welcome email queued for ${user.email}`);
}

async function sendOnboardingEmail(user: SignupUser): Promise<void> {
  'use step';

  console.log(`[WORKFLOW] Onboarding email queued for ${user.email}`);
}

export async function handleUserSignup(email: string) {
  'use workflow';

  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await sleep('5s');
  await sendOnboardingEmail(user);

  return { userId: user.id, status: 'onboarded' as const };
}