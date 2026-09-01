const test = require("node:test");
const assert = require("node:assert/strict");

class MemorySessionStorage {
	constructor() {
		this.values = new Map();
	}

	getItem(key) {
		return this.values.has(key) ? this.values.get(key) : null;
	}

	setItem(key, value) {
		this.values.set(key, String(value));
	}

	removeItem(key) {
		this.values.delete(key);
	}

	clear() {
		this.values.clear();
	}
}

global.sessionStorage = new MemorySessionStorage();
global.localStorage = new MemorySessionStorage();
global.localStorage.setItem("devUsername", "old-user");
global.localStorage.setItem("devPassword", "old-password");
const auth = require("../js/auth.js");

test.beforeEach(() => {
	global.sessionStorage.clear();
});

test("legacy credentials are removed from persistent browser storage", () => {
	assert.equal(global.localStorage.getItem("devUsername"), null);
	assert.equal(global.localStorage.getItem("devPassword"), null);
});

test("invalid credentials do not create a dashboard session", () => {
	assert.equal(auth.login("admin", "incorrect", 1000), false);
	assert.equal(global.sessionStorage.getItem(auth.SESSION_KEY), null);
});

test("successful login creates a two-hour session without storing a password", () => {
	assert.equal(auth.login("admin", "admin", 1000), true);
	const storedSession = JSON.parse(
		global.sessionStorage.getItem(auth.SESSION_KEY),
	);

	assert.deepEqual(Object.keys(storedSession).sort(), [
		"createdAt",
		"expiresAt",
		"username",
	]);
	assert.equal(storedSession.createdAt, 1000);
	assert.equal(storedSession.expiresAt, 1000 + auth.SESSION_DURATION_MS);
	assert.equal(auth.isAuthenticated(1001), true);
});

test("expired sessions are rejected and removed", () => {
	auth.login("admin", "admin", 1000);
	const expiry = 1000 + auth.SESSION_DURATION_MS;

	assert.equal(auth.isAuthenticated(expiry), false);
	assert.equal(global.sessionStorage.getItem(auth.SESSION_KEY), null);
});

test("logout clears the active session", () => {
	auth.login("admin", "admin", 1000);
	auth.clearSession();

	assert.equal(auth.isAuthenticated(1001), false);
});
