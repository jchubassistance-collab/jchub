import { redirect } from 'next/navigation';

// La publication sur Facebook et Instagram se fait depuis les kits de l'espace CM.
export default function SocialPublishingRedirect() {
  redirect('/admin/cm#kits');
}
