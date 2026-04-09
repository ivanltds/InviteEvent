import { redirect } from 'next/navigation';

export default function AdminRoot() {
  // O middleware cuidará de redirecionar para /admin/login se não houver cookie.
  // Se chegar aqui, redireciona para o dashboard.
  redirect('/admin/dashboard');
}
