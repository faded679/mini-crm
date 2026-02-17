import WebApp from "@twa-dev/sdk";

export function getTelegramUser() {
  const user = WebApp.initDataUnsafe?.user;
  return user
    ? {
        id: String(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      }
    : null;
}

export function closeMiniApp() {
  WebApp.close();
}

export function ready() {
  WebApp.ready();
  WebApp.expand();
}
