import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { readonly, ref } from 'vue';
import { discoverPlatform } from '@/services/platformDiscovery';

const user = ref<User | null>(null);
const ready = ref(false);
let manager: UserManager | undefined;

async function getManager(): Promise<UserManager> {
  if (typeof window === 'undefined') throw new Error('Customer login requires a browser');
  if (manager) return manager;
  const platform = await discoverPlatform();
  manager = new UserManager({
    authority: platform.customer_oidc_issuer,
    client_id: platform.customer_web_client_id,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: false,
    monitorSession: false,
  });
  return manager;
}

export async function initializeCustomerAuth(): Promise<void> {
  if (ready.value || typeof window === 'undefined') return;
  user.value = await (await getManager()).getUser();
  ready.value = true;
}

export async function loginCustomer(returnTo = window.location.href): Promise<void> {
  await (
    await getManager()
  ).signinRedirect({
    state: { returnTo },
    extraQueryParams: { ui_locales: customerAuthLocale() },
  });
}

export async function registerCustomer(returnTo = window.location.href): Promise<void> {
  await (
    await getManager()
  ).signinRedirect({
    state: { returnTo },
    extraQueryParams: {
      prompt: 'create',
      ui_locales: customerAuthLocale(),
    },
  });
}

export async function completeCustomerLogin(): Promise<string> {
  const signedIn = await (await getManager()).signinRedirectCallback();
  user.value = signedIn;
  ready.value = true;
  const state = signedIn.state as { returnTo?: unknown } | undefined;
  if (typeof state?.returnTo !== 'string') return '/';
  try {
    const returnTo = new URL(state.returnTo);
    return returnTo.origin === window.location.origin ? returnTo.href : '/';
  } catch {
    return '/';
  }
}

export async function logoutCustomer(): Promise<void> {
  const idToken = user.value?.id_token;
  await (await getManager()).signoutRedirect(idToken ? { id_token_hint: idToken } : {});
}

export function useCustomerAuth() {
  return {
    user: readonly(user),
    ready: readonly(ready),
    initialize: initializeCustomerAuth,
    login: loginCustomer,
    register: registerCustomer,
    logout: logoutCustomer,
  };
}

function customerAuthLocale(): 'de' | 'en' {
  return document.documentElement.lang.toLowerCase().startsWith('de') ? 'de' : 'en';
}
