(function (global) {
	"use strict";

	const SESSION_KEY = "fadaDashboardSession";
	const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
	const AUTHORIZED_USERNAME = "admin";
	const AUTHORIZED_PASSWORD = "admin";

	function getSessionStorage() {
		try {
			return global.sessionStorage || null;
		} catch (error) {
			console.error("Session storage is unavailable:", error);
			return null;
		}
	}

	function clearLegacyCredentials() {
		try {
			if (global.localStorage) {
				global.localStorage.removeItem("devUsername");
				global.localStorage.removeItem("devPassword");
			}
		} catch (error) {
			console.error("Unable to remove legacy saved credentials:", error);
		}
	}

	function clearSession() {
		const storage = getSessionStorage();
		if (storage) {
			storage.removeItem(SESSION_KEY);
		}
	}

	function createSession(username, now = Date.now()) {
		const storage = getSessionStorage();
		if (!storage) return false;

		const session = {
			username,
			createdAt: now,
			expiresAt: now + SESSION_DURATION_MS,
		};

		storage.setItem(SESSION_KEY, JSON.stringify(session));
		return true;
	}

	function readSession(now = Date.now()) {
		const storage = getSessionStorage();
		if (!storage) return null;

		try {
			const rawSession = storage.getItem(SESSION_KEY);
			if (!rawSession) return null;

			const session = JSON.parse(rawSession);
			const isValid =
				session &&
				session.username === AUTHORIZED_USERNAME &&
				Number.isFinite(session.createdAt) &&
				Number.isFinite(session.expiresAt) &&
				session.expiresAt > now;

			if (!isValid) {
				clearSession();
				return null;
			}

			return session;
		} catch (error) {
			console.error("Invalid dashboard session:", error);
			clearSession();
			return null;
		}
	}

	function login(username, password, now = Date.now()) {
		const isAuthorized =
			username === AUTHORIZED_USERNAME &&
			password === AUTHORIZED_PASSWORD;

		if (!isAuthorized) {
			clearSession();
			return false;
		}

		return createSession(username, now);
	}

	function isAuthenticated(now = Date.now()) {
		return Boolean(readSession(now));
	}

	function redirect(url) {
		if (global.location && typeof global.location.replace === "function") {
			global.location.replace(url);
		}
	}

	function revealProtectedPage() {
		if (global.document) {
			global.document.documentElement.classList.remove("auth-check");
		}
	}

	function startGuard(loginUrl) {
		const session = readSession();
		if (!session) {
			redirect(loginUrl);
			return false;
		}

		revealProtectedPage();

		if (typeof global.setTimeout === "function") {
			const remainingTime = Math.max(0, session.expiresAt - Date.now());
			global.setTimeout(() => {
				if (!isAuthenticated()) {
					redirect(loginUrl);
				}
			}, remainingTime + 50);
		}

		return true;
	}

	function logout(loginUrl) {
		clearSession();
		redirect(loginUrl);
	}

	const authApi = {
		SESSION_DURATION_MS,
		SESSION_KEY,
		clearLegacyCredentials,
		clearSession,
		createSession,
		isAuthenticated,
		login,
		logout,
		readSession,
		startGuard,
	};

	clearLegacyCredentials();
	global.FadaAuth = authApi;

	if (typeof module !== "undefined" && module.exports) {
		module.exports = authApi;
	}
})(typeof window !== "undefined" ? window : globalThis);
